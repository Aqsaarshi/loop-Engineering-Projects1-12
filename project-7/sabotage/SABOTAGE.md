# Sabotage Documentation

## Sabotage Method
**Method:** Missing file (pointing the prompt at a file that does not exist)

## Details
- **Target file:** `nonexistent-file.js` (does not exist in the project)
- **Location in code:** `loop.js` → `findTodos()` function → line that checks `fs.existsSync(SABOTAGE_FILE)`
- **Failure trigger:** The loop attempts to scan `nonexistent-file.js` for TODO comments, but the file doesn't exist, causing an Error to be thrown

## Retry Limit
- **Max attempts:** 3 (defined in `config/settings.js`)
- **Delay between retries:** 1 second
- **Behavior:** After 3 failed attempts, the loop writes "NEEDS HUMAN ATTENTION" to progress.md and exits with error code 1

## Why This Sabotage
This simulates a real-world failure where:
- A scheduled job points to a file that was deleted/moved
- A configuration references a path that no longer exists
- The loop fails fast and clearly, without silent failures

## Expected Failure Evidence
When the loop runs, it will:
1. Attempt 1: Fail with "SABOTAGE: Target file does not exist: .../nonexistent-file.js"
2. Attempt 2: Same failure
3. Attempt 3: Same failure, then write NEEDS HUMAN ATTENTION to progress.md
4. Exit with error

The log file (`logs/run_log.jsonl`) will contain 3 entries with:
- `status: "failure"`
- `needs_human: true`
- `error: "SABOTAGE: Target file does not exist: ..."`
- Incrementing `attempt` numbers (1, 2, 3)

The progress.md will have a final entry:
```
### 2026-09-01 12:34

New TODOs found:
None

⚠️ NEEDS HUMAN ATTENTION: SABOTAGE: Target file does not exist: .../nonexistent-file.js
```