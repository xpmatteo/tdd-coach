const fs = require('fs').promises;
const path = require('path');

class SessionPersistenceService {
  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'sessions');
  }

  /**
   * Ensure the base sessions directory exists
   */
  async ensureBaseDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Get the directory path for a session
   * @param {string} sessionId - The session ID
   * @returns {string} Directory path
   */
  getSessionDirectory(sessionId) {
    return path.join(this.basePath, sessionId);
  }

  /**
   * Check if a session exists
   * @param {string} sessionId - The session ID
   * @returns {boolean} True if session directory exists
   */
  async sessionExists(sessionId) {
    try {
      const sessionDir = this.getSessionDirectory(sessionId);
      const stats = await fs.stat(sessionDir);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Save session data with timestamp filename
   * @param {string} sessionId - The session ID
   * @param {Object} sessionData - The session data to save
   */
  async saveSession(sessionId, sessionData) {
    await this.ensureBaseDirectory();
    
    const sessionDir = this.getSessionDirectory(sessionId);
    await fs.mkdir(sessionDir, { recursive: true });
    
    const timestamp = Date.now();
    const filename = `${timestamp}.json`;
    const filepath = path.join(sessionDir, filename);
    
    const jsonData = JSON.stringify(sessionData, null, 2);
    await fs.writeFile(filepath, jsonData, 'utf8');
  }

  /**
   * Load the latest session data for a session ID
   * @param {string} sessionId - The session ID
   * @returns {Object|null} Session data or null if not found
   */
  async loadLatestSession(sessionId) {
    try {
      const sessionDir = this.getSessionDirectory(sessionId);
      const files = await fs.readdir(sessionDir);
      
      // Filter JSON files and sort by timestamp (filename)
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const timestampA = parseInt(a.replace('.json', ''));
          const timestampB = parseInt(b.replace('.json', ''));
          return timestampB - timestampA; // Sort descending (latest first)
        });

      if (jsonFiles.length === 0) {
        return null;
      }

      const latestFile = jsonFiles[0];
      const filepath = path.join(sessionDir, latestFile);
      const jsonData = await fs.readFile(filepath, 'utf8');
      
      return JSON.parse(jsonData);
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get all session files for a session (for debugging/history)
   * @param {string} sessionId - The session ID
   * @returns {Array} Array of session file info
   */
  async getSessionHistory(sessionId) {
    try {
      const sessionDir = this.getSessionDirectory(sessionId);
      const files = await fs.readdir(sessionDir);
      
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const timestamp = parseInt(file.replace('.json', ''));
          return {
            filename: file,
            timestamp,
            date: new Date(timestamp)
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      return jsonFiles;
    } catch (error) {
      console.error(`Error getting session history ${sessionId}:`, error);
      return [];
    }
  }
}

module.exports = SessionPersistenceService;