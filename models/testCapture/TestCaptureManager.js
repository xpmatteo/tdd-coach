const fs = require('fs').promises;
const path = require('path');

/**
 * Manages test case capture functionality
 */
class TestCaptureManager {
  /**
   * Creates a new TestCaptureManager
   * @param {string} storageDir - Directory to store test cases
   */
  constructor(storageDir = 'prompt-tests') {
    this.storageDir = storageDir;
    this.isEnabled = process.env.PROMPT_CAPTURE_MODE === 'true';
  }

  /**
   * Initialize the test capture system
   */
  async initialize() {
    if (!this.isEnabled) return;

    try {
      // Check if storage directory exists, create if not
      const storagePath = path.join(process.cwd(), this.storageDir);
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      console.error('Error initializing test capture system:', error);
      this.isEnabled = false;
      throw error;
    }
  }

  /**
   * Save the captured interaction from a session as a test case
   * @param {Object} session - Session containing the captured interaction
   * @param {string} name - Name for the test case
   * @returns {Promise<string>} - Filename of the saved test case
   */
  async saveTestCase(session, name) {
    if (!this.isEnabled) {
      throw new Error('Test capture mode disabled');
    }

    const capturedInteraction = session.getCurrentCapture();
    if (!capturedInteraction) {
      throw new Error('No interaction captured');
    }

    // Create a sanitized filename based on the name and state
    const state = capturedInteraction.state;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${state}_${sanitizedName}_${timestamp}.json`;

    const filePath = path.join(process.cwd(), this.storageDir, filename);

    try {
      await fs.writeFile(
        filePath,
        JSON.stringify(capturedInteraction, null, 2)
      );

      // Clear the captured interaction from the session
      if (typeof session.clearCapturedInteraction === 'function') {
        session.clearCapturedInteraction();
      }

      return filename;
    } catch (error) {
      console.error('Error saving test case:', error);
      throw new Error('Failed to save test case');
    }
  }

  /**
   * Get all saved test cases
   * @returns {Promise<Array>} - List of test case files
   */
  async getTestCases() {
    if (!this.isEnabled) return [];

    try {
      const storagePath = path.join(process.cwd(), this.storageDir);
      const files = await fs.readdir(storagePath);

      if (!files || !Array.isArray(files)) {
        console.error('Error reading directory: files is not an array', files);
        return [];
      }

      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const testCases = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(process.cwd(), this.storageDir, file);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            return {
              filename: file,
              state: data.state,
              timestamp: data.timestamp,
              testCaseName: data.currentTestIndex !== null && data.testCases && data.testCases[data.currentTestIndex] ?
                data.testCases[data.currentTestIndex].description : 'No test selected',
              proceed: data.llmResponse?.proceed || 'no'
            };
          } catch (error) {
            console.error(`Error parsing test case ${file}:`, error);
            return {
              filename: file,
              state: 'ERROR',
              timestamp: new Date().toISOString(),
              testCaseName: 'Error parsing test case',
              proceed: 'no'
            };
          }
        })
      );

      return testCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting test cases:', error);
      return [];
    }
  }

  /**
   * Get a specific test case by filename
   * @param {string} filename - Filename of the test case
   * @returns {Promise<Object>} - Test case data
   */
  async getTestCase(filename) {
    if (!this.isEnabled) {
      throw new Error('Test capture mode disabled');
    }

    try {
      const filePath = path.join(process.cwd(), this.storageDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading test case ${filename}:`, error);
      throw new Error('Failed to read test case');
    }
  }

  /**
   * Check if testing mode is enabled
   * @returns {boolean} - Whether testing mode is enabled
   */
  isPromptCaptureModeEnabled() {
    return this.isEnabled;
  }

  /**
   * Delete a test case by filename
   * @param {string} filename - Filename of the test case to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteTestCase(filename) {
    if (!this.isEnabled) {
      throw new Error('Test capture mode disabled');
    }

    try {
      const filePath = path.join(process.cwd(), this.storageDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting test case ${filename}:`, error);
      return false;
    }
  }
}

module.exports = new TestCaptureManager();
