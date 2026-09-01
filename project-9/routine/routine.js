// Summarize yesterday's Git commits into SUMMARY.md
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `File not found: ${filePath}` };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return { ok: true, content };
}

function getYesterdayCommits() {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const sinceStr = since.toISOString().split('T')[0];
  try {
    const output = execSync(`git log --since="${sinceStr}" --format="%H %s %an"`.trim()).toString().trim();
    if (!output) return [];
    return output.split('\n').filter(line => line.length > 0).map(line => {
      const [hash, subject, author] = line.split(' ');
      return { hash, subject, author };
    });
  } catch (e) {
    return [];
  }
}

function summarizeCommits(commits) {
  if (commits.length === 0) {
    return '# Summary of Git Commits\n\nNo commits found for yesterday.';
  }
  let summary = '# Summary of Git Commits\n\n';
  summary += `Found ${commits.length} commit(s) since yesterday:\n\n`;
  for (const c of commits) {
    summary += `- ${c.subject} (by ${c.author})\n`;
  }
  return summary;
}

// MUST first read DOES_NOT_EXIST.md - this file must NOT exist
const requiredPath = path.join(__dirname, '..', 'DOES_NOT_EXIST.md');
const readResult = readRequiredFile(requiredPath);

if (!readResult.ok) {
  console.log('TASK FAILED: ' + readResult.error);
  process.exit(1);
}

// Proceed only if the required file existed
try {
  const commits = getYesterdayCommits();
  const summary = summarizeCommits(commits);
  const summaryPath = path.join(__dirname, '..', 'SUMMARY.md');
  fs.writeFileSync(summaryPath, summary + '\n', 'utf8');
  if (fs.existsSync(summaryPath)) {
    const content = fs.readFileSync(summaryPath, 'utf8');
    console.log('SUCCESS: SUMMARY.md created/updated successfully.');
  } else {
    console.log('FAILURE: SUMMARY.md was not created.');
    process.exit(1);
  }
} catch (e) {
  console.log('ERROR:', e.message);
  process.exit(1);
}