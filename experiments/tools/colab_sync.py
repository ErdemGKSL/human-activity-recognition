"""Tek çağrıda: Colab loglarının sonunu yaz, cv/*.json indir, format+commit+push. Ortam: CB (runtime url), CT (token). Kullanım: CB=... CT=... python3 -I experiments/tools/colab_sync.py"""
import json, os, pathlib, subprocess, urllib.request
base, tok = os.environ["CB"], os.environ["CT"]
H = {"X-Colab-Runtime-Proxy-Token": tok}
def get(path):
    return json.load(urllib.request.urlopen(urllib.request.Request(f"{base}/api/contents/content/exp{"/" + path if path else ""}?content=1", headers=H), timeout=60))
repo = pathlib.Path(__file__).resolve().parents[2]
for it in get("").get("content", []):
    if it["name"].endswith(".log"):
        lines = [l for l in get(it["name"])["content"].splitlines() if l.startswith("==") or "ALLDONE" in l or "Error" in l or "cv seed" in l or "final seed" in l]
        print(it["name"], "|", " || ".join(l[:60] for l in lines[-2:]))
out = repo / "experiments/results2/cv"; out.mkdir(parents=True, exist_ok=True)
n = 0
for it in get("cv")["content"]:
    if it["name"].endswith((".json",)):
        (out / it["name"]).write_text(get("cv/" + it["name"])["content"]); n += 1
print(n, "json indirildi")
# final koşu çıktıları (json + olasılık npz); ikili dosya base64 gelir
import base64
fin = repo / "experiments/results2/final"
try:
    items = get("final")["content"]
except Exception:
    items = []
m = 0
for it in items:
    if it["name"].endswith(".json"):
        fin.mkdir(parents=True, exist_ok=True); (fin / it["name"]).write_text(get("final/" + it["name"])["content"]); m += 1
    elif it["name"].endswith(".npz"):
        r = json.load(urllib.request.urlopen(urllib.request.Request(f"{base}/api/contents/content/exp/final/{it['name']}?content=1&format=base64", headers=H), timeout=120))
        fin.mkdir(parents=True, exist_ok=True); (fin / it["name"]).write_bytes(base64.b64decode(r["content"])); m += 1
print(m, "final dosyası indirildi")
sh = lambda c: subprocess.run(c, shell=True, cwd=repo, capture_output=True, text=True)
sh("bun run format")
sh("git add -A && git commit -q -m 'experiments: Colab sonuç eşitleme\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_011osUpAGK1YXek1b27SP9Xb'")
print(sh("git push -q origin claude/zealous-lovelace-smjw8t && git push -q origin HEAD:main && echo pushed").stdout.strip())
