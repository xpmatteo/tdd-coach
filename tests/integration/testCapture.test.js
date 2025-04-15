const Session = require('../../models/Session');
const TestCaptureManager = require('../../models/testCapture/TestCaptureManager');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue('{}'),
    unlink: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Test Capture Integration', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save the original environment
    originalEnv = process.env.TEST_CAPTURE_MODE;
    process.env.TEST_CAPTURE_MODE = 'true';
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore the original environment
    process.env.TEST_CAPTURE_MODE = originalEnv;
  });
  
  it('should capture and save a test case', async () => {
    // Arrange
    const session = new Session('fizzbuzz');
    const interactionData = {
      state: 'RED',
      llmResponse: { proceed: 'yes', comments: 'Good test!' }
    };
    
    // Initialize test capture system
    await TestCaptureManager.initialize();
    
    // Act
    session.captureInteraction(interactionData);
    const capture = session.getCurrentCapture();
    await TestCaptureManager.saveTestCase(session, 'test-case-name');
    
    // Assert
    expect(capture).not.toBeNull();
    expect(capture.state).toBe('RED');
    expect(capture.llmResponse.proceed).toBe('yes');
    
    // Check if writeFile was called with correct arguments
    const fs = require('fs').promises;
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-case-name'),
      expect.stringContaining('RED'),
      undefined
    );
    
    // Check if session's capturedInteraction was cleared
    expect(session.getCurrentCapture()).toBeNull();
  });
  
  it('should not interfere with multiple sessions', () => {
    // Arrange
    process.env.TEST_CAPTURE_MODE = 'true';
    const session1 = new Session('fizzbuzz');
    const session2 = new Session('fizzbuzz');
    
    // Act
    session1.captureInteraction({
      state: 'RED',
      llmResponse: { proceed: 'yes', comments: 'Session 1 feedback' }
    });
    
    session2.captureInteraction({
      state: 'GREEN',
      llmResponse: { proceed: 'no', comments: 'Session 2 feedback' }
    });
    
    // Assert
    const capture1 = session1.getCurrentCapture();
    const capture2 = session2.getCurrentCapture();
    
    expect(capture1.state).toBe('RED');
    expect(capture1.llmResponse.comments).toBe('Session 1 feedback');
    
    expect(capture2.state).toBe('GREEN');
    expect(capture2.llmResponse.comments).toBe('Session 2 feedback');
    
    // Captures are independent
    expect(capture1).not.toBe(capture2);
  });
});
