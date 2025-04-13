const katas = require('./katas');

class Session {
  constructor(kataName) {
    const kata = katas[kataName];
    if (!kata) {
      throw new Error(`Kata ${kataName} not found`);
    }
    
    this.kataName = kataName;
    this.state = 'PICK'; // PICK, RED, GREEN, REFACTOR
    this.testCases = [...kata.testCases]; // Clone test cases
    this.productionCode = kata.initialProductionCode || '';
    this.testCode = kata.initialTestCode || '';
    this.currentTestIndex = null;
  }
  
  /**
   * Advances the state machine to the next state
   * PICK -> RED -> GREEN -> REFACTOR -> PICK
   */
  advanceState() {
    switch (this.state) {
      case 'PICK':
        this.state = 'RED';
        break;
      case 'RED':
        this.state = 'GREEN';
        break;
      case 'GREEN':
        this.state = 'REFACTOR';
        break;
      case 'REFACTOR':
        // Mark current test as done
        if (this.currentTestIndex !== null) {
          this.testCases[this.currentTestIndex].status = 'DONE';
          this.currentTestIndex = null;
        }
        
        // If there are still tests to do, go back to PICK
        if (this.testCases.some(test => test.status === 'TODO')) {
          this.state = 'PICK';
        } else {
          this.state = 'COMPLETE';
        }
        break;
      default:
        this.state = 'PICK';
    }
    
    return this.state;
  }
  
  /**
   * Selects a test case to work on
   * @param {number} index - Index of the test case to select
   */
  selectTestCase(index) {
    if (this.state !== 'PICK') {
      throw new Error('Can only select test case in PICK state');
    }
    
    if (index < 0 || index >= this.testCases.length) {
      throw new Error('Invalid test case index');
    }
    
    if (this.testCases[index].status !== 'TODO') {
      throw new Error('Test case already completed or in progress');
    }
    
    this.currentTestIndex = index;
    this.testCases[index].status = 'IN_PROGRESS';
  }
}

module.exports = Session;