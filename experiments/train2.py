"""v2: kişi bazlı GroupKFold CV (test'e erişim yok) ve dondurulmuş düzenle final koşu.

  python train2.py --mode cv    --model gru --name a1 --epochs 100 ...
  python train2.py --mode final --model gru --name f1 --epochs 100 --seeds 0 1 2 3 4 5 6 7 8 9

CV'de karar ölçütü: 21 eğitim kişisinin havuzlanmış out-of-fold macro F1 değeri.
Seçim erken durdurmayla değil, sabit epoch sonundaki (son) modelle yapılır.
"""
import argparse, json, math, time
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from torch import nn

from har import data
from har.models2 import build

p = argparse.ArgumentParser()
p.add_argument("--mode", choices=["cv", "final"], default="cv")
p.add_argument("--model", required=True, choices=["mlp", "mlpraw", "cnn", "lstm", "gru"])
p.add_argument("--name", required=True)
p.add_argument("--data", default="data")
p.add_argument("--out", default="results2")
p.add_argument("--epochs", type=int, default=40)
p.add_argument("--lr", type=float, default=2e-3)
p.add_argument("--warmup", type=int, default=0)
p.add_argument("--clip", type=float, default=0.0)
p.add_argument("--bs", type=int, default=128)
p.add_argument("--seeds", type=int, nargs="+", default=[0, 1, 2])
p.add_argument("--gravity", action="store_true", help="9 kanal: body acc, gravity, gyro")
p.add_argument("--tstep", type=int, default=64, help="eğitim window adımı (64 = baseline)")
p.add_argument("--aug", action="store_true")
p.add_argument("--cw", choices=["full", "sqrt", "none"], default="full")
p.add_argument("--pool", choices=["last", "meanmax"], default="last")
p.add_argument("--bidir", action="store_true")
p.add_argument("--variant", default="base")
p.add_argument("--min-frac", type=float, default=0.9)
p.add_argument("--noise", type=float, default=0.0, help="MLP için standardize feature uzayında Gauss gürültüsü (std birimi)")
p.add_argument("--save-oof", action="store_true", help="CV modunda OOF tahminlerini ve kişi etiketlerini kaydet")
a = p.parse_args()

dev = "cuda" if torch.cuda.is_available() else "cpu"
raw = data.download(Path(a.data))
Xf_tr, yf_tr, Xf_te, yf_te, sf_tr, sf_te = data.load_features(raw)
test_users = np.unique(sf_te)
train_users = np.unique(sf_tr)
c_in = 9 if a.gravity else 6
if a.model == "mlp":
    D = dict(Xtr=Xf_tr, ytr=yf_tr, str_=sf_tr, Xev=Xf_tr, yev=yf_tr, sev=sf_tr, Xte=Xf_te, yte=yf_te, ste=sf_te)
else:
    Xg, yg, sg = data.build_windows(raw, a.min_frac, 64, a.gravity)
    if a.tstep != 64:
        Xd, yd, sd = data.build_windows(raw, a.min_frac, a.tstep, a.gravity)
    else:
        Xd, yd, sd = Xg, yg, sg
    ng, nd = ~np.isin(sg, test_users), ~np.isin(sd, test_users)
    D = dict(Xtr=Xd[nd], ytr=yd[nd], str_=sd[nd], Xev=Xg[ng], yev=yg[ng], sev=sg[ng],
             Xte=Xg[~ng], yte=yg[~ng], ste=sg[~ng])
T = lambda x, dt=torch.float32: torch.tensor(x, dtype=dt, device=dev)  # noqa: E731


def rotate(x, deg=12.0):
    B = x.shape[0]
    v = torch.randn(B, 3, device=dev); v = v / v.norm(dim=1, keepdim=True)
    th = (torch.rand(B, device=dev) * 2 - 1) * math.radians(deg)
    K = torch.zeros(B, 3, 3, device=dev)
    K[:, 0, 1], K[:, 0, 2], K[:, 1, 0], K[:, 1, 2], K[:, 2, 0], K[:, 2, 1] = -v[:, 2], v[:, 1], v[:, 2], -v[:, 0], -v[:, 1], v[:, 0]
    R = torch.eye(3, device=dev) + torch.sin(th)[:, None, None] * K + (1 - torch.cos(th))[:, None, None] * (K @ K)
    out = x.clone()
    for i in range(0, x.shape[2], 3):
        out[:, :, i:i + 3] = x[:, :, i:i + 3] @ R.transpose(1, 2)
    return out


def augment(x):
    x = rotate(x)
    x = x * (0.9 + 0.2 * torch.rand(x.shape[0], 1, 1, device=dev))
    return x


def fit_predict(Xtr, ytr, Xs, seed):
    """Eğitir, her X için (olasılık) döndürür. Son epoch modeli kullanılır."""
    torch.manual_seed(seed); np.random.seed(seed)
    ax = tuple(range(Xtr.ndim - 1))
    m, s = Xtr.mean(ax, keepdims=True), Xtr.std(ax, keepdims=True) + 1e-6
    m_, s_ = T(m), T(s)
    Xt, yt = T(Xtr), T(ytr, torch.long)
    cnt = np.bincount(ytr, minlength=12).astype(np.float32)
    w = cnt.sum() / (12 * np.maximum(cnt, 1))
    w = {"full": w, "sqrt": np.sqrt(w), "none": np.ones_like(w)}[a.cw]
    model = build(a.model, c_in, d_in=Xtr.shape[-1], variant=a.variant, pool=a.pool, bidir=a.bidir).to(dev)
    opt = torch.optim.AdamW(model.parameters(), a.lr, weight_decay=1e-4)
    lossf = nn.CrossEntropyLoss(weight=T(w))
    spe = math.ceil(len(Xt) / a.bs); total = a.epochs * spe; wu = a.warmup * spe; step = 0
    for ep in range(a.epochs):
        model.train(); perm = torch.randperm(len(Xt), device=dev)
        for i in range(0, len(perm), a.bs):
            b = perm[i:i + a.bs]
            lr = a.lr * (step / wu if step < wu else 0.5 * (1 + math.cos(math.pi * (step - wu) / max(1, total - wu))))
            for g in opt.param_groups: g["lr"] = lr
            xb = Xt[b]
            if a.aug and xb.ndim == 3:
                xb = augment(xb)
            if a.noise and xb.ndim == 2:
                xb = xb + a.noise * s_ * torch.randn_like(xb)
            opt.zero_grad(); lossf(model((xb - m_) / s_), yt[b]).backward()
            if a.clip: nn.utils.clip_grad_norm_(model.parameters(), a.clip)
            opt.step(); step += 1
    model.eval(); outs = []
    with torch.no_grad():
        for X in Xs:
            Xe = T(X); ps = []
            for i in range(0, len(Xe), 2048):
                ps.append(torch.softmax(model((Xe[i:i + 2048] - m_) / s_), 1).cpu())
            outs.append(torch.cat(ps).numpy())
    return outs


def scores(y, pr):
    P, R, F, _ = precision_recall_fscore_support(y, pr, average="macro", zero_division=0)
    return dict(accuracy=accuracy_score(y, pr), precision=P, recall=R, macro_f1=F,
                per_class_f1=f1_score(y, pr, labels=range(12), average=None, zero_division=0).tolist())


out = Path(a.out); out.mkdir(exist_ok=True)
res = dict(name=a.name, args=vars(a), seeds=[], n_ev=len(D["yev"]))
t0 = time.time()
folds = [train_users[i::5] for i in range(5)]  # deterministik, kişi bazlı 5 fold
oofs = []
if a.mode == "cv":
    for seed in a.seeds:
        oof = np.zeros(len(D["yev"]), int)
        for fu in folds:
            tr, ev = ~np.isin(D["str_"], fu), np.isin(D["sev"], fu)
            if a.model == "mlp":  # özellik satırları hem eğitim hem değerlendirme
                (pe,) = fit_predict(D["Xtr"][tr], D["ytr"][tr], [D["Xev"][ev]], seed)
            else:
                (pe,) = fit_predict(D["Xtr"][tr], D["ytr"][tr], [D["Xev"][ev]], seed)
            oof[ev] = pe.argmax(1)
        r = scores(D["yev"], oof); r["seed"] = seed; res["seeds"].append(r)
        if a.save_oof:
            oofs.append(oof.copy())
        print(f"{a.name} cv seed={seed} oofF1={r['macro_f1']:.4f} acc={r['accuracy']:.4f} {time.time()-t0:.0f}s", flush=True)
    if a.save_oof:
        np.savez_compressed(out / f"{a.name}_oof.npz", oof=np.array(oofs), y=D["yev"], subj=D["sev"])
else:
    probs = []
    for seed in a.seeds:
        (pt,) = fit_predict(D["Xtr"], D["ytr"], [D["Xte"]], seed)
        probs.append(pt)
        r = scores(D["yte"], pt.argmax(1)); r["seed"] = seed; res["seeds"].append(r)
        print(f"{a.name} final seed={seed} testF1={r['macro_f1']:.4f} acc={r['accuracy']:.4f}", flush=True)
    ens = scores(D["yte"], np.mean(probs, 0).argmax(1)); res["ensemble"] = ens
    print(f"{a.name} ensemble testF1={ens['macro_f1']:.4f}", flush=True)
    np.savez_compressed(out / f"{a.name}_probs.npz", probs=np.array(probs), y=D["yte"], subj=D["ste"])
f = np.array([r["macro_f1"] for r in res["seeds"]])
res["mean_f1"], res["std_f1"], res["seconds"] = float(f.mean()), float(f.std()), time.time() - t0
(out / f"{a.name}.json").write_text(json.dumps(res, indent=1))
print(f"== {a.name}: macroF1 {f.mean():.4f} ± {f.std():.4f} ({res['seconds']:.0f}s)")
