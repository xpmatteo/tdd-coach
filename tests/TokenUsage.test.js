const TokenUsage = require('../models/TokenUsage');

describe('TokenUsage', () => {
  let tokenUsage;

  beforeEach(() => {
    // Mock environment variables if needed for tests
    // Use a default model
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    tokenUsage = new TokenUsage();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENROUTER_MODEL;
  });

  test('constructor defaults to OpenRouter provider and model from env', () => {
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('anthropic/claude-3-7-sonnet');
    // No pricing properties to check anymore
  });

  test('setProvider forces provider to openrouter and sets model', () => {
    tokenUsage.setProvider('some-ignored-provider', 'anthropic/claude-3-haiku'); // Provider arg is ignored
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('anthropic/claude-3-haiku');
    // No pricing properties to check anymore
  });

  test('starts with zero values', () => {
    expect(tokenUsage.inputTokens).toBe(0);
    expect(tokenUsage.outputTokens).toBe(0);
    expect(tokenUsage.callCount).toBe(0);
    expect(tokenUsage.actualCost).toBe(0);
  });

  test('adds token usage correctly', () => {
    tokenUsage.addUsage(100, 50);
    expect(tokenUsage.inputTokens).toBe(100);
    expect(tokenUsage.outputTokens).toBe(50);
    expect(tokenUsage.callCount).toBe(1);

    tokenUsage.addUsage(200, 150);
    expect(tokenUsage.inputTokens).toBe(300);
    expect(tokenUsage.outputTokens).toBe(200);
    expect(tokenUsage.callCount).toBe(2);
  });

  test('adds token usage with actual cost correctly', () => {
    tokenUsage.addUsage(100, 50, 0.00234);
    expect(tokenUsage.inputTokens).toBe(100);
    expect(tokenUsage.outputTokens).toBe(50);
    expect(tokenUsage.callCount).toBe(1);
    expect(tokenUsage.actualCost).toBe(0.00234);
    
    tokenUsage.addUsage(200, 150, 0.00345);
    expect(tokenUsage.inputTokens).toBe(300);
    expect(tokenUsage.outputTokens).toBe(200);
    expect(tokenUsage.callCount).toBe(2);
    expect(tokenUsage.actualCost).toBe(0.00579); // 0.00234 + 0.00345
  });

  test('getTotalCost returns accumulated actual cost', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet'); // Rates would calculate to $18
    tokenUsage.addUsage(1_000_000, 1_000_000, 17.5); // Provide actual cost
    const cost = tokenUsage.getTotalCost();
    expect(cost).toBe(17.5); // Uses actual cost instead of calculation

    tokenUsage.addUsage(100, 50, 0.1); // Add more cost
    expect(tokenUsage.getTotalCost()).toBe(17.6);

    tokenUsage.addUsage(200, 100); // Add usage without cost
    expect(tokenUsage.getTotalCost()).toBe(17.6); // Cost remains the same
  });

  test('formats cost correctly based on actual cost', () => {
    // Uses the model set in beforeEach ('anthropic/claude-3-7-sonnet')
    tokenUsage.addUsage(500_000, 100_000, 3.123456);
    // 0.5M * $3 (input) + 0.1M * $15 (output) = 1.5 + 1.5 = 3.0
    expect(tokenUsage.getFormattedCost()).toBe('$3.1235');
  });

  test('provides detailed statistics including total cost', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    tokenUsage.addUsage(100_000, 20_000, 0.5); // Actual cost provided
    const stats = tokenUsage.getStats();

    expect(stats.inputTokens).toBe(100_000);
    expect(stats.outputTokens).toBe(20_000);
    expect(stats.totalTokens).toBe(120_000);
    expect(stats.callCount).toBe(1);
    expect(stats.totalCost).toBe(0.5);
    expect(stats.formattedCost).toBe('$0.5000');
    // Ensure removed fields are not present
    expect(stats).not.toHaveProperty('estimatedCost');
    expect(stats).not.toHaveProperty('inputCost');
    expect(stats).not.toHaveProperty('outputCost');
    expect(stats).not.toHaveProperty('usingActualCost');
  });

  test('resets all counters including actual cost', () => {
    tokenUsage.addUsage(100, 200, 0.123);
    tokenUsage.reset();

    expect(tokenUsage.inputTokens).toBe(0);
    expect(tokenUsage.outputTokens).toBe(0);
    expect(tokenUsage.callCount).toBe(0);
    expect(tokenUsage.actualCost).toBe(0);
  });

  test('validates input', () => {
    expect(() => tokenUsage.addUsage('100', 50)).toThrow();
    expect(() => tokenUsage.addUsage(100, '50')).toThrow();
    expect(() => tokenUsage.addUsage(-10, 50)).toThrow();
    expect(() => tokenUsage.addUsage(100, -20)).toThrow();
    // Cost parameter is optional and can be null/undefined
    expect(() => tokenUsage.addUsage(100, 50, null)).not.toThrow();
    expect(() => tokenUsage.addUsage(100, 50, undefined)).not.toThrow();
    // But if provided, it must be a number
    expect(() => tokenUsage.addUsage(100, 50, '0.5')).toThrow();
    expect(() => tokenUsage.addUsage(100, 50, -0.1)).toThrow();
  });

  test('returns this for method chaining', () => {
    const result = tokenUsage.addUsage(100, 50);
    expect(result).toBe(tokenUsage);

    const resetResult = tokenUsage.reset();
    expect(resetResult).toBe(tokenUsage);
  });
});
