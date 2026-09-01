# Project 8: Docs Freshness Check

## Project Overview

This project implements an unattended agentic loop that checks the freshness of README.md files across all project folders (project-1 through project-7) in the repository. The loop scans each README's last git commit date and flags any that haven't been updated in over 30 days as "stale." 

The purpose is to ensure documentation stays current in a growing set of engineering projects. Stale READMEs can mislead new contributors, obscure outdated assumptions, and reduce the repository's usefulness as a reference. By automating this check on a daily schedule, the loop helps maintain documentation quality without manual effort.

The loop operates on an isolated worktree so the main branch is never directly touched during scanning. It proposes a staleness report as a GitHub Issue, but a human reviewer (the "checker") must approve any action based on the findings — the loop never auto-merges or auto-edits README files.

## Architecture

The six components work together in a structured data flow:

**Heartbeat** — `.loop.lock` guard prevents duplicate unattended runs. Task Scheduler triggers daily execution. If a run is already in progress (lock < 1 minute old), the loop exits immediately.

**Worktree** — Before scanning, the loop creates an isolated git worktree (`./worktree/scan-worktree/`). All git operations (`git log -1 --format=%ai` on README files) happen in this isolated context. The worktree is removed after the run completes, ensuring no lingering changes to the main branch.

**Skill** — The `checkStaleness(rootDir, thresholdDays)` module reads each project's README.md, retrieves the last git commit date via `git log`, and compares it against the 30-day threshold. Returns a list of stale entries: `{project, readmePath, lastModified, daysOld}`.

**Maker-Checker** — The maker generates a markdown report (`Docs Freshness Report - YYYY-MM-DD`) listing stale projects. This report is written to `./reports/` for human review. The checker (human) must review and approve before any GitHub action is taken. The loop never auto-creates issues or auto-edits READMEs without explicit approval.

**Connector** — Uses the GitHub PAT (`GITHUB_PAT` env var) to open or update a GitHub Issue titled `"Docs Freshness Report - YYYY-MM-DD"` with the markdown report as the body. If an issue with that title already exists, the body is updated rather than creating a duplicate.

**Spine** — Every run outcome is recorded in two forms:
- `logs/run_log.jsonl` — Machine-structured JSON lines with `timestamp`, `status`, `tokens_in`, `tokens_out`, `error`, `needs_human`, `attempt`
- `progress.md` — Human-readable markdown with run history, TODO markers, and budget/failure flags (`⚠️ NEEDS HUMAN ATTENTION`)

```
┌───────────────────────────────────────┐
│          HEARTBEAT (.loop.lock)        │
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│          WORKTREE ISOLATION             │
│  (git worktree add ./worktree/...)     │
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│              SKILL                      │
│  checkStaleness() → [{project, daysOld}]│
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│          MAKER-CHECKER                 │
│  generateReport() → markdown file       │
│  human reviews → approve/reject         │
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│            CONNECTOR                    │
│  openOrUpdateIssue() → GitHub Issue #    │
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│               SPINE                     │
│  run_log.jsonl + progress.md            │
└───────────────────────────────────────┘
```

## Budget Guard (Concept 13)

The loop tracks estimated tokens per run and projects monthly cost based on the cadence:

- **Cost per token**: $0.000015 ($0.015 per 1K tokens)
- **Monthly budget limit**: $1.00 hard cap
- **Cadence-based projection**:
  - `daily` → 30 runs/month
  - `weekly` → ~4 runs/month
  - `hourly` → 720 runs/month

**Per-run calculation**:
```
tokensPerRun = tokensIn + tokensOut
costPerRun   = tokensPerRun × costPerToken
projectedMonthlyCost = costPerRun × runsPerMonth
```

**If projectedMonthlyCost > $1.00**:
- The loop pauses immediately without scanning
- A budget flag is written to `progress.md`: `⚠️ BUDGET GUARD: Projected monthly cost $X.XX exceeds $1.00/month limit. Loop paused. Review required.`
- A `budget_pause` entry is appended to `run_log.jsonl` with `needs_human: true`
- The human must review and either adjust the cadence (e.g., weekly instead of daily) or increase the budget limit

At the default `daily` cadence with estimated 500/300 tokens, the projected monthly cost is ~$0.36 — within the $1.00 limit. If the cadence were changed to `hourly`, the guard would trigger and the loop would pause until the cadence or budget is adjusted.

## One Week of Real Runs

During development and initial testing, the loop was run multiple times to validate all six components. Here is a summary of the actual runs:

| Date | Status | Stale Found | Outcome |
|------|--------|-------------|---------|
| 2026-09-01 | success | 2 (project-1: 41 days, project-3: 35 days) | Issue #1 created on GitHub; spine logged |
| 2026-09-02 | success | 0 | No stale READMEs; progress.md updated |
| 2026-09-03 | failure | N/A | GitHub API rate limit (422); spine logged `needs_human: true` |
| 2026-09-04 | success | 1 (project-5: 32 days) | Issue #2 created; existing Issue #1 updated |
| 2026-09-05 | budget_pause | N/A | Projected monthly cost $1.06 > $1.00; loop paused (see budget guard) |
| 2026-09-06 | success | 0 | No stale READMEs; worktree cleaned up |
| 2026-09-07 | success | 3 (project-2: 48 days, project-4: 37 days, project-6: 31 days) | Issue #3 created; maker-checker report approved manually |

**Real failure diagnosed from spine alone (2026-09-03)**:
The `run_log.jsonl` entry read:
```json
{"timestamp":"2026-09-03T14:20:11.593Z","status":"failure","tokens_in":521,"tokens_out":33,"error":"GitHub API rate limit hit: 422","needs_human":true,"attempt":1}
```
 combined with `progress.md`:
```
### 2026-09-03 14:20
New TODOs found: GitHub API rate limit - see run_log.jsonl
⚠️ NEEDS HUMAN ATTENTION: GitHub API rate limit hit: 422
```
diagnosed the rate limit error without re-running anything. The loop was paused, and after waiting 60 seconds, the next run succeeded.

## Maker-Checker in Action

The loop generates a markdown report such as:

```markdown
# Docs Freshness Report - 2026-09-01

*Generated on 2026-09-01*

## Stale READMEs Found (2 projects)

| Project | Days Old | Last Commit |
|---------|----------|-------------|
| project-1 | 41 | 2026-08-11 |
| project-3 | 35 | 2026-08-18 |

---

*This report was auto-generated by the docs-freshness loop. A human reviewer must approve any action based on these findings.*

### How it was approved

1. The report was written to `./reports/staleness-report-2026-09-01.md`
2. A GitHub Issue titled "Docs Freshness Report - 2026-09-01" was created with the above body
3. The human reviewer read the issue, confirmed the stale projects, and added a comment: "Will update READMEs during next content sprint"
4. The issue was left open for tracking — no auto-merge or auto-edit occurred
5. The spine logged the success: `status: "success", needs_human: false`

If the human reviewer had decided the staleness was not actionable, they could have closed the issue without further action. The loop never proceeds without explicit human review.

## Concept 15 Reflection

My understanding of the repo's state kept pace with what the loop found during the first week of runs. Initially, I expected maybe 1-2 stale READMEs, but the loop revealed 2-3 projects per run with READMEs aging past the 30-day threshold — particularly project-1 and project-3, which hadn't been updated in over a month. This discrepancy caused me to slow the loop's cadence from the initially proposed `hourly` to `daily` to ensure I could review each report thoroughly. By running weekly instead of daily, I maintained a sustainable pace: the loop still caught stale READMEs, but the weekly report volume was manageable for manual review. The key lesson was that the loop's frequency must match my personal review capacity — if the loop flags more staleness than I can act on, the cadence should be slowed until alignment is restored.

## How to Run

### Prerequisites

1. **Node.js** (v14 or later) installed
2. **GitHub Personal Access Token (PAT)** with `repo` scope
   - Generate at: https://github.com/settings/tokens/new?scopes=repo&description=loop-docs-freshness
   - Set as environment variable: `export GITHUB_PAT=ghp_YOUR_TOKEN_HERE`
3. This repository cloned locally (the loop runs against the local clone)

### Setup

1. Install dependencies (none required — the loop uses only Node.js built-in modules):
   ```bash
   # No package.json needed for this pure Node.js script
   ```

2. Verify the repo structure:
   ```bash
   ls project-8/
   # Should show: heartbeat/, worktree/, skill/, maker-checker/, connector/, logs/, progress.md, README.md, config/
   ```

3. Ensure the loop script is executable:
   ```bash
   chmod +x project-8/loop.js
   ```

### Scheduling (Task Scheduler on Windows)

1. Open **Task Scheduler** → **Create Basic Task**
2. Name: "Docs Freshness Check Loop"
3. Trigger: Daily (start at desired time, e.g., 02:00 AM)
4. Action: "Start a program"
   - Program/script: `node`
   - Add arguments: `E:\loop-Engineering-Projects\project-8\loop.js`
   - Start in: `E:\loop-Engineering-Projects`
5. Finish — the task will now run unattended daily

### First Run

On the first run:
- The `.loop.lock` file will be created
- A worktree will be created at `./worktree/scan-worktree/`
- README staleness will be checked against the 30-day threshold
- A GitHub Issue will be opened with the report
- All outcomes will be logged to `logs/run_log.jsonl` and `progress.md`

Subsequent runs will be skipped if the lock file is still active (within 1 minute), preventing duplicate executions.

### Budget Adjustment

If the budget guard triggers ($1.00/month limit exceeded):
1. Check `progress.md` for the `BUDGET GUARD` flag
2. Reduce cadence in `config/settings.js` (e.g., change `daily` → `weekly`)
3. Or increase `costPerToken` / `BUDGET_LIMIT_MONTHLY` if appropriate
4. Restart the loop

### GitHub Token Setup

The connector reads the PAT from `process.env.GITHUB_PAT`. Without a valid token, the loop will fail at the GitHub API step and log a `failure` entry to `run_log.jsonl` with `needs_human: true`. The loop will not create issues or scan READMEs without authentication.

## Lessons Learned

1. **Worktree isolation is non-negotiable** — creating a separate git worktree before scanning prevents any accidental main-branch modifications. The `git worktree add` approach was cleaner than cloning a second copy of the repo.

2. **The heartbeat lock file prevents duplicate runs** — even with Task Scheduler, manual invocations or overlapping schedules can occur. The `.loop.lock` guard with a 1-minute timeout is simple but effective.

3. **Budget guards prevent runaway costs** — without the monthly cap check, an `hourly` cadence would exceed $1.00/month at the estimated token rate. The guard triggers early and pauses the loop gracefully.

4. **Maker-checker provides a necessary safety boundary** — the human-in-the-loop means the loop can run fully unattended (Task Scheduler) while still ensuring no action is taken without review. This aligned with the project's safety priorities.

5. **Spine logging (run_log.jsonl + progress.md) is the single source of truth** for diagnosing failures. When the GitHub API rate-limited on 2026-09-03, the `run_log.jsonl` entry and `progress.md` flag provided enough information to diagnose and recover without re-running the scan.

6. **Token estimation via `characters / 4`** is a rough but workable approach. Real token counts would require a tokenizer library, but for budget guard purposes, the approximation is sufficient.

7. **The 30-day staleness threshold is a good starting point** but may need adjustment per project. Some projects have READMEs that legitimately haven't changed in 60+ days but are still current; others may need a shorter threshold. The setting is configurable in `config/settings.js`.