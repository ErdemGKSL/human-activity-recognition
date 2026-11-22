---
name: colab-gpu
description: Run this repo's experiments (experiments/train2.py CV and final runs) on a Google Colab GPU through the mcp__colab-claude__* MCP tools without losing results — loading the deferred tools, picking a runtime spec, the real ~60 s execute_code limit, background jobs with nohup, polling sessions, uploading code and downloading result JSONs through the runtime's Jupyter contents API, and recovering when a runtime disappears ("Requested entity was not found"). Use when asked to train on Colab/GPU, start or reuse a Colab runtime, move files to or from a runtime, or when a runtime dropped or a Colab call timed out.
---

# Colab GPU runs (experiments/)

> **Scope: `experiments/`.** Paths are relative to the repo root. Everything here was
> observed in this repo's own Colab sessions unless it is marked **unverified hypothesis**.

## The rules that cost results when broken

1. **One `execute_code` call must finish in ≤ ~55 s.** The tool doc says 600 s, but the MCP
   client gives up with `timed out after 60s` (a 150 s `time.sleep` call died this way).
   Anything longer runs in the background (see [Background jobs](#background-jobs)).
2. **Results never live only on the runtime.** A runtime that got no call for ~15 min, while
   only a background process ran, was deleted with all its outputs. Poll about every 8 min,
   and on every poll download the results and commit/push them.
3. **A tool timeout is not a failure.** After `timed out`, the cell may still be running.
   Check the job log before doing anything; never restart a job just because a call
   timed out.
4. **Test data is touched once.** `--mode final` runs only with the frozen configuration, as
   the last step (see `experiments/JOURNEY.md`). Every decision before that uses `--mode cv`.
5. **No keep-alive tricks.** Fake clicks or activity simulators come close to violating
   Colab's usage policy. Short, real poll calls (log reads, downloads) are the only thing
   used here.

## Setup in a session

The tools are deferred. Load their schemas first with ToolSearch:

```
select:mcp__colab-claude__get_subscription,mcp__colab-claude__list_runtime_specs,mcp__colab-claude__list_runtimes,mcp__colab-claude__create_runtime,mcp__colab-claude__get_runtime,mcp__colab-claude__execute_code,mcp__colab-claude__create_session,mcp__colab-claude__list_sessions,mcp__colab-claude__delete_session,mcp__colab-claude__delete_runtime
```

Each call can raise a permission prompt. `.claude/settings.json` already allows all ten
tools, but allow rules load only when a session starts; in a session that is already
running, the user can pick Auto from the mode menu. Cloud sessions have no
bypass/dontAsk mode.

## Start or reuse a runtime

1. `get_subscription`: the API only returns Free, Pro or Pro+ (an "AI Ultra" plan does not
   show up as its own tier).
2. `list_runtime_specs`: use only specs with `eligible: true`. The set depends on the plan
   (T4/L4/A100/G4/TPU; on Free, L4 and T4 were eligible and H100 was not).
3. `list_runtimes`: reuse a running runtime instead of creating one.
4. `create_runtime` with a `runtimeSpec` and a **new UUID `requestId`** per runtime.
   - `FAILED_PRECONDITION`: no capacity or quota for that spec. Try another eligible spec.
   - `RESOURCE_EXHAUSTED`: rate limit. Back off and retry later.

What the runtime already has: `torch` and `scipy` are installed, and it has internet (the
UCI dataset downloads directly, `experiments/har/data.py`). The kernel's working
directory is `/content`.

## Running code

- `execute_code` targets either a `session` or a `runtime`, never both, and every run needs
  a **new UUID `executionId`**.
- Calls on the same session queue behind each other. A cell still running in the kernel
  (for example a wait loop the client gave up on after 60 s) blocks every later call on
  that session. Do the polling in **a separate session**: `create_session` with a
  `sessionId` such as `poll`.
- Delete only sessions and runtimes you created.

### Background jobs

A run grid is a bash file started detached, writing to a log and ending with an `ALLDONE`
marker:

```python
import subprocess
subprocess.Popen("cd /content/exp && nohup bash job.sh > job.log 2>&1 &", shell=True)
```

```bash
# job.sh (written with colab_up.py or execute_code)
set -u
mkdir -p results2/cv
python train2.py --mode cv --model gru --name g_gru --gravity --out results2/cv &
python train2.py --mode cv --model lstm --name g_lstm --gravity --out results2/cv &
python train2.py --mode cv --model cnn --name g_cnn --gravity --out results2/cv &
wait
echo ALLDONE
```

Each `train2.py` run writes `<--out>/<name>.json`, so CV grids pass `--out results2/cv`
(`train2.py` creates only the last folder level, hence the `mkdir -p`). A poll
call reads `tail -n 20 job.log` and `ls results2/cv`, and stays short.

The GPU was ~14% busy with these small models, and 3 parallel processes on one GPU ran
fine: each one got slower, total throughput went up. The same seeds gave the same results
on different runtimes.

CPU vs GPU: CPU is enough for small or baseline jobs. One RNN CV configuration takes
~1.5 h on CPU and ~5 min on Colab (**estimate, not measured side by side**).

## Moving files

`execute_code` output is text only, and base64 through it fills the context. Use the
runtime's Jupyter contents API over HTTP instead; it works from this container with
urllib or curl through the proxy.

- **Base URL**: `connectionInfo.url` from `list_runtimes`. **Header**:
  `X-Colab-Runtime-Proxy-Token: <connectionInfo.token>`. The token lasts about an hour;
  `list_runtimes` gives a fresh one.
- Paths start at `/content`: `<base>/api/contents/content/<path>`.
- `GET …?content=1` returns a directory listing or a file as JSON (text in `content`).
- `PUT` with `{"type":"file","format":"text","content":"…"}` writes a file. A missing parent
  directory gives 404, so `os.makedirs(..., exist_ok=True)` it with `execute_code` first.

The scripts read the URL and token from the environment variables `CB` and `CT`. Export
them in the same Bash command; never write either value into the repo, a commit or the chat.

```bash
SK=.claude/skills/colab-gpu/scripts
# upload code: experiments/train2.py -> /content/exp/train2.py, har/*.py -> /content/exp/har/
python3 -I $SK/colab_up.py --root experiments exp experiments/train2.py experiments/har/*.py
# download results: every *.json in /content/exp/results2/cv
python3 -I $SK/colab_down.py exp/results2/cv experiments/results2/cv
```

`colab_up.py` sends UTF-8 text only (binary `format: "base64"` is an **unverified
hypothesis**). `colab_down.py` is non-recursive, filters by `--glob` (default `*.json`) and
skips files whose content is unchanged.

## Poll loop and recovery

On every poll (about every 8 min; use `send_later` to wake this session):

1. Read the log tail on the `poll` session.
2. `colab_down.py` the result folder, then `python experiments/summarize2.py
   experiments/results2/cv` (writes `experiments/results2/ablation.md`).
3. Commit and push the new JSONs (and the journal entry in `experiments/JOURNEY.md`).
4. On `ALLDONE`: download one last time, then `delete_runtime`.

If a call returns `Requested entity was not found`, the runtime is gone. Open a new one,
create the folders, upload the code again, and restart only the runs whose JSON is not in
the repo yet.

Idle timeout and VM lifetime: Google's FAQ (research.google.com/colaboratory/faq.html)
gives no numbers. It says a runtime lasts at most 12 h (Pro+ up to 24 h of continuous
execution while compute units last) and that idle timeouts apply only once code execution
ends. Nothing written covers runtimes created through the MCP/API. The ~15 min loss above
is one observation. That a cell left waiting in the kernel keeps the runtime alive is an
**unverified hypothesis**; do not rely on it.

## Common mistakes

| Symptom | Cause | Fix |
| --- | --- | --- |
| `timed out after 60s`, output unknown | client limit, not the kernel | read `job.log`; don't relaunch |
| Calls hang one after another | same session, a cell still running | use the `poll` session |
| `Requested entity was not found` | runtime deleted | [recover](#poll-loop-and-recovery) |
| PUT returns 404 | parent dir missing | `os.makedirs` first |
| 401/403 on the contents API | token expired | `list_runtimes`, export the new `CT` |
| Result JSONs change in the diff after `bun run format`, or fail `bun run lint` | `train2.py` writes `indent=1`; Biome reformats them (same content) | expected; since local files then differ from the runtime's, the next `colab_down.py` rewrites them, so run `bun run format` after downloading and before committing |
