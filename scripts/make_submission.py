#!/usr/bin/env python3
"""Teslim paketini submission/ klasörüne toplar.

  python3 scripts/make_submission.py [--dataset-zip YOL]

Çıktı:
  submission/1_Sunum.pdf                  slides/output/final-results.pdf
  submission/2_Proje_Raporu.pdf           report/output/final-results.pdf
  submission/3_Veri_Seti/UCI_HAPT_veri_seti.zip  (UCI'nin özgün arşivi, başka dosya yok)
  submission/4_Model_Kodlari.zip          yalnızca kaynak kod: experiments/ ve android/ (açıklama dosyaları, sonuçlar, yorumlar ve docstring'ler hariç)
Önce `cd slides && bun run generate final-results --pdf` ve `cd report && bun run build final-results` çalıştırılmalı.
"""
import argparse, hashlib, shutil, subprocess, sys, zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from strip_comments import strip_file

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "submission"
UCI = "https://archive.ics.uci.edu/dataset/341/smartphone+based+recognition+of+human+activities+and+postural+transitions"
UCI_ZIP = UCI.replace("/dataset/341/", "/static/public/341/") + ".zip"

CODE_EXT = {".py", ".kt", ".kts", ".gradle", ".xml", ".sh", ".toml", ".lock", ".properties", ".bat", ".jar"}
# Android derlemesi için gereken veri dosyaları (model ve birim test verisi); başka hiçbir sonuç/veri dosyası girmez.
BUILD_DATA = ("android/app/src/main/assets/model.json", "android/app/src/test/resources/calib_testdata.json")

def keep_in_code_zip(f):
    """Yalnızca kaynak kod ve derleme dosyaları: açıklama (md/txt), günlük, sonuç ve şekil dosyaları girmez."""
    if f.startswith(("experiments/results", "experiments/export", "experiments/tools")):
        return False
    if f in BUILD_DATA:
        return True
    name = f.rsplit("/", 1)[-1]
    return Path(f).suffix in CODE_EXT or name in ("gradlew",)

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
    tmp = z.with_suffix(".tmp")
    with zipfile.ZipFile(z) as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        for info in src.infolist():
            if info.filename.rsplit("/", 1)[-1].lower() == "readme.txt":
                continue  # istek üzerine açıklama dosyası çıkarıldı; veri dosyaları aynen kalır
            dst.writestr(info, src.read(info.filename), compress_type=zipfile.ZIP_DEFLATED)
    tmp.replace(z)
    files = subprocess.run(["git", "ls-files", "experiments", "android"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    with zipfile.ZipFile(OUT / "4_Model_Kodlari.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if keep_in_code_zip(f) and (ROOT / f).is_file():
                info = zipfile.ZipInfo(f"model_kodlari/{f}", date_time=(2026, 11, 26, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = (0o755 if f.endswith(".sh") or f.endswith("gradlew") else 0o644) << 16
                zf.writestr(info, strip_file(f, (ROOT / f).read_bytes()))  # yorumlar ve docstring'ler çıkarılır
    for p in sorted(OUT.rglob("*")):
        if p.is_file():
            print(f"{p.relative_to(OUT)}  {p.stat().st_size / 1e6:.1f} MB")

main()
