# Project 6: Doorbell Loop — Event-Driven GitHub PR Review

## What This Project Demonstrates

### Concept 7: Event-Driven Loop
A GitHub Pull Request event automatically wakes up OpenCode, which reviews the PR without manual prompting. This demonstrates an event-driven loop where a GitHub event triggers automated actions.

### Concept 10: Connectors
The OpenCode GitHub integration acts as a connector between GitHub events and the OpenCode review system, enabling automatic PR reviews through the GitHub Actions workflow.

### GitHub PR Events
- **`pull_request.opened`**: Fires when a new PR is created, triggering the initial OpenCode review.
- **`pull_request.synchronize`**: Fires when new commits are pushed to the PR branch, triggering a re-review.

### GitHub Actions
The `.github/workflows/opencode.yml` workflow listens for PR events and runs OpenCode automatically to review the code.

### OpenCode Automatic Review
OpenCode runs as a GitHub Action step and posts a review comment on the PR identifying any bugs or issues in the code.

## Event Flow

### PR opened → Review
```text
PR opened
  → GitHub pull_request.opened event
  → GitHub Actions workflow starts
  → OpenCode reviews the code
  → Automatic PR review comment appears
```

### New commit pushed → Re-review
```text
New commit pushed
  → GitHub pull_request.synchronize event
  → GitHub Actions workflow starts again
  → OpenCode reviews the updated PR
  → New review/comment appears
```

## Planted Bug

The intentional off-by-one bug in `buggy_code.py`:

```python
def get_list_item(items, index):
    if index <= len(items):  # BUG: should be `index < len(items)`
        return items[index]
```

**Why it's wrong**: The condition `index <= len(items)` incorrectly allows an index equal to `len(items)`. For a list of length 3 (indices 0, 1, 2), index 3 is incorrectly accepted, which will cause an `IndexError` when accessing `items[3]`.

The correct boundary check should be `if index < len(items):`, which rejects index 3 for a 3-item list.

## Demonstration Results

| Event      | Trigger                    | OpenCode Review | Bug Detected |
| ---------- | -------------------------- | --------------- | ------------ |
| PR opened  | `pull_request.opened`      |                 |              |
| New commit | `pull_request.synchronize` |                 |              |

*(Results documented after GitHub operations are completed)*

## Files Changed

- `buggy_code.py` — Added intentional off-by-one bug
- `test_buggy_code.py` — Tests verifying expected behavior
- `.github/workflows/opencode.yml` — OpenCode PR review workflow

## Setup Verification

- Project 6 exists independently inside `loop-Engineering-Projects1-12/`
- No new GitHub repository was created
- Projects 1-5 were not modified
- OpenCode workflow configured with `pull_request.opened` and `pull_request.synchronize` triggers