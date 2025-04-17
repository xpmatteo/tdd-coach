const Session = require('../../models/Session');
const PickState = require('../../models/states/PickState');
const TokenUsage = require('../../models/TokenUsage');

// Mock dependencies
jest.mock('../../models/TokenUsage');
jest.mock('../../models/states/PickState');
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
  let mockPickState;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup PickState mock implementation
    mockPickState = {
      getName: jest.fn().mockReturnValue('PickState'),
      onEnter: jest.fn(),
      onExit: jest.fn(),
      getNextState: jest.fn(),
      canSelectTestCase: jest.fn().mockReturnValue(true),
      processSubmission: jest.fn(),
      getDescription: jest.fn().mockReturnValue('Pick a test case')
    };
    
    PickState.mockImplementation(() => mockPickState);
  });
  
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
      expect(session.state).toBe('PickState');
      expect(TokenUsage).toHaveBeenCalledTimes(1);
      expect(PickState).toHaveBeenCalledWith(session);
    });
    
    test('should throw an error if kata is not found', () => {
      expect(() => new Session('nonExistentKata')).toThrow('Kata nonExistentKata not found');
    });
  });
  
  describe('state management', () => {
    let session;
    let mockNextState;
    
    beforeEach(() => {
      session = new Session('testKata');
      mockNextState = {
        getName: jest.fn().mockReturnValue('NextState'),
        onEnter: jest.fn(),
        onExit: jest.fn(),
        getNextState: jest.fn(),
        canSelectTestCase: jest.fn(),
        processSubmission: jest.fn(),
        getDescription: jest.fn()
      };
      mockPickState.getNextState.mockReturnValue(mockNextState);
    });
    
    test('should set current state correctly', () => {
      const newState = {
        getName: jest.fn().mockReturnValue('NewState'),
        onEnter: jest.fn(),
        onExit: jest.fn()
      };
      
      const result = session.setCurrentState(newState);
      
      expect(mockPickState.onExit).toHaveBeenCalledTimes(1);
      expect(newState.onEnter).toHaveBeenCalledTimes(1);
      expect(session.currentState).toBe(newState);
      expect(session.state).toBe('NewState');
      expect(result).toBe('NewState');
    });
    
    test('should advance to the next state', () => {
      const result = session.advanceState();
      
      expect(mockPickState.getNextState).toHaveBeenCalledTimes(1);
      expect(session.currentState).toBe(mockNextState);
      expect(result).toBe('NextState');
    });
    
    test('should get state description', () => {
      mockPickState.getDescription.mockReturnValue('Test description');
      
      const result = session.getStateDescription();
      
      expect(mockPickState.getDescription).toHaveBeenCalledTimes(1);
      expect(result).toBe('Test description');
    });
  });
  
  describe('test case selection', () => {
    let session;
    
    beforeEach(() => {
      session = new Session('testKata');
    });
    
    test('should check if test case selection is allowed', () => {
      mockPickState.canSelectTestCase.mockReturnValue(true);
      
      const result = session.canSelectTestCase();
      
      expect(mockPickState.canSelectTestCase).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });
    
    test('should select a test case successfully', () => {
      session.selectTestCase(0);
      
      expect(session.currentTestIndex).toBe(0);
      expect(session.testCases[0].status).toBe('IN_PROGRESS');
    });
    
    test('should throw an error when selecting test case in invalid state', () => {
      mockPickState.canSelectTestCase.mockReturnValue(false);
      
      expect(() => session.selectTestCase(0)).toThrow(`Cannot select test case in PickState state`);
    });
    
    test('should throw an error when selecting an invalid test case index', () => {
      expect(() => session.selectTestCase(-1)).toThrow('Invalid test case index');
      expect(() => session.selectTestCase(3)).toThrow('Invalid test case index');
    });
    
    test('should throw an error when selecting a test case not in TODO state', () => {
      expect(() => session.selectTestCase(2)).toThrow('Test case not in TODO state: DONE');
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
      mockPickState.processSubmission.mockReturnValue(true);
    });
    
    test('should process submission correctly', () => {
      const feedback = { result: 'success' };
      
      const result = session.processSubmission(feedback);
      
      expect(mockPickState.processSubmission).toHaveBeenCalledWith(feedback);
      expect(result).toBe(true);
    });
  });
});