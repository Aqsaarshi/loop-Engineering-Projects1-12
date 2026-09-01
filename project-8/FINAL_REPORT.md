# Project 8 - Final Report

## Components Created

All six required components are implemented in `project-8/`:

| Component | File(s) | Status |
|-----------|---------|--------|
| **Heartbeat** | `heartbeat/heartbeat.js` | `.loop.lock` guard with 1-minute timeout |
| **Worktree** | `worktree/worktree.js` | `git worktree add` isolation; cleanup after each run |
| **Skill** | `skill/checkStaleness.js` | `checkStaleness(rootDir, thresholdDays)` reads git log dates |
| **Maker-Checker** | `maker-checker/maker-checker.js` | Generates markdown report; human-review only |
| **Connector** | `connector/github-connector.js` | GitHub API via `GITHUB_PAT` env var; `openOrUpdateIssue()` |
| **Spine** | `logs/run_log.jsonl`, `progress.md` | Machine + human-readable run history |

### Additional Files
- `config/settings.js` — Configuration (30-day threshold, $1.00 budget, daily cadence)
- `loop.js` — Main orchestrator (658 lines)
- `budget/budget-guard.js` — Monthly budget tracking
- `README.md` — Full documentation

## What Was Tested

Multiple end-to-end runs were performed from a clean state:

### Passes
- ✅ Loop runs unattended from clean state
- ✅ `.loop.lock` heartbeat guard prevents duplicate runs within 1 minute
- ✅ Worktree created, used for scanning README git dates, then removed
- ✅ `checkStaleness()` correctly identifies READMEs past 30-day threshold
- ✅ Maker-checker generates markdown report listing stale projects
- ✅ Report written to `reports/` directory for human review
- ✅ `progress.md` persists run history across runs (append-only entries)
- ✅ `run_log.jsonl` records one JSON entry per run with `timestamp`, `status`, `tokens_in`, `tokens_out`, `error`, `needs_human`, `attempt`
- ✅ Budget guard: daily cadence projects $0.36/month (within $1.00 limit); hourly would pause
- ✅ GitHub API 401 correctly produces `status: "failure"`, `needs_human: true` in spine
- ✅ Worktree cleanup removes scan directory and runs `git worktree prune`

### Still Needs Configuration
- ⚠️ GitHub PAT authentication: Loop requires `GITHUB_PAT` environment variable with `repo` scope to create GitHub Issues. Without it, the GitHub API step fails with 401, which the loop handles gracefully (logs failure, flags `needs_human: true`, pauses for human review).

### Root Cause: progress.md Confusion
The earlier `progress.md` "not found" issue was caused by using `&&` to chain commands after the loop script. The loop intentionally exits with code 1 when the GitHub API authentication fails (no PAT configured). Using `&&` with `exit code 1` skips the second command. The `progress.md` file was correctly created and persisted during each loop run.

### Remaining Real-World Validation Needed
> "The loop has been tested through multiple end-to-end runs. A real one-week unattended scheduled test remains future validation."

To achieve the full acceptance criteria, the loop must run on a daily Task Scheduler trigger for a full week unattended. This will validate:
- Heartbeat lock does not cause missed or duplicate runs under Task Scheduler
- Budget guard remains stable at daily cadence across 7+ runs
- Spine files accumulate correctly without corruption
- Maker-checker reports are generated and can be reviewed
- Worktree isolation holds across all runs (no lingering git worktrees)

## Authentication Setup Required
Set `GITHUB_PAT` environment variable:
```powershell
$env:GITHUB_PAT = "ghp_your_personal_access_token"
```
The PAT needs `repo` scope to create issues in the target repository.

## Files/Components Summary
- **9 directory components**: heartbeat, worktree, skill, maker-checker, connector, logs, reports, config, budget
- **10 source files**: loop.js, heartbeat.js, worktree.js, checkStaleness.js, maker-checker.js, github-connector.js, budget-guard.js, settings.js, README.md, run_log.jsonl (runtime), progress.md (runtime)
- **Runtime artifacts**: `logs/run_log.jsonl`, `progress.md`, `reports/staleness-report-*.md`, `.loop.lock`, `worktree/scan-worktree/` (temporary)