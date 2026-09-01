const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Check README staleness for all project directories under a given root.
 * For each project-N/ folder, reads the README.md last git commit date,
 * compares against the staleness threshold, and returns a list of stale READMEs.
 *
 * @param {string} rootDir - Root directory containing project folders (e.g., repo root)
 * @param {number} thresholdDays - Days old threshold (default: 30)
 * @returns {Array<Object>} List of stale README entries
 */
function checkStaleness(rootDir, thresholdDays = 30) {
  const staleList = [];

  // Find all directories under rootDir that match project-N pattern
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(rootDir, entry.name);

    // Skip non-project directories and files
    if (entry.name.startsWith('.') || !entry.name.match(/^project/)) continue;

    const readmePath = path.join(dirPath, 'README.md');
    if (!fs.existsSync(readmePath)) continue;

    try {
      // Get the last commit date for the README file using git log
      let lastModified;
      try {
        const output = execSync(
          `git log -1 --format=%ai "${readmePath}"`,
          { cwd: dirPath, encoding: 'utf8' }
        ).trim();
        lastModified = output;
      } catch (e) {
        // If git log fails, skip this README
        continue;
      }

      // Calculate days old
      const lastModDate = new Date(lastModified);
      const now = new Date();
      const diffDays = Math.floor((now - lastModDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= thresholdDays) {
        staleList.push({
          project: entry.name,
          readmePath,
          lastModified: lastModDate.toISOString(),
          daysOld: diffDays,
        });
      }
    } catch (err) {
      // Skip directories that fail to read
      continue;
    }
  }

  // Sort by daysOld descending (stale first)
  staleList.sort((a, b) => b.daysOld - a.daysOld);

  return staleList;
}

module.exports = { checkStaleness };