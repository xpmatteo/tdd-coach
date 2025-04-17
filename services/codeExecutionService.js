/**
 * Code Execution Service
 * 
 * This service provides functionality to execute user code and tests in a controlled environment.
 * It uses eval() which is generally unsafe, but acceptable for this MVP as it's only running locally.
 * 
 * WARNING: This should NEVER be used in a production environment or with untrusted code.
 */

/**
 * Execute test code against production code and return results
 * @param {string} productionCode - The production code to test
 * @param {string} testCode - The test code to execute
 * @param {number} timeout - Maximum execution time in milliseconds (default: 2000ms)
 * @returns {Object} Result of execution with test results and any errors
 */
function executeCode(productionCode, testCode, timeout = 2000) {
  // Store results
  const testResults = [];
  let consoleOutput = [];
  let currentTest = null;
  let success = true;
  let globalError = null;
  
  try {
    // Create a controlled execution environment
    const sandbox = createSandbox(testResults, consoleOutput);
    
    // Combine the code
    const combinedCode = `
      ${productionCode}
      
      ${testCode}
    `;
    
    // Execute with timeout protection
    executeWithTimeout(combinedCode, sandbox, timeout);
    
    // Overall success is false if any test failed
    success = testResults.every(test => test.success);
    
  } catch (error) {
    // Catch any syntax errors or other exceptions during execution
    success = false;
    globalError = `${error.name}: ${error.message}`;
    
    // If we were in the middle of a test when the error occurred, mark it as failed
    if (currentTest) {
      currentTest.success = false;
      currentTest.error = globalError;
    }
  }
  
  // Format the console output as a string
  const formattedConsole = consoleOutput.join('\n');
  
  return {
    success,
    testResults,
    error: globalError,
    console: formattedConsole
  };
}

/**
 * Create a sandbox environment for test execution
 * @param {Array} testResults - Array to collect test results
 * @param {Array} consoleOutput - Array to collect console output
 * @returns {Object} The sandbox with Jest-like globals
 */
function createSandbox(testResults, consoleOutput) {
  // Current test tracking
  let currentDescribe = [];
  let currentTest = null;
  
  // Create a sandbox environment with Jest-like globals
  const sandbox = {
    // Console mock
    console: {
      log: (...args) => {
        const output = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        consoleOutput.push(output);
      },
      warn: (...args) => {
        const output = `WARN: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`;
        consoleOutput.push(output);
      },
      error: (...args) => {
        const output = `ERROR: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`;
        consoleOutput.push(output);
      }
    },
    
    // Jest-like test functions
    describe: (description, fn) => {
      currentDescribe.push(description);
      try {
        fn();
      } finally {
        currentDescribe.pop();
      }
    },
    
    test: (description, fn) => {
      // Store full path for context but just use the test description in the result
      const fullDescription = [...currentDescribe, description].join(' > ');
      
      currentTest = {
        description: description,
        success: true,
        error: null
      };
      
      testResults.push(currentTest);
      
      try {
        fn();
      } catch (error) {
        currentTest.success = false;
        currentTest.error = `${error.name}: ${error.message}`;
      }
      
      currentTest = null;
    },
    
    expect: (actual) => {
      return {
        toBe: (expected) => {
          if (actual !== expected) {
            const error = new Error(`Expected: ${expected}\nReceived: ${actual}`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toEqual: (expected) => {
          const actualStr = JSON.stringify(actual);
          const expectedStr = JSON.stringify(expected);
          
          if (actualStr !== expectedStr) {
            const error = new Error(`Expected: ${expectedStr}\nReceived: ${actualStr}`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toBeTruthy: () => {
          if (!actual) {
            const error = new Error(`Expected ${actual} to be truthy`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toBeFalsy: () => {
          if (actual) {
            const error = new Error(`Expected ${actual} to be falsy`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toContain: (substring) => {
          if (typeof actual !== 'string' || !actual.includes(substring)) {
            const error = new Error(`Expected "${actual}" to contain "${substring}"`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toBeGreaterThan: (expected) => {
          if (actual <= expected) {
            const error = new Error(`Expected ${actual} to be greater than ${expected}`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        toBeLessThan: (expected) => {
          if (actual >= expected) {
            const error = new Error(`Expected ${actual} to be less than ${expected}`);
            error.name = 'AssertionError';
            throw error;
          }
        },
        
        not: {
          toBe: (expected) => {
            if (actual === expected) {
              const error = new Error(`Expected: not ${expected}\nReceived: ${actual}`);
              error.name = 'AssertionError';
              throw error;
            }
          },
          
          toEqual: (expected) => {
            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            
            if (actualStr === expectedStr) {
              const error = new Error(`Expected: not ${expectedStr}\nReceived: ${actualStr}`);
              error.name = 'AssertionError';
              throw error;
            }
          },
          
          toContain: (substring) => {
            if (typeof actual === 'string' && actual.includes(substring)) {
              const error = new Error(`Expected "${actual}" not to contain "${substring}"`);
              error.name = 'AssertionError';
              throw error;
            }
          }
        }
      };
    }
  };
  
  // Add alias for test
  sandbox.it = sandbox.test;
  
  return sandbox;
}

/**
 * Execute code with a timeout to prevent infinite loops
 * @param {string} code - The code to execute
 * @param {Object} sandbox - The sandbox environment
 * @param {number} timeout - Maximum execution time in milliseconds
 */
function executeWithTimeout(code, sandbox, timeout) {
  // Create the function to be executed with the sandbox as its context
  const wrappedCode = `
    with (this) {
      ${code}
    }
  `;
  
  // Create the function
  const fn = new Function(wrappedCode);
  
  // Use a timeout to prevent infinite loops
  let timeoutTriggered = false;
  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
    throw new Error('Execution timed out - possible infinite loop');
  }, timeout);
  
  try {
    // Execute the function with the sandbox as its context
    fn.call(sandbox);
    
    // If we've reached here and the timeout was triggered, something weird happened
    // (the setTimeout fired but execution continued)
    if (timeoutTriggered) {
      throw new Error('Execution continued after timeout');
    }
  } finally {
    // Clear the timeout
    clearTimeout(timeoutId);
  }
}

module.exports = {
  executeCode
};
