const katas = require('../models/katas');

/**
 * Predefined TDD sessions for special use cases
 */
const RedState = require('./states/RedState');
const Session = require('./Session');
const TokenUsage = require('./TokenUsage');

/**
 * Create a predefined FizzBuzz session halfway through the kata
 * - Tests for 1, 2, and 3 are completed (DONE)
 * - Current test is for 5 (IN_PROGRESS)
 * - Current state is RED (writing a failing test for 5)
 *
 * @returns {Session} A Session object in the desired state
 */
function createFizzBuzzHalfwaySession() {
  // Create a new FizzBuzz session
  const session = new Session(katas['fizzbuzz']);

  // Set up production code for completed tests (1, 2, 3)
  session.productionCode = `function fizzBuzz(number) {
  if (number === 1) {
    return "1";
  }
  if (number === 2) {
    return "2";
  }
  if (number === 3) {
    return "Fizz";
  }
  // More to implement...
}`;

  // Set up test code for completed tests (1, 2, 3)
  session.testCode = `describe("FizzBuzz", () => {
  test("1 should return '1'", () => {
    expect(fizzBuzz(1)).toBe("1");
  });
  
  test("2 should return '2'", () => {
    expect(fizzBuzz(2)).toBe("2");
  });
  
  test("3 should return 'Fizz'", () => {
    expect(fizzBuzz(3)).toBe("Fizz");
  });
  
  // Add your test for 5 here
});`;

  // Mark test cases 1, 2, 3 as DONE
  session.testCases[0].status = 'DONE'; // Test for 1
  session.testCases[1].status = 'DONE'; // Test for 2
  session.testCases[2].status = 'DONE'; // Test for 3

  // Set test for 5 (index 4) as IN_PROGRESS
  session.testCases[4].status = 'IN_PROGRESS'; // Test for 5
  session.currentTestIndex = 4;

  // Set the current state to RED
  session.setCurrentState(new RedState(session));

  // Reset token usage
  session.tokenUsage = new TokenUsage();

  return session;
}

// Map of predefined sessions with speaking IDs
const sessions = {
  'fizzbuzz_halfway': createFizzBuzzHalfwaySession()
};

module.exports = {
  sessions,
};
