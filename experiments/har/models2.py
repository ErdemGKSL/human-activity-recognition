"""Ayarlanabilir model aileleri (v2). Baseline için har/models.py korunur."""
import torch
from torch import nn

NC = 12


class MLP(nn.Module):
    def __init__(self, d_in, h=256, p=0.3):
        super().__init__()
        self.net = nn.Sequential(nn.Flatten(), nn.Linear(d_in, h), nn.ReLU(), nn.Dropout(p),
                                 nn.Linear(h, h // 2), nn.ReLU(), nn.Dropout(p), nn.Linear(h // 2, NC))

    def forward(self, x):
        return self.net(x)


class CNN1D(nn.Module):
    """variant: base (3 blok, GAP) | deep (4 blok, dilation, mean+max pooling)."""

    def __init__(self, c_in=6, variant="base", p=0.3):
        super().__init__()
        def blk(i, o, d=1):
            return nn.Sequential(nn.Conv1d(i, o, 5, padding=2 * d, dilation=d), nn.BatchNorm1d(o), nn.ReLU(), nn.MaxPool1d(2))
        if variant == "base":
            self.f = nn.Sequential(blk(c_in, 32), blk(32, 64), blk(64, 128))
            self.deep = False
        else:
            self.f = nn.Sequential(blk(c_in, 32), blk(32, 64, 2), blk(64, 128, 2), blk(128, 128, 2))
            self.deep = True
        self.head = nn.Sequential(nn.Dropout(p), nn.Linear(256 if self.deep else 128, NC))

    def forward(self, x):
        z = self.f(x.transpose(1, 2))
        z = torch.cat([z.mean(2), z.amax(2)], 1) if self.deep else z.mean(2)
        return self.head(z)


class RNN(nn.Module):
    def __init__(self, kind="lstm", c_in=6, h=64, p=0.3, pool="last", bidir=False):
        super().__init__()
        cls = nn.LSTM if kind == "lstm" else nn.GRU
        self.rnn = cls(c_in, h, num_layers=2, batch_first=True, dropout=p, bidirectional=bidir)
        self.pool = pool
        d = h * (2 if bidir else 1)
        self.head = nn.Sequential(nn.Dropout(p), nn.Linear(d * (2 if pool == "meanmax" else 1), NC))
        if kind == "lstm":  # forget-gate bias 1: gradient akışını kolaylaştırır
            for n, prm in self.rnn.named_parameters():
                if "bias" in n:
                    prm.data[h:2 * h] = 1.0

    def forward(self, x):
        out, _ = self.rnn(x)
        z = torch.cat([out.mean(1), out.amax(1)], 1) if self.pool == "meanmax" else out[:, -1]
        return self.head(z)


def build(name, c_in, **kw):
    if name == "mlp":
        return MLP(kw.get("d_in", 561))
    if name == "mlpraw":
        return MLP(128 * c_in)
    if name == "cnn":
        return CNN1D(c_in, kw.get("variant", "base"))
    return RNN(name, c_in, pool=kw.get("pool", "last"), bidir=kw.get("bidir", False))
