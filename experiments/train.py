"""HAR deneyleri: python train.py --models mlp cnn lstm gru --out results [--subset N]

Eğitim/test ayrımı resmi kişi bazlı ayrımdır. Validation kümesi eğitim kişilerinden ayrılır
(kişi bazlı, test kişileri asla kullanılmaz). Test kümesi yalnızca son değerlendirmede kullanılır.
"""
import argparse, json, time
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from torch import nn

from har import data
from har.models import build

p = argparse.ArgumentParser()
p.add_argument("--models", nargs="+", default=["mlp", "cnn", "lstm", "gru"])
p.add_argument("--data", default="data")
p.add_argument("--out", default="results")
p.add_argument("--epochs", type=int, default=40)
p.add_argument("--seeds", type=int, nargs="+", default=[0, 1, 2])
p.add_argument("--subset", type=int, default=0, help="hızlı deneme: eğitimden N örnek")
p.add_argument("--min-frac", type=float, default=0.9)
a = p.parse_args()

dev = "cuda" if torch.cuda.is_available() else "cpu"
torch.set_num_threads(4)
raw = data.download(Path(a.data))
Xf_tr, y_tr_f, Xf_te, y_te_f, s_tr_f, s_te_f = data.load_features(raw)
Xw, yw, sw = data.build_windows(raw, a.min_frac)
test_users = set(s_te_f.tolist())
is_te = np.isin(sw, list(test_users))
Xw_tr, yw_tr, sw_tr, Xw_te, yw_te = Xw[~is_te], yw[~is_te], sw[~is_te], Xw[is_te], yw[is_te]


def standardize(tr, te):
    ax = tuple(range(tr.ndim - 1))
    m, s = tr.mean(ax, keepdims=True), tr.std(ax, keepdims=True) + 1e-6
    return (tr - m) / s, (te - m) / s, m, s


def split_val(s_tr):
    users = np.unique(s_tr)
    val_users = users[::5]  # her 5. kişi (deterministik, kişi bazlı)
    return np.isin(s_tr, val_users)


def predict(model, X, bs=1024):
    model.eval(); out = []
    with torch.no_grad():
        for i in range(0, len(X), bs):
            out.append(model(X[i:i + bs]).argmax(1).cpu())
    return torch.cat(out).numpy()


def run(name, seed):
    torch.manual_seed(seed); np.random.seed(seed)
    if name == "mlp":
        Xtr, ytr, Xte, yte, s = Xf_tr, y_tr_f, Xf_te, y_te_f, s_tr_f
    else:
        Xtr, ytr, Xte, yte, s = Xw_tr, yw_tr, Xw_te, yw_te, sw_tr
    isv = split_val(s)
    Xtr, Xte, _, _ = standardize(Xtr, Xte)  # istatistik yalnızca eğitimden
    Xt, yt = Xtr[~isv], ytr[~isv]
    Xv, yv = Xtr[isv], ytr[isv]
    if a.subset:
        idx = np.random.permutation(len(Xt))[:a.subset]; Xt, yt = Xt[idx], yt[idx]
    T = lambda x: torch.tensor(x, dtype=torch.float32, device=dev)  # noqa: E731
    Xt_, Xv_, Xte_ = T(Xt), T(Xv), T(Xte)
    yt_ = torch.tensor(yt, device=dev)
    cnt = np.bincount(yt, minlength=12).astype(np.float32)
    w = torch.tensor(cnt.sum() / (12 * np.maximum(cnt, 1)), device=dev)  # class-weighted loss
    model = build(name).to(dev)
    opt = torch.optim.AdamW(model.parameters(), 2e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, a.epochs)
    lossf = nn.CrossEntropyLoss(weight=w)
    best, best_state, t0 = -1, None, time.time()
    for ep in range(a.epochs):
        model.train(); perm = torch.randperm(len(Xt_), device=dev)
        for i in range(0, len(perm), 128):
            b = perm[i:i + 128]
            opt.zero_grad(); lossf(model(Xt_[b]), yt_[b]).backward(); opt.step()
        sched.step()
        f1 = precision_recall_fscore_support(yv, predict(model, Xv_), average="macro", zero_division=0)[2]
        if f1 > best:
            best, best_state = f1, {k: v.clone() for k, v in model.state_dict().items()}
    secs = time.time() - t0
    model.load_state_dict(best_state)
    pr = predict(model, Xte_)
    P, R, F, _ = precision_recall_fscore_support(yte, pr, average="macro", zero_division=0)
    return dict(model=name, seed=seed, n_train=len(Xt), n_val=len(Xv), n_test=len(Xte),
                params=sum(p.numel() for p in model.parameters()), train_seconds=round(secs, 1),
                val_macro_f1=best, accuracy=accuracy_score(yte, pr), precision=P, recall=R, macro_f1=F,
                per_class_f1=precision_recall_fscore_support(yte, pr, labels=range(12), zero_division=0)[2].tolist(),
                confusion=confusion_matrix(yte, pr, labels=range(12)).tolist(), device=dev)


out = Path(a.out); out.mkdir(exist_ok=True)
rows = []
for name in a.models:
    for seed in a.seeds:
        r = run(name, seed); rows.append(r)
        print(f"{name} seed={seed} acc={r['accuracy']:.4f} macroF1={r['macro_f1']:.4f} "
              f"{r['train_seconds']}s params={r['params']}", flush=True)
        (out / "runs.json").write_text(json.dumps(rows, indent=1))
