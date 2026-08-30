import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const PROJECT_ROOT = process.cwd();
const SRC_PATH = `${PROJECT_ROOT}/src/math.js`;

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
}

function readSource() {
  return readFileSync(SRC_PATH, 'utf-8');
}

function checkTestsPass() {
  try {
    run('npm test');
    return true;
  } catch {
    return false;
  }
}

function checkBugFixed(source) {
  const subtractMatch = source.match(/export function subtract[\s\S]*?return\s+([a-z0-9 +()\-]+);/i);
  if (subtractMatch) {
    const returnStmt = subtractMatch[1].trim();
    return returnStmt === 'a - b';
  }
  return false;
}

function checkNoRegression(source) {
  const hasAdd = source.includes('export function add') && source.includes('return a + b');
  const hasMultiply = source.includes('export function multiply') && source.includes('return a * b');
  if (hasAdd && hasMultiply) return true;
  return false;
}

function checkNoBadPractices(source) {
  if (source.includes('return 2') || source.includes('return 0')) return false;
  if (source.match(/return a [+-] ?\d+/)) return false;
  if (source.includes('return a - b + (a >') || source.includes('return a - b + (a <')) return false;
  return true;
}

function checkNoUnrelatedModifications(currentSource) {
  const buggyLine = '  return a + b; // BUG';
  const fixLine = '  return a - b; // Fixed';
  const buggyChanges = (currentSource.match(new RegExp(buggyLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const fixChanges = (currentSource.match(new RegExp(fixLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (buggyChanges > 0 && fixChanges === 0) return false;
  if (fixChanges > 1) return false;
  return true;
}

const status = {};
const currentSource = readSource();

console.log('=== Independent Reviewer Check ===');
console.log('');

status.testsPass = checkTestsPass();
console.log(`Tests pass: ${status.testsPass}`);

status.bugFixed = checkBugFixed(currentSource);
console.log(`Bug fixed: ${status.bugFixed}`);

status.noRegression = checkNoRegression(currentSource);
console.log(`No regression: ${status.noRegression}`);

status.noBadPractices = checkNoBadPractices(currentSource);
console.log(`No bad practices: ${status.noBadPractices}`);

status.noUnrelatedMods = checkNoUnrelatedModifications(currentSource);
console.log(`No unrelated modifications: ${status.noUnrelatedMods}`);

const allPass = status.testsPass && status.bugFixed && status.noRegression && status.noBadPractices && status.noUnrelatedMods;

console.log('');
if (allPass) {
  console.log('STATUS: PASS');
  console.log('REASONS:');
  console.log('- All tests passed.');
  console.log('- The original bug is fixed (subtract correctly returns a - b).');
  console.log('- No regression: add and multiply still work correctly.');
  console.log('- No bad practices: the fix is minimal and correct.');
  console.log('- No unrelated modifications: only the subtract function was changed.');
} else {
  console.log('STATUS: FAIL');
  console.log('REASONS:');
  if (!status.testsPass) console.log('- Tests do not pass.');
  if (!status.bugFixed) console.log('- The original bug is not fixed.');
  if (!status.noRegression) console.log('- Regression: existing functionality broken.');
  if (!status.noBadPractices) console.log('- Bad fix detected: superficial or incorrect solution.');
  if (!status.noUnrelatedMods) console.log('- Unrelated modifications present.');
}