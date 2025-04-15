const { newSession, submitCode, getHint, restartSession, getSession } = require('../controllers/sessionController');
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
      },
      params: {}
    };
    
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  describe('newSession', () => {
    test('should create a new session and redirect to session page with UUID', () => {
      // Arrange & Act
      newSession(req, res);
      
      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/^\/session\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      );
    });
  });

  describe('getSession', () => {
    test('should render session with initial data and null proceed value', () => {
      // Arrange - Create a session first
      newSession(req, res);
      
      // Extract the UUID from the redirect URL
      const redirectUrl = res.redirect.mock.calls[0][0];
      const sessionId = redirectUrl.split('/').pop();
      
      // Set up request with session ID param
      req.params.id = sessionId;
      
      // Act
      getSession(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'session',
        expect.objectContaining({
          sessionId,
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
      const redirectUrl = res.redirect.mock.calls[0][0];
      const sessionId = redirectUrl.split('/').pop();
      
      // Update req for submitCode
      req.body.sessionId = sessionId;
      
      // Act
      await submitCode(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'session',
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
      const redirectUrl = res.redirect.mock.calls[0][0];
      const sessionId = redirectUrl.split('/').pop();
      
      // Update req for submitCode
      req.body.sessionId = sessionId;
      
      // Act
      await submitCode(req, res);
      
      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'session',
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
      const redirectUrl = res.redirect.mock.calls[0][0];
      const sessionId = redirectUrl.split('/').pop();
      
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
      const redirectUrl = res.redirect.mock.calls[0][0];
      const sessionId = redirectUrl.split('/').pop();
      
      // Update req for restartSession
      req.body = { sessionId };
      
      // Reset redirect mock to check only the restart call
      res.redirect.mockClear();
      
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
