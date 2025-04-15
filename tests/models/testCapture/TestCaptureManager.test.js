const path = require('path');

// Mock fs module
const fs = jest.mock('fs', () => {
  const mockFs = {
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readdir: jest.fn().mockResolvedValue(['RED_test1.json', 'GREEN_test2.json']),
      readFile: jest.fn().mockImplementation((filePath) => {
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
      }),
      unlink: jest.fn().mockResolvedValue(undefined)
    }
  };
  return mockFs;
});

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
    }),
    clearCapturedInteraction: jest.fn()
  };
  
  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.PROMPT_CAPTURE_MODE;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset module cache for each test
    jest.resetModules();
    
    // Import the module
    TestCaptureManager = require('../../../models/testCapture/TestCaptureManager');
  });
  
  afterEach(() => {
    // Restore environment
    process.env.PROMPT_CAPTURE_MODE = originalEnv;
  });
  
  describe('initialize', () => {
    it('should create the storage directory when enabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      
      // Act
      await TestCaptureManager.initialize();
      
      // Assert
      expect(require('fs').promises.mkdir).toHaveBeenCalled();
      expect(TestCaptureManager.isEnabled).toBe(true);
    });
    
    it('should not create directory when disabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act
      await TestCaptureManager.initialize();
      
      // Assert
      expect(require('fs').promises.mkdir).not.toHaveBeenCalled();
      expect(TestCaptureManager.isEnabled).toBe(false);
    });
  });
  
  describe('saveTestCase', () => {
    it('should save a test case from session data', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const name = 'test-case-name';
      
      // Act
      await TestCaptureManager.saveTestCase(testSession, name);
      
      // Assert
      expect(require('fs').promises.writeFile).toHaveBeenCalled();
      const writeArgs = require('fs').promises.writeFile.mock.calls[0];
      expect(writeArgs[0]).toContain('RED');
      expect(writeArgs[0].toLowerCase()).toContain('test_case_name');
      expect(JSON.parse(writeArgs[1])).toHaveProperty('state', 'RED');
      expect(testSession.clearCapturedInteraction).toHaveBeenCalled();
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.saveTestCase(testSession, 'name'))
        .rejects.toThrow('Test capture mode disabled');
    });
    
    it('should throw error when session has no captured interaction', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const sessionWithNoCapture = { 
        ...testSession, 
        getCurrentCapture: () => null 
      };
      
      // Act & Assert
      await expect(TestCaptureManager.saveTestCase(sessionWithNoCapture, 'name'))
        .rejects.toThrow('No interaction captured');
    });
  });
  
  describe('getTestCases', () => {
    it('should return list of test cases when enabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      
      // Act
      const result = await TestCaptureManager.getTestCases();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('state', 'GREEN'); // Should be sorted by timestamp (desc)
      expect(result[1]).toHaveProperty('state', 'RED');
    });
    
    it('should return empty array when disabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act
      const result = await TestCaptureManager.getTestCases();
      
      // Assert
      expect(result).toEqual([]);
      expect(require('fs').promises.readdir).not.toHaveBeenCalled();
    });
  });
  
  describe('getTestCase', () => {
    it('should return a specific test case', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const filename = 'RED_test1.json';
      
      // Act
      const result = await TestCaptureManager.getTestCase(filename);
      
      // Assert
      expect(result).toHaveProperty('state', 'RED');
      expect(result).toHaveProperty('timestamp', '2023-10-15T12:00:00.000Z');
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.getTestCase('file.json'))
        .rejects.toThrow('Test capture mode disabled');
    });
  });
  
  describe('deleteTestCase', () => {
    it('should delete a test case', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      const filename = 'RED_test1.json';
      
      // Act
      const result = await TestCaptureManager.deleteTestCase(filename);
      
      // Assert
      expect(result).toBe(true);
      expect(require('fs').promises.unlink).toHaveBeenCalledWith(expect.stringContaining(filename));
    });
    
    it('should throw error when disabled', async () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act & Assert
      await expect(TestCaptureManager.deleteTestCase('file.json'))
        .rejects.toThrow('Test capture mode disabled');
    });
  });
  
  describe('isTestingModeEnabled', () => {
    it('should return true when enabled', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'true';
      TestCaptureManager.isEnabled = true;
      
      // Act
      const result = TestCaptureManager.isTestingModeEnabled();
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when disabled', () => {
      // Arrange
      process.env.PROMPT_CAPTURE_MODE = 'false';
      TestCaptureManager.isEnabled = false;
      
      // Act
      const result = TestCaptureManager.isTestingModeEnabled();
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
