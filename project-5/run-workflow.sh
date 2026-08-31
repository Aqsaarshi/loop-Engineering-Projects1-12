#!/bin/bash
# Main workflow script: draft-and-review pipeline for three candidates
# Demonstrates: isolated checkouts, parallel execution, reviewer/checker, PASS/FAIL verdicts

set -e

WORKSPACE="E:/loop-Engineering-Projects/project-5"
CANDIDATES=(
  "candidates/candidate1"
  "candidates/candidate2"
  "candidates/candidate3"
)

# Function to process a single candidate in an isolated workspace
process_candidate() {
  local index="$1"
  local candidate="${CANDIDATES[$index]}"
  local cwd="$WORKSPACE/$candidate"
  local worktree_dir
  local verdict="UNKNOWN"

  echo "=== Candidate $((index + 1)): $candidate ==="

  # Step 1: Create isolated checkout using git worktree
  # We'll use a separate directory for the worktree
  local isolated_dir="$WORKSPACE/${candidate}.worktree"
  
  # Remove any existing worktree
  if [ -d "$isolated_dir" ]; then
    rm -rf "$isolated_dir"
  fi

  # Change to candidate directory and create isolated checkout
  cd "$cwd"
  
  # Try git worktree add, fallback to creating isolated directory
  if git worktree add "$isolated_dir" main 2>/dev/null; then
    echo "  Using git worktree for isolated checkout"
  else
    # Fallback: create isolated directory by copying relevant files
    mkdir -p "$isolated_dir"
    cp -r "$cwd/"* "$isolated_dir/" 2>/dev/null
    cp -r "$cwd/."/* "$isolated_dir/" 2>/dev/null
    # Remove the .git from the copy and init fresh
    if [ -d "$isolated_dir/.git" ]; then
      rm -rf "$isolated_dir/.git"
    fi
    git -C "$isolated_dir" init 2>/dev/null
  fi

  # Step 2: Run the implementer/fix process
  # The "implementer" applies a fix to the buggy code
  echo "  Implementer: Applying fix to $candidate"
  
  # Apply the fix based on candidate number
  case "$index" in
    0)
      # Candidate 1: Fix add function (change * to +)
      sed -i 's/return a \* b/return a + b/' "$isolated_dir/src/math.js"
      echo "  Implementer: Fixed add function (addition instead of multiplication)"
      ;;
    1)
      # Candidate 2: Fix capitalize function - the bug is it uppercases everything instead of just first letter
      # Original buggy code: str[0].toUpperCase() + str.slice(1).toUpperCase()
      # Fixed code: str[0].toUpperCase() + str.slice(1).toLowerCase()
      # Since candidate 2 already has the bug (uppercase all), the fix is to lowercase the rest
      sed -i 's/str\[0\].toUpperCase() + str\.slice(1).toUpperCase()/str[0].toUpperCase() + str.slice(1).toLowerCase()/' "$isolated_dir/src/index.js"
      echo "  Implementer: Fixed capitalize function (only first letter uppercase)"
      ;;
    2)
      # Candidate 3: Fix double function (change / to *)
      sed -i 's/return a \/ 2/return a * 2/' "$isolated_dir/src/math.js"
      echo "  Implementer: Fixed double function (multiplication instead of division)"
      ;;
  esac

  # Step 3: Draft and apply a fix (already done above)
  echo "  Implementer: Fix applied"

  # Step 4: Run the reviewer/checker
  echo "  Reviewer: Independently checking fix..."
  bash "$WORKSPACE/reviewer/check.sh" "$isolated_dir"
  local exit_code=$?

  # Step 5: Save the verdict
  if [ "$exit_code" -eq 0 ]; then
    verdict="PASS"
  else
    verdict="FAIL"
  fi

  echo "  Candidate $((index + 1)): $verdict"
  
  # Clean up worktree
  if [ -d "$isolated_dir" ]; then
    rm -rf "$isolated_dir"
  fi

  echo "$verdict"
}

# Main: Run all three candidates in parallel
echo "Starting draft-and-review workflow for 3 candidates"
echo ""

# Start all three candidate jobs in parallel
for i in 0 1 2; do
  (
    result=$(process_candidate "$i")
    echo "Candidate $((i + 1)) verdict: $result"
  ) &
done

# Wait for all parallel jobs to complete
wait

echo ""
echo "=== Workflow Complete ==="
echo "All candidates have been processed."