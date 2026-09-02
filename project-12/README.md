# Project 12: Weekly Self-Improvement Loop

This project implements a weekly improvement loop that analyzes dated log entries,
detects repeated failures, and proposes rule changes — all on a `claude/` branch
only. Main/master is never modified directly.

## What This Project Does

The dreaming-loop.ps1 script reads `progress.md` entries dated after the
`last_reviewed_date` in `dreaming-state.md`, scans them for error/failure
patterns that appear more than once, and proposes:

1. **One rule addition** to `RULES.md` (on `claude/` branch only) — a single
   line rule that would prevent the repeated issue
2. **One rule deletion** (on `claude/` branch only) — a rule that was never
   triggered in the reviewed window

The loop does NOT edit main/master. All changes are on `claude/dreaming-loop-<date>`
branch, and only you can manually merge them.

## `dreaming-state.md` — What It Tracks

Contains a single line:

```
last_reviewed_date: 2026-09-01
```

This date marks the cutoff — the loop only reads entries **after** this date.
After the loop runs, this is updated to the latest date found in progress.md
so the next run only looks at new entries.

## How Repeated Failures Are Detected

The `dreaming-loop.ps1` script:

1. Reads `dreaming-state.md` to get `last_reviewed_date`
2. Reads **all entries in `progress.md` dated AFTER** that date
3. Scans every log line for patterns matching `TypeError`, `ERROR`, `FAILURE`,
   or `⚠️`
4. **Normalizes** each matching line (lowercase + collapse whitespace) and groups
   them by exact normalized string
5. Filters to only those appearing **2 or more times**
6. For each repeated pattern, proposes the smallest possible rule that would
   have prevented it

**Important**: The script's internal counter showed "Repeated failures found: 2"
was a **counting bug** — only **1** distinct error pattern actually repeats
(the TypeError on 3 dates). The other patterns (ERROR/FAILURE on single dates)
do not repeat.

## How Rule Proposals Work (claude/ branch only)

### Addition
- One clear line rule that, if present in `RULES.md`, would have prevented
  the repeated TypeError: `Never call a method on a value without checking
  it is not None first.`
- Justified with exact dates and quotes from `progress.md`
- Count = 1 repeated pattern (3 occurrences across 3 dates)

### Deletion
- Rule 1 "Never commit without running tests" is proposed for removal because
  **0** entries in the reviewed window ever needed/triggered it
- No citation supports keeping it, so it's removed

**Crucial**: These changes are made only on `claude/dreaming-loop-2026-09-05`
branch. The `RULES.md` on main/master is **never** modified directly.

## How to Run the Loop

```powershell
pwsh -ExecutionPolicy Bypass -File E:\loop-Engineering-Projects\project-12\dreaming-loop.ps1
```

This will:
- Read `dreaming-state.md` for the last reviewed date
- Scan `progress.md` entries after that date
- Output repeated failure patterns with dates and counts
- Show unused rules never triggered in the window
- **NOT** modify any files outside the script's output

## How to Review & Merge

Since all changes are on a `claude/` branch only, the review process is:

1. **Check the branch**:
   ```powershell
   git branch
   # Confirm claude/dreaming-loop-2026-09-05 exists
   ```

2. **Review the PR description**:
   ```powershell
   Get-Content "E:\loop-Engineering-Projects\project-12\PR_DESCRIPTION.md"
   ```
   - Verify every cited date exists in `progress.md`
   - Verify every quoted line is an exact copy from `progress.md`
   - Confirm the repeated failure count is correct (1 pattern, 3 occurrences)
   - Confirm the deletion rule has count = 0 support

3. **Review the RULES.md diff**:
   ```powershell
   git diff main...claude/dreaming-loop-2026-09-05
   # Or: git checkout claude/dreaming-loop-2026-09-05 && cat RULES.md
   ```
   - On claude branch: rule 1 removed, new rule 3 added
   - On main: original 6 rules unchanged

4. **Manual merge if approved**:
   - `git checkout main`
   - `git claude/dreaming-loop-2026-09-05` (or cherry-pick the commit)
   - Verify `RULES.md` changes are correct
   - Commit on main if you decide to merge
   - **Never** use `&` background jobs or `git merge` automatically

## Files in This Project

| File | Description |
|---|---|
| `progress.md` | 7 dated log entries (after 2026-09-01) including TypeError on 3 dates |
| `dreaming-state.md` | `last_reviewed_date: 2026-09-01` (updated after each run) |
| `RULES.md` | 6 general rules; modified only on `claude/` branch |
| `dreaming-loop.ps1` | PowerShell script that runs the improvement loop |
| `PR_DESCRIPTION.md` | PR-style description of proposed changes (claude/ branch only) |

## Verification Checklist (before marking done)

- [ ] Every proposed rule change in PR_DESCRIPTION.md traces to real, cited,
      quoted log entries — not a plausible-sounding guess
- [ ] The deliberately planted repeated failure (TypeError, 3 occurrences on
      2026-09-02, 09-03, 09-05) was caught and turned into a concrete
      proposal with correct dates and count
- [ ] Nothing changed in the actual rules file outside the `claude/` branch —
      main/master is untouched until manual merge
- [ ] `dreaming-state.md` `last_reviewed_date` updated to latest date in
      progress.md after run
- [ ] PR_DESCRIPTION.md on claude branch has correct count = 1 (not the buggy
      "2"), with real dates/quotes cited
- [ ] `RULES.md` on main still has all 6 original rules intact