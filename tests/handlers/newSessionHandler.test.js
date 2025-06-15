const createNewSessionHandler = require('../../handlers/newSessionHandler');

// Mock uuid
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-123' }));

describe('newSessionHandler', () => {
  let mockKatas, mockSessionManager, req, res, newSessionHandler;

  beforeEach(() => {
    mockKatas = {
      fizzbuzz: { name: 'FizzBuzz', description: 'FizzBuzz kata' },
      leapYear: { name: 'Leap Year', description: 'Leap year kata' }
    };

    mockSessionManager = {
      createSession: jest.fn().mockResolvedValue({})
    };

    req = {
      query: {}
    };

    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    newSessionHandler = createNewSessionHandler(mockKatas, mockSessionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create session with specified kata', async () => {
    req.query.kata = 'fizzbuzz';

    await newSessionHandler(req, res);

    expect(mockSessionManager.createSession).toHaveBeenCalledWith('mock-uuid-123', mockKatas.fizzbuzz);
    expect(res.redirect).toHaveBeenCalledWith('/session/mock-uuid-123');
  });

  test('should create session with leapYear kata', async () => {
    req.query.kata = 'leapYear';

    await newSessionHandler(req, res);

    expect(mockSessionManager.createSession).toHaveBeenCalledWith('mock-uuid-123', mockKatas.leapYear);
    expect(res.redirect).toHaveBeenCalledWith('/session/mock-uuid-123');
  });

  test('should default to fizzbuzz when no kata specified', async () => {
    // req.query is empty

    await newSessionHandler(req, res);

    expect(mockSessionManager.createSession).toHaveBeenCalledWith('mock-uuid-123', mockKatas.fizzbuzz);
    expect(res.redirect).toHaveBeenCalledWith('/session/mock-uuid-123');
  });

  test('should return 404 when kata not found', async () => {
    req.query.kata = 'nonexistent';

    await newSessionHandler(req, res);

    expect(mockSessionManager.createSession).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Kata not found');
  });
});