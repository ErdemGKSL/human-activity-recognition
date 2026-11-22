"""Eğitilmiş çift yönlü GRU modelini, Kotlin'de bağımlılıksız çalıştırılacak düz JSON'a döker.

Şema (har-gru-v1): giriş ham birimlerde (ivme g, gyro rad/s, HAPT eksen çerçevesi) 128x6 window;
standardizasyon (x-mean)/std; 2 katman çift yönlü GRU (hidden 64); çıkışlar (ileri, geri) birleştirilir,
zaman boyunca mean ve max birleştirilir (256) ve Linear(256, 12) uygulanır. test_vectors, PyTorch çıktısıdır.
GRU denklemleri (PyTorch): r=σ(W_ir x+b_ir+W_hr h+b_hr); z=σ(W_iz x+b_iz+W_hz h+b_hz);
n=tanh(W_in x+b_in+r*(W_hn h+b_hn)); h'=(1-z)*n+z*h. Ağırlık satır sırası: r, z, n.
"""
import json

import numpy as np
import torch

LABELS = ["WALKING", "WALKING_UPSTAIRS", "WALKING_DOWNSTAIRS", "SITTING", "STANDING", "LAYING",
          "STAND_TO_SIT", "SIT_TO_STAND", "SIT_TO_LIE", "LIE_TO_SIT", "STAND_TO_LIE", "LIE_TO_STAND"]


def _arr(t):
    return np.asarray(t.detach().cpu().numpy(), dtype=np.float64).round(8).tolist()


def export_gru(model, mean, std, windows, out_path, hidden=64):
    """model: har.models2.RNN('gru', pool='meanmax', bidir=True); mean/std: (6,); windows: (N,128,6) ham birim."""
    assert model.pool == "meanmax"
    model = model.cpu().eval()
    sd = model.rnn.state_dict()
    layers = []
    for k in range(2):
        for d, suf in (("fwd", ""), ("bwd", "_reverse")):
            layers.append({"layer": k, "dir": d,
                           "w_ih": _arr(sd[f"weight_ih_l{k}{suf}"]), "w_hh": _arr(sd[f"weight_hh_l{k}{suf}"]),
                           "b_ih": _arr(sd[f"bias_ih_l{k}{suf}"]), "b_hh": _arr(sd[f"bias_hh_l{k}{suf}"])})
    lin = model.head[1]
    mean, std = np.asarray(mean, dtype=np.float64).reshape(-1), np.asarray(std, dtype=np.float64).reshape(-1)
    with torch.no_grad():
        x = torch.tensor(((np.asarray(windows) - mean) / std), dtype=torch.float32)
        logits = model(x).numpy()
    obj = {"format": "har-gru-v1", "labels": LABELS, "window": 128, "rate_hz": 50,
           "input_units": "acc g, gyro rad/s, HAPT axis frame (standing: +x about +1 g)",
           "mean": mean.round(8).tolist(), "std": std.round(8).tolist(), "hidden": hidden, "layers_n": 2,
           "bidirectional": True, "pool": "meanmax", "gru": layers,
           "head": {"w": _arr(lin.weight), "b": _arr(lin.bias)},
           "test_vectors": [{"input": np.asarray(w, dtype=np.float64).round(6).tolist(),
                             "logits": logits[i].astype(np.float64).round(6).tolist()} for i, w in enumerate(windows)]}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))
    return logits
