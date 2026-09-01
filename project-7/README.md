# Project 7: Observability, Cost Measurement & Failure Diagnosis

## 1. Project Overview
This project adds observability, cost estimation, and failure diagnosis to the Project 3 "Morning Brief" loop. It implements structured logging, token-based cost tracking, deliberate sabotage with retry limits, and a clear "NEEDS HUMAN ATTENTION" signal for diagnosable failures.

## 2. Base Loop Reference
**Project 3 (morning-brief)** is a Node.js script that:
- Scans `.js` files for `// TODO:` comments
- Stores recorded TODOs in `progress.md` between `RECORDED_TODOS_START` / `RECORDED_TODOS_END` markers
- Compares current TODOs against previous runs, recording only new ones
- Adds a dated entry to "Run History" on each run
- Has a 1-minute lock guard to prevent duplicate rapid runs
- Runs on a schedule (e.g., daily via Windows Task Scheduler)

Project 7 reuses this loop logic but adds: cost tracking, logging, sabotage, and failure diagnosis.

## 3. Cost Measurement

### Approximate Tokens Per Run (Measured)
| Metric | Value |
|--------|-------|
| Input tokens (`tokens_in`) | 103 |
| Output tokens (`tokens_out`) | 31 |
| **Total tokens per run** | **134** |

*Measured from actual log output during failed runs (reading progress.md + example.js ≈ 412 chars ÷ 4 = 103 tokens in; error message written ≈ 124 chars ÷ 4 = 31 tokens out).*

### Cadence
- **Frequency:** Daily (1 run per day)
- **Runs per month:** 30

### Formula
```
Monthly Cost = (tokens_in + tokens_out) × cost_per_token × runs_per_month
```

### Cost Parameters
- `cost_per_token`: $0.000015 ($0.015 per 1K tokens, approximate GPT-3.5-turbo pricing)

### Final Monthly Cost
```
Monthly Cost = 134 × $0.000015 × 30 = $0.0603 ≈ **$0.06/month**
```

At this cadence and token usage, the loop costs approximately **6 cents per month**.

## 4. Sabotage Method

### What Was Broken
**Missing file sabotage:** The `findTodos()` function in `loop.js` attempts to read from `nonexistent-file.js` (a file that does not exist in the project).

### Code Location
```javascript
// loop.js - findTodos() function
const SABOTAGE_FILE = path.join(PROJ_DIR, 'nonexistent-file.js');

if (!fs.existsSync(SABOTAGE_FILE)) {
  const error = `SABOTAGE: Target file does not exist: ${SABOTAGE_FILE}`;
  throw new Error(error);  // Deliberate failure
}
```

### Retry Limit
- **Max attempts:** 3 (configured in `config/settings.js`)
- **Delay between retries:** 1 second
- **After max retries:** Writes "NEEDS HUMAN ATTENTION" to `progress.md` and exits with code 1

### Why This Method
Simulates a real-world scenario where a scheduled job references a file that was deleted or moved. The loop fails fast and visibly, not silently.

## 5. Failure Diagnosis

### Evidence from Log Spine Only (`logs/run_log.jsonl`)
```json
{"timestamp":"2026-09-01T17:38:44.186Z","status":"failure","tokens_in":103,"tokens_out":31,"error":"SABOTAGE: Target file does not exist: E:\\loop-Engineering-Projects\\project-7\\nonexistent-file.js","needs_human":true,"attempt":1}
{"timestamp":"2026-09-01T17:38:45.193Z","status":"failure","tokens_in":103,"tokens_out":31,"error":"SABOTAGE: Target file does not exist: E:\\loop-Engineering-Projects\\project-7\\nonexistent-file.js","needs_human":true,"attempt":2}
{"timestamp":"2026-09-01T17:38:46.211Z","status":"failure","tokens_in":103,"tokens_out":31,"error":"SABOTAGE: Target file does not exist: E:\\loop-Engineering-Projects\\project-7\\nonexistent-file.js","needs_human":true,"attempt":3}
```

### What This Tells Us (Without Replaying)
| Observation | Inference |
|-------------|-----------|
| 3 entries, 1 second apart | Loop retried 3 times with 1s delay |
| `status: "failure"` on all | Every attempt failed |
| Same `error` message each time | Deterministic failure (not transient) |
| `needs_human: true` on all | System flagged for human intervention |
| `attempt` increments 1→2→3 | Retry logic executed correctly |
| Final attempt = `retryLimit` | Loop stopped after configured max retries |

**Diagnosis:** The loop tried to read a file (`nonexistent-file.js`) that doesn't exist. It retried 3 times (per config), failed each time, and correctly signaled for human attention.

### Evidence from `progress.md` Only
```markdown
### 2026-09-01 17:38

New TODOs found:
None

⚠️ NEEDS HUMAN ATTENTION: SABOTAGE: Target file does not exist: E:\loop-Engineering-Projects\project-7\nonexistent-file.js
```

**Diagnosis from progress.md alone:** The run at 2026-09-01 17:38 found no new TODOs and explicitly flagged "NEEDS HUMAN ATTENTION" with the exact error message. The failure is visible in the spine without any log access.

## 6. "Needs Human" Signal Implementation

### How It Works
1. **In log file (`run_log.jsonl`):** Every failed attempt includes `"needs_human": true`
2. **In progress.md:** After max retries, a `⚠️ NEEDS HUMAN ATTENTION:` line is added to the run history entry with the full error message

### Example Log Entry (Failure)
```json
{
  "timestamp": "2026-09-01T17:38:44.186Z",
  "status": "failure",
  "tokens_in": 103,
  "tokens_out": 31,
  "error": "SABOTAGE: Target file does not exist: E:\\loop-Engineering-Projects\\project-7\\nonexistent-file.js",
  "needs_human": true,
  "attempt": 1
}
```

### Example progress.md Entry (After Max Retries)
```markdown
### 2026-09-01 17:38

New TODOs found:
None

⚠️ NEEDS HUMAN ATTENTION: SABOTAGE: Target file does not exist: E:\loop-Engineering-Projects\project-7\nonexistent-file.js
```

### Key Properties
- **Not silent:** Failure is recorded in both log and progress.md
- **Specific:** Exact error message included (not generic "error occurred")
- **Actionable:** Tells human exactly what file is missing and where
- **Persistent:** Survives in progress.md even if logs are rotated

## 7. How to Run

### Setup
```bash
cd E:\loop-Engineering-Projects\project-7
npm install  # (no dependencies, but initializes package.json)
```

### Run Once
```bash
node loop.js
```

### Expected Output (Sabotage Active)
```
=== Project 7 Loop Started ===
Retry limit: 3
Cadence: daily
Cost per token: $0.000015
Attempt 1/3 failed: SABOTAGE: Target file does not exist: ...
Attempt 2/3 failed: SABOTAGE: Target file does not exist: ...
Attempt 3/3 failed: SABOTAGE: Target file does not exist: ...
Loop failed permanently: SABOTAGE: Target file does not exist: ...
Max retries reached. NEEDS HUMAN ATTENTION written to progress.md
```

### Verify Logs
```bash
cat logs/run_log.jsonl
cat progress.md
```

### Disable Sabotage (For Normal Operation)
Edit `config/settings.js`:
```javascript
sabotage: {
  enabled: false,  // Change to false
  ...
}
```

Then the loop will run normally, scanning `example.js` for TODOs and updating `progress.md`.

### Schedule (Windows Task Scheduler)
1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task → Name: "Project 7 Loop" → Daily
3. Program: `cmd.exe`
4. Arguments: `/C node E:\loop-Engineering-Projects\project-7\loop.js`
5. The 1-minute lock guard prevents duplicate runs

## 8. Lessons Learned

1. **Structured logging beats ad-hoc logging:** JSONL format with consistent fields (timestamp, status, tokens, error, needs_human) makes automated analysis and diagnosis trivial.

2. **Fail fast, fail loud:** The sabotage revealed that the original Project 3 loop would fail silently (just exit). Adding explicit `needs_human` flags in both log and progress.md makes failures visible without replaying runs.

3. **Token estimation is practical even without AI calls:** By measuring characters read/written and dividing by ~4 chars/token, we get reasonable cost estimates for any text-processing loop, not just LLM-based ones.

4. **Retry limits prevent runaway loops:** A configurable `retryLimit` (3) with exponential backoff or fixed delay stops infinite retries while giving transient errors a chance to resolve.

5. **The "spine" (progress.md) is the ultimate debug tool:** When the log shows failure details and the spine shows the human-readable flag, you can diagnose from either source alone — no need to re-run or add debug prints.