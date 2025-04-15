const State = require('./State');

/**
 * Represents the RED state in the TDD cycle
 * In this state, the user writes a failing test
 */
class RedState extends State {
  /**
   * Get the name of the state
   * @returns {string} The state name
   */
  getName() { 
    return 'RED'; 
  }
  
  /**
   * Get the next state in the TDD cycle
   * @returns {State} The next state object (GREEN)
   */
  getNextState() {
    const GreenState = require('./GreenState');
    return new GreenState(this.session);
  }
  
  /**
   * Get the description of the task for this state
   * @returns {string} The task description
   */
  getDescription() {
    return "Your task: write one failing test";
  }
  
  /**
   * Process LLM feedback for the RED state
   * @param {Object} feedback - The feedback from the LLM
   * @returns {boolean} Whether to advance to the next state
   */
  processSubmission(feedback) {
    return feedback.proceed === 'yes';
  }
}

module.exports = RedState;