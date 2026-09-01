const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCK_FILE = path.join(process.cwd(), '.loop.lock');
const LOCK_TIMEOUT = 60 * 1000; // 1 minute - prevents duplicate rapid runs

/**
 * Heartbeat module.
 * Provides a lock-guards mechanism to prevent duplicate unattended runs.
 * Checks for a .loop.lock file; if a run occurred less than 1 minute ago,
 * the new run exits early. Otherwise, it creates the lock and proceeds.
 */
class Heartbeat {
  /**
   * Check if a previous run is still "active" (within the timeout window).
   * @returns {boolean} True if a previous run is active (should skip), false if safe to proceed
   */
  isRunning() {
    try {
      if (!fs.existsSync(LOCK_FILE)) {
        return false;
      }
      const content = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const timestamp = parseInt(content, 10);
      if (isNaN(timestamp)) {
        return false;
      }
      const age = Date.now() - timestamp;
      return age < LOCK_TIMEOUT;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create/refresh the .loop.lock file to signal the start of a new run.
   * This should be called at the very beginning of the loop execution.
   * @returns {void}
   */
  acquireLock() {
    const timestamp = Date.now().toString();
    fs.writeFileSync(LOCK_FILE, timestamp, 'utf8');
  }

  /**
   * Release/refresh the lock at the end of a run.
   * This can either remove the lock or update its timestamp to the current time,
   * signaling the run has completed.
   * @param {boolean} [keep=false] - If true, keep the lock (useful for debugging);
   *                                 if false, remove the lock file
   * @returns {void}
   */
  releaseLock(keep = false) {
    if (keep) {
      // Just refresh the timestamp to show the run completed
      this.acquireLock();
    } else {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = { Heartbeat };