---
name: update-ppt-master
description: Bump the vendored ppt-master submodule to a newer upstream commit and re-validate the export pipeline. Use when asked to update ppt-master or when an upstream fix is needed.
---

# Update the ppt-master pin

> **Scope: `slides/`** — this skill covers the PPTX pipeline in `slides/` only. Paths below
> are relative to `slides/`, and `bun run …` commands run from there. PDFs (`report/`,
> `slide-directions/`) are covered by [pdf-documents](../pdf-documents/SKILL.md).

`vendor/ppt-master` is a shallow git submodule pinned to one commit. Never edit files
inside it.

```bash
git -C vendor/ppt-master fetch --depth 1 origin main   # or a tag / commit sha
git -C vendor/ppt-master checkout FETCH_HEAD
git -C vendor/ppt-master log -1 --oneline
```

Then:

1. Compare the exporter's dependencies,
   `vendor/ppt-master/skills/ppt-master/requirements.txt`, against `pyproject.toml`. We only
   mirror the packages the **SVG → PPTX** stage needs (python-pptx, XlsxWriter,
   skia-pathops, uharfbuzz, Pillow, numpy, PyYAML). Add any new export-stage dependency,
   then run `uv lock && uv sync`.
2. Check whether the CLI flags we call still exist. They're in
   `packages/ppt-master/src/run.ts`: `--quick-generate`, `--canonical-authoring`,
   `--stage final`, `--format`, `--json`, `-o`, `--with-notes` and `--no-notes`, plus
   `animation_config.py validate`. Confirm
   with `.venv/bin/python vendor/ppt-master/skills/ppt-master/scripts/svg_to_pptx.py --help`.
3. Regenerate the typed effect and transition names, **and** the skill catalogs
   (`pptx-object-animations/references/effect-catalog.md` and
   `pptx-transitions/references/transition-catalog.md`), with `bun run sync:motion`. If an effect
   used in `packages/slides` or `packages/mock-data` was removed upstream, `tsc` will flag it.
   Also check that `animation_config.py validate` still exists and that the sidecar schema
   in `packages/ppt-master/src/animations.ts` still matches `scripts/docs/pptx-animations.md` §8.
4. Run `bun run check && bun run generate --png`. If the quality gate adds new blocking
   rules, handle them in `normalizeSvg` and add a test case.
5. Re-verify the facts recorded in [ppt-master-export](../ppt-master-export/SKILL.md) (flags,
   default transition, contract rules) and fix the skill if upstream changed them.
6. Commit the submodule pointer together with any adapter changes, and name the new commit
   in the message.
