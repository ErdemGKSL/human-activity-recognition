#!/usr/bin/env python3
"""Teslim paketini submission/ klasörüne toplar.

  python3 scripts/make_submission.py [--dataset-zip YOL]

Çıktı:
  submission/1_Sunum.pdf                  slides/output/final-results.pdf
  submission/2_Proje_Raporu.pdf           report/output/final-results.pdf
  submission/3_Veri_Seti/UCI_HAPT_veri_seti.zip + VERI_SETI_README.txt
  submission/4_Model_Kodlari.zip          experiments/ ve android/ kaynakları (git'te izlenen dosyalar)
Önce `cd slides && bun run generate final-results --pdf` ve `cd report && bun run build final-results` çalıştırılmalı.
"""
import argparse, hashlib, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "submission"
UCI = "https://archive.ics.uci.edu/dataset/341/smartphone+based+recognition+of+human+activities+and+postural+transitions"
UCI_ZIP = UCI.replace("/dataset/341/", "/static/public/341/") + ".zip"

DATASET_README = f"""Veri seti: Smartphone-Based Recognition of Human Activities and Postural Transitions (HAPT), sürüm 2.1
Kaynak: UCI Machine Learning Repository, #341  ({UCI})
Dosya: UCI_HAPT_veri_seti.zip (UCI'den indirilen özgün arşiv, değiştirilmemiştir)

İçerik: 30 gönüllünün bele takılı akıllı telefon (Samsung Galaxy S II) accelerometer ve gyroscope kayıtları (50 Hz),
12 etiket (6 aktivite ve 6 postural transition), 561 feature'lı hazır window kümeleri ve ham sinyaller (RawData/).
Resmi kişi bazlı ayrım: 21 kişi eğitim, 9 kişi test. Projede kullanılan ham window'lar bu arşivdeki RawData'dan
experiments/har/data.py ile üretilmiştir.

Kullanım koşulları (arşivdeki README.txt'den): yayınlarda veri setinin kullanımı aşağıdaki yayına atıfla belirtilmelidir.
Veri seti "olduğu gibi" dağıtılır ve ticari kullanımı yasaktır. Bu paket yalnızca ders teslimi (akademik, ticari olmayan)
amacıyla hazırlanmıştır.

Atıf:
- Jorge-L. Reyes-Ortiz, Luca Oneto, Albert Sama, Xavier Parra, Davide Anguita. Transition-Aware Human Activity
  Recognition Using Smartphones. Neurocomputing. Springer 2015.
"""

def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset-zip", help="UCI arşivi (yoksa indirilir)")
    a = ap.parse_args()
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "3_Veri_Seti").mkdir(parents=True)
    for src, dst in ((ROOT / "slides/output/final-results.pdf", "1_Sunum.pdf"), (ROOT / "report/output/final-results.pdf", "2_Proje_Raporu.pdf")):
        if not src.exists():
            sys.exit(f"{src} yok: önce PDF'i üretin (dosya başındaki açıklamaya bakın)")
        shutil.copy(src, OUT / dst)
    z = OUT / "3_Veri_Seti" / "UCI_HAPT_veri_seti.zip"
    if a.dataset_zip:
        shutil.copy(a.dataset_zip, z)
    else:
        import urllib.request
        with urllib.request.urlopen(UCI_ZIP) as r, open(z, "wb") as f:
            shutil.copyfileobj(r, f)
    assert zipfile.ZipFile(z).testzip() is None, "veri seti arşivi bozuk"
    (OUT / "3_Veri_Seti" / "VERI_SETI_README.txt").write_text(DATASET_README + f"\nSHA-256 (zip): {sha256(z)}\n", encoding="utf-8")
    files = subprocess.run(["git", "ls-files", "experiments", "android"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    with zipfile.ZipFile(OUT / "4_Model_Kodlari.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f.endswith("experiments/HANDOFF.md"):
                continue  # oturumlar arası iç not, teslime girmez
            if (ROOT / f).is_file():
                zf.write(ROOT / f, f"model_kodlari/{f}")
        zf.write(ROOT / "experiments/README.md", "model_kodlari/README.md")
    for p in sorted(OUT.rglob("*")):
        if p.is_file():
            print(f"{p.relative_to(OUT)}  {p.stat().st_size / 1e6:.1f} MB")

main()
