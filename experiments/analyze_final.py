"""Final test koşularının çevrimdışı analizi.

Girdi: <dir>/f_<model>_<parça>_probs.npz  (train2.py --mode final çıktısı: probs[seed,N,12], y[N], subj[N]).
Model adı dosya adındaki `f_<model>_` önekinden gelir (ör. f_mlp_a, f_mlp_b, f_cnn_a ...).
Çıktı: <dir>/summary.md, confusion_<model>.png, delta_vs_mlp.png.

Analiz planı (test öncesi dondurulmuştur, JOURNEY.md):
  - birincil metrik: test macro F1
  - tekil model: seed ortalaması ± std; ensemble: seed olasılıklarının ortalaması
  - %95 GA: kişi bazlı bootstrap (test kişileri yerine koyarak), B=2000, percentile
  - model farkı: aynı kişi örneklemesinde eşleştirilmiş Δ macro F1 (ham model - MLP)
"""
import json
import sys
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt

LAB = ["WALKING", "W_UP", "W_DOWN", "SITTING", "STANDING", "LAYING", "ST2SIT", "SIT2ST", "SIT2LIE", "LIE2SIT", "ST2LIE", "LIE2ST"]
NAMES = {"mlp": "MLP", "mlpraw": "MLP-raw", "cnn": "1D CNN", "lstm": "LSTM", "gru": "GRU"}
B = 2000
RNG = np.random.default_rng(0)


def macro_f1(y, p, k=12):
    cm = np.bincount(y * k + p, minlength=k * k).reshape(k, k)
    tp = np.diag(cm).astype(float)
    prec = tp / np.maximum(cm.sum(0), 1)
    rec = tp / np.maximum(cm.sum(1), 1)
    f = np.where(prec + rec > 0, 2 * prec * rec / np.maximum(prec + rec, 1e-12), 0.0)
    return f.mean()


def load(d: Path):
    out = {}
    for m in NAMES:
        files = sorted(d.glob(f"f_{m}_*_probs.npz"))
        if not files:
            continue
        probs, y, s = [], None, None
        for f in files:
            z = np.load(f)
            probs.append(z["probs"])
            if y is None:
                y, s = z["y"], z["subj"]
            assert (y == z["y"]).all() and (s == z["subj"]).all(), f"{f}: test kümesi parçalar arasında farklı"
        out[m] = dict(probs=np.concatenate(probs, 0), y=y, subj=s)
    return out


def main(d: Path):
    data = load(d)
    if not data:
        sys.exit(f"{d} içinde f_<model>_*_probs.npz yok")
    users = np.unique(next(iter(data.values()))["subj"])
    res, ens_pred = {}, {}
    for m, z in data.items():
        per_seed = [macro_f1(z["y"], p.argmax(1)) for p in z["probs"]]
        acc_seed = [(p.argmax(1) == z["y"]).mean() for p in z["probs"]]
        pred = z["probs"].mean(0).argmax(1)
        ens_pred[m] = pred
        res[m] = dict(n_seeds=len(per_seed), n_test=int(len(z["y"])), f1_mean=float(np.mean(per_seed)), f1_std=float(np.std(per_seed)),
                      acc_mean=float(np.mean(acc_seed)), ens_f1=float(macro_f1(z["y"], pred)), ens_acc=float((pred == z["y"]).mean()))
    # kişi bazlı bootstrap
    idx = {m: {u: np.where(z["subj"] == u)[0] for u in users} for m, z in data.items()}
    boot = {m: np.empty(B) for m in data}
    for b in range(B):
        draw = RNG.choice(users, size=len(users), replace=True)
        for m, z in data.items():
            ii = np.concatenate([idx[m][u] for u in draw])
            boot[m][b] = macro_f1(z["y"][ii], ens_pred[m][ii])
    ci = lambda a: (float(np.percentile(a, 2.5)), float(np.percentile(a, 97.5)))  # noqa: E731
    for m in data:
        res[m]["ens_ci"] = ci(boot[m])
    delta = {}
    if "mlp" in data:
        for m in data:
            if m != "mlp":
                dd = boot[m] - boot["mlp"]  # aynı kişi çekilişleri (eşleştirilmiş)
                delta[m] = dict(mean=float(dd.mean()), ci=ci(dd), excludes_zero=bool(ci(dd)[0] > 0 or ci(dd)[1] < 0))
    # sınıf bazlı F1 (ensemble)
    pcf1 = {}
    for m, z in data.items():
        cm = np.bincount(z["y"] * 12 + ens_pred[m], minlength=144).reshape(12, 12).astype(float)
        pr, rc = np.diag(cm) / np.maximum(cm.sum(0), 1), np.diag(cm) / np.maximum(cm.sum(1), 1)
        pcf1[m] = np.where(pr + rc > 0, 2 * pr * rc / np.maximum(pr + rc, 1e-12), 0.0)
    lines = ["| Model | Seed | Test n | Macro F1 (seed ort. ± std) | Accuracy | Ensemble macro F1 | Ensemble %95 GA (kişi bootstrap) | Ensemble acc. |", "|---|---|---|---|---|---|---|---|"]
    for m, r in res.items():
        lines.append(f"| {NAMES[m]} | {r['n_seeds']} | {r['n_test']} | {r['f1_mean']:.3f} ± {r['f1_std']:.3f} | {r['acc_mean']:.3f} | {r['ens_f1']:.3f} | [{r['ens_ci'][0]:.3f}, {r['ens_ci'][1]:.3f}] | {r['ens_acc']:.3f} |")
    if delta:
        lines += ["", "Eşleştirilmiş Δ macro F1 (model - MLP), kişi bazlı bootstrap, ensemble:", "", "| Model | Δ ortalama | %95 GA | GA sıfırı dışlıyor mu |", "|---|---|---|---|"]
        for m, r in delta.items():
            lines.append(f"| {NAMES[m]} | {r['mean']:+.3f} | [{r['ci'][0]:+.3f}, {r['ci'][1]:+.3f}] | {'evet' if r['excludes_zero'] else 'hayır'} |")
    lines += ["", "Sınıf bazlı F1 (ensemble):", "", "| Sınıf | " + " | ".join(NAMES[m] for m in data) + " |", "|---|" + "---|" * len(data)]
    for i, l in enumerate(LAB):
        lines.append(f"| {l} | " + " | ".join(f"{pcf1[m][i]:.3f}" for m in data) + " |")
    for tag, sl in (("Aktivite (ilk 6) ortalama F1", slice(0, 6)), ("Transition (son 6) ortalama F1", slice(6, 12))):
        lines.append(f"| **{tag}** | " + " | ".join(f"{pcf1[m][sl].mean():.3f}" for m in data) + " |")
    (d / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (d / "summary.json").write_text(json.dumps(dict(results=res, delta=delta), indent=1), encoding="utf-8")
    # confusion matrix (ensemble, satır normalize)
    for m, z in data.items():
        cm = np.bincount(z["y"] * 12 + ens_pred[m], minlength=144).reshape(12, 12).astype(float)
        cmn = cm / cm.sum(1, keepdims=True).clip(1)
        fig, ax = plt.subplots(figsize=(7, 6))
        ax.imshow(cmn, cmap="Blues", vmin=0, vmax=1)
        ax.set_xticks(range(12), LAB, rotation=60, ha="right", fontsize=7)
        ax.set_yticks(range(12), LAB, fontsize=7)
        for i in range(12):
            for j in range(12):
                if cmn[i, j] >= 0.01:
                    ax.text(j, i, f"{cmn[i, j]:.2f}", ha="center", va="center", fontsize=5, color="white" if cmn[i, j] > .5 else "black")
        ax.set_xlabel("Tahmin"); ax.set_ylabel("Gerçek"); ax.set_title(f"{NAMES[m]} (test, ensemble, satır normalize)")
        fig.tight_layout(); fig.savefig(d / f"confusion_{m}.png", dpi=150); plt.close(fig)
    if delta:
        fig, ax = plt.subplots(figsize=(6, 3 + 0.4 * len(delta)))
        for k, (m, r) in enumerate(delta.items()):
            ax.errorbar(r["mean"], k, xerr=[[r["mean"] - r["ci"][0]], [r["ci"][1] - r["mean"]]], fmt="o", capsize=4)
        ax.axvline(0, color="gray", lw=1)
        ax.set_yticks(range(len(delta)), [NAMES[m] for m in delta]); ax.set_xlabel("Δ macro F1 (model - MLP), %95 GA")
        fig.tight_layout(); fig.savefig(d / "delta_vs_mlp.png", dpi=150); plt.close(fig)
    print("\n".join(lines))


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "results2/final"))
