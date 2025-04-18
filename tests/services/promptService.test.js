const { getPrompts } = require('../../services/promptService');
const Session = require('../../models/Session');
const katas = require('../../models/katas');
const State = require('../../models/states/State');

// Mock state for testing invalid state
class InvalidState extends State {
  getName() { return 'INVALID_STATE'; }
  getNextState() { return this; }
  getDescription() { return 'Invalid state'; }
}

describe('promptService', () => {
  test('getPrompts returns object with system and user prompts', () => {
    // Setup
    const fizzbuzzKata = katas['fizzbuzz'];
    const session = new Session(fizzbuzzKata);
    
    // Execute
    const result = getPrompts(session);
    
    // Verify
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });
  
  test('getPrompts throws error for invalid state', () => {
    // Setup
    const fizzbuzzKata = katas['fizzbuzz'];
    const session = new Session(fizzbuzzKata);
    
    // Create an invalid state and set it on the session
    const invalidState = new InvalidState(session);
    session.setCurrentState(invalidState);
    
    // Execute & Verify
    expect(() => {
      getPrompts(session);
    }).toThrow('No prompt templates for state: INVALID_STATE');
  });
  
  test('getPrompts includes kata name in system prompt', () => {
    // Setup
    const fizzbuzzKata = katas['fizzbuzz'];
    const session = new Session(fizzbuzzKata);
    
    // Execute
    const result = getPrompts(session);
    
    // Verify
    expect(result.system).toContain(fizzbuzzKata.name);
  });
});
