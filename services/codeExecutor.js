const { executeCode } = require('./codeExecutionService');

/**
 * Code Executor - wraps the code execution service
 */
class CodeExecutor {
  executeCode(productionCode, testCode) {
    return executeCode(productionCode, testCode);
  }
}

module.exports = CodeExecutor;