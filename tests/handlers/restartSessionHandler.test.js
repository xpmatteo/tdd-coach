const createRestartSessionHandler = require('../../handlers/restartSessionHandler');

describe('restartSessionHandler', () => {
  let mockSessionManager, mockViewDataBuilder;
  let req, res, restartSessionHandler, mockSession;

  beforeEach(() => {
    mockSession = {
      kata: {
        name: 'FizzBuzz',
        description: 'FizzBuzz kata'
      },
      runningCost: {
        totalCost: 100,
        getStats: jest.fn().mockReturnValue({ totalCost: 100 })
      }
    };

    mockSessionManager = {
      findSession: jest.fn().mockReturnValue(mockSession),
      restartSession: jest.fn().mockResolvedValue({
        state: 'PICK',
        runningCost: mockSession.runningCost
      })
    };

    mockViewDataBuilder = {
      getSessionViewData: jest.fn().mockReturnValue({
        sessionId: 'test-session',
        state: 'PICK',
        feedback: "Session restarted. Let's begin again!"
      })
    };

    req = {
      body: {
        sessionId: 'test-session'
      }
    };

    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    restartSessionHandler = createRestartSessionHandler(mockSessionManager, mockViewDataBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 404 when session not found', async () => {
    mockSessionManager.findSession.mockReturnValue(null);

    await restartSessionHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Session not found');
  });

  test('should restart session and preserve running cost', async () => {
    const newSession = {
      state: 'PICK',
      runningCost: mockSession.runningCost
    };
    mockSessionManager.restartSession.mockResolvedValue(newSession);

    await restartSessionHandler(req, res);

    expect(mockSessionManager.restartSession).toHaveBeenCalledWith('test-session', mockSession);
    expect(mockViewDataBuilder.getSessionViewData).toHaveBeenCalledWith(
      'test-session',
      newSession,
      "Session restarted. Let's begin again!",
      null
    );
    expect(res.render).toHaveBeenCalledWith('session', {
      sessionId: 'test-session',
      state: 'PICK',
      feedback: "Session restarted. Let's begin again!"
    });
  });

  test('should handle session manager errors gracefully', async () => {
    mockSessionManager.restartSession.mockRejectedValue(new Error('Restart failed'));

    await restartSessionHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Failed to restart session');
  });
});