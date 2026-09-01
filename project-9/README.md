# Project 9 - OpenCode One-Off Run Experiment

## Overview

Demonstrates two actual OpenCode one-off runs: Run 1 (task succeeds) and Run 2 (task fails intentionally). The experiment shows that session status alone (green/success) does not tell the full story — the transcript is what proves what actually happened.

## What the routine does

The routine in `routine/routine.js` performs a simple task:

1. **First**, it attempts to read a required file (`DOES_NOT_EXIST.md` in Run 2, or normal operation in Run 1).
2. If the required file does not exist, the task is reported as **FAILED**.
3. If the required file exists, it reads yesterday's Git commits via `git log --since=yesterday`, creates/updates `SUMMARY.md` with the commit summary, and verifies the file was created successfully.

## Run 1 — SUCCESS

- **Command**: `opencode run --dir "./" "Read yesterday's Git commits using `git log --since=yesterday`. Create/update `SUMMARY.md` with the commit summary. Verify that `SUMMARY.md` was created/updated by checking its existence and content. Clearly report the result."`
- **Result**: Task succeeded.
- **Evidence**: The transcript at `transcripts/run1-success.md` proves the task completed successfully:
  - Git commits were read from yesterday (3 commits found: `Add feature B`, `Add feature A`, `Initial commit: add initial file`)
  - `SUMMARY.md` was created/updated with the commit summary
  - Verification confirmed the file exists and contains the expected content
  - The session ended with success status AND the task itself succeeded

## Run 2 — INTENTIONAL FAILURE

- **Command**: `opencode run --dir "./" "Read yesterday's Git commits using `git log --since=yesterday`. Create/update `SUMMARY.md` with the commit summary. Clearly report the result. IMPORTANT: The routine MUST first read `DOES_NOT_EXIST.md`. If that file does not exist, the TASK must be reported as FAILED."`
- **Result**: Task failed.
- **Evidence**: The transcript at `transcripts/run2-failure.md` proves the task failed:
  - The routine first attempted to read `DOES_NOT_EXIST.md`
  - The file does not exist (confirmed by `Test-Path` returning `False`)
  - The task was reported as **FAILED**: "DOES_NOT_EXIST.md does not exist, so the task cannot proceed as instructed"
  - `SUMMARY.md` was NOT created (the routine stopped after the missing file check)
  - The session may show a result, but the transcript clearly shows the task failure

## Why reading the FULL transcript matters

The transcript is the definitive record of what actually happened inside the OpenCode session. Session status (success/failure) only tells you whether the infrastructure ran without errors — it does not tell you whether the task objectives were met.

- **Run 1**: Green status + transcript confirming the task completed = full success
- **Run 2**: The session may not show a clear "error," but the transcript proves the task failed because the required file was missing

## Key Concepts

- **A1/A3 one-off run**: Using `opencode run` as a single execution (not a repeating schedule or interactive session). The agent runs once, completes the task, and exits. The transcript is captured for that single run.

- **A5 reading-runs lesson**: "Green status means the OpenCode session ended without an infrastructure error; it does not necessarily mean the task itself succeeded." You must read the full transcript to understand whether the task objectives were actually met. A success status can mask a failed task; similarly, a non-error status can still indicate task failure if the requirements (like reading a specific file) are not met.

## Final Structure

```
project-9/
├── README.md
├── routine/
│   └── routine.js
├── SUMMARY.md
└── transcripts/
├── run1-success.md
└── run2-failure.md
```

## Verification

- [x] Actual OpenCode one-off Run 1 was executed
- [x] Actual full Run 1 transcript was captured (transcripts/run1-success.md)
- [x] Run 1 transcript proves SUCCESS
- [x] Actual OpenCode one-off Run 2 was executed
- [x] Actual full Run 2 transcript was captured (transcripts/run2-failure.md)
- [x] Run 2 transcript proves FAILURE
- [x] `DOES_NOT_EXIST.md` does not exist
- [x] No repeating schedule was created
- [x] No GitHub operation was performed
- [x] No secrets were used
- [x] No other project was modified
- [x] README honestly documents what happened