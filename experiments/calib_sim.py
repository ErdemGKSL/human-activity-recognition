"""Kalibrasyon yönteminin HAPT verisiyle simülasyonu (telefona koymadan önce doğrulama).

Telefonun HAPT'tan farklı duruşu, a_app = P a_hapt (P: 24 uygun dönmeden biri) ile simüle edilir.
Kalibratör yalnızca bilinen duruşların (ayakta, oturuyor, yatıyor [+ yürüme]) kayıtlarını görür ve
her aday M için (M a_app) pencerelerini modele verip doğru sınıfın ortalama log-olasılığını hesaplar.
Başarı ölçütleri: (1) M·P = I tam eşleşme, (2) seçilen M ile 6 aktivite window doğruluğu (oracle ile karşılaştır).
"""
import itertools, json, sys
import numpy as np, torch
sys.path.insert(0, '.')
from har.models2 import RNN

RAW = '/tmp/claude-0/hd/raw/RawData/'
torch.set_num_threads(4)

def rotations():
    out = []
    for perm in itertools.permutations(range(3)):
        for signs in itertools.product([1, -1], repeat=3):
            M = np.zeros((3, 3)); 
            for r in range(3): M[r, perm[r]] = signs[r]
            if round(np.linalg.det(M)) == 1: out.append(M)
    return out
ROTS = rotations(); assert len(ROTS) == 24

def load_model(path):
    d = json.load(open(path)); m = RNN('gru', c_in=6, h=64, pool='meanmax', bidir=True)
    sd = {}
    for e in d['gru']:
        suf = '' if e['dir'] == 'fwd' else '_reverse'; k = e['layer']
        for n in ('w_ih', 'w_hh', 'b_ih', 'b_hh'):
            nm = {'w_ih': 'weight_ih', 'w_hh': 'weight_hh', 'b_ih': 'bias_ih', 'b_hh': 'bias_hh'}[n]
            sd[f'{nm}_l{k}{suf}'] = torch.tensor(e[n], dtype=torch.float32)
    m.rnn.load_state_dict(sd); m.head[1].weight.data = torch.tensor(d['head']['w'], dtype=torch.float32); m.head[1].bias.data = torch.tensor(d['head']['b'], dtype=torch.float32)
    return m.eval(), np.array(d['mean'], dtype=np.float32), np.array(d['std'], dtype=np.float32)

def windows(x, start=100, n=400, stride=64):
    x = x[start:start + n]
    return np.stack([x[i:i + 128] for i in range(0, len(x) - 127, stride)]) if len(x) >= 128 else np.zeros((0, 128, 6), np.float32)

def load_users(users):
    L = np.loadtxt(RAW + 'labels.txt', dtype=int); data = {}
    for u in users:
        segs = {a: [] for a in range(1, 7)}
        for exp in np.unique(L[L[:, 1] == u][:, 0]):
            f = f"exp{exp:02d}_user{u:02d}.txt"
            sig = np.hstack([np.loadtxt(RAW + 'acc_' + f), np.loadtxt(RAW + 'gyro_' + f)]).astype(np.float32)
            for _, _, a, s, e in L[L[:, 0] == exp]:
                if a <= 6 and e - s > 500: segs[a].append(sig[s - 1:e])
        data[u] = segs
    return data

@torch.no_grad()
def probs(model, mean, std, W):
    return torch.softmax(model(torch.tensor((W - mean) / std, dtype=torch.float32)), 1).numpy()

def rot(W, M):  # (N,128,6) pencereler, acc ve gyro'ya aynı M
    return np.concatenate([W[..., :3] @ M.T, W[..., 3:] @ M.T], -1).astype(np.float32)

def calibrate(model, mean, std, calib, acts):
    """calib: {aktivite: pencereler (app çerçevesi)}. Dönüş: aday başına skor (24,)."""
    sc = []
    for M in ROTS:
        s = 0.0; n = 0
        for a in acts:
            p = probs(model, mean, std, rot(calib[a], M))[:, a - 1]
            s += np.log(p + 1e-4).sum(); n += len(p)
        sc.append(s / n)
    return np.array(sc)

def report(res):
    for name, r in res.items():
        r = np.array(r, dtype=float)
        bad = (r[:, 1] < r[:, 2] - 0.05).mean()
        print(f"  {name:12s} n={len(r)} tam eşleşme {r[:,0].mean():.3f} | seçilen M ile doğruluk {r[:,1].mean():.3f} | oracle {r[:,2].mean():.3f} | kalibrasyonsuz {r[:,3].mean():.3f} | marj medyan {np.median(r[:,4]):.2f} | oracle'dan >0,05 kötü {bad:.3f}", flush=True)


def main():
    model, mean, std = load_model('export/gru_demo/model.json')
    users = [int(u) for u in sys.argv[1:]] or [2, 4, 9, 10]
    data = load_users(users)
    rng = np.random.default_rng(0)
    res = {'static': [], 'static+walk': []}
    for u in users:
        segs = data[u]
        calib_h = {a: windows(segs[a][0]) for a in range(1, 7) if segs[a]}
        ev_h = {a: np.concatenate([windows(s, 50, 4000, 64) for s in segs[a]]) for a in range(1, 7) if segs[a]}
        for ti, P in enumerate(ROTS):
            calib_app = {a: rot(w, P) for a, w in calib_h.items()}
            ev_app = {a: rot(w, P) for a, w in ev_h.items()}
            for name, acts in (('static', (4, 5, 6)), ('static+walk', (1, 4, 5, 6))):
                sc = calibrate(model, mean, std, calib_app, acts)
                best = int(np.argmax(sc)); M = ROTS[best]
                exact = np.allclose(M @ P, np.eye(3))
                srt = np.sort(sc)[::-1]
                def acc(Mx):
                    c = n = 0
                    for a, w in ev_app.items():
                        c += (probs(model, mean, std, rot(w, Mx)).argmax(1) == a - 1).sum(); n += len(w)
                    return c / n
                res[name].append((exact, acc(M), acc(P.T), acc(np.eye(3)), srt[0] - srt[1]))
        print('kullanıcı', u, 'tamam', flush=True)
        report(res)
    return
    for name, r in res.items():
        r = np.array(r, dtype=float)
        print(f"{name:12s} tam eşleşme {r[:,0].mean():.3f} | seçilen M ile doğruluk {r[:,1].mean():.3f} | oracle {r[:,2].mean():.3f} | kalibrasyonsuz (I) {r[:,3].mean():.3f} | skor marjı medyan {np.median(r[:,4]):.2f}")
        bad = r[r[:, 1] < r[:, 2] - 0.05]
        print(f"   oracle'dan >0,05 kötü olan deneme oranı {len(bad)/len(r):.3f}")
    np.save('/tmp/claude-0/calib_res.npy', {k: np.array(v) for k, v in res.items()}, allow_pickle=True)

if __name__ == '__main__':
    main()
