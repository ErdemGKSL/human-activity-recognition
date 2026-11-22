"""Kalibrasyon v2: duruş ortalama yerçekimi vektörlerini HAPT eğitim kişilerinin ortalamalarına dönmeyle eşle (Wahba/Kabsch)."""
import sys
import numpy as np
sys.path.insert(0, '.')
from calib_sim import *

TEST = [2, 4, 9, 10, 12, 13, 18, 20, 24]
def pop_means():
    L = np.loadtxt(RAW + 'labels.txt', dtype=int); acc = {4: [], 5: [], 6: []}
    for exp in np.unique(L[:, 0]):
        seg = L[L[:, 0] == exp]; u = int(seg[0, 1])
        if u in TEST: continue
        f = f"exp{exp:02d}_user{u:02d}.txt"; A = np.loadtxt(RAW + 'acc_' + f)
        for _, _, a, s, e in seg:
            if a in acc and e - s > 300: acc[a].append(A[s + 100:min(e, s + 500)].mean(0))
    return {a: np.mean(v, 0) for a, v in acc.items()}, {a: np.std(v, 0) for a, v in acc.items()}

def wahba(u, v, w):
    """min Σ w |R u_i - v_i|^2 -> R (3x3 dönme)."""
    B = sum(wi * np.outer(vi, ui) for ui, vi, wi in zip(u, v, w))
    U, _, Vt = np.linalg.svd(B); d = np.sign(np.linalg.det(U @ Vt))
    return U @ np.diag([1, 1, d]) @ Vt

def rand_rot(rng):
    q = rng.normal(size=4); q /= np.linalg.norm(q); a, b, c, d = q
    return np.array([[a*a+b*b-c*c-d*d, 2*(b*c-a*d), 2*(b*d+a*c)], [2*(b*c+a*d), a*a-b*b+c*c-d*d, 2*(c*d-a*b)], [2*(b*d-a*c), 2*(c*d+a*b), a*a-b*b-c*c+d*d]])

def angle(R):
    return np.degrees(np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1)))

def main():
    model, mean, std = load_model('export/gru_demo/model.json')
    pm, ps = pop_means(); print('popülasyon ortalama g:', {a: pm[a].round(2).tolist() for a in pm}, flush=True)
    users = [int(u) for u in sys.argv[1:]] or [2, 4]
    data = load_users(users); rng = np.random.default_rng(1)
    out = {'ayrık': [], 'sürekli': []}
    for u in users:
        segs = data[u]
        calib_h = {a: windows(segs[a][0]) for a in (4, 5, 6)}
        ev_h = {a: np.concatenate([windows(s, 50, 4000, 64) for s in segs[a]]) for a in range(1, 7) if segs[a]}
        trials = [('ayrık', P) for P in ROTS] + [('sürekli', rand_rot(rng)) for _ in range(24)]
        for kind, P in trials:
            calib_app = {a: rot(w, P) for a, w in calib_h.items()}
            ev_app = {a: rot(w, P) for a, w in ev_h.items()}
            us = [calib_app[a][..., :3].reshape(-1, 3).mean(0) for a in (4, 5, 6)]
            R = wahba(us, [pm[4], pm[5], pm[6]], [1, 1, 2])
            def acc(Mx):
                c = n = 0
                for a, w in ev_app.items():
                    c += (probs(model, mean, std, rot(w, Mx)).argmax(1) == a - 1).sum(); n += len(w)
                return c / n
            out[kind].append((angle(R @ P), acc(R), acc(P.T), acc(np.eye(3))))
        print('kullanıcı', u, 'tamam', flush=True)
        for k, r in out.items():
            r = np.array(r)
            print(f"  {k:8s} n={len(r)} dönme hatası medyan {np.median(r[:,0]):.1f}° (p90 {np.percentile(r[:,0],90):.1f}°) | doğruluk wahba {r[:,1].mean():.3f} | oracle {r[:,2].mean():.3f} | kalibrasyonsuz {r[:,3].mean():.3f}", flush=True)

main()
