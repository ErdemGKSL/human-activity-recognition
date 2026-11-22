"""Şekil 1: resmi eğitim/test ayrımında sınıf başına window (örnek) sayısı.

  python plot_class_dist.py [raw_dir] [out_png]

Kaynak: UCI #341 resmi Train/y_train.txt ve Test/y_test.txt (561 feature'lı kayıtların
etiketleri; 7.767 eğitim, 3.162 test). Ham sinyal modellerinin kendi ürettiğimiz window'ları
(10.776) bu şekle dahil değildir.
"""
import sys
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt

LAB = ["WALKING", "WALKING_UPSTAIRS", "WALKING_DOWNSTAIRS", "SITTING", "STANDING", "LAYING",
       "STAND_TO_SIT", "SIT_TO_STAND", "SIT_TO_LIE", "LIE_TO_SIT", "STAND_TO_LIE", "LIE_TO_STAND"]
TRAIN, TEST = "#2a78d6", "#eb6834"  # dataviz kategorik slot 1-2 (validator: PASS)
INK, MUTED, GRID = "#0b0b0b", "#52514e", "#e1e0d9"


def main(raw: Path, out: Path):
    ytr = np.loadtxt(raw / "Train" / "y_train.txt").astype(int) - 1
    yte = np.loadtxt(raw / "Test" / "y_test.txt").astype(int) - 1
    ctr, cte = np.bincount(ytr, minlength=12), np.bincount(yte, minlength=12)
    for name, a, b in zip(LAB, ctr, cte):
        print(f"{name:20s} {a:5d} {b:5d}")
    print(f"{'TOPLAM':20s} {ctr.sum():5d} {cte.sum():5d}")

    fig, ax = plt.subplots(figsize=(7, 4.6))
    y = np.arange(12)[::-1]
    h = 0.38
    ax.barh(y + h / 2, ctr, h, color=TRAIN, label=f"Eğitim (21 kişi, n={ctr.sum()})", edgecolor="white", linewidth=1)
    ax.barh(y - h / 2, cte, h, color=TEST, label=f"Test (9 kişi, n={cte.sum()})", edgecolor="white", linewidth=1)
    for yi, a, b in zip(y, ctr, cte):
        ax.text(a + 15, yi + h / 2, str(a), va="center", fontsize=7, color=MUTED)
        ax.text(b + 15, yi - h / 2, str(b), va="center", fontsize=7, color=MUTED)
    ax.set_yticks(y, LAB, fontsize=8, color=INK)
    ax.axhline(5.5, color=GRID, lw=1, ls="--")  # temel aktiviteler / postural transition sınırı
    ax.set_xlabel("Örnek (window) sayısı", fontsize=8, color=MUTED)
    ax.tick_params(axis="x", labelsize=7, colors=MUTED)
    ax.grid(axis="x", color=GRID, lw=0.6)
    ax.set_axisbelow(True)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color("#c3c2b7")
    ax.set_xlim(0, max(ctr.max(), cte.max()) * 1.12)
    ax.legend(fontsize=8, frameon=False, loc="lower right")
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    print(f"-> {out}")


if __name__ == "__main__":
    here = Path(__file__).parent
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else here / "data" / "raw",
         Path(sys.argv[2]) if len(sys.argv) > 2 else here / "results" / "class_distribution.png")
