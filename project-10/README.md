# Project 10 – The Secret Drill

Demonstrates how secret storage location affects script execution.

## What this drill shows

1. **Run 1 (fail)**: Script run normally cannot read a `.env` file that sits alongside it – the `.env` is gitignored, so it never travels to GitHub or cloud deployments.

2. **Run 2 (success)**: Token must be set as a real environment variable (`$env:DUMMY_TOKEN = "..."` in PowerShell) so it persists across clones and deployments.

## Files

- `main.py` – reads `DUMMY_TOKEN` from `os.environ`; prints masked output
- `.env` – **gitignored**; contains `DUMMY_TOKEN=dummy-12345` (local dev only)
- `.env.example` – placeholder for team awareness; **do not commit real values**
- `.gitignore` – excludes `.env` from version control