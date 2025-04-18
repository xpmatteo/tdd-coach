const sessionController = require('../../controllers/sessionController');
const Session = require('../../models/Session');
const llmService = require('../../services/llmService');
const codeExecutionService = require('../../services/codeExecutionService');

// Mock dependencies
jest.mock('../../services/llmService');
jest.mock('../../services/codeExecutionService');
jest.mock('../../models/Session');
jest.mock('uuid', () => ({ v4: () => 'test-session-id' }));

describe('Session Controller', () => {
  let req, res;
  let mockSession;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock request and response objects
    req = {
      params: { id: 'test-session-id' },
      body: {
        sessionId: 'test-session-id',
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("fizzbuzz", () => {});',
        selectedTestIndex: '0',
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Create mock session
    mockSession = {
      state: 'RED',
      getStateDescription: jest.fn().mockReturnValue('Write a failing test'),
      testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
      productionCode: '',
      testCode: '',
      selectedTestIndex: '0',  // Match req.body.selectedTestIndex type
      currentTestIndex: 0,
      tokenUsage: {
        getStats: jest.fn().mockReturnValue({ formattedCost: '$0.01' })
      },
      processSubmission: jest.fn().mockReturnValue(true),
      advanceState: jest.fn(),
      captureInteraction: jest.fn(),
      captureLastLlmInteraction: jest.fn(),
      getLastLlmInteraction: jest.fn().mockReturnValue(null),
      // Add methods for code execution results
      setCodeExecutionResults: jest.fn(),
      getCodeExecutionResults: jest.fn().mockReturnValue(null),
      // Add getter method for state
      getState: jest.fn().mockReturnValue('RED')
    };

    // Mocking sessions Map
    sessionController.sessions.set('test-session-id', mockSession);

    // Mock LLM service response
    llmService.getLlmFeedback.mockResolvedValue({
      comments: 'Great job!',
      hint: 'Try this...',
      proceed: 'yes'
    });
  });

  describe('submitCode', () => {
    beforeEach(() => {
      // Mock the code execution service
      codeExecutionService.executeCode.mockReturnValue({
        success: true,
        testResults: [
          { description: 'test case 1', success: true, error: null }
        ],
        console: 'Test execution log',
        error: null
      });
    });

    it('should execute code and store results when not in PICK state', async () => {
      // Arrange
      mockSession.state = 'RED';
      mockSession.getState.mockReturnValue('RED');

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      expect(codeExecutionService.executeCode).toHaveBeenCalledWith(
        req.body.productionCode,
        req.body.testCode
      );
      expect(mockSession.setCodeExecutionResults).toHaveBeenCalled();
    });

    it('should not execute code in PICK state', async () => {
      // Arrange
      mockSession.state = 'PICK';
      mockSession.getState.mockReturnValue('PICK');

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      expect(codeExecutionService.executeCode).not.toHaveBeenCalled();
      expect(mockSession.setCodeExecutionResults).not.toHaveBeenCalled();
    });

    it('should include code execution results in interaction data', async () => {
      // Arrange
      const executionResults = {
        success: true,
        testResults: [{ description: 'test case 1', success: true, error: null }],
        console: 'Test execution log',
        error: null
      };
      mockSession.getCodeExecutionResults.mockReturnValue(executionResults);

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      expect(mockSession.captureLastLlmInteraction).toHaveBeenCalledWith(
        expect.objectContaining({
          codeExecutionResults: executionResults
        })
      );
    });

    it('should handle code execution errors gracefully', async () => {
      // Arrange
      codeExecutionService.executeCode.mockImplementation(() => {
        throw new Error('Execution error');
      });

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      expect(mockSession.setCodeExecutionResults).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Execution error')
        })
      );
    });

    xit('should store last LLM interaction and use it for view rendering', async () => {
      // Arrange
      const llmResponse = {
        comments: 'Good test!',
        hint: 'Consider testing edge cases',
        proceed: 'yes'
      };
      llmService.getLlmFeedback.mockResolvedValue(llmResponse);

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      // Check that the view was rendered with the right data
      expect(res.render).toHaveBeenCalledWith('session', {
        sessionId: 'test-session-id',
        state: 'RED',
        stateDescription: 'Write a failing test',
        testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("fizzbuzz", () => {});',
        feedback: 'Good test!',
        selectedTestIndex: '0',
        proceed: 'yes',
        tokenUsage: { formattedCost: '$0.01' },
        isPromptCaptureModeEnabled: expect.any(Boolean),
        isProductionCodeEditorEnabled: false,
        isTestCodeEditorEnabled: true,
        mockModeEnabled: false,
      });
    });

    xit('does not call LLM when mockMode is on', async () => {
      // Arrange
      req.body.mockMode = 'on';

      // Act
      await sessionController.submitCode(req, res);

      // Assert
      // Check that the session was processed without calling LLM
      expect(llmService.getLlmFeedback).not.toHaveBeenCalled();
      // Check that the view was rendered with the right data
      expect(res.render).toHaveBeenCalledWith('session', {
        sessionId: 'test-session-id',
        state: 'GREEN',
        stateDescription: 'Write a failing test',
        testCases: [{ description: 'Test 1', status: 'IN_PROGRESS' }],
        productionCode: 'function fizzbuzz() {}',
        testCode: 'test("fizzbuzz", () => {});',
        feedback: 'Mock mode is enabled. Automatically approving your RED state submission.',
        selectedTestIndex: '0',
        proceed: 'yes',
        tokenUsage: { formattedCost: '$0.01' },
        isPromptCaptureModeEnabled: expect.any(Boolean),
        isProductionCodeEditorEnabled: false,
        isTestCodeEditorEnabled: true,
        mockModeEnabled: false,
      });
    });

  });

  describe('getSession', () => {
    it('should use last LLM interaction for feedback if available', async () => {
      // Arrange
      const lastInteraction = {
        llmResponse: {
          comments: 'Previously stored feedback',
          proceed: 'no'
        }
      };
      mockSession.getLastLlmInteraction.mockReturnValue(lastInteraction);

      // Act
      await sessionController.getSession(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('session',
        expect.objectContaining({
          feedback: 'Previously stored feedback',
          proceed: 'no'
        })
      );
    });

    it('should use default welcome message when no previous LLM interaction exists', async () => {
      // Arrange
      mockSession.getLastLlmInteraction.mockReturnValue(null);

      // Act
      await sessionController.getSession(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('session',
        expect.objectContaining({
          feedback: expect.stringContaining('Welcome to the FizzBuzz kata'),
          proceed: null
        })
      );
    });

    it('should include code execution results in the view data if available', async () => {
      // Arrange
      const executionResults = {
        success: true,
        testResults: [{ description: 'test case 1', success: true }],
        console: 'Test output'
      };
      mockSession.getCodeExecutionResults.mockReturnValue(executionResults);

      // Act
      await sessionController.getSession(req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith('session',
        expect.objectContaining({
          codeExecutionResults: executionResults,
          hasCodeExecutionResults: true
        })
      );
    });

    [
      {state: 'PICK', isProductionCodeEditorEnabled: false, isTestCodeEditorEnabled: false},
      {state: 'RED', isProductionCodeEditorEnabled: false, isTestCodeEditorEnabled: true},
      {state: 'GREEN', isProductionCodeEditorEnabled: true, isTestCodeEditorEnabled: false},
      {state: 'REFACTOR', isProductionCodeEditorEnabled: true, isTestCodeEditorEnabled: true},
    ].forEach(({state, isProductionCodeEditorEnabled, isTestCodeEditorEnabled}) => {
      it(`enables appropriate editors in state ${state}`, async () => {
        // Arrange
        mockSession.state = state;

        // Act
        await sessionController.getSession(req, res);

        // Assert
        expect(res.render).toHaveBeenCalledWith('session',
            expect.objectContaining({
              isProductionCodeEditorEnabled,
              isTestCodeEditorEnabled,
            })
        );
      });
    });
  });
});
