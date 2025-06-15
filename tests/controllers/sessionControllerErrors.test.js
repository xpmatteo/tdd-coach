const { getHint, sessions } = require('../../controllers/sessionController');
const { getLlmFeedback } = require('../../services/llmService');
const Session = require('../../models/Session');
const RunningCost = require('../../models/RunningCost');

// Mock the llmService
jest.mock('../../services/llmService', () => ({
  getLlmFeedback: jest.fn()
}));

// Mock the Session model
jest.mock('../../models/Session');

describe('Session Controller Error Handling', () => {
  let req, res, session, mockSessions;
  const testSessionId = 'test-session-id';
  
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
      runningCost: new RunningCost(),
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
    sessions.set(testSessionId, session);
    require('../../controllers/sessionController').sessions = mockSessions;

    // Reset mocks before each test
    getLlmFeedback.mockClear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  
  test('should handle network errors from LLM in getHint', async () => {
    // Set up request body
    req.body.sessionId = testSessionId;
    const networkError = new Error('Network timeout');
    networkError.type = 'network';
    networkError.originalError = new Error('Network timeout');

    getLlmFeedback.mockImplementation(() => { throw networkError; });

    await getHint(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: {
        type: 'system',
        message: 'Failed to get hint',
        details: expect.objectContaining({
          type: 'network',
          message: 'Network timeout',
          details: expect.stringContaining('Error: Network timeout')
        })
      }
    }));
  });
});
