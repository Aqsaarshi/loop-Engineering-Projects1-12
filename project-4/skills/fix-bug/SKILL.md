## Fix Bug Skill

This skill guides the implementer (maker) through fixing a bug in the maker-checker fix loop.

### Prerequisites
- Git must be available.
- The project must have a test suite (`npm test`).

### Workflow

1. **Read the bug report.** Understand what the bug is and where it manifests.
2. **Inspect the relevant source code.** Open `src/math.js` and locate the function with the bug (`subtract`).
3. **Understand the expected behavior.** The `subtract(a, b)` function must return `a - b`.
4. **Reproduce the bug.** Run `npm test` to confirm the test fails with the current code.
5. **Implement the smallest correct fix.** Change `return a + b;` to `return a - b;` in `src/math.js`.
6. **Run the full test suite.** Verify all tests pass: `npm test`.
7. **Do not modify unrelated files.** Only change the source code that addresses the bug.
8. **Document what was changed.** Note the fix in git: `git diff` to show the change.

### Output
After following this skill, the implementer produces:
- A fixed `src/math.js` with `subtract` returning `a - b`.
- Passing tests (`npm test` returns PASS).
- A summary of the proposed fix ready for review.