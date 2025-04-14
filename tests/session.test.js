const Session = require('../models/Session');
const katas = require('../models/katas');

describe('Session', () => {
  let session;

  beforeEach(() => {
    session = new Session('fizzbuzz');
  });

  test('test cases should be cloned from kata', () => {
    const originalTestCases = katas.fizzbuzz.testCases;
    session.testCases[0].status = 'DONE'; // Modify the cloned test case
    expect(session.testCases[0].status).toBe('DONE');
    expect(originalTestCases[0].status).toBe('TODO'); // Original should remain unchanged
  });

  test('should initialize with correct state', () => {
    expect(session.state).toBe('PICK');
    expect(session.kataName).toBe('fizzbuzz');
    expect(session.testCases.length).toBeGreaterThan(0);
    expect(session.currentTestIndex).toBeNull();
  });

  test('should advance state properly', () => {
    // PICK -> RED
    expect(session.state).toBe('PICK');
    session.advanceState();
    expect(session.state).toBe('RED');

    // RED -> GREEN
    session.advanceState();
    expect(session.state).toBe('GREEN');

    // GREEN -> REFACTOR
    session.advanceState();
    expect(session.state).toBe('REFACTOR');

    // REFACTOR -> PICK (if more tests remain)
    session.advanceState();
    expect(session.state).toBe('PICK');
  });

  test('should select a test case correctly', () => {
    session.selectTestCase(0);
    expect(session.currentTestIndex).toBe(0);
    expect(session.testCases[0].status).toBe('IN_PROGRESS');
  });

  test('should mark test case as done after REFACTOR', () => {
    session.selectTestCase(0);
    session.advanceState(); // PICK -> RED
    session.advanceState(); // RED -> GREEN
    session.advanceState(); // GREEN -> REFACTOR
    session.advanceState(); // REFACTOR -> PICK

    expect(session.testCases[0].status).toBe('DONE');
    expect(session.currentTestIndex).toBeNull();
  });

  test('should finish when all test cases are done', () => {
    // Mark all test cases as DONE
    for (let i = 0; i < session.testCases.length; i++) {
      session.selectTestCase(i);
      session.advanceState(); // PICK -> RED
      session.advanceState(); // RED -> GREEN
      session.advanceState(); // GREEN -> REFACTOR
      session.advanceState(); // REFACTOR -> PICK/COMPLETE
    }

    expect(session.state).toBe('COMPLETE');
  });

  test('should throw error when selecting test case in wrong state', () => {
    session.advanceState(); // PICK -> RED
    expect(() => {
      session.selectTestCase(1);
    }).toThrow();
  });

  test('should throw error when selecting invalid test case', () => {
    expect(() => {
      session.selectTestCase(-1);
    }).toThrow();

    expect(() => {
      session.selectTestCase(999);
    }).toThrow();
  });
});
