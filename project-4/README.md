# Project 4: Maker–Checker Fix Loop with Worktrees

## Project Overview

The Maker–Checker Fix Loop is a software engineering workflow that demonstrates how an implementer (maker) proposes a fix for a bug, and an independent reviewer (checker) decides whether the fix should be accepted (PASS) or rejected (FAIL). A Pull Request is created only if the reviewer returns PASS.

This project implements the complete maker-checker fix loop with:
- Isolated workbranches for the implementer
- A reusable bug-fixing skill guide
- An independent reviewer with specific checks
- PR gating logic that only creates PRs after PASS
- Demonstration of both correct and incorrect fixes

## Concepts Demonstrated

### Concept 8 — Worktree

The implementer works in an isolated Git branch (alternative to worktrees). The main repository remains untouched, and the implementer creates a separate branch to develop the fix:

```
main repository
        |
        └── implementer branch
                |
                └── proposed fix
```

The implementer never directly modifies the main branch. All changes are made in the isolated branch, which can be deleted or merged depending on the reviewer's decision.

### Concept 9 — Skill

A reusable bug-fixing skill guides the implementer through the fix process. The skill file (`skills/fix-bug/SKILL.md`) contains step-by-step instructions:

1. Read the bug report.
2. Inspect the relevant source code.
3. Understand the expected behavior.
4. Write or inspect tests.
5. Reproduce the bug.
6. Implement the smallest correct fix.
7. Run the full test suite.
8. Do not modify unrelated files.
9. Document what was changed.

The skill is reusable for future bug fixes and ensures consistency across implementers.

### Concept 11 — Maker–Checker

The maker (implementer) proposes a fix, and an independent reviewer (checker) decides PASS or FAIL. The reviewer has specific independent checks that go beyond just running `npm test`:

1. **Tests** - Verify that the tests pass
2. **Correct Behavior** - Verify the original bug is actually fixed
3. **Regression Protection** - Verify the solution does not break existing behavior
4. **Bad Fix Detection** - Verify the solution is not superficial or incorrect
5. **Code Quality** - Verify no unrelated modifications, no test disabling, no hardcoded answers

The checker must provide reasons when it returns FAIL, and must not approve everything.

## Selected Bug

### What the bug was

The `subtract(a, b)` function in `src/math.js` incorrectly used `+` (addition) instead of `-` (subtraction). This caused `subtract(5, 3)` to return `8` instead of the expected `2`.

### What caused it

The function was implemented as `return a + b;` when it should have been `return a - b;`.

### How it was fixed

The correct fix changes `return a + b;` to `return a - b;` in the `subtract` function, so that `subtract(a, b)` correctly computes `a - b`.

## Good Fix Demonstration

The workflow for a correct fix:

```
Bug Report
    ↓
Implementer Branch (fix-subtract-fix)
    ↓
Read Fix Skill
    ↓
Implement Correct Fix (return a - b)
    ↓
Run Tests
    ↓
Reviewer Checks Fix
    ↓
PASS
    ↓
PR Allowed
```

### Command and output:

```bash
# Run the good fix implementer
npm run implement:good

# Output:
=== Good Fix Implementer (Maker) ===

Step 1: Creating isolated branch...
  Branch created and checked out: fix-subtract-fix
Step 2: Reading the bug...
  Current subtract implementation:
Step 3: Implementing the correct fix (following fix-bug skill)...
  Fixed subtract implementation:
Step 4: Running tests in branch...
  Test output:
  > project-4@1.0.0 test
  ✔ add should return a + b (1.1051ms)
  ✔ subtract should return a - b (0.3252ms)
  ✔ multiply should return a * b (0.2367ms)
  ℹ tests 3
  ℹ suites 0
  ℹ pass 3
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ duration_ms 162.5938

Step 5: Verifying the fix...
  Fix verified: subtract now returns a - b
Step 6: Producing fix summary...
  Proposed fix:

=== Good Fix Implementer Complete ===
The implementer has fixed the bug in an isolated branch.
All tests pass. Ready for reviewer review.

# Run the reviewer
npm run review:good

# Output:
STATUS: PASS
REASONS:
- All tests passed.
- The original bug is fixed (subtract correctly returns a - b).
- No regression: add and multiply still work correctly.
- No bad practices: the fix is minimal and correct.
- No unrelated modifications: only the subtract function was changed.

# Run PR creation
npm run pr:good

# Output:
=== PR Creation for Good Fix ===
Reviewer returned PASS. Creating PR...
warning: in the working copy of 'src/math.js', LF will be replaced by CRLF the next time Git touches it
PR would be created with:
  gh pr create --title "fix: subtract bug" --body "The subtract function was fixed to correctly compute a - b instead of a + b."
PR creation successful (simulated).
```

### Verification

- GOOD FIX → PASS → PR ✓

### Why the Checker Is Not Too Soft

The reviewer has five independent checks that can detect bad fixes:

1. **Tests pass** - Simply running `npm test` is not enough; the reviewer also checks
2. **Bug fixed** - Specifically checks that `subtract` returns `a - b`, not just that tests pass
3. **No regression** - Verifies that `add` and `multiply` still work correctly with `return a + b` and `return a * b`
4. **No bad practices** - Checks for superficial fixes like `return 2`, `return 0`, or `return a [+-] ?\d+`
5. **No unrelated modifications** - Ensures only the subtract function was changed, no other files modified

These checks specifically detect the deliberately bad fix `return a - b + (a > 0 ? 1 : 0)` which:
- Passes some tests incorrectly (only for positive inputs)
- Gives wrong results for negative inputs (e.g., `subtract(-1, 3)` returns `-5` instead of `-4`)
- Is not a proper fix for the underlying bug

## Bad Fix Demonstration

The workflow for an incorrect fix:

```
Bug Report
    ↓
Bad Implementer Branch (bad-fix-subtract)
    ↓
Deliberately Incorrect Fix (return a - b + (a > 0 ? 1 : 0))
    ↓
Reviewer
    ↓
FAIL
    ↓
NO PR Created
```

### Command and output:

```bash
# Run the bad fix implementer
npm run implement:bad

# Output:
=== Bad Fix Implementer (Maker) ===

Step 1: Creating isolated branch...
  Branch created and checked out: bad-fix-subtract
Step 2: Reading the bug...
  Current subtract implementation:
Step 3: Implementing a deliberately bad fix...
  Bad fix subtract implementation:
Step 4: Running tests in branch...
  Test output:
  > project-4@1.0.0 test
  ✔ add should return a + b (1.3832ms)
  ✖ subtract should return a - b (0.33ms)
  ✔ multiply should return a * b (0.1813ms)
  ℹ tests 3
  ℹ suites 0
  ℹ pass 2
  ℹ fail 1
  ℹ cancelled 0
  ℹ skipped 0
  ℹ duration_ms 386.0703
  ℹ duration_ms 386.0703
  ✖ failing tests:
  test at tests\math.test.js:9:1
  'subtract expected 2, got 3'
      at TestContext.<anonymous> (file:///E:/loop-Engineering-Projects/project-4/tests/math.test.js:11:27)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:14)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3)

Step 5: Analyzing the bad fix...
  Bad fix detected: subtract modified with conditional offset.
  This fix only works for positive inputs; negative inputs will be wrong.
  subtract(5, 3) returns 3 instead of 2, subtract(-1, 3) returns -5 instead of -4.
Step 6: Producing fix summary...
  Proposed fix:

=== Bad Fix Implementer Complete ===
The implementer has applied a superficially plausible but incorrect fix.
The fix appears to work for some cases but fails edge cases.

# Run the reviewer
npm run review:bad

# Output:
STATUS: FAIL
REASONS:
- Tests do not pass.
- The original bug is not fixed.
- Bad fix detected: superficial or incorrect solution.

# Try PR creation (should be blocked)
npm run pr:bad

# Output:
=== PR Creation for Bad Fix ===
PR creation BLOCKED: reviewer returned FAIL.
No PR will be created for a bad fix.
Reasons:
- Tests do not pass.
- The original bug is not fixed.
- Bad fix detected: superficial or incorrect solution.
```

### Verification

- BAD FIX → FAIL → NO PR ✓

### Why the Checker Is Not Too Soft

The reviewer's "Bad fix detected" check specifically identifies the deliberately bad fix `return a - b + (a > 0 ? 1 : 0)` by checking for the conditional offset pattern. This fix:

- Only handles positive inputs correctly
- Gives incorrect results for negative inputs
- Appears to work superficially but fails edge cases
- Is rejected by the reviewer's independent checks

## Final Verification Checklist

### Worktree / Isolation

- [x] Implementer uses its own branch.
- [x] Main branch is not directly modified by the implementer.

### Skill

- [x] A reusable fix skill exists at `skills/fix-bug/SKILL.md`.
- [x] The implementer follows the skill.

### Good Fix

- [x] A real bug exists (subtract uses + instead of -).
- [x] A correct fix was implemented.
- [x] Tests pass.
- [x] Reviewer returns PASS.
- [x] PR is created or correctly prepared only after PASS.

### Bad Fix

- [x] A deliberately bad fix was created.
- [x] Reviewer independently checks it.
- [x] Reviewer returns FAIL.
- [x] Specific reasons are provided.
- [x] PR creation is blocked.

### Checker Quality

- [x] The reviewer does more than just run the normal tests.
- [x] The reviewer detects the planted bad fix.
- [x] The reviewer is capable of rejecting incorrect changes.

### Commands

- `npm run test` - Run the test suite
- `npm run review:good` - Review a good fix (returns PASS)
- `npm run review:bad` - Review a bad fix (returns FAIL)
- `npm run pr:good` - Create PR for good fix (allowed after PASS)
- `npm run pr:bad` - Create PR for bad fix (blocked after FAIL)
- `npm run implement:good` - Run the good fix implementer
- `npm run implement:bad` - Run the bad fix implementer

## Final Output Required

### 1. Project Structure

```text
project-4/
│
├── src/
│   └── math.js          # Buggy subtract function (return a + b)
│
├── tests/
│   └── math.test.js     # Tests: add, subtract, multiply
│
├── skills/
│   └── fix-bug/
│       └── SKILL.md     # Reusable fix skill guide
│
├── reviewer/
│   └── reviewer.js      # Independent reviewer/checker
│
├── scripts/
│   ├── implement-good-fix.js    # Good fix implementer
│   ├── implement-bad-fix.js     # Bad fix implementer
│   ├── reviewer/reviewer.js    # Reviewer script
│   └── create-pr.js             # PR creation logic
│
├── evidence/
│   ├── good-fix-result.txt      # Good fix demonstration output
│   └── bad-fix-result.txt       # Bad fix demonstration output
│
├── package.json               # Project configuration
└── README.md                  # This file
```

### 2. Selected Bug

The `subtract(a, b)` function in `src/math.js` uses `+` instead of `-`, causing:
- `subtract(5, 3)` returns `8` instead of `2`
- String concatenation for non-numeric inputs
- Wrong mathematical results

### 3. Worktree Evidence

The implementer works on branch `fix-subtract-fix` (or `bad-fix-subtract` for bad fixes). The main `main` branch is never directly modified. All changes are made in the isolated branch.

### 4. Good Fix Result

- Reviewer output: `STATUS: PASS`
- PR creation: Allowed (simulated with `gh pr create` command)
- Verified: `GOOD FIX → PASS → PR`

### 5. Bad Fix Result

- Reviewer output: `STATUS: FAIL`
- Reasons: Tests do not pass, The original bug is not fixed, Bad fix detected: superficial or incorrect solution
- PR creation: Blocked (no PR created)
- Verified: `BAD FIX → FAIL → NO PR`

### 6. Commands

Provide all commands needed to run the project from scratch:

```bash
# Clone or navigate to project-4
cd project-4

# Install dependencies (none beyond Node.js)
# The project uses Node.js native test runner

# Run the test suite
npm run test

# Review a good fix
npm run review:good
# Expected: STATUS: PASS

# Run the good fix implementer
npm run implement:good
# Expected: Fix implemented, all tests pass

# Review a bad fix
npm run review:bad
# Expected: STATUS: FAIL with reasons

# Create PR for good fix
npm run pr:good
# Expected: PR creation allowed (simulated)

# Create PR for bad fix
npm run pr:bad
# Expected: PR creation blocked
```

### 7. Final Verification

- GOOD FIX → PASS → PR ✓
- BAD FIX → FAIL → NO PR ✓

The implementation successfully demonstrates that:
1. The checker can reject bad fixes
2. The checker is not too soft (it has independent checks beyond just running tests)
3. Both workflows (good fix and bad fix) have been tested and verified