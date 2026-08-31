# Project 5: Automated Draft-and-Review Workflow Engine

## Project Purpose

This project implements a complete draft-and-review workflow as a single automated
shell script. It demonstrates the OpenCode approach to workflow engineering with
three independent bug-fix candidates, isolated git worktrees, parallel execution,
and independent reviewer verification.

The workflow transforms the conceptual fix-and-review cycle from Project 4 into
a fully automated, one-command workflow engine.

## Overall Workflow Architecture

The workflow follows a fan-out parallel pattern:

1. **Fan-out**: A `for` loop iterates over three candidates, spawning an
   independent background job for each using `&`.
2. **Isolated checkout**: Each candidate gets its own isolated git worktree so
   changes do not interfere with other candidates.
3. **Implementer fix**: Each job applies a targeted fix to the buggy code.
4. **Reviewer check**: An independent reviewer script verifies the fix and
   returns an exit code.
5. **Wait**: After all three jobs are started in parallel, `wait` synchronizes
   the workflow until all complete.
6. **Verdict**: Each candidate receives a clear PASS or FAIL verdict based on
   the reviewer's exit code (0 = PASS, non-zero = FAIL).

## The Three Candidate Issues

### Candidate 1: Addition bug (math.js)
- **File**: `candidates/candidate1/src/math.js`
- **Bug**: The `add` function uses multiplication (`a * b`) instead of addition (`a + b`)
- **Test**: `math.test.js` expects `add(2, 3)` to return `5`
- **Fix**: Change `return a * b` to `return a + b`

### Candidate 2: Capitalize function (index.js)
- **File**: `candidates/candidate2/src/index.js`
- **Bug**: The `capitalize` function uppercases the entire remaining string
  (`str.slice(1).toUpperCase()`) instead of only the first letter
  (`str.slice(1).toLowerCase()`)
- **Test**: `tests/index.test.js` expects `capitalize("hello")` to return `"Hello"`
- **Fix**: Change `str.slice(1).toUpperCase()` to `str.slice(1).toLowerCase()`

### Candidate 3: Double function (math.js)
- **File**: `candidates/candidate3/src/math.js`
- **Bug**: The `double` function divides by 2 (`a / 2`) instead of multiplying
  by 2 (`a * 2`)
- **Test**: `tests/math.test.js` expects `double(4)` to return `8`
- **Fix**: Change `return a / 2` to `return a * 2`

## Isolated Workspaces / Checkouts

Each candidate uses an isolated git worktree (`candidates/candidateX.worktree`)
to ensure changes do not interfere with other candidates. The workflow:

1. Removes any existing worktree for the candidate
2. Creates a new worktree from the candidate's git repo using `git worktree add`
3. Applies the fix via `sed` to the worktree's source files
4. Runs the reviewer against the worktree
5. Cleans up the worktree after verification

This isolation guarantees that the three candidates run independently and their
fixes do not interfere with each other.

## The `for` Loop and Parallel Fan-Out

The main script (`run-workflow.sh`) contains a `for` loop over three candidate
indices (0, 1, 2). Inside the loop, each iteration spawns a background job
using `&`:

```bash
for i in 0 1 2; do
  (
    result=$(process_candidate "$i")
    echo "Candidate $((i + 1)) verdict: $result"
  ) &
done
```

The `&` operator runs each job in the background, allowing all three candidates
to be processed simultaneously rather than sequentially. This is the "fan-out"
pattern - three independent processes start nearly at the same time.

## Why `&` is Used

The `&` symbol in bash runs a command in the foreground but returns control
immediately to the parent script, allowing the next command to start without
waiting for the previous one to finish. In this workflow:

- Without `&`, the three candidates would be processed one at a time (sequential)
- With `&`, all three candidates start almost simultaneously (parallel)
- The total execution time is roughly the max of the three individual times,
  not the sum

This provides a significant speedup since the three candidates are verified
independently and simultaneously.

## Why `wait` is Used

After spawning the three background jobs with `&`, the `wait` command is used
to synchronize the workflow. Without `wait`, the script would immediately exit
after starting the three jobs, potentially killing the background processes
before they complete their work.

`wait` pauses the script until all background jobs started with `&` have
completed. This ensures:

1. All three candidates are fully processed before the workflow ends
2. The verdicts are all captured and displayed
3. No candidate is interrupted or left unfinished

## The Reviewer as Checker

The reviewer script (`reviewer/check.sh`) acts as the independent checker for
each candidate. For each candidate, the reviewer:

1. Independently inspects the proposed fix in the isolated worktree
2. Verifies the implementation by running tests or checking function outputs
3. Returns a clear exit code: 0 for PASS, non-zero for FAIL

The reviewer does **not** hard-code PASS or FAIL results. The verdict must come
from actual verification. The `case` statement in the reviewer determines the
candidate type and runs appropriate verification (checking `add(2,3)=5`,
`capitalize("hello")="Hello"`, or `double(4)=8`).

## Exit Codes Determine PASS or FAIL

The workflow uses the reviewer's exit code as the verdict mechanism:

- **Exit code 0** => **PASS**: The reviewer's verification succeeded (all tests
  passed, function outputs are correct)
- **Non-zero exit code** => **FAIL**: The reviewer's verification failed
  (tests failed, function outputs are incorrect)

This convention is standard in Unix-like systems and provides a clean, automatic
way to determine success or failure without parsing output text.

## Run 1 Results

```
Starting draft-and-review workflow for 3 candidates

Candidate 1 verdict: === Candidate 1: candidates/candidate1 ===
  Implementer: Applying fix to candidates/candidate1
  Implementer: Fixed add function (addition instead of multiplication)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Reviewer: PASS - all tests verified
  Candidate 1: PASS
PASS
Candidate 2 verdict: === Candidate 2: candidates/candidate2 ===
  Implementer: Applying fix to candidates/candidate2
  Implementer: Fixed capitalize function (only first letter uppercase)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Reviewer: PASS - all tests verified
  Candidate 2: PASS
PASS
Candidate 3 verdict: === Candidate 3: candidates/candidate3 ===
  Implementer: Applying fix to candidates/candidate3
  Implementer: Fixed double function (multiplication instead of division)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Reviewer: PASS - all tests verified
  Candidate 3: PASS
PASS

=== Workflow Complete ===
All candidates have been processed.
```

Result: Candidate 1: PASS, Candidate 2: PASS, Candidate 3: PASS

## Run 2 Results

```
Starting draft-and-review workflow for 3 candidates

Candidate 3 verdict: === Candidate 3: candidates/candidate3 ===
Initialized empty Git repository in E:/loop-Engineering-Projects/project-5/candidates/candidate3.worktree/.git/
  Implementer: Applying fix to candidates/candidate3
  Implementer: Fixed double function (multiplication instead of division)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Candidate 3: PASS
PASS
Candidate 2 verdict: === Candidate 2: candidates/candidate2 ===
Initialized empty Git repository in E:/loop-Engineering-Projects/project-5/candidates/candidate2.worktree/.git/
  Implementer: Applying fix to candidates/candidate2
  Implementer: Fixed capitalize function (only first letter uppercase)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Candidate 2: PASS
PASS
Candidate 1 verdict: === Candidate 1: candidates/candidate1 ===
Initialized empty Git repository in E:/loop-Engineering-Projects/project-5/candidates/candidate1.worktree/.git/
  Implementer: Applying fix to candidates/candidate1
  Implementer: Fixed add function (addition instead of multiplication)
  Implementer: Fix applied
  Reviewer: Independently checking fix...
  Candidate 1: PASS
PASS

=== Workflow Complete ===
All candidates have been processed.
```

Result: Candidate 1: PASS, Candidate 2: PASS, Candidate 3: PASS

Both runs produce identical results (all PASS), confirming the workflow is
deterministic and reliable.

## Fresh-Session Statelessness

The workflow demonstrates that a fresh session starts without memory of the
previous runtime. After the first run:

1. Start a fresh PowerShell or bash session (completely new process)
2. Run the workflow again with `./run-workflow.sh` or the explicit Git Bash command
3. The workflow starts from scratch - it does not automatically remember the
   previous run's results, verdicts, or state

Each workflow execution:
- Creates fresh git worktrees (removing any existing ones)
- Applies fixes fresh to each candidate
- Runs the reviewer independently
- Does not read or write any persistent state between runs

This proves that the workflow engine itself is stateless. Without explicit
persistent state storage (a progress file or other mechanism), each run is
independent.

### Proof of Fresh-Session Statelessness

Running the workflow twice in separate sessions produces identical results:

- Run 1 (fresh session): All three candidates PASS
- Run 2 (fresh session): All three candidates PASS

The second run starts without any memory of the first run's internal state.
Worktrees are recreated, fixes are re-applied, and the reviewer re-verifies
everything from scratch. This is the expected behavior for a workflow engine
without persistent state.

To make a fresh run remember previous state, you would need to add:

1. **A progress file** - persistent storage where agents write information about
   what happened so future runs can know previous progress
2. **A heartbeat** - something that automatically triggers the workflow repeatedly
   or on a schedule

Without these two additions, the workflow engine does not remember what happened
in previous runs.

## Workflow Engine vs Continuous Loop

### Current System: A WORKFLOW ENGINE

The current system is a **workflow engine**, not a complete continuous loop.
It requires one explicit command to start the workflow (`./run-workflow.sh`).
After the workflow completes, it stops. It does not automatically run again.

To become a continuous loop, the workflow engine needs two additional things:

### A. HEARTBEAT

A heartbeat is something that automatically triggers the workflow repeatedly or
on a schedule. Without a heartbeat:

- The workflow will not automatically run again after completing
- Someone or something must manually start each run
- There is no periodic or scheduled automatic execution

A heartbeat could be a cron job, a systemd timer, a Windows Task Scheduler
entry, or any other mechanism that triggers the workflow at regular intervals.

### B. PROGRESS FILE

A progress file is persistent state storage where agents write information about
what happened so future runs can know previous progress. Without a persistent
progress file or other persistent state:

- A fresh run does not remember what happened in the previous runtime
- The workflow engine is stateless by default
- Each run starts from zero knowledge of previous runs

A progress file could be a simple JSON or text file that records:
- Which candidates have been processed
- Their latest verdicts
- Timestamps of when runs occurred
- Any error messages or warnings

Without a progress file, each run is stateless and starts from zero knowledge.

### Without both concepts, the system remains a workflow engine:

| Concept | Without it | With it |
|---------|-----------|---------|
| **Heartbeat** | Workflow runs only when manually triggered | Workflow runs automatically on a schedule |
| **Progress file** | Fresh run remembers nothing from previous runs | Fresh run can know previous progress and state |

Together, a heartbeat and progress file transform this workflow engine into a
continuous loop that can automatically and repeatedly process candidates with
knowledge of previous runs.

---

## How to Run the Workflow

### Using Git Bash (Windows):

```powershell
& "C:\Program Files\Git\bin\bash.exe" "E:\loop-Engineering-Projects\project-5\run-workflow.sh"
```

### Using PowerShell with Git Bash:

```powershell
& "C:\Program Files\Git\bin\bash.exe" "E:\loop-Engineering-Projects\project-5\run-workflow.sh"
```

### Expected Output:

Both runs produce all three candidates PASS:
- Candidate 1: PASS (add function fixed: `add(2,3)` now returns 5)
- Candidate 2: PASS (capitalize function fixed: `capitalize("hello")` now returns "Hello")
- Candidate 3: PASS (double function fixed: `double(4)` now returns 8)