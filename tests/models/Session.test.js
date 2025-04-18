const Session = require('../../models/Session');
const katas = require('../../models/katas');

describe('Session', () => {
  let session;
  let fizzBuzzKata;
  
  beforeEach(() => {
    fizzBuzzKata = katas.fizzbuzz;
    session = new Session(fizzBuzzKata);
  });

  test('should initialize with the kata information', () => {
    expect(session.getKataName()).toBe('FizzBuzz');
    expect(session.getProductionCode()).toBe(fizzBuzzKata.initialProductionCode);
    expect(session.getTestCode()).toBe(fizzBuzzKata.initialTestCode);
    expect(session.getState()).toBe('PICK');
    expect(session.getTestCases()).toHaveLength(fizzBuzzKata.testCases.length);
  });
  
  test('should update production code', () => {
    const newCode = 'function fizzBuzz(n) { return n; }';
    session.setProductionCode(newCode);
    expect(session.getProductionCode()).toBe(newCode);
  });
  
  test('should update test code', () => {
    const newCode = 'test("example", () => { expect(true).toBe(true); });';
    session.setTestCode(newCode);
    expect(session.getTestCode()).toBe(newCode);
  });
  
  test('should not allow direct modification of test cases', () => {
    const testCases = session.getTestCases();
    const originalLength = testCases.length;
    
    // Try to modify the returned array
    testCases.push({ id: 999, description: 'New test', status: 'TODO' });
    
    // Verify the internal state wasn't modified
    expect(session.getTestCases()).toHaveLength(originalLength);
  });
  
  test('should select a test case in PICK state', () => {
    // In PICK state initially
    expect(session.getState()).toBe('PICK');
    
    // Select first test case
    session.selectTestCase(0);
    expect(session.getCurrentTestIndex()).toBe(0);
    
    // Test case should be marked IN_PROGRESS
    expect(session.getTestCases()[0].status).toBe('IN_PROGRESS');
  });
  
  test('should not select a test case in non-PICK state', () => {
    // Advance to RED state
    session.selectTestIndex(0); // Set temporary selection
    const feedback = { proceed: 'yes' };
    session.processSubmission(feedback);
    session.advanceState();
    
    // Try to select a test case in RED state
    expect(() => {
      session.selectTestCase(1);
    }).toThrow();
  });
  
  test('should store code execution results', () => {
    const executionResults = {
      success: true,
      testResults: [{ 
        description: 'test 1', 
        success: true, 
        error: null 
      }],
      console: 'Test output'
    };
    
    session.setCodeExecutionResults(executionResults);
    expect(session.getCodeExecutionResults()).toEqual(executionResults);
  });
  
  test('should process LLM feedback and advance state when approved', () => {
    // Setup
    session.selectTestIndex(0);
    const feedback = { proceed: 'yes' };
    
    // Process feedback in PICK state
    const shouldAdvance = session.processSubmission(feedback);
    expect(shouldAdvance).toBe(true);
    
    // Advance state
    session.advanceState();
    expect(session.getState()).toBe('RED');
  });
  
  test('should not advance state when feedback does not approve', () => {
    // Setup
    session.selectTestIndex(0);
    const feedback = { proceed: 'no' };
    
    // Process feedback in PICK state
    const shouldAdvance = session.processSubmission(feedback);
    expect(shouldAdvance).toBe(false);
    
    // State should remain PICK
    expect(session.getState()).toBe('PICK');
  });
});
