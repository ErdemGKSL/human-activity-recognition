"""Print what a generated .pptx actually contains, slide by slide.

Previews are static PNGs and LibreOffice may be unavailable, so this is how
agents verify motion and structure without PowerPoint:

  transition   element, duration, direction/options, auto-advance
  morph        `!!key` shape names (Morph pairs)
  animations   one row per Animation Pane entry: order, Start mode, effect key,
               target shape name, and modifiers (repeat, auto-reverse, after-effect)
  triggers     "On click of" sequences (interactiveSeq) and their trigger shape
  notes        whether speaker notes are embedded
  shapes       counts of native shapes / groups / pictures / text runs

Usage:
  bun run inspect output/motion-showcase.pptx            # all slides
  bun run inspect output/motion-showcase.pptx --slide 3  # one slide
  bun run inspect output/deck.pptx --json                # machine-readable
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "vendor/ppt-master/skills/ppt-master/scripts"))

try:  # Map preset ids back to ppt-master effect keys when the registry is present.
    import pptx_animations

    _BY_PRESET = {}
    for _key, _spec in pptx_animations.NATIVE_ANIMATIONS.items():
        _BY_PRESET.setdefault(
            (_spec.get("presetClass"), str(_spec.get("presetID")), str(_spec.get("presetSubtype"))), _key
        )
        _BY_PRESET.setdefault((_spec.get("presetClass"), str(_spec.get("presetID")), None), _key)
except Exception:  # noqa: BLE001 — inspection still works without names
    _BY_PRESET = {}

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
TRIGGERS = {"clickEffect": "on-click", "withEffect": "with-previous", "afterEffect": "after-previous"}


def effect_key(cls: str | None, pid: str | None, sub: str | None) -> str:
    return _BY_PRESET.get((cls, pid, sub)) or _BY_PRESET.get((cls, pid, None)) or f"{cls}#{pid}/{sub}"


def slide_order(z: zipfile.ZipFile) -> list[str]:
    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    rels = ET.fromstring(z.read("ppt/_rels/presentation.xml.rels"))
    targets = {r.get("Id"): r.get("Target") for r in rels}
    ids = [s.get(f"{{{NS['r']}}}id") for s in pres.iterfind(".//p:sldIdLst/p:sldId", NS)]
    return ["ppt/" + targets[i].lstrip("/").removeprefix("ppt/") for i in ids]


def transition(xml: str) -> dict | None:
    m = re.search(r"<p:transition\b([^>]*)>(.*?)</p:transition>", xml, re.S)
    if not m:
        return None
    attrs, body = m.groups()
    # Prefer the richest branch of mc:AlternateContent (p14/p159 Choice).
    el = re.search(r"<(p\d*:\w+)\b([^>/]*)/?>", re.sub(r"</?mc:\w+[^>]*>", "", body))
    out: dict = {"effect": el.group(1).split(":")[1] if el else "none"}
    if el and el.group(2).strip():
        out["attrs"] = dict(re.findall(r'(\w+)="([^"]*)"', el.group(2)))
    dur = re.search(r'(?:p14:)?dur="(\d+)"', attrs)
    if dur:
        out["duration_s"] = int(dur.group(1)) / 1000
    adv = re.search(r'advTm="(\d+)"', attrs)
    if adv:
        out["auto_advance_s"] = int(adv.group(1)) / 1000
    return out


def animations(root: ET.Element, names: dict[str, str]) -> tuple[list[dict], list[dict]]:
    rows: list[dict] = []
    interactive: list[dict] = []
    # bounce_end writes mc:AlternateContent with two p:timing branches (p14
    # Choice + Fallback); read only the first so rows aren't counted twice.
    timing = root.find(".//p:timing", NS)
    if timing is None:
        return rows, interactive
    for seq in timing.iter(f"{{{NS['p']}}}seq"):
        ctn = seq.find("p:cTn", NS)
        kind = ctn.get("nodeType") if ctn is not None else None
        trigger_shape = None
        if kind == "interactiveSeq":
            tgt = seq.find("p:prevCondLst/../p:cTn/p:stCondLst/p:cond/p:tgtEl/p:spTgt", NS)
            if tgt is None:
                tgt = seq.find(".//p:stCondLst/p:cond/p:tgtEl/p:spTgt", NS)
            trigger_shape = names.get(tgt.get("spid")) if tgt is not None else None
        for node in seq.iter(f"{{{NS['p']}}}cTn"):
            cls = node.get("presetClass")
            if not cls:
                continue
            target = node.find(".//p:spTgt", NS)
            row = {
                "effect": effect_key(cls, node.get("presetID"), node.get("presetSubtype")),
                "start": TRIGGERS.get(node.get("nodeType", ""), node.get("nodeType")),
                "target": names.get(target.get("spid")) if target is not None else None,
            }
            # Effective duration = longest behavior inside the row; delay = row start offset.
            durs = [
                int(c.get("dur"))
                for c in node.iter(f"{{{NS['p']}}}cTn")
                if c is not node and (c.get("dur") or "").isdigit()
            ]
            if durs:
                row["dur"] = f"{max(durs) / 1000:g}s"
            cond = node.find("p:stCondLst/p:cond", NS)
            if cond is not None and (cond.get("delay") or "0").isdigit() and int(cond.get("delay")) > 0:
                row["delay"] = f"{int(cond.get('delay')) / 1000:g}s"
            repeat = node.get("repeatCount")
            if repeat and repeat != "indefinite":
                row["repeat"] = f"{int(repeat) / 1000:g}"  # OOXML stores thousandths
            elif repeat:
                row["repeat"] = "indefinite"
            if node.get("autoRev") == "1":
                row["auto_reverse"] = "yes"
            if node.find(".//p:animClr", NS) is not None and cls == "entr":
                row["after_effect"] = "dim"
            if kind == "interactiveSeq":
                row["on_click_of"] = trigger_shape
                interactive.append(row)
            else:
                rows.append(row)
    return rows, interactive


def inspect(path: Path, only: int | None) -> list[dict]:
    report = []
    with zipfile.ZipFile(path) as z:
        files = set(z.namelist())
        for index, part in enumerate(slide_order(z), 1):
            if only and index != only:
                continue
            xml = z.read(part).decode("utf-8")
            root = ET.fromstring(xml)
            names = {
                el.get("id"): el.get("name")
                for el in root.iterfind(".//p:cNvPr", NS)
                if el.get("id")
            }
            rows, interactive = animations(root, names)
            rels_part = part.replace("slides/", "slides/_rels/") + ".rels"
            has_notes = rels_part in files and b"notesSlide" in z.read(rels_part)
            report.append(
                {
                    "slide": index,
                    "part": part,
                    "transition": transition(xml),
                    "morph_names": sorted({n for n in names.values() if n and n.startswith("!!")}),
                    "animations": rows,
                    "on_click_of": interactive,
                    "notes": has_notes,
                    "shapes": {
                        "sp": xml.count("<p:sp>"),
                        "grpSp": xml.count("<p:grpSp>"),
                        "pic": xml.count("<p:pic>"),
                        "text_runs": xml.count("<a:t>"),
                    },
                }
            )
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pptx", type=Path)
    parser.add_argument("--slide", type=int, help="1-based slide number")
    parser.add_argument("--json", action="store_true", help="print JSON")
    args = parser.parse_args()
    report = inspect(args.pptx, args.slide)
    if args.json:
        print(json.dumps(report, indent=2))
        return
    for s in report:
        t = s["transition"]
        tdesc = "none" if not t else " ".join(
            [t["effect"]]
            + [f"{k}={v}" for k, v in t.get("attrs", {}).items()]
            + ([f"{t['duration_s']:g}s"] if "duration_s" in t else [])
            + ([f"auto-advance {t['auto_advance_s']:g}s"] if "auto_advance_s" in t else [])
        )
        print(f"── slide {s['slide']}  transition: {tdesc}  notes: {'yes' if s['notes'] else 'no'}")
        if s["morph_names"]:
            print(f"   morph: {', '.join(s['morph_names'])}")
        for i, r in enumerate(s["animations"], 1):
            extra = " ".join(f"{k}={v}" for k, v in r.items() if k not in {"effect", "start", "target"})
            print(f"   {i:>2}. {r['start']:<14} {r['effect']:<26} → {r['target']}  {extra}".rstrip())
        for r in s["on_click_of"]:
            print(f"   ⇢ on click of {r['on_click_of']}: {r['effect']} → {r['target']}")
        sh = s["shapes"]
        print(f"   shapes: {sh['sp']} sp, {sh['grpSp']} groups, {sh['pic']} pictures, {sh['text_runs']} text runs")


if __name__ == "__main__":
    main()
