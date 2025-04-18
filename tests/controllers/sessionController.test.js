const { submitCode } = require('../../controllers/sessionController');
const { getPrompts } = require('../../services/promptService');
const { getLlmFeedback } = require('../../services/llmService');
const { executeCode } = require('../../services/codeExecutionService');
const Session = require('../../models/Session');

// Mock dependencies
jest.mock('../../services/promptService');
jest.mock('../../services/llmService');
jest.mock('../../services/codeExecutionService');
jest.mock('../../models/Session');
jest.mock('../../models/testCapture/TestCaptureManager', () => ({
  isPromptCaptureModeEnabled: jest.fn().mockReturnValue(false),
  initialize: jest.fn().mockResolvedValue(undefined)
}));

describe('sessionController', () => {
  let req, res, mockSession;
  
  beforeEach(() => {
    // Setup request and response objects
    req = {
      body: {
        sessionId: 'test-session-id',
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("test", () => {})',
        selectedTestIndex: '0',
        mockMode: 'off'
      }
    };
    
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    
    // Create mock session
    mockSession = {
      state: 'RED',
      productionCode: '',
      testCode: '',
      testCases: [{ description: 'Test case 1', status: 'IN_PROGRESS' }],
      selectedTestIndex: null,
      currentTestIndex: 0,
      getLastLlmInteraction: jest.fn().mockReturnValue(null),
      getCodeExecutionResults: jest.fn().mockReturnValue(null),
      setCodeExecutionResults: jest.fn(),
      processSubmission: jest.fn().mockReturnValue(true),
      advanceState: jest.fn(),
      captureLastLlmInteraction: jest.fn(),
      captureInteraction: jest.fn(),
      getStateDescription: jest.fn().mockReturnValue('Write a failing test'),
      tokenUsage: {
        getStats: jest.fn().mockReturnValue({ inputTokens: 0, outputTokens: 0, cost: 0 })
      }
    };
    
    // Add mock session to controller's sessions map
    require('../../controllers/sessionController').sessions.set('test-session-id', mockSession);
    
    // Mock the service functions
    getPrompts.mockReturnValue({
      system: 'You are a TDD coach',
      user: 'Here is the code to review'
    });
    
    executeCode.mockReturnValue({
      success: false,
      error: null,
      testResults: [{ description: 'Test 1', success: false, error: 'Test failed' }],
      console: ''
    });
    
    getLlmFeedback.mockResolvedValue({
      comments: 'Test comments',
      hint: 'Test hint',
      proceed: 'yes'
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('submitCode should use prompt format with system and user parts', async () => {
    // Execute
    await submitCode(req, res);
    
    // Verify
    expect(getPrompts).toHaveBeenCalledWith(mockSession);
    expect(getLlmFeedback).toHaveBeenCalledWith(
      { system: 'You are a TDD coach', user: 'Here is the code to review' },
      mockSession.tokenUsage
    );
  });
});
