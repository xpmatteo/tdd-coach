const State = require('./State');

/**
 * Represents the GREEN state in the TDD cycle
 * In this state, the user writes the minimal code to make the test pass
 */
class GreenState extends State {
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() { 
    return 'GREEN'; 
  }
  
  /**
   * Get the next state in the TDD cycle
   * @returns {State} The next state object (REFACTOR)
   */
  getNextState() {
    const RefactorState = require('./RefactorState');
    return new RefactorState(this.session);
  }
  
  /**
   * Process LLM feedback for the GREEN state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    return feedback.proceed === 'yes';
  }
}

module.exports = GreenState;