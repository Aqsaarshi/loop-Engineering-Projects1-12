import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
}

const arg = process.argv[2];

if (arg === '--good') {
  console.log('=== PR Creation for Good Fix ===');
  const reviewResult = run('node reviewer/reviewer.js');
  if (reviewResult.includes('STATUS: PASS')) {
    console.log('Reviewer returned PASS. Creating PR...');
    try {
      run('git add src/math.js');
      run('git commit -m "fix: correct subtract function to use - instead of +"');
      console.log('PR would be created with:');
      console.log('  gh pr create --title "fix: subtract bug" --body "The subtract function was fixed to correctly compute a - b instead of a + b."');
      console.log('PR creation successful (simulated).');
    } catch (e) {
      console.log('PR creation command: gh pr create --title "fix: subtract bug" --body "The subtract function was fixed to correctly compute a - b instead of a + b."');
      console.log('(gh CLI not authenticated, but PR command prepared above)');
    }
  } else {
    console.log('PR creation BLOCKED: reviewer returned FAIL.');
    console.log(reviewResult);
  }
} else if (arg === '--bad') {
  console.log('=== PR Creation for Bad Fix ===');
  const reviewResult = run('node reviewer/reviewer.js');
  if (reviewResult.includes('STATUS: PASS')) {
    console.log('Reviewer returned PASS. PR would be created.');
    console.log('(This should NOT happen for a bad fix.)');
  } else {
    console.log('PR creation BLOCKED: reviewer returned FAIL.');
    console.log('No PR will be created for a bad fix.');
    console.log('Reasons:');
    const reasons = reviewResult.split('REASONS:')[1];
    if (reasons) console.log(reasons);
  }
} else {
  console.log('Usage: npm run pr:good | npm run pr:bad');
  process.exit(1);
}