"""cv/*.json (ve final/*.json) -> results2/ablation.md. Kullanım: python summarize2.py cv_dir"""
import json, sys
from pathlib import Path

d = Path(sys.argv[1] if len(sys.argv) > 1 else "results2/cv")
rows = []
for f in sorted(d.glob("*.json")):
    r = json.loads(f.read_text())
    a = r["args"]
    cfg = (f"ep{a['epochs']} lr{a['lr']:g} wu{a['warmup']} clip{a['clip']:g} pool={a['pool']} bi={int(a['bidir'])} "
           f"grav={int(a['gravity'])} step={a['tstep']} aug={int(a['aug'])} cw={a['cw']} var={a['variant']}")
    pc = [sum(s["per_class_f1"][i] for s in r["seeds"]) / len(r["seeds"]) for i in range(12)]
    rows.append((r["name"], a["model"], cfg, r["mean_f1"], r["std_f1"], sum(pc[:6]) / 6, sum(pc[6:]) / 6))
out = ["| Koşu | Model | Yapılandırma | OOF macro F1 | Aktivite F1 | Transition F1 |", "|---|---|---|---|---|---|"]
for n, m, c, mu, sd, fa, ft in rows:
    out.append(f"| {n} | {m} | {c} | {mu:.3f} ± {sd:.3f} | {fa:.3f} | {ft:.3f} |")
Path(d.parent / "ablation.md").write_text("\n".join(out) + "\n")
print("\n".join(out))
