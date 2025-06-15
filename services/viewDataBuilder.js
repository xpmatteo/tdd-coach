/**
 * View Data Builder - handles preparation of view data for templates
 */
class ViewDataBuilder {
  getSessionViewData(sessionId, session, feedback = null, proceed = null) {
    // Check if there's a previous LLM interaction
    const lastInteraction = session.getLastLlmInteraction();

    // Use last interaction feedback if available and no new feedback provided
    if (!feedback && lastInteraction && lastInteraction.llmResponse) {
      feedback = lastInteraction.llmResponse.comments;
      proceed = lastInteraction.llmResponse.proceed;
    }

    // Get code execution results if available
    const executionResults = session.getCodeExecutionResults();

    return {
      sessionId,
      state: session.state,
      stateDescription: session.getStateDescription(),
      testCases: session.testCases,
      productionCode: session.productionCode,
      testCode: session.testCode,
      feedback: feedback || session.feedback || "Welcome to the FizzBuzz kata! Let's get started with TDD.",
      selectedTestIndex: session.selectedTestIndex,
      proceed: proceed,
      runningCost: session.runningCost.getStats(),
      isProductionCodeEditorEnabled: session.state == 'GREEN' || session.state == 'REFACTOR',
      isTestCodeEditorEnabled: session.state == 'RED' || session.state == 'REFACTOR',
      mockModeEnabled: lastInteraction && lastInteraction.mockModeEnabled,
      // Include code execution results if available
      codeExecutionResults: executionResults,
      hasCodeExecutionResults: !!executionResults
    };
  }
}

module.exports = ViewDataBuilder;