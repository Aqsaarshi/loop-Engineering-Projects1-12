import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ROOT = process.cwd();
const SRC_PATH = PROJECT_ROOT + '/src/math.js';
const FIX_BRANCH = 'bad-fix-subtract';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT });
}

console.log('=== Bad Fix Implementer (Maker) ===');
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

// Step 3: Implement a DELIBERATELY BAD fix
console.log('Step 3: Implementing a deliberately bad fix...');
const badFixedSource = buggySource.replace(
  'return a + b; // BUG: should be a - b, currently uses + causing wrong results',
  'return a - b + (a > 0 ? 1 : 0); // Bad fix: only handles positive numbers correctly'
);
fs.writeFileSync(SRC_PATH, badFixedSource, 'utf-8');
console.log('  Bad fix subtract implementation:');
fs.readFileSync(SRC_PATH, 'utf-8').split('\n').forEach(line => {
  if (line.includes('subtract')) console.log('  ' + line);
});

// Step 4: Run tests in the branch
console.log('Step 4: Running tests in branch...');
const testOutput = run('npm test');
console.log('  Test output:');
console.log(testOutput);

// Step 5: Analyze the bad fix
console.log('Step 5: Analyzing the bad fix...');
const fixedContent = fs.readFileSync(SRC_PATH, 'utf-8');
if (fixedContent.includes('return a - b +')) {
  console.log('  Bad fix detected: subtract modified with conditional offset.');
  console.log('  This fix only works for positive inputs; negative inputs will be wrong.');
  console.log('  subtract(5, 3) returns 3 instead of 2, subtract(-1, 3) returns -5 instead of -4.');
}

// Step 6: Produce summary
console.log('Step 6: Producing fix summary...');
const diff = run('git diff src/math.js');
console.log('  Proposed fix:');
console.log(diff);

console.log('');
console.log('=== Bad Fix Implementer Complete ===');
console.log('The implementer has applied a superficially plausible but incorrect fix.');
console.log('The fix appears to work for some cases but fails edge cases.');
process.exit(0);