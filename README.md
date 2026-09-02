# loop-Engineering-Projects1-12

## Project 1: Monitoring Loop Demo
Node.js monitoring loop with task.js (3-min task) and monitor.js (checks every 60s, max 5 checks). Detects when task-complete.txt is created.

## Project 2: Make the tests pass, then stop
Beginner Maker-Checker loop. Fix buggy math functions in src/math.js until all 3 tests pass, then stop before 6-attempt limit.

## Project 3: The Morning Brief with a Memory
Persistent memory using marker-based progress.md. Records TODOs between RECORDED_TODOS_START/END markers. Tracks new vs. previously recorded TODOs.

## Project 4: Maker–Checker Fix Loop with Worktrees
Git worktree-based maker-checker workflow. Implementer fixes bugs in isolated branches; reviewer checks and gates PR creation after PASS only.

## Project 5: Automated Draft-and-Review Workflow Engine
Automated shell script with 3 parallel candidates (add, capitalize, double bugs). Uses git worktrees, fan-out `for` loop with `&`, and independent reviewer verification.

## Project 6: Doorbell Loop — Event-Driven GitHub PR Review
GitHub event-driven loop. `pull_request.opened` and `pull_request.synchronize` triggers automatically review PRs via OpenCode GitHub Actions.

## Project 7: Observability, Cost Measurement & Failure Diagnosis
Adds cost tracking (token estimation), structured JSONL logging, sabotage with retry limits, and "NEEDS HUMAN ATTENTION" signals to Project 3 loop.

## Project 8: Docs Freshness Check
Scans README.md freshness across project folders. Flags stale READMEs (>30 days old) using git commit dates. Generates report for human reviewer approval.

## Project 9: OpenCode One-Off Run Experiment
Demonstrates two actual OpenCode one-off runs: Run 1 (succeeds) and Run 2 (fails intentionally). Shows transcript is the definitive record, not just session status.

## Project 10: The Secret Drill
Shows how secret storage location affects script execution. `.env` is gitignored; token must be set as real environment variable for persistence across clones/deployments.

## Project 11: Two Routines and a Human Gate
Human-approval gate using two automated routines. Routine A drafts change; Routine B performs safe action only when manually triggered after reviewing Routine A's output.

## Project 12: Weekly Self-Improvement Loop
Weekly loop that analyzes dated progress.md entries, detects repeated failure patterns, and proposes rule additions/deletions on `claude/` branch only. Main/master untouched until manual merge.
