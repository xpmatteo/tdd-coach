const createSubmitCodeHandler = require('../../handlers/submitCodeHandler');

describe('submitCodeHandler', () => {
  let mockSessionManager, mockCodeExecutor, mockPromptService, mockLlmService, mockViewDataBuilder;
  let req, res, submitCodeHandler, mockSession;

  beforeEach(() => {
    mockSession = {
      state: 'RED',
      productionCode: '',
      testCode: '',
      selectedTestIndex: null,
      setCodeExecutionResults: jest.fn(),
      processSubmission: jest.fn().mockReturnValue(true),
      advanceState: jest.fn(),
      captureLastLlmInteraction: jest.fn(),
      getCodeExecutionResults: jest.fn().mockReturnValue(null),
      runningCost: {
        getStats: jest.fn().mockReturnValue({ totalCost: 0 })
      }
    };

    mockSessionManager = {
      findSession: jest.fn().mockReturnValue(mockSession),
      saveSession: jest.fn().mockResolvedValue()
    };

    mockCodeExecutor = {
      executeCode: jest.fn().mockReturnValue({
        success: false,
        error: null,
        testResults: [],
        console: ''
      })
    };

    mockPromptService = {
      getPrompts: jest.fn().mockReturnValue({
        system: 'System prompt',
        user: 'User prompt'
      })
    };

    mockLlmService = {
      getLlmFeedback: jest.fn().mockResolvedValue({
        comments: 'Good work',
        hint: 'Test hint',
        proceed: 'yes'
      })
    };

    mockViewDataBuilder = {
      getSessionViewData: jest.fn().mockReturnValue({
        sessionId: 'test-session',
        feedback: 'Good work'
      })
    };

    req = {
      body: {
        sessionId: 'test-session',
        productionCode: 'function test() {}',
        testCode: 'test("test", () => {})',
        selectedTestIndex: '0',
        mockMode: 'off'
      }
    };

    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    submitCodeHandler = createSubmitCodeHandler(
      mockSessionManager,
      mockCodeExecutor,
      mockPromptService,
      mockLlmService,
      mockViewDataBuilder
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 404 when session not found', async () => {
    mockSessionManager.findSession.mockReturnValue(null);

    await submitCodeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Session not found');
  });

  test('should update session with code and execute in normal mode', async () => {
    await submitCodeHandler(req, res);

    expect(mockSession.productionCode).toBe('function test() {}');
    expect(mockSession.testCode).toBe('test("test", () => {})');
    expect(mockCodeExecutor.executeCode).toHaveBeenCalledWith(
      'function test() {}',
      'test("test", () => {})'
    );
  });

  test('should set selectedTestIndex only in PICK state', async () => {
    mockSession.state = 'PICK';

    await submitCodeHandler(req, res);

    expect(mockSession.selectedTestIndex).toBe('0');
  });

  test('should not execute code in PICK state', async () => {
    mockSession.state = 'PICK';

    await submitCodeHandler(req, res);

    expect(mockCodeExecutor.executeCode).not.toHaveBeenCalled();
  });

  test('should handle mock mode', async () => {
    req.body.mockMode = 'on';

    await submitCodeHandler(req, res);

    expect(mockLlmService.getLlmFeedback).not.toHaveBeenCalled();
    expect(mockSession.captureLastLlmInteraction).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('session', {
      sessionId: 'test-session',
      feedback: 'Good work'
    });
  });

  test('should get LLM feedback in normal mode', async () => {
    await submitCodeHandler(req, res);

    expect(mockPromptService.getPrompts).toHaveBeenCalledWith(mockSession);
    expect(mockLlmService.getLlmFeedback).toHaveBeenCalledWith(
      { system: 'System prompt', user: 'User prompt' },
      mockSession.runningCost
    );
  });

  test('should handle LLM service errors', async () => {
    const error = new Error('API Error');
    error.type = 'api';
    mockLlmService.getLlmFeedback.mockRejectedValue(error);

    await submitCodeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        type: 'system',
        message: 'Error processing your submission',
        details: expect.objectContaining({
          type: 'api',
          message: 'API Error'
        })
      }
    });
  });

  test('should advance state when feedback says proceed', async () => {
    await submitCodeHandler(req, res);

    expect(mockSession.processSubmission).toHaveBeenCalled();
    expect(mockSession.advanceState).toHaveBeenCalled();
    expect(mockSessionManager.saveSession).toHaveBeenCalled();
  });
});