const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Worktree isolation module.
 * Creates a separate git worktree for scanning so the main branch is never directly touched.
 * All git operations (reading README dates, checking commits) happen in this context.
 */
class Worktree {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.worktreePath = path.join(path.dirname(repoPath), 'worktree', 'scan-worktree');
  }

  createWorktree() {
    if (fs.existsSync(this.worktreePath)) {
      fs.rmSync(this.worktreePath, { recursive: true, force: true });
    }
    execSync(`git worktree add "${this.worktreePath}"`, { cwd: this.repoPath });
    return this.worktreePath;
  }

  removeWorktree() {
    if (fs.existsSync(this.worktreePath)) {
      fs.rmSync(this.worktreePath, { recursive: true, force: true });
    }
  }

  getFileLastModified(filePath) {
    const fullPath = path.join(this.worktreePath, filePath);
    try {
      const output = execSync(
        `git log -1 --format=%ai "${fullPath}"`,
        { cwd: this.worktreePath, encoding: 'utf8' }
      ).trim();
      return output || null;
    } catch (e) {
      return null;
    }
  }

  exists() {
    return fs.existsSync(this.worktreePath);
  }
}

module.exports = { Worktree };