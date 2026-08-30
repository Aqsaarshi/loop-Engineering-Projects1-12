# Project 2: Make the tests pass, then stop

A beginner‑friendly Node.js project that demonstrates the **Maker‑Checker** loop concept using the built‑in test runner.

## Project structure

```
project2/
│  package.json   – npm config with "type": "module" and "test": "node --test"
│  src/math.js    – module with intentionally buggy functions
│  test/math.test.js – 3 automated tests for the functions
│  README.md      – this file
```

## Maker‑Checker concept (simple words)

| Role | Who / what | Responsibility |
|------|------------|----------------|
| **Maker** | The agent (you or the script) | Can edit the code (`src/math.js`) to fix bugs. |
| **Checker** | The test runner (`npm test`) | Runs the tests and reports pass/fail. It decides if the work is complete. |
| **Loop** | Repeated “run tests → fix if fail” cycle | Runs up to 6 attempts. The agent must **not** declare success by itself; only the test runner result matters. |

The goal is: **fix the code until all tests pass**, but stop **before** the 6‑attempt limit if the tests pass earlier.

## How the loop worked for this project

| Attempt | Action | Result |
|---------|--------|--------|
| **1** | `npm test` (first run) | **3 tests failed** – `add`, `subtract`, `multiply` had intentional bugs. The output showed each test expecting the correct result but getting a wrong value. |
| **Fix** | inspected the failures and edited `src/math.js` to correct the three functions (changed `-` to `+` for `add`, `+` to `-` for `subtract`, and `+` to `*` for `multiply`). |
| **2** | `npm test` (second run) | **All 3 tests passed**. The loop stopped successfully because the tests passed **before** reaching the maximum of 6 attempts. |

**Number of attempts used:** 2 (out of a maximum of 6).  
**Why the loop stopped:** The test runner reported zero failures after the code fixes, so the Maker stopped; the Checker (test runner) confirmed success.

## Running the project

1. **Install dependencies (none – built‑in only)**  
   ```cmd
   npm install
   ```

2. **Run the tests**  
   ```cmd
   npm test
   ```

   - On first run you will see 3 failing tests (the intentional bugs).  
   - After fixing `src/math.js`, run `npm test` again; all 3 tests should pass.

3. **Loop limit** – The built‑in loop described in the README can be run manually up to 6 times, but here we stopped after 2 attempts because the tests passed.

## What each file contains

| File | Purpose |
|------|---------|
| `package.json` | npm project config; sets `"type": "module"` and `"test": "node --test"` so the built‑in runner is used. |
| `src/math.js` | The code that **needs fixing** – three exported functions with intentional bugs. |
| `test/math.test.js` | The **tests** (3 tests) that check the functions’ behaviour. The test runner result is the **Checker**. |
| `README.md` | This file – explains the project, Maker‑Checker concept, and how to run the loop. |

---

Enjoy experimenting with the loop! Remember: **only the test runner can say “pass” – the agent must listen to it.**