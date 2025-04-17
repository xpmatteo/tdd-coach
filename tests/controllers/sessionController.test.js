const sessionController = require('../../controllers/sessionController');
const Session = require('../../models/Session');
const llmService = require('../../services/llmService');

// Mock dependencies
jest.mock('../../services/llmService');
jest.mock('../../models/Session');
jest.mock('uuid', () => ({ v4: () => 'test-session-id' }));

describe('Session Controller', () => {
  let req, res;
  let mockSession;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock request and response objects
    req = {
      params: { id: 'test-session-id' },
      body: {
        sessionId: 'test-session-id',
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("fizzbuzz", () => {});',
        selectedTestIndex: '0'
      }
    };
    
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    
    // Create mock session
    mockSession = {
      state: 'RED',
      getStateDescription: jest.fn().mockReturnValue('Write a failing test'),
      testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
      productionCode: '',
      testCode: '',
      selectedTestIndex: '0',  // Match req.body.selectedTestIndex type
      currentTestIndex: 0,
      tokenUsage: {
        getStats: jest.fn().mockReturnValue({ formattedCost: '$0.01' })
      },
      processSubmission: jest.fn().mockReturnValue(true),
      advanceState: jest.fn(),
      captureInteraction: jest.fn(),
      captureLastLlmInteraction: jest.fn(),
      getLastLlmInteraction: jest.fn().mockReturnValue(null)
    };
    
    // Mocking sessions Map
    sessionController.sessions.set('test-session-id', mockSession);
    
    // Mock LLM service response
    llmService.getLlmFeedback.mockResolvedValue({
      comments: 'Great job!',
      hint: 'Try this...',
      proceed: 'yes'
    });
  });
  
  describe('submitCode', () => {
    it('should store last LLM interaction and use it for view rendering', async () => {
      // Arrange
      const llmResponse = {
        comments: 'Good test!',
        hint: 'Consider testing edge cases',
        proceed: 'yes'
      };
      llmService.getLlmFeedback.mockResolvedValue(llmResponse);
      
      // Act
      await sessionController.submitCode(req, res);
      
      // Assert
      // Check that captureLastLlmInteraction was called with the right data
      expect(mockSession.captureLastLlmInteraction).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'RED',
          productionCode: 'function fizzbuzz() {}',
          testCode: 'test("fizzbuzz", () => {});',
          selectedTestIndex: '0',
          llmResponse
        })
      );
      
      // Check that the view was rendered with the right data
      expect(res.render).toHaveBeenCalledWith('session', 
        expect.objectContaining({
          feedback: 'Good test!',
          proceed: 'yes'
        })
      );
    });
    
    it('should capture interaction for prompt testing when enabled', async () => {
      // Arrange
      // Mock the testCaptureManager to avoid relying on env vars in tests
      const testCaptureManager = require('../../models/testCapture/TestCaptureManager');
      const originalIsEnabled = testCaptureManager.isPromptCaptureModeEnabled;
      testCaptureManager.isPromptCaptureModeEnabled = jest.fn().mockReturnValue(true);
      
      // Act
      await sessionController.submitCode(req, res);
      
      // Assert
      expect(mockSession.captureInteraction).toHaveBeenCalled();
      expect(mockSession.captureLastLlmInteraction).toHaveBeenCalled();
      
      // Restore original method
      testCaptureManager.isPromptCaptureModeEnabled = originalIsEnabled;
    });
    
    it('should not call captureInteraction when prompt capture mode is disabled', async () => {
      // Arrange
      // Mock the testCaptureManager to avoid relying on env vars in tests
      const testCaptureManager = require('../../models/testCapture/TestCaptureManager');
      const originalIsEnabled = testCaptureManager.isPromptCaptureModeEnabled;
      testCaptureManager.isPromptCaptureModeEnabled = jest.fn().mockReturnValue(false);
      
      // Act
      await sessionController.submitCode(req, res);
      
      // Assert
      expect(mockSession.captureInteraction).not.toHaveBeenCalled();
      expect(mockSession.captureLastLlmInteraction).toHaveBeenCalled(); // Still captures last interaction
      
      // Restore original method
      testCaptureManager.isPromptCaptureModeEnabled = originalIsEnabled;
    });
  });
  
  describe('getSession', () => {
    it('should use last LLM interaction for feedback if available', async () => {
      // Arrange
      const lastInteraction = {
        llmResponse: {
          comments: 'Previously stored feedback',
          proceed: 'no'
        }
      };
      mockSession.getLastLlmInteraction.mockReturnValue(lastInteraction);
      
      // Act
      await sessionController.getSession(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith('session', 
        expect.objectContaining({
          feedback: 'Previously stored feedback',
          proceed: 'no'
        })
      );
    });
    
    it('should use default welcome message when no previous LLM interaction exists', async () => {
      // Arrange
      mockSession.getLastLlmInteraction.mockReturnValue(null);
      
      // Act
      await sessionController.getSession(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith('session', 
        expect.objectContaining({
          feedback: expect.stringContaining('Welcome to the FizzBuzz kata'),
          proceed: null
        })
      );
    });
  });
});