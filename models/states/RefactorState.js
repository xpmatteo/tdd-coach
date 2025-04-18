const State = require('./State');

/**
 * Represents the REFACTOR state in the TDD cycle
 * In this state, the user improves the code while keeping tests passing
 */
class RefactorState extends State {
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() {
    return 'REFACTOR';
  }

  /**
   * Get the next state in the TDD cycle
   * @returns {State} The next state object (PICK or COMPLETE)
   */
  getNextState() {
    this.session.markCurrentTestAsDone();

    // If there are still tests to do, go back to PICK
    if (this.session.testCases.some(test => test.status === 'TODO')) {
      const PickState = require('./PickState');
      return new PickState(this.session);
    } else {
      // Return a Complete state
      const CompleteState = require('./CompleteState');
      return new CompleteState(this.session);
    }
  }

  /**
   * Get the description of the task for this state
   * @returns {string} The task description
   */
  getDescription() {
    return "Your task: remove duplication, improve names";
  }

  /**
   * Process LLM feedback for the REFACTOR state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    return feedback.proceed === 'yes';
  }
}

module.exports = RefactorState;
