const https = require('https');

/**
 * GitHub Connector module.
 * Connects to the GitHub API to open/update Issues for the staleness report.
 * Uses PAT authentication via Authorization: token header.
 */
class GitHubConnector {
  constructor({ repoOwner, repoName, pat }) {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.pat = pat;
    this.baseUrl = 'api.github.com';
    this.headers = {
      'User-Agent': 'loop-docs-freshness',
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github+json',
    };
  }

  /**
   * Make a request to the GitHub API.
   * @param {string} method - HTTP method (GET, POST, PATCH)
   * @param {string} endpoint - API endpoint (e.g., 'issues', 'issues/123')
   * @param {Object} [body] - Request body for POST/PATCH
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {Error} If the request fails
   */
  async apiRequest(method, endpoint, body = null) {
    const path = `/repos/${this.repoOwner}/${this.repoName}/${endpoint}`;
    const options = {
      method,
      hostname: this.baseUrl,
      path,
      headers: this.headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Check if an issue with the given title already exists.
   * @param {string} title - Issue title to search for
   * @returns {Promise<Object|null>} Existing issue object or null
   */
  async findExistingIssue(title) {
    try {
      const searchQuery = `is:issue repo:${this.repoOwner}/${this.repoName} intitle:"${encodeURIComponent(title)}"`;
      const searchPath = `issues?q=${encodeURIComponent(searchQuery)}`;
      const result = await this.apiRequest('GET', searchPath);
      if (result && result.total_count && result.total_count > 0) {
        return result.items[0];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Create a new GitHub Issue with the staleness report.
   * @param {string} title - Issue title (e.g., "Docs Freshness Report - 2026-09-01")
   * @param {string} body - Issue body (markdown report)
   * @returns {Promise<Object>} Created issue object
   * @throws {Error} If creation fails
   */
  async createIssue(title, body) {
    const payload = {
      title,
      body,
      labels: ['docs-freshness', 'auto-generated'],
    };

    return this.apiRequest('POST', 'issues', payload);
  }

  /**
   * Update an existing GitHub Issue body.
   * @param {number} issueNumber - The issue number to update
   * @param {string} newBody - The new issue body
   * @returns {Promise<Object>} Updated issue object
   * @throws {Error} If update fails
   */
  async updateIssue(issueNumber, newBody) {
    return this.apiRequest('PATCH', `issues/${issueNumber}`, { body: newBody });
  }

  /**
   * Open or update the docs freshness report issue.
   * If an issue with the given title already exists, it updates the body.
   * Otherwise, it creates a new issue.
   * @param {string} title - Issue title (e.g., "Docs Freshness Report - 2026-09-01")
   * @param {string} body - Issue body (markdown report)
   * @returns {Promise<Object>} The issue object (created or updated)
   * @throws {Error} If the operation fails
   */
  async openOrUpdateIssue(title, body) {
    const existing = await this.findExistingIssue(title);

    if (existing) {
      return this.updateIssue(existing.number, body);
    } else {
      return this.createIssue(title, body);
    }
  }
}

module.exports = { GitHubConnector };