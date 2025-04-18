const Session = require('../../models/Session');
const { executeCode } = require('../../services/codeExecutionService');
const katas = require('../../models/katas');

describe('Session with Code Execution', () => {
  let session;

  beforeEach(() => {
    // Create a new session with the FizzBuzz kata
    const fizzbuzzKata = katas.fizzbuzz;
    session = new Session(fizzbuzzKata);
  });

  test('should execute code and store results', () => {
    // Set up some test and production code
    const productionCode = `
      function fizzBuzz(n) {
        if (n % 3 === 0 && n % 5 === 0) return "FizzBuzz";
        if (n % 3 === 0) return "Fizz";
        if (n % 5 === 0) return "Buzz";
        return String(n);
      }
    `;

    const testCode = `
      describe("FizzBuzz", () => {
        test("returns '1' for 1", () => {
          expect(fizzBuzz(1)).toBe("1");
        });
        
        test("returns 'Fizz' for 3", () => {
          expect(fizzBuzz(3)).toBe("Fizz");
        });
      });
    `;

    // Update the session code
    session.setProductionCode(productionCode);
    session.setTestCode(testCode);

    // Execute the code
    const executionResults = executeCode(productionCode, testCode);

    // Store the results in the session
    session.setCodeExecutionResults(executionResults);

    // Verify the results were stored correctly
    const storedResults = session.getCodeExecutionResults();
    expect(storedResults).toBeTruthy();
    expect(storedResults.success).toBe(true);
    expect(storedResults.testResults.length).toBe(2);
    expect(storedResults.testResults[0].success).toBe(true);
    expect(storedResults.testResults[1].success).toBe(true);
  });

  test('should detect failing tests', () => {
    // Set up some test and production code with a deliberate bug
    const productionCode = `
      function fizzBuzz(n) {
        if (n % 3 === 0 && n % 5 === 0) return "FizzBuzz";
        if (n % 3 === 0) return "Buzz"; // Bug: should be "Fizz"
        if (n % 5 === 0) return "Buzz";
        return String(n);
      }
    `;

    const testCode = `
      describe("FizzBuzz", () => {
        test("returns '1' for 1", () => {
          expect(fizzBuzz(1)).toBe("1");
        });
        
        test("returns 'Fizz' for 3", () => {
          expect(fizzBuzz(3)).toBe("Fizz");
        });
      });
    `;

    // Update the session code
    session.setProductionCode(productionCode);
    session.setTestCode(testCode);

    // Execute the code
    const executionResults = executeCode(productionCode, testCode);

    // Store the results in the session
    session.setCodeExecutionResults(executionResults);

    // Verify the results indicate a failing test
    const storedResults = session.getCodeExecutionResults();
    expect(storedResults.success).toBe(false);
    expect(storedResults.testResults[0].success).toBe(true); // First test passes
    expect(storedResults.testResults[1].success).toBe(false); // Second test fails
    expect(storedResults.testResults[1].error).toContain('Expected: Fizz');
    expect(storedResults.testResults[1].error).toContain('Received: Buzz');
  });

  test('should handle syntax errors', () => {
    // Set up some test and production code with a syntax error
    const productionCode = `
      function fizzBuzz(x y
    `;

    const testCode = `
      describe("FizzBuzz", () => {
        test("returns '1' for 1", () => {
          expect(fizzBuzz(1)).toBe("1")
        });
      });
    `;

    // Update the session code
    session.setProductionCode(productionCode);
    session.setTestCode(testCode);

    // Execute the code
    const executionResults = executeCode(productionCode, testCode);

    // Store the results in the session
    session.setCodeExecutionResults(executionResults);

    // Verify the results indicate a syntax error
    const storedResults = session.getCodeExecutionResults();
    expect(storedResults.success).toBe(false);
    expect(storedResults.error).toBeTruthy();
    expect(storedResults.error).toContain('SyntaxError');
  });
});
