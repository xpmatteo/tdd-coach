/**
 * Tests for Session previous version functionality
 * This tests that the TDD coach properly captures and provides
 * previous versions of code to the LLM for better context.
 */

const Session = require('../../models/Session');
const katas = require('../../models/katas');
const { getPrompts } = require('../../services/promptService');

describe('Session Previous Versions', () => {
  let session;

  beforeEach(() => {
    session = new Session(katas.fizzbuzz);
  });

  describe('Initial State', () => {
    test('should have empty previous versions when first created', () => {
      expect(session.getPreviousTestCode()).toBe('');
      expect(session.getPreviousProductionCode()).toBe('');
    });
  });

  describe('Version Capture on State Transitions', () => {
    test('should capture previous versions when transitioning out of PICK state', () => {
      // Select test case and advance to RED
      session.selectTestCase(0);
      session.advanceState();

      // Should have captured the initial code as previous versions
      expect(session.getPreviousTestCode()).toContain('sample test -- replace with your own');
      expect(session.getPreviousProductionCode()).toContain('Implement FizzBuzz here');
    });

    test('should capture test code when transitioning out of RED state', () => {
      // Setup: advance to RED state
      session.selectTestCase(0);
      session.advanceState();

      // Update test code
      const newTestCode = 'describe("FizzBuzz", () => { test("returns 1 for 1", () => { expect(fizzbuzz(1)).toBe("1"); }); });';
      session.setTestCode(newTestCode);

      // Advance to GREEN state
      session.advanceState();

      // Should have captured the updated test code
      expect(session.getPreviousTestCode()).toBe(newTestCode);
    });

    test('should capture production code when transitioning out of GREEN state', () => {
      // Setup: advance to GREEN state
      session.selectTestCase(0);
      session.advanceState();
      session.setTestCode('test code');
      session.advanceState();

      // Update production code
      const newProductionCode = 'function fizzbuzz(n) { return n.toString(); }';
      session.setProductionCode(newProductionCode);

      // Advance to REFACTOR state
      session.advanceState();

      // Should have captured the updated production code
      expect(session.getPreviousProductionCode()).toBe(newProductionCode);
    });
  });

  describe('Prompt Generation with Previous Versions', () => {
    test('should include previous versions in RED state prompts when available', () => {
      // Setup: advance to RED with previous versions
      session.selectTestCase(0);
      session.advanceState();

      const prompts = getPrompts(session);
      expect(prompts.user).toContain('Previous test code (for context):');
    });

    test('should include previous versions in GREEN state prompts when available', () => {
      // Setup: advance to GREEN with previous versions
      session.selectTestCase(0);
      session.advanceState();
      session.setTestCode('new test code');
      session.advanceState();

      const prompts = getPrompts(session);
      expect(prompts.user).toContain('Previous production code (for context):');
    });

    test('should include both previous versions in REFACTOR state prompts when available', () => {
      // Setup: advance to REFACTOR with previous versions
      session.selectTestCase(0);
      session.advanceState();
      session.setTestCode('new test code');
      session.advanceState();
      session.setProductionCode('new production code');
      session.advanceState();

      const prompts = getPrompts(session);
      expect(prompts.user).toContain('Previous test code (for context):');
      expect(prompts.user).toContain('Previous production code (for context):');
    });

    test('should not include previous version sections when no previous versions exist', () => {
      // Use a fresh session in PICK state (no previous versions)
      const prompts = getPrompts(session);
      expect(prompts.user).not.toContain('Previous test code (for context):');
      expect(prompts.user).not.toContain('Previous production code (for context):');
    });
  });

  describe('Serialization and Persistence', () => {
    test('should serialize previous versions to JSON', () => {
      // Setup session with previous versions
      session.selectTestCase(0);
      session.advanceState(); // PICK -> RED (captures initial versions)
      
      const originalTestCode = session.getTestCode();
      session.setTestCode('updated test');
      session.advanceState(); // RED -> GREEN (captures updated test)
      
      const originalProductionCode = session.getProductionCode();
      session.setProductionCode('updated production');

      const serialized = session.toJSON();
      
      expect(serialized).toHaveProperty('previousTestCode');
      expect(serialized).toHaveProperty('previousProductionCode');
      // Previous versions should be what was captured during the last transition
      expect(serialized.previousTestCode).toBe('updated test');
      expect(serialized.previousProductionCode).toBe(originalProductionCode);
    });

    test('should restore previous versions from JSON', () => {
      // Setup session with previous versions
      session.selectTestCase(0);
      session.advanceState();
      session.setTestCode('updated test');
      session.advanceState();
      session.setProductionCode('updated production');

      // Serialize and restore
      const serialized = session.toJSON();
      const restored = Session.fromJSON(serialized);

      expect(restored.getPreviousTestCode()).toBe(session.getPreviousTestCode());
      expect(restored.getPreviousProductionCode()).toBe(session.getPreviousProductionCode());
    });

    test('should handle missing previous version data in fromJSON gracefully', () => {
      // Create serialized data without previous versions (backward compatibility)
      const serialized = session.toJSON();
      delete serialized.previousTestCode;
      delete serialized.previousProductionCode;

      const restored = Session.fromJSON(serialized);
      
      expect(restored.getPreviousTestCode()).toBe('');
      expect(restored.getPreviousProductionCode()).toBe('');
    });
  });
});