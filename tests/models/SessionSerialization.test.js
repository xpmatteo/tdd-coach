const Session = require('../../models/Session');
const katas = require('../../models/katas');

describe('Session Serialization', () => {
  let session;
  let fizzbuzzKata;

  beforeEach(() => {
    fizzbuzzKata = katas['fizzbuzz'];
    session = new Session(fizzbuzzKata);
  });

  describe('toJSON', () => {
    it('should serialize all session data', () => {
      // Modify session to have some data
      session.productionCode = 'function fizzbuzz() { return "fizz"; }';
      session.testCode = 'test("fizzbuzz", () => { expect(fizzbuzz()).toBe("fizz"); });';
      session.selectedTestIndex = 1;
      session.setCodeExecutionResults({ success: true, testResults: [] });
      
      // Capture an LLM interaction
      session.captureLastLlmInteraction({
        state: 'pick',
        llmResponse: { comments: 'test comment', proceed: 'yes' }
      });

      const serialized = session.toJSON();

      expect(serialized).toHaveProperty('kataName', 'FizzBuzz');
      expect(serialized).toHaveProperty('testCases');
      expect(serialized).toHaveProperty('productionCode', 'function fizzbuzz() { return "fizz"; }');
      expect(serialized).toHaveProperty('testCode', 'test("fizzbuzz", () => { expect(fizzbuzz()).toBe("fizz"); });');
      expect(serialized).toHaveProperty('currentTestIndex', null);
      expect(serialized).toHaveProperty('selectedTestIndex', 1);
      expect(serialized).toHaveProperty('lastLlmInteraction');
      expect(serialized).toHaveProperty('currentState', 'PICK');
      expect(serialized).toHaveProperty('runningCost');
      expect(serialized).toHaveProperty('codeExecutionResults');

      // Verify nested objects are serialized
      expect(serialized.lastLlmInteraction).toHaveProperty('state', 'pick');
      expect(serialized.runningCost).toHaveProperty('callCount', 0);
      expect(serialized.codeExecutionResults).toHaveProperty('success', true);
    });

    it('should serialize empty session correctly', () => {
      const serialized = session.toJSON();

      expect(serialized.kataName).toBe('FizzBuzz');
      expect(serialized.currentState).toBe('PICK');
      expect(serialized.productionCode).toBe(fizzbuzzKata.initialProductionCode);
      expect(serialized.testCode).toBe(fizzbuzzKata.initialTestCode);
      expect(serialized.currentTestIndex).toBeNull();
      expect(serialized.selectedTestIndex).toBeNull();
      expect(serialized.lastLlmInteraction).toBeNull();
      expect(serialized.codeExecutionResults).toBeNull();
    });
  });

  describe('fromJSON', () => {
    it('should deserialize a complete session', () => {
      // Create a session with data
      const originalSession = new Session(fizzbuzzKata);
      originalSession.productionCode = 'function fizzbuzz() { return "fizz"; }';
      originalSession.testCode = 'test("fizzbuzz", () => { expect(fizzbuzz()).toBe("fizz"); });';
      originalSession.selectedTestIndex = 1;
      originalSession.setCodeExecutionResults({ success: true, testResults: [] });
      originalSession.captureLastLlmInteraction({
        state: 'pick',
        llmResponse: { comments: 'test comment', proceed: 'yes' }
      });

      // Serialize and deserialize
      const serialized = originalSession.toJSON();
      const deserializedSession = Session.fromJSON(serialized);

      // Verify all data is restored
      expect(deserializedSession.getKataName()).toBe('FizzBuzz');
      expect(deserializedSession.getProductionCode()).toBe('function fizzbuzz() { return "fizz"; }');
      expect(deserializedSession.getTestCode()).toBe('test("fizzbuzz", () => { expect(fizzbuzz()).toBe("fizz"); });');
      expect(deserializedSession.getSelectedTestIndex()).toBe(1);
      expect(deserializedSession.getState()).toBe('PICK');
      expect(deserializedSession.getCodeExecutionResults()).toEqual({ success: true, testResults: [] });
      expect(deserializedSession.getLastLlmInteraction()).toEqual({
        state: 'pick',
        llmResponse: { comments: 'test comment', proceed: 'yes' }
      });

      // Verify running cost is restored
      expect(deserializedSession.getRunningCost().callCount).toBe(0);
      expect(deserializedSession.getRunningCost().actualCost).toBe(0);
    });

    it('should restore different states correctly', () => {
      const testStates = ['PICK', 'RED', 'GREEN', 'REFACTOR', 'COMPLETE'];

      testStates.forEach(stateName => {
        const sessionData = {
          kataName: 'FizzBuzz',
          testCases: fizzbuzzKata.testCases,
          productionCode: '',
          testCode: '',
          currentTestIndex: null,
          selectedTestIndex: null,
          lastLlmInteraction: null,
          currentState: stateName,
          runningCost: { callCount: 0, actualCost: 0, provider: 'openrouter', model: 'test-model' },
          codeExecutionResults: null
        };

        const deserializedSession = Session.fromJSON(sessionData);
        expect(deserializedSession.getState()).toBe(stateName);
      });
    });

    it('should throw error for unknown kata', () => {
      const sessionData = {
        kataName: 'unknown-kata',
        testCases: [],
        productionCode: '',
        testCode: '',
        currentTestIndex: null,
        selectedTestIndex: null,
        lastLlmInteraction: null,
        currentState: 'pick',
        runningCost: { callCount: 0, actualCost: 0, provider: 'openrouter', model: 'test-model' },
        codeExecutionResults: null
      };

      expect(() => {
        Session.fromJSON(sessionData);
      }).toThrow('Kata not found: unknown-kata');
    });

    it('should throw error for unknown state', () => {
      const sessionData = {
        kataName: 'FizzBuzz',
        testCases: fizzbuzzKata.testCases,
        productionCode: '',
        testCode: '',
        currentTestIndex: null,
        selectedTestIndex: null,
        lastLlmInteraction: null,
        currentState: 'unknown-state',
        runningCost: { callCount: 0, actualCost: 0, provider: 'openrouter', model: 'test-model' },
        codeExecutionResults: null
      };

      expect(() => {
        Session.fromJSON(sessionData);
      }).toThrow('Unknown state: unknown-state');
    });
  });

  describe('round-trip serialization', () => {
    it('should maintain session integrity through serialize/deserialize cycle', () => {
      // Create a session with complex state
      const originalSession = new Session(fizzbuzzKata);
      originalSession.productionCode = 'function fizzbuzz(n) { return n % 3 === 0 ? "fizz" : n.toString(); }';
      originalSession.testCode = 'test("fizzbuzz returns fizz for 3", () => { expect(fizzbuzz(3)).toBe("fizz"); });';
      originalSession.selectedTestIndex = 2;
      originalSession.setCodeExecutionResults({
        success: false,
        error: 'Test failed',
        testResults: [{ name: 'test1', passed: false, error: 'Expected fizz but got 3' }],
        console: 'Running tests...'
      });
      
      originalSession.captureLastLlmInteraction({
        state: 'red',
        productionCode: originalSession.productionCode,
        testCode: originalSession.testCode,
        llmResponse: { 
          comments: 'Your test is failing because...', 
          hint: 'Try checking the modulo operation',
          proceed: 'no' 
        },
        mockModeEnabled: false
      });

      // Add some cost
      originalSession.runningCost.addCost(0.005);

      // Serialize and deserialize
      const serialized = originalSession.toJSON();
      const restoredSession = Session.fromJSON(serialized);

      // Verify everything matches
      expect(restoredSession.getKataName()).toBe(originalSession.getKataName());
      expect(restoredSession.getProductionCode()).toBe(originalSession.getProductionCode());
      expect(restoredSession.getTestCode()).toBe(originalSession.getTestCode());
      expect(restoredSession.getSelectedTestIndex()).toBe(originalSession.getSelectedTestIndex());
      expect(restoredSession.getState()).toBe(originalSession.getState());
      expect(restoredSession.getCodeExecutionResults()).toEqual(originalSession.getCodeExecutionResults());
      expect(restoredSession.getLastLlmInteraction()).toEqual(originalSession.getLastLlmInteraction());
      expect(restoredSession.getRunningCost().getTotalCost()).toBe(originalSession.getRunningCost().getTotalCost());
      expect(restoredSession.getRunningCost().callCount).toBe(originalSession.getRunningCost().callCount);
    });
  });
});