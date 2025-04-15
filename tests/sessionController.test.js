const { newSession, submitCode, getHint, restartSession } = require('../controllers/sessionController');
const { getLlmFeedback } = require('../services/llmService');

// Mock dependencies
jest.mock('../services/llmService');
jest.mock('../services/promptService', () => ({
  getPrompt: jest.fn().mockReturnValue('mocked prompt')
}));

describe('SessionController', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      body: {
        sessionId: 'test-session-id',
        productionCode: 'test production code',
        testCode: 'test test code'
      }
    };
    
    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  describe('newSession', () => {
    test('should render session with initial data and null proceed value', () => {
      // Arrange & Act
      newSession(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'session',
        expect.objectContaining({
          state: 'PICK',
          feedback: expect.any(String),
          proceed: null // Should have null proceed value for initial session
        })
      );
    });
  });

  describe('submitCode', () => {
    test('should render session with proceed value from LLM feedback', async () => {
      // Arrange
      const mockFeedback = {
        comments: 'Test feedback',
        hint: 'Test hint',
        proceed: 'yes'
      };
      
      getLlmFeedback.mockResolvedValue(mockFeedback);
      
      // Create a new session first to have it in the controller's memory
      newSession(req, res);
      const sessionId = res.render.mock.calls[0][1].sessionId;
      
      // Update req for submitCode
      req.body.sessionId = sessionId;
      
      // Act
      await submitCode(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledTimes(2);
      expect(res.render.mock.calls[1][0]).toBe('session');
      expect(res.render.mock.calls[1][1]).toEqual(
        expect.objectContaining({
          feedback: 'Test feedback',
          proceed: 'yes' // Should have proceed value from LLM feedback
        })
      );
    });

    test('should render session with proceed value "no" when LLM suggests improvements', async () => {
      // Arrange
      const mockFeedback = {
        comments: 'You need to improve your test',
        hint: 'Try adding an assertion',
        proceed: 'no'
      };
      
      getLlmFeedback.mockResolvedValue(mockFeedback);
      
      // Create a new session first to have it in the controller's memory
      newSession(req, res);
      const sessionId = res.render.mock.calls[0][1].sessionId;
      
      // Update req for submitCode
      req.body.sessionId = sessionId;
      
      // Act
      await submitCode(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledTimes(2);
      expect(res.render.mock.calls[1][0]).toBe('session');
      expect(res.render.mock.calls[1][1]).toEqual(
        expect.objectContaining({
          feedback: 'You need to improve your test',
          proceed: 'no' // Should have proceed value from LLM feedback
        })
      );
    });
  });

  describe('getHint', () => {
    test('should return JSON with hint and proceed values', async () => {
      // Arrange
      const mockFeedback = {
        comments: 'Test feedback',
        hint: 'Test hint',
        proceed: 'yes'
      };
      
      getLlmFeedback.mockResolvedValue(mockFeedback);
      
      // Create a new session first to have it in the controller's memory
      newSession(req, res);
      const sessionId = res.render.mock.calls[0][1].sessionId;
      
      // Update req for getHint
      req.body = { sessionId };
      
      // Act
      await getHint(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith({
        hint: 'Test hint',
        proceed: 'yes' // Should include proceed value for styling hints
      });
    });
  });

  describe('restartSession', () => {
    test('should render session with null proceed value', () => {
      // Arrange - Create a session first
      newSession(req, res);
      const sessionId = res.render.mock.calls[0][1].sessionId;
      
      // Update req for restartSession
      req.body = { sessionId };
      
      // Reset render mock to check only the restart call
      res.render.mockClear();
      
      // Act
      restartSession(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'session',
        expect.objectContaining({
          feedback: expect.stringContaining('restart'),
          proceed: null // Should have null proceed value for restarted session
        })
      );
    });
  });
});
