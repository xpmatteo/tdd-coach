const createGetSessionHandler = require('../../handlers/getSessionHandler');
const Session = require('../../models/Session');

// Mock Session
jest.mock('../../models/Session');

describe('getSessionHandler', () => {
  let mockSessionManager, mockViewDataBuilder, req, res, getSessionHandler, mockSession;

  beforeEach(() => {
    mockSession = {
      state: 'PICK',
      testCases: [],
      productionCode: '',
      testCode: ''
    };

    mockSessionManager = {
      findSession: jest.fn(),
      loadFromPersistence: jest.fn()
    };

    mockViewDataBuilder = {
      getSessionViewData: jest.fn().mockReturnValue({
        sessionId: 'test-session',
        state: 'PICK',
        feedback: 'Welcome!'
      })
    };

    req = {
      params: { id: 'test-session' }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn()
    };

    getSessionHandler = createGetSessionHandler(mockSessionManager, mockViewDataBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render session when found in memory', async () => {
    mockSessionManager.findSession.mockReturnValue(mockSession);

    await getSessionHandler(req, res);

    expect(mockSessionManager.findSession).toHaveBeenCalledWith('test-session');
    expect(mockViewDataBuilder.getSessionViewData).toHaveBeenCalledWith('test-session', mockSession);
    expect(res.render).toHaveBeenCalledWith('session', {
      sessionId: 'test-session',
      state: 'PICK',
      feedback: 'Welcome!'
    });
  });

  test('should load from persistence when not in memory', async () => {
    mockSessionManager.findSession.mockReturnValue(null);
    mockSessionManager.loadFromPersistence.mockResolvedValue(mockSession);

    await getSessionHandler(req, res);

    expect(mockSessionManager.findSession).toHaveBeenCalledWith('test-session');
    expect(mockSessionManager.loadFromPersistence).toHaveBeenCalledWith('test-session');
    expect(mockViewDataBuilder.getSessionViewData).toHaveBeenCalledWith('test-session', mockSession);
    expect(res.render).toHaveBeenCalledWith('session', {
      sessionId: 'test-session',
      state: 'PICK',
      feedback: 'Welcome!'
    });
  });

  test('should redirect to new session when session not found', async () => {
    mockSessionManager.findSession.mockReturnValue(null);
    mockSessionManager.loadFromPersistence.mockResolvedValue(null);

    await getSessionHandler(req, res);

    expect(mockSessionManager.findSession).toHaveBeenCalledWith('test-session');
    expect(mockSessionManager.loadFromPersistence).toHaveBeenCalledWith('test-session');
    expect(res.redirect).toHaveBeenCalledWith('/session/new');
    expect(res.render).not.toHaveBeenCalled();
  });

  test('should redirect to new session when persistence loading fails', async () => {
    mockSessionManager.findSession.mockReturnValue(null);
    mockSessionManager.loadFromPersistence.mockRejectedValue(new Error('Load failed'));

    await getSessionHandler(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/session/new');
    expect(res.render).not.toHaveBeenCalled();
  });
});