const { submitCode, getHint } = require('../../controllers/sessionController');
const { getLlmFeedback } = require('../../services/llmService');
const Session = require('../../models/Session');
const TokenUsage = require('../../models/TokenUsage');

// Mock the llmService
jest.mock('../../services/llmService', () => ({
  getLlmFeedback: jest.fn()
}));

// Mock the Session model
jest.mock('../../models/Session');

describe('Session Controller Error Handling', () => {
  let req, res, session, mockSessions;
  
  beforeEach(() => {
    // Create request and response objects
    req = {
      body: {
        sessionId: 'test-session-id',
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("test", () => {});',
        selectedTestIndex: '0'
      },
      params: {
        id: 'test-session-id'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      render: jest.fn()
    };
    
    // Create a mock session
    session = {
      state: 'RED',
      productionCode: '',
      testCode: '',
      testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
      selectedTestIndex: null,
      currentTestIndex: 0,
      tokenUsage: new TokenUsage(),
      setCodeExecutionResults: jest.fn(),
      getCodeExecutionResults: jest.fn().mockReturnValue(null),
      captureLastLlmInteraction: jest.fn(),
      processSubmission: jest.fn().mockReturnValue(true),
      advanceState: jest.fn(),
      getStateDescription: jest.fn().mockReturnValue('Write a failing test'),
      getLastLlmInteraction: jest.fn().mockReturnValue(null)
    };
    
    // Set up the mock sessions map
    mockSessions = new Map();
    mockSessions.set('test-session-id', session);
    require('../../controllers/sessionController').sessions = mockSessions;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle network errors from LLM in submitCode', async () => {
    // Set up the mock LLM service to return a network error
    getLlmFeedback.mockResolvedValueOnce({
      error: {
        type: 'network',
        message: 'Failed to connect to LLM API: Network timeout',
        originalError: new Error('Network timeout')
      }
    });
    
    // Call the controller method
    await submitCode(req, res);
    
    // Verify the error is handled properly
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'network',
        message: 'Failed to connect to LLM API: Network timeout',
        details: 'Error: Network timeout'
      }
    });
    expect(res.status).toHaveBeenCalledWith(500);
  });
  
  test('should handle JSON parsing errors from LLM in submitCode', async () => {
    // Set up the mock LLM service to return a parse error
    getLlmFeedback.mockResolvedValueOnce({
      error: {
        type: 'parse',
        message: 'Failed to parse LLM response as JSON: Unexpected token',
        rawResponse: 'This is not valid JSON',
        originalError: new SyntaxError('Unexpected token')
      }
    });
    
    // Call the controller method
    await submitCode(req, res);
    
    // Verify the error is handled properly
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'parse',
        message: 'Failed to parse LLM response as JSON: Unexpected token',
        details: 'SyntaxError: Unexpected token',
        rawResponse: 'This is not valid JSON'
      }
    });
    expect(res.status).toHaveBeenCalledWith(500);
  });
  
  test('should handle API errors from LLM in submitCode', async () => {
    // Set up the mock LLM service to return an API error
    getLlmFeedback.mockResolvedValueOnce({
      error: {
        type: 'api',
        message: 'LLM service error: API responded with 429 Too Many Requests',
        status: 429,
        originalError: new Error('API responded with 429 Too Many Requests')
      }
    });
    
    // Call the controller method
    await submitCode(req, res);
    
    // Verify the error is handled properly
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'api',
        message: 'LLM service error: API responded with 429 Too Many Requests',
        details: 'Error: API responded with 429 Too Many Requests',
        status: 429
      }
    });
    expect(res.status).toHaveBeenCalledWith(500);
  });
  
  test('should handle network errors from LLM in getHint', async () => {
    // Set up the mock LLM service to return a network error
    getLlmFeedback.mockResolvedValueOnce({
      error: {
        type: 'network',
        message: 'Failed to connect to LLM API: Network timeout',
        originalError: new Error('Network timeout')
      }
    });
    
    // Call the controller method
    await getHint(req, res);
    
    // Verify the error is handled properly
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'network',
        message: 'Failed to connect to LLM API: Network timeout',
        details: 'Error: Network timeout'
      }
    });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
