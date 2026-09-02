# project-11 — Two Routines and a Human Gate

This project demonstrates a human-approval gate using two separate automated routines.

---

## 1. What it demonstrates
A manual, two-step approval workflow where:
- **Routine A** drafts a change for review
- **Routine B** performs a safe, reversible action — but **only** when I explicitly trigger it after reviewing Routine A's output

Neither routine auto-triggers the other. The human sits between them.

---

## 2. What Routine A does (draft creator)
- Runs on a one-off/manual schedule
- Creates a git branch named `claude/summary`
- Adds/edits one small file (`summary.txt`) with a short generated summary/proposed change
- Stops there — does **not** merge, push, or open a PR automatically
- Output is reviewable: the branch and the staged file

**I reviewed:** `claude/summary` branch with `summary.txt` containing a short draft.

---

## 3. What Routine B does (gated action)
- Has an API endpoint protected by a bearer token
- Performs **one small, safe, reversible** action **only when triggered**
- Action: appends `timestamp: approved` to `approval.log`
- **Must not** auto-run from Routine A — only runs when I manually fire the curl command

---

## 4. How to start the server
```powershell
# In the project-11 folder
python routine-b.py
```
This starts a Python HTTP server on `http://localhost:5000/approve` as a background process.
- Bearer token (shown once at startup): `GATE-KEY-12345`
- Store it for later: `$env:B_TOKEN = 'GATE-KEY-12345'`

---

## 5. How to trigger Routine B (curl command)
```powershell
curl -X POST http://localhost:5000/approve `
  -H "Authorization: Bearer $env:B_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"approved": true}'
```
- **Important:** The JSON body uses single quotes around the whole payload so PowerShell does not interpolate variables inside it.
- Replace `$env:B_TOKEN` with your actual token value, or ensure it's set in the session.

**Do not** include the real token in README or version control — it's a demo token habit.

---

## 6. Safety checklist result
| # | Check | Pass/Fail |
|---|-------|-----------|
| 1 | Connectors pruned — unused external services removed | **Pass** — Routine A uses git only (local). Routine B uses local Python HTTP server + local log file. No external connectors. |
| 2 | Unrestricted pushes off — Routine A cannot push to protected/main branch | **Pass** — Routine A only creates `claude/summary` branch; no push or merge automation. |
| 3 | A state file chosen — clear "pending"/"approved" tracker | **Pass** — `approval.log` is the state file. After triggering, it contains the timestamped "approved" entry. |

---
*Demo token only: `GATE-KEY-12345`. Do not share or hardcode in code.*