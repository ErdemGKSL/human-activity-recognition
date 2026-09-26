"""Validate agent docs: cross-links between skills must never rot.

Checks every Markdown file in AGENTS.md, README.md and .claude/skills/:
  - relative links point at files that exist
  - `#anchor` fragments match a heading in the target (GitHub slug rules)
  - every skill directory has SKILL.md with `name` == directory and a `description`

Run: bun run lint:docs   (also part of `bun run check`)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / ".claude/skills"
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)\)")
FENCE = re.compile(r"^(```|~~~)")


def slug(heading: str) -> str:
    """GitHub-style heading anchor."""
    text = re.sub(r"`", "", heading.strip().lower())
    text = re.sub(r"[^\w\- ]", "", text)
    return text.replace(" ", "-")


def anchors(path: Path) -> set[str]:
    found: set[str] = set()
    counts: dict[str, int] = {}
    in_fence = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r"^#{1,6}\s+(.*)$", line)
        if m:
            base = slug(m.group(1))
            n = counts.get(base, 0)
            counts[base] = n + 1
            found.add(base if n == 0 else f"{base}-{n}")
    return found


def links(path: Path):
    in_fence = False
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        # Ignore inline code spans.
        for target in LINK.findall(re.sub(r"`[^`]*`", "", line)):
            yield number, target


def main() -> int:
    files = [ROOT / "AGENTS.md", ROOT / "README.md", *sorted(SKILLS.rglob("*.md"))]
    errors: list[str] = []
    cache: dict[Path, set[str]] = {}

    for md in files:
        for number, target in links(md):
            if re.match(r"^[a-z]+:", target):  # http:, https:, mailto:
                continue
            file_part, _, fragment = target.partition("#")
            dest = (md.parent / file_part).resolve() if file_part else md
            where = f"{md.relative_to(ROOT)}:{number}"
            if not dest.exists():
                errors.append(f"{where}: missing file {target}")
                continue
            if fragment and dest.suffix == ".md":
                known = cache.setdefault(dest, anchors(dest))
                if fragment not in known:
                    errors.append(f"{where}: no heading #{fragment} in {dest.relative_to(ROOT)}")

    for skill in sorted(p for p in SKILLS.iterdir() if p.is_dir()):
        doc = skill / "SKILL.md"
        if not doc.exists():
            errors.append(f"{skill.relative_to(ROOT)}: missing SKILL.md")
            continue
        head = doc.read_text(encoding="utf-8").split("---")
        meta = head[1] if len(head) > 2 else ""
        name = re.search(r"^name:\s*(.+)$", meta, re.M)
        if not name or name.group(1).strip() != skill.name:
            errors.append(f"{doc.relative_to(ROOT)}: frontmatter name must be '{skill.name}'")
        if not re.search(r"^description:\s*\S", meta, re.M):
            errors.append(f"{doc.relative_to(ROOT)}: missing description")

    for error in errors:
        print(f"✗ {error}")
    print(f"{'✗' if errors else '✓'} docs: {len(files)} files, {len(errors)} problems")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
