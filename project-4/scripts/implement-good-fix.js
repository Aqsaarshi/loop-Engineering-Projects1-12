import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const SRC_PATH = PROJECT_ROOT + '/src/math.js';
const FIX_BRANCH = 'fix-subtract-fix';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT });
}

console.log('=== Good Fix Implementer (Maker) ===');
console.log('');

// Step 1: Create isolated branch
console.log('Step 1: Creating isolated branch...');
try {
  try { run('git branch -D ' + FIX_BRANCH); } catch (e) {}
  run('git checkout -b ' + FIX_BRANCH);
  console.log('  Branch created and checked out: ' + FIX_BRANCH);
} catch (e) {
  console.log('  Failed to create branch: ' + e.message);
  process.exit(1);
}

// Step 2: Read the bug
console.log('Step 2: Reading the bug...');
const buggySource = fs.readFileSync(SRC_PATH, 'utf-8');
console.log('  Current subtract implementation:');
buggySource.split('\n').forEach(line => {
  if (line.includes('subtract')) console.log('  ' + line);
});

// Step 3: Follow the fix skill - implement the correct fix
console.log('Step 3: Implementing the correct fix (following fix-bug skill)...');
const fixedSource = buggySource.replace(
  'return a + b; // BUG: should be a - b, currently uses + causing wrong results',
  'return a - b; // Fixed: subtract correctly computes a - b'
);
fs.writeFileSync(SRC_PATH, fixedSource, 'utf-8');
console.log('  Fixed subtract implementation:');
fs.readFileSync(SRC_PATH, 'utf-8').split('\n').forEach(line => {
  if (line.includes('subtract')) console.log('  ' + line);
});

// Step 4: Run tests in the branch
console.log('Step 4: Running tests in branch...');
const testOutput = run('npm test');
console.log('  Test output:');
console.log(testOutput);

// Step 5: Verify the fix
console.log('Step 5: Verifying the fix...');
const fixedContent = fs.readFileSync(SRC_PATH, 'utf-8');
if (fixedContent.includes('return a - b') && !fixedContent.includes('return a + b // BUG')) {
  console.log('  Fix verified: subtract now returns a - b');
} else {
  console.log('  Fix verification FAILED');
  process.exit(1);
}

// Step 6: Produce summary
console.log('Step 6: Producing fix summary...');
const diff = run('git diff src/math.js');
console.log('  Proposed fix:');
console.log(diff);

console.log('');
console.log('=== Good Fix Implementer Complete ===');
console.log('The implementer has fixed the bug in an isolated branch.');
console.log('All tests pass. Ready for reviewer review.');
process.exit(0);