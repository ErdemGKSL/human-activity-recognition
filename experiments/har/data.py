"""UCI #341 (HAPT) yükleme ve ham sinyalden window üretimi.

MLP için hazır 561 feature kullanılır (Train/Test dosyaları). CNN/LSTM/GRU için ham
accelerometer + gyroscope sinyali 128 ölçümlük window'lara bölünür. Hazır X_train/X_test
dosyalarında window'ların ham sinyaldeki yeri verilmediği için ham window'lar burada yeniden
üretilir; kişi bazlı eğitim/test ayrımı resmi subject_id dosyalarından alınır.
"""
from __future__ import annotations

import io
import urllib.request
import zipfile
from pathlib import Path

import numpy as np

URL = ("https://archive.ics.uci.edu/static/public/341/"
       "smartphone+based+recognition+of+human+activities+and+postural+transitions.zip")
LABELS = ["WALKING", "WALKING_UPSTAIRS", "WALKING_DOWNSTAIRS", "SITTING", "STANDING", "LAYING",
          "STAND_TO_SIT", "SIT_TO_STAND", "SIT_TO_LIE", "LIE_TO_SIT", "STAND_TO_LIE", "LIE_TO_STAND"]
WIN, STEP = 128, 64


def download(root: Path) -> Path:
    """Veri setini root/raw içine indirir ve açar; zaten varsa dokunmaz."""
    raw = root / "raw"
    if (raw / "Train" / "X_train.txt").exists():
        return raw
    raw.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(URL) as r:
        zipfile.ZipFile(io.BytesIO(r.read())).extractall(raw)
    return raw


def load_features(raw: Path):
    """561 feature'lı hazır eğitim/test kümeleri (etiketler 0..11)."""
    ld = lambda p: np.loadtxt(raw / p)  # noqa: E731
    return (ld("Train/X_train.txt").astype(np.float32), ld("Train/y_train.txt").astype(int) - 1,
            ld("Test/X_test.txt").astype(np.float32), ld("Test/y_test.txt").astype(int) - 1,
            ld("Train/subject_id_train.txt").astype(int), ld("Test/subject_id_test.txt").astype(int))


def add_gravity_split(sig):
    """acc kanallarını 0,3 Hz low-pass ile gravity ve body olarak ayırır: [body acc, gravity, gyro] (9 kanal).

    Kayıt düzeyinde ve etiketsiz sabit bir filtredir; window istatistiği hesaplanmaz.
    """
    from scipy.signal import butter, sosfiltfilt
    sos = butter(3, 0.3, btype="low", fs=50, output="sos")
    grav = sosfiltfilt(sos, sig[:, :3], axis=0)
    return np.hstack([sig[:, :3] - grav, grav, sig[:, 3:]]).astype(np.float32)


def build_windows(raw: Path, min_frac: float = 1.0, step: int = STEP, gravity: bool = False):
    """Ham sinyali 128'lik window'lara böler (%50 overlap).

    Bir window yalnızca etiketli tek bir segmentin en az `min_frac` kadarını kapsıyorsa
    alınır. Dönüş: X (N,128,6), y (N,), subject (N,).
    """
    labels = np.loadtxt(raw / "RawData" / "labels.txt", dtype=int)
    X, y, s = [], [], []
    for exp in np.unique(labels[:, 0]):
        seg = labels[labels[:, 0] == exp]
        user = int(seg[0, 1])
        f = f"exp{exp:02d}_user{user:02d}.txt"
        sig = np.hstack([np.loadtxt(raw / "RawData" / f"acc_{f}"),
                         np.loadtxt(raw / "RawData" / f"gyro_{f}")]).astype(np.float32)
        if gravity:
            sig = add_gravity_split(sig)
        lab = np.full(len(sig), -1, int)
        for _, _, act, a, b in seg:  # 1 tabanlı, uçlar dahil
            lab[a - 1:b] = act - 1
        for st in range(0, len(sig) - WIN + 1, step):
            w = lab[st:st + WIN]
            vals, cnt = np.unique(w[w >= 0], return_counts=True)
            if len(vals) and cnt.max() / WIN >= min_frac:
                X.append(sig[st:st + WIN]); y.append(vals[cnt.argmax()]); s.append(user)
    return np.stack(X), np.array(y), np.array(s)
