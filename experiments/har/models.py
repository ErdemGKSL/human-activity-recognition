import torch
from torch import nn

NC = 12


class MLP(nn.Module):
    def __init__(self, d_in=561, h=256, p=0.3):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(d_in, h), nn.ReLU(), nn.Dropout(p),
                                 nn.Linear(h, h // 2), nn.ReLU(), nn.Dropout(p), nn.Linear(h // 2, NC))

    def forward(self, x):
        return self.net(x)


class CNN1D(nn.Module):
    def __init__(self, c_in=6, p=0.3):
        super().__init__()
        def blk(i, o):
            return nn.Sequential(nn.Conv1d(i, o, 5, padding=2), nn.BatchNorm1d(o), nn.ReLU(), nn.MaxPool1d(2))
        self.f = nn.Sequential(blk(c_in, 32), blk(32, 64), blk(64, 128), nn.AdaptiveAvgPool1d(1), nn.Flatten())
        self.head = nn.Sequential(nn.Dropout(p), nn.Linear(128, NC))

    def forward(self, x):  # x: (B,128,6)
        return self.head(self.f(x.transpose(1, 2)))


class RNN(nn.Module):
    def __init__(self, kind="lstm", c_in=6, h=64, p=0.3):
        super().__init__()
        cls = nn.LSTM if kind == "lstm" else nn.GRU
        self.rnn = cls(c_in, h, num_layers=2, batch_first=True, dropout=p)
        self.head = nn.Sequential(nn.Dropout(p), nn.Linear(h, NC))

    def forward(self, x):
        out, _ = self.rnn(x)
        return self.head(out[:, -1])


def build(name):
    return {"mlp": MLP, "cnn": CNN1D, "lstm": lambda: RNN("lstm"), "gru": lambda: RNN("gru")}[name]()
