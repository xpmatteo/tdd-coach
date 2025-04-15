const fs = require('fs').promises;
const path = require('path');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('TestCaptureManager', () => {
  let TestCaptureManager;
  let originalEnv;
  const testSession = {
    state: 'RED',
    productionCode: 'function fizzbuzz() {}',
    testCode: 'test("should return 1", () => {});',
    testCases: [{ description: 'Test case 1', status: 'IN_PROGRESS' }],
    currentTestIndex: 0,
    getCurrentCapture: () => ({
      state: 'RED',
      productionCode: 'function fizzbuzz() {}',
      testCode: 'test("should return 1", () => {});',
      testCases: [{ description: 'Test case 1', status: 'IN_PROGRESS' }],
      currentTestIndex: 0,
      llmResponse: { proceed: 'yes', comments: 'Good job!' }
    })
  };
  
  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.TEST_CAPTURE_MODE;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset module cache for each test
    jest.resetModules();
    
    // Import the module
    TestCaptureManager = require('../../../models/testCapture/TestCaptureManager');
  });
  
  afterEach(() => {
    // Restore environment
    process.env.TEST_CAPTURE_MODE = originalEnv;
  });
  
  describe('initialize', () => {
    it('should create the storage directory when enabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      
      // Act
      await TestCaptureManager.initialize();
      
      // Assert
      expect(fs.mkdir).toHaveBeenCalled();
      expect(TestCaptureManager.isEnabled).toBe(true);
    });
    
    it('should not create directory when disabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      
      // Act
      await TestCaptureManager.initialize();
      
      // Assert
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(TestCaptureManager.isEnabled).toBe(false);
    });
  });
  
  describe('saveTestCase', () => {
    it('should save a test case from session data', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const name = 'test-case-name';
      
      // Act
      await TestCaptureManager.saveTestCase(testSession, name);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalled();
      const writeArgs = fs.writeFile.mock.calls[0];
      expect(writeArgs[0]).toContain(name.toLowerCase());
      expect(writeArgs[0]).toContain('RED');
      expect(JSON.parse(writeArgs[1])).toHaveProperty('state', 'RED');
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.saveTestCase(testSession, 'name'))
        .rejects.toThrow('Test capture mode disabled');
    });
    
    it('should throw error when session has no captured interaction', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const sessionWithNoCapture = { ...testSession, getCurrentCapture: () => null };
      
      // Act & Assert
      await expect(TestCaptureManager.saveTestCase(sessionWithNoCapture, 'name'))
        .rejects.toThrow('No interaction captured');
    });
  });
  
  describe('getTestCases', () => {
    it('should return list of test cases when enabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      fs.readdir.mockResolvedValue(['RED_test1.json', 'GREEN_test2.json']);
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('RED_test1.json')) {
          return Promise.resolve(JSON.stringify({
            state: 'RED',
            timestamp: '2023-10-15T12:00:00.000Z',
            testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
            currentTestIndex: 0,
            llmResponse: { proceed: 'yes' }
          }));
        } else {
          return Promise.resolve(JSON.stringify({
            state: 'GREEN',
            timestamp: '2023-10-15T12:05:00.000Z',
            testCases: [{ description: 'Test 2', status: 'IN_PROGRESS' }],
            currentTestIndex: 0,
            llmResponse: { proceed: 'no' }
          }));
        }
      });
      
      // Act
      const result = await TestCaptureManager.getTestCases();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('state', 'GREEN'); // Should be sorted by timestamp (desc)
      expect(result[1]).toHaveProperty('state', 'RED');
    });
    
    it('should return empty array when disabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act
      const result = await TestCaptureManager.getTestCases();
      
      // Assert
      expect(result).toEqual([]);
      expect(fs.readdir).not.toHaveBeenCalled();
    });
  });
  
  describe('getTestCase', () => {
    it('should return a specific test case', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const filename = 'RED_test1.json';
      const testCase = {
        state: 'RED',
        timestamp: '2023-10-15T12:00:00.000Z',
        llmResponse: { proceed: 'yes' }
      };
      fs.readFile.mockResolvedValue(JSON.stringify(testCase));
      
      // Act
      const result = await TestCaptureManager.getTestCase(filename);
      
      // Assert
      expect(result).toEqual(testCase);
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.getTestCase('file.json'))
        .rejects.toThrow('Test capture mode disabled');
    });
  });
  
  describe('deleteTestCase', () => {
    it('should delete a test case', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const filename = 'RED_test1.json';
      
      // Act
      const result = await TestCaptureManager.deleteTestCase(filename);
      
      // Assert
      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining(filename));
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.deleteTestCase('file.json'))
        .rejects.toThrow('Test capture mode disabled');
    });
  });
  
  describe('isTestingModeEnabled', () => {
    it('should return true when enabled', () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      
      // Act
      const result = TestCaptureManager.isTestingModeEnabled();
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when disabled', () => {
      // Arrange
      process.env.TEST_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act
      const result = TestCaptureManager.isTestingModeEnabled();
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
