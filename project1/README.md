# Monitoring Loop Demo

A simple throw‑away project that demonstrates an in‑session monitoring loop with Node.js.

## Project structure

```
monitoring-loop/
│  task.js     – long‑running task (waits ~3 min, then creates task‑complete.txt)
│  monitor.js  – checks every 60 s, max 5 checks, prints one message and exits
│  README.md   – this file
```

## How to run (Windows, Node.js)

### 1. Start the long‑running task

```cmd
node task.js
```

- The script waits **approximately 3 minutes** and then writes `task-complete.txt`.
- After writing the file the script exits automatically.

### 2. Start the monitoring loop

Open a **new** Command Prompt (or PowerShell) window and run:

```cmd
node monitor.js
```

- The monitor checks **every 60 seconds** whether `task‑complete.txt` exists.
- It performs a **maximum of 5 checks**.
- If the file appears before the 5th check, it prints **exactly one** line:

```
Task finished successfully!
```

- If 5 checks pass without the file, it prints:

```
Maximum check limit reached. Stopping safely.
```

- In both cases the script exits cleanly (`process.exit(0)`).

### 3. Stop the monitoring process safely at any time

While `monitor.js` is running, press **Ctrl+C** in that terminal window. The script will terminate immediately.

## Safety notes

- Both scripts use only Node.js **built‑in modules** (`fs`, `process`, `setTimeout`, `setInterval`). No external dependencies are required.
- They operate solely inside the project folder; no files are created outside it.
- The monitor never prints the success message more than once (a `completed` flag prevents repeats).

## Quick test (optional)

If you want to verify the flow without waiting 3 minutes, temporarily change

```js
const THREE_MINUTES = 1000 * 60 * 3; // 3 minutes
```

in `task.js` to e.g. `const THREE_MINUTES = 1000 * 5;` (5 seconds). Remember to change it back if you want the full 3‑minute behavior.