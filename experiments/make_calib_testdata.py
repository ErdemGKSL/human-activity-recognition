"""Android kalibrasyon birim testi için gerçek HAPT pencereleri (test kullanıcısı 2) + bilinen bir telefon duruşu P.

Çıktı: android/app/src/test/resources/calib_testdata.json. Pencereler 'app çerçevesinde' (a_app = P a_hapt).
"""
import json, sys
import numpy as np
sys.path.insert(0, '.')
from calib_sim import load_model, load_users, windows, rot, probs
from calib_sim2 import pop_means, wahba, angle

def main():
    model, mean, std = load_model('export/gru_demo/model.json')
    pm, _ = pop_means()
    segs = load_users([2])[2]
    ax = np.array([1.0, 2.0, 3.0]); ax /= np.linalg.norm(ax); th = np.radians(100)
    K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]])
    P = np.eye(3) + np.sin(th) * K + (1 - np.cos(th)) * K @ K
    names = {4: 'sitting', 5: 'standing', 6: 'laying'}
    app = {a: rot(windows(segs[a][0]), P) for a in (4, 5, 6)}
    us = [app[a][..., :3].reshape(-1, 3).mean(0) for a in (5, 4, 6)]   # sıra: ayakta, oturma, yatma
    R = wahba(us, [pm[5], pm[4], pm[6]], [1, 1, 2])
    frac = {names[a]: float((probs(model, mean, std, rot(app[a], R)).argmax(1) == a - 1).mean()) for a in (4, 5, 6)}
    obj = {"P": P.round(8).flatten().tolist(), "expected_R": R.round(8).flatten().tolist(),
           "expected_angle_error_deg": float(angle(R @ P)), "expected_correct_fraction": frac,
           "population_gravity": {names[a]: pm[a].round(4).tolist() for a in (4, 5, 6)},
           "windows": {names[a]: app[a].round(5).tolist() for a in (4, 5, 6)}}
    out = '../android/app/src/test/resources/calib_testdata.json'
    import os; os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(obj, open(out, 'w'), separators=(',', ':'))
    print('yazıldı', os.path.getsize(out) // 1024, 'KB', frac, 'açı hatası', round(obj['expected_angle_error_deg'], 1), 'popülasyon', obj['population_gravity'])

main()
