const Session = require('../../models/Session');
const PickState = require('../../models/states/PickState');
const TokenUsage = require('../../models/TokenUsage');

// Only mock the katas dependency
jest.mock('../../models/katas', () => ({
  testKata: {
    testCases: [
      { description: 'Test case 1', status: 'TODO' },
      { description: 'Test case 2', status: 'TODO' },
      { description: 'Test case 3', status: 'DONE' }
    ],
    initialProductionCode: 'function example() {}',
    initialTestCode: 'test("example", () => {});'
  }
}));

describe('Session', () => {
  describe('constructor', () => {
    test('should initialize with the correct kata data', () => {
      const session = new Session('testKata');
      
      expect(session.kataName).toBe('testKata');
      expect(session.testCases).toHaveLength(3);
      expect(session.productionCode).toBe('function example() {}');
      expect(session.testCode).toBe('test("example", () => {});');
      expect(session.currentTestIndex).toBeNull();
      expect(session.selectedTestIndex).toBeNull();
      expect(session.capturedInteraction).toBeNull();
      expect(session.lastLlmInteraction).toBeNull();
      expect(session.state).toBe('PICK'); // Real PickState returns 'PICK'
      expect(session.currentState).toBeInstanceOf(PickState);
      expect(session.tokenUsage).toBeInstanceOf(TokenUsage);
    });
    
    test('should throw an error if kata is not found', () => {
      expect(() => new Session('nonExistentKata')).toThrow('Kata nonExistentKata not found');
    });
  });
  
  describe('state management', () => {
    let session;
    
    beforeEach(() => {
      session = new Session('testKata');
    });
    
    test('should set current state correctly', () => {
      // Create a real state object with minimum necessary implementation
      class TestState {
        constructor(session) {
          this.session = session;
        }
        
        getName() { return 'TEST'; }
        onEnter() {}
        onExit() {}
      }
      
      // Create a spy to verify onExit is called on the previous state
      const origState = session.currentState;
      const exitSpy = jest.spyOn(origState, 'onExit');
      const enterSpy = jest.spyOn(TestState.prototype, 'onEnter');
      
      const newState = new TestState(session);
      const result = session.setCurrentState(newState);
      
      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(enterSpy).toHaveBeenCalledTimes(1);
      expect(session.currentState).toBe(newState);
      expect(session.state).toBe('TEST');
      expect(result).toBe('TEST');
      
      // Clean up
      exitSpy.mockRestore();
      enterSpy.mockRestore();
    });
    
    test('should advance to the next state', () => {
      // Create a spy to verify getNextState is called
      const getNextStateSpy = jest.spyOn(session.currentState, 'getNextState');
      
      // We need to implement a minimal next state that the real PickState would return
      class NextTestState {
        constructor(session) {
          this.session = session;
        }
        
        getName() { return 'NEXT_TEST'; }
        onEnter() {}
        onExit() {}
      }
      
      // Mock the implementation temporarily for this test
      getNextStateSpy.mockImplementation(() => new NextTestState(session));
      
      const result = session.advanceState();
      
      expect(getNextStateSpy).toHaveBeenCalledTimes(1);
      expect(session.state).toBe('NEXT_TEST');
      expect(result).toBe('NEXT_TEST');
      
      // Clean up
      getNextStateSpy.mockRestore();
    });
    
    test('should get state description', () => {
      const descriptionSpy = jest.spyOn(session.currentState, 'getDescription');
      const mockDescription = 'Test description';
      descriptionSpy.mockReturnValue(mockDescription);
      
      const result = session.getStateDescription();
      
      expect(descriptionSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockDescription);
      
      // Clean up
      descriptionSpy.mockRestore();
    });
  });
  
  describe('test case selection', () => {
    let session;
    
    beforeEach(() => {
      session = new Session('testKata');
    });
    
    test('should check if test case selection is allowed', () => {
      const canSelectSpy = jest.spyOn(session.currentState, 'canSelectTestCase');
      canSelectSpy.mockReturnValue(true);
      
      const result = session.canSelectTestCase();
      
      expect(canSelectSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      
      // Clean up
      canSelectSpy.mockRestore();
    });
    
    test('should select a test case successfully', () => {
      // Ensure the current state allows selection
      const canSelectSpy = jest.spyOn(session.currentState, 'canSelectTestCase');
      canSelectSpy.mockReturnValue(true);
      
      session.selectTestCase(0);
      
      expect(session.currentTestIndex).toBe(0);
      expect(session.testCases[0].status).toBe('IN_PROGRESS');
      
      // Clean up
      canSelectSpy.mockRestore();
    });
    
    test('should throw an error when selecting test case in invalid state', () => {
      const canSelectSpy = jest.spyOn(session.currentState, 'canSelectTestCase');
      canSelectSpy.mockReturnValue(false);
      
      expect(() => session.selectTestCase(0)).toThrow(`Cannot select test case in ${session.state} state`);
      
      // Clean up
      canSelectSpy.mockRestore();
    });
    
    test('should throw an error when selecting an invalid test case index', () => {
      // Ensure the current state allows selection
      const canSelectSpy = jest.spyOn(session.currentState, 'canSelectTestCase');
      canSelectSpy.mockReturnValue(true);
      
      expect(() => session.selectTestCase(-1)).toThrow('Invalid test case index');
      expect(() => session.selectTestCase(3)).toThrow('Invalid test case index');
      
      // Clean up
      canSelectSpy.mockRestore();
    });
    
    test('should throw an error when selecting a test case not in TODO state', () => {
      // Ensure the current state allows selection
      const canSelectSpy = jest.spyOn(session.currentState, 'canSelectTestCase');
      canSelectSpy.mockReturnValue(true);
      
      expect(() => session.selectTestCase(2)).toThrow('Test case not in TODO state: DONE');
      
      // Clean up
      canSelectSpy.mockRestore();
    });
  });
  
  describe('interaction capturing', () => {
    let session;
    let originalEnv;
    
    beforeEach(() => {
      originalEnv = process.env.PROMPT_CAPTURE_MODE;
      session = new Session('testKata');
    });
    
    afterEach(() => {
      process.env.PROMPT_CAPTURE_MODE = originalEnv;
    });
    
    test('should capture interaction when PROMPT_CAPTURE_MODE is true', () => {
      process.env.PROMPT_CAPTURE_MODE = 'true';
      const interactionData = { prompt: 'test prompt' };
      
      session.captureInteraction(interactionData);
      
      expect(session.capturedInteraction).toMatchObject({
        ...interactionData,
        timestamp: expect.any(String),
        id: expect.any(String)
      });
    });
    
    test('should not capture interaction when PROMPT_CAPTURE_MODE is not true', () => {
      process.env.PROMPT_CAPTURE_MODE = 'false';
      const interactionData = { prompt: 'test prompt' };
      
      session.captureInteraction(interactionData);
      
      expect(session.capturedInteraction).toBeNull();
    });
    
    test('should capture last LLM interaction', () => {
      const interactionData = { response: 'test response' };
      
      session.captureLastLlmInteraction(interactionData);
      
      expect(session.lastLlmInteraction).toEqual(interactionData);
    });
    
    test('should get last LLM interaction', () => {
      const interactionData = { response: 'test response' };
      session.lastLlmInteraction = interactionData;
      
      const result = session.getLastLlmInteraction();
      
      expect(result).toEqual(interactionData);
    });
    
    test('should get current capture', () => {
      const interactionData = { prompt: 'test prompt' };
      session.capturedInteraction = interactionData;
      
      const result = session.getCurrentCapture();
      
      expect(result).toEqual(interactionData);
    });
    
    test('should clear captured interaction', () => {
      session.capturedInteraction = { prompt: 'test prompt' };
      
      session.clearCapturedInteraction();
      
      expect(session.capturedInteraction).toBeNull();
    });
  });
  
  describe('LLM feedback processing', () => {
    let session;
    
    beforeEach(() => {
      session = new Session('testKata');
    });
    
    test('should process submission correctly', () => {
      const processSubmissionSpy = jest.spyOn(session.currentState, 'processSubmission');
      processSubmissionSpy.mockReturnValue(true);
      
      const feedback = { result: 'success' };
      const result = session.processSubmission(feedback);
      
      expect(processSubmissionSpy).toHaveBeenCalledWith(feedback);
      expect(result).toBe(true);
      
      // Clean up
      processSubmissionSpy.mockRestore();
    });
  });
});