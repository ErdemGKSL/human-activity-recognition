"""results/runs.json -> results/summary.md + confusion matrix figures + class distribution."""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

LAB = ["WALKING", "W_UP", "W_DOWN", "SITTING", "STANDING", "LAYING", "ST2SIT", "SIT2ST", "SIT2LIE", "LIE2SIT", "ST2LIE", "LIE2ST"]
NAMES = {"mlp": "MLP", "cnn": "1D CNN", "lstm": "LSTM", "gru": "GRU"}
out = Path("results")
runs = json.loads((out / "runs.json").read_text())
lines = ["| Model | Parametre | Accuracy | Precision | Recall | Macro F1 | Eğitim süresi (sn) |", "|---|---|---|---|---|---|---|"]
for m in NAMES:
    x = [r for r in runs if r["model"] == m]
    f = lambda k: f"{np.mean([r[k] for r in x]):.3f} ± {np.std([r[k] for r in x]):.3f}"  # noqa: E731
    lines.append(f"| {NAMES[m]} | {x[0]['params']:,} | {f('accuracy')} | {f('precision')} | {f('recall')} | {f('macro_f1')} | {np.mean([r['train_seconds'] for r in x]):.1f} |")
    cm = np.sum([r["confusion"] for r in x], 0).astype(float)
    cmn = cm / cm.sum(1, keepdims=True).clip(1)
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.imshow(cmn, cmap="Blues", vmin=0, vmax=1)
    ax.set_xticks(range(12), LAB, rotation=60, ha="right", fontsize=7); ax.set_yticks(range(12), LAB, fontsize=7)
    for i in range(12):
        for j in range(12):
            if cmn[i, j] >= 0.01:
                ax.text(j, i, f"{cmn[i,j]:.2f}", ha="center", va="center", fontsize=5, color="white" if cmn[i, j] > .5 else "black")
    ax.set_xlabel("Tahmin"); ax.set_ylabel("Gerçek"); ax.set_title(f"{NAMES[m]} (5 seed ortalaması, satır normalize)")
    fig.tight_layout(); fig.savefig(out / f"confusion_{m}.png", dpi=150); plt.close(fig)
pc = ["", "Sınıf bazlı F1 (5 seed ortalaması):", "", "| Sınıf | " + " | ".join(NAMES.values()) + " |", "|---|---|---|---|---|"]
for i, l in enumerate(LAB):
    pc.append(f"| {l} | " + " | ".join(f"{np.mean([r['per_class_f1'][i] for r in runs if r['model']==m]):.3f}" for m in NAMES) + " |")
r0 = {m: next(r for r in runs if r["model"] == m) for m in NAMES}
pc += ["", "Örnek sayıları (train/val/test): " + "; ".join(f"{NAMES[m]} {r0[m]['n_train']}/{r0[m]['n_val']}/{r0[m]['n_test']}" for m in NAMES)]
(out / "summary.md").write_text("\n".join(lines + pc) + "\n")
print("\n".join(lines + pc))
