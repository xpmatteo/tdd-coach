const { executeCode } = require('../../services/codeExecutionService');

describe('codeExecutionService', () => {
  describe('executeCode', () => {
    test('should return success result when test passes', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const testCode = `
        describe('add', () => {
          test('adds two numbers correctly', () => {
            expect(add(2, 3)).toBe(5);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(true);
      expect(result.testResults[0].description).toBe('adds two numbers correctly');
      expect(result.testResults[0].error).toBeNull();
    });

    test('should return failure result when test fails with assertion error', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a - b; // Intentional bug
        }
      `;

      const testCode = `
        describe('add', () => {
          test('adds two numbers correctly', () => {
            expect(add(2, 3)).toBe(5);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(false);
      expect(result.testResults[0].description).toBe('adds two numbers correctly');
      expect(result.testResults[0].error).toContain('Expected: 5');
      expect(result.testResults[0].error).toContain('Received: -1');
    });

    test('should return error when code has syntax error', () => {
      // Arrange
      const productionCode = `
        function add(a, b {  // Missing closing parenthesis
          return a + b;
        }
      `;

      const testCode = `
        describe('add', () => {
          test('adds two numbers correctly', () => {
            expect(add(2, 3)).toBe(5);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('SyntaxError');
    });

    test('should handle multiple tests', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a + b;
        }
        
        function subtract(a, b) {
          return a - b;
        }
      `;

      const testCode = `
        describe('math functions', () => {
          test('adds two numbers correctly', () => {
            expect(add(2, 3)).toBe(5);
          });
          
          test('subtracts two numbers correctly', () => {
            expect(subtract(5, 3)).toBe(2);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testResults.length).toBe(2);
      expect(result.testResults[0].success).toBe(true);
      expect(result.testResults[0].description).toBe('adds two numbers correctly');
      expect(result.testResults[1].success).toBe(true);
      expect(result.testResults[1].description).toBe('subtracts two numbers correctly');
    });

    test('should handle tests with runtime error', () => {
      // Arrange
      const productionCode = `
        function divide(a, b) {
          return a / b;
        }
      `;

      const testCode = `
        describe('divide', () => {
          test('divides two numbers correctly', () => {
            expect(divide(6, 0)).toBe(Infinity); // Will cause division by zero
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true); // In JS, division by zero returns Infinity, not an error
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(true);
    });

    test('should handle actual runtime errors in tests', () => {
      // Arrange
      const productionCode = `
        function process(obj) {
          return obj.value;
        }
      `;

      const testCode = `
        describe('process', () => {
          test('processes value correctly', () => {
            expect(process(null)).toBe(5); // Will throw TypeError
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(false);
      expect(result.testResults[0].error).toContain('TypeError');
    });

    test('should handle nested describe blocks', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const testCode = `
        describe('math', () => {
          describe('addition', () => {
            test('adds positive numbers', () => {
              expect(add(2, 3)).toBe(5);
            });
            
            test('adds negative numbers', () => {
              expect(add(-2, -3)).toBe(-5);
            });
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testResults.length).toBe(2);
      expect(result.testResults[0].description).toBe('adds positive numbers');
      expect(result.testResults[1].description).toBe('adds negative numbers');
      // We no longer include parent describe blocks in the description
    });

    test('should handle console.log output', () => {
      // Arrange
      const productionCode = `
        function logMessage() {
          console.log('Hello, World!');
          return true;
        }
      `;

      const testCode = `
        describe('logging', () => {
          test('logs a message', () => {
            expect(logMessage()).toBe(true);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.console).toContain('Hello, World!');
    });

    test('should handle multiple assertions in a single test', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const testCode = `
        describe('add', () => {
          test('works with different numbers', () => {
            expect(add(2, 3)).toBe(5);
            expect(add(-1, 1)).toBe(0);
            expect(add(0, 0)).toBe(0);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(true);
    });

    test('should stop execution after first failing assertion', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a - b; // Intentional bug
        }
      `;

      const testCode = `
        describe('add', () => {
          test('works with different numbers', () => {
            expect(add(2, 3)).toBe(5); // Will fail
            console.log('This should not be reached');
            expect(add(-1, 1)).toBe(0);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(false);
      expect(result.console).not.toContain('This should not be reached');
    });

    test('should handle only one test failing out of many', () => {
      // Arrange
      const productionCode = `
        function add(a, b) {
          return a + b;
        }
        
        function subtract(a, b) {
          return a + b; // Intentional bug
        }
      `;

      const testCode = `
        describe('math', () => {
          test('add works', () => {
            expect(add(2, 3)).toBe(5);
          });
          
          test('subtract works', () => {
            expect(subtract(5, 3)).toBe(2);
          });
          
          test('add works with zero', () => {
            expect(add(0, 0)).toBe(0);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.testResults.length).toBe(3);
      expect(result.testResults[0].success).toBe(true);
      expect(result.testResults[1].success).toBe(false);
      expect(result.testResults[2].success).toBe(true);
    });

    test('should handle special assertions like toEqual', () => {
      // Arrange
      const productionCode = `
        function createObject(name, age) {
          return { name, age };
        }
      `;

      const testCode = `
        describe('createObject', () => {
          test('creates object correctly', () => {
            expect(createObject('John', 30)).toEqual({ name: 'John', age: 30 });
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].success).toBe(true);
    });

    xtest('should protect against infinite loops with timeout', () => {
      // Arrange
      const productionCode = `
        function infiniteLoop() {
          while (true) {
            // This will never end
          }
        }
      `;

      const testCode = `
        describe('infiniteLoop', () => {
          test('should not hang', () => {
            infiniteLoop();
            expect(true).toBe(true);
          });
        });
      `;

      // Act
      const result = executeCode(productionCode, testCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
});
