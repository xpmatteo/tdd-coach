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
  constructor(storageDir = 'promptTestCases') {
    this.storageDir = storageDir;
    this.isEnabled = process.env.TEST_CAPTURE_MODE === 'true';
    this.capturedInteraction = null;
  }

  /**
   * Initialize the test capture system
   */
  async initialize() {
    if (!this.isEnabled) return;

    try {
      // Check if storage directory exists, create if not
      await fs.mkdir(path.join(process.cwd(), this.storageDir), { recursive: true });
      console.log(`Test capture mode enabled. Storing test cases in: ${this.storageDir}`);
    } catch (error) {
      console.error('Error initializing test capture system:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Capture an interaction for potential test case creation
   * @param {Object} captureData - Data to capture
   * @param {string} captureData.state - Current TDD state
   * @param {string} captureData.productionCode - Current production code
   * @param {string} captureData.testCode - Current test code
   * @param {Array} captureData.testCases - All test cases
   * @param {number|null} captureData.selectedTestIndex - Selected test index (if applicable)
   * @param {number|null} captureData.currentTestIndex - Current test index (if applicable)
   * @param {Object} captureData.llmResponse - Response from the LLM
   */
  captureInteraction(captureData) {
    if (!this.isEnabled) return;

    this.capturedInteraction = {
      ...captureData,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
  }

  /**
   * Save the currently captured interaction as a test case
   * @param {string} name - Name for the test case
   * @returns {Promise<string>} - Filename of the saved test case
   */
  async saveTestCase(name) {
    if (!this.isEnabled || !this.capturedInteraction) {
      throw new Error('No interaction captured or test capture mode disabled');
    }

    // Create a sanitized filename based on the name and state
    const state = this.capturedInteraction.state;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${state}_${sanitizedName}_${timestamp}.json`;
    
    const filePath = path.join(process.cwd(), this.storageDir, filename);
    
    try {
      await fs.writeFile(
        filePath, 
        JSON.stringify(this.capturedInteraction, null, 2)
      );
      
      console.log(`Test case saved: ${filename}`);
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
      const files = await fs.readdir(path.join(process.cwd(), this.storageDir));
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
              testCaseName: data.currentTestIndex !== null && data.testCases[data.currentTestIndex] ? 
                data.testCases[data.currentTestIndex].description : 'No test selected',
              proceed: data.llmResponse.proceed
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
  isTestingModeEnabled() {
    return this.isEnabled;
  }

  /**
   * Get the currently captured interaction
   * @returns {Object|null} - The captured interaction or null
   */
  getCurrentCapture() {
    return this.capturedInteraction;
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
