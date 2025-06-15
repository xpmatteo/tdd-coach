const createGetHintHandler = require('../../handlers/getHintHandler');

describe('getHintHandler', () => {
  let mockSessionManager, mockPromptService, mockLlmService;
  let req, res, getHintHandler, mockSession;

  beforeEach(() => {
    mockSession = {
      runningCost: {
        getStats: jest.fn().mockReturnValue({ totalCost: 0 })
      }
    };

    mockSessionManager = {
      findSession: jest.fn().mockReturnValue(mockSession)
    };

    mockPromptService = {
      getPrompts: jest.fn().mockReturnValue({
        system: 'System hint prompt',
        user: 'User hint prompt'
      })
    };

    mockLlmService = {
      getLlmFeedback: jest.fn().mockResolvedValue({
        comments: 'Good work',
        hint: 'Try to consider edge cases',
        proceed: 'yes'
      })
    };

    req = {
      body: {
        sessionId: 'test-session',
        mockMode: 'off'
      }
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    getHintHandler = createGetHintHandler(mockSessionManager, mockPromptService, mockLlmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 404 when session not found', async () => {
    mockSessionManager.findSession.mockReturnValue(null);

    await getHintHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Session not found');
  });

  test('should return mock hint when mock mode is enabled', async () => {
    req.body.mockMode = 'on';

    await getHintHandler(req, res);

    expect(mockLlmService.getLlmFeedback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      hint: 'Mock hint: Provide a suggestion to improve the code.'
    });
  });

  test('should get prompts with hint flag and return LLM hint', async () => {
    await getHintHandler(req, res);

    expect(mockPromptService.getPrompts).toHaveBeenCalledWith(mockSession, true);
    expect(mockLlmService.getLlmFeedback).toHaveBeenCalledWith(
      { system: 'System hint prompt', user: 'User hint prompt' },
      mockSession.runningCost
    );
    expect(res.json).toHaveBeenCalledWith({
      hint: 'Try to consider edge cases'
    });
  });

  test('should handle LLM service errors', async () => {
    const error = new Error('API Error');
    error.type = 'api';
    error.status = 429;
    mockLlmService.getLlmFeedback.mockRejectedValue(error);

    await getHintHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'system',
        message: 'Failed to get hint',
        details: expect.objectContaining({
          type: 'api',
          message: 'API Error',
          status: 429
        })
      }
    });
  });

  test('should handle parse errors with raw response', async () => {
    const error = new SyntaxError('Unexpected token');
    error.type = 'parse';
    error.rawResponse = 'Invalid JSON';
    mockLlmService.getLlmFeedback.mockRejectedValue(error);

    await getHintHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'system',
        message: 'Failed to get hint',
        details: expect.objectContaining({
          type: 'parse',
          message: 'Unexpected token',
          rawResponse: 'Invalid JSON'
        })
      }
    });
  });

  test('should handle network errors', async () => {
    const error = new Error('Network timeout');
    error.type = 'network';
    error.originalError = new Error('Network timeout');
    mockLlmService.getLlmFeedback.mockRejectedValue(error);

    await getHintHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'system',
        message: 'Failed to get hint',
        details: expect.objectContaining({
          type: 'network',
          message: 'Network timeout',
          details: expect.stringContaining('Error: Network timeout')
        })
      }
    });
  });
});