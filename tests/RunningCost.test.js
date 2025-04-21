const RunningCost = require('../models/RunningCost');

describe('RunningCost', () => {
  let runningCost;

  beforeEach(() => {
    // Mock environment variables if needed for tests
    // Use a default model
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    runningCost = new RunningCost();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENROUTER_MODEL;
  });

  test('constructor defaults to OpenRouter provider and model from env', () => {
    expect(runningCost.provider).toBe('openrouter');
    expect(runningCost.model).toBe('anthropic/claude-3-7-sonnet');
    // No pricing properties to check anymore
  });

  test('setProvider forces provider to openrouter and sets model', () => {
    runningCost.setProvider('some-ignored-provider', 'anthropic/claude-3-haiku'); // Provider arg is ignored
    expect(runningCost.provider).toBe('openrouter');
    expect(runningCost.model).toBe('anthropic/claude-3-haiku');
    // No pricing properties to check anymore
  });

  test('starts with zero values', () => {
    expect(runningCost.callCount).toBe(0);
    expect(runningCost.actualCost).toBe(0);
  });

  test('addCost increments call count and accumulates cost', () => {
    runningCost.addCost(0.00234);
    expect(runningCost.callCount).toBe(1);
    expect(runningCost.actualCost).toBe(0.00234);

    runningCost.addCost(0.00345);
    expect(runningCost.callCount).toBe(2);
    expect(runningCost.actualCost).toBe(0.00579); // 0.00234 + 0.00345

    runningCost.addCost(); // Call without cost
    expect(runningCost.callCount).toBe(3);
    expect(runningCost.actualCost).toBe(0.00579); // Cost unchanged

    runningCost.addCost(null); // Call with null cost
    expect(runningCost.callCount).toBe(4);
    expect(runningCost.actualCost).toBe(0.00579); // Cost unchanged
  });

  test('getTotalCost returns accumulated actual cost', () => {
    runningCost.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    runningCost.addCost(17.5); // Provide actual cost
    const cost = runningCost.getTotalCost();
    expect(cost).toBe(17.5); // Uses actual cost instead of calculation

    runningCost.addCost(0.1); // Add more cost
    expect(runningCost.getTotalCost()).toBe(17.6);

    runningCost.addCost(); // Add usage without cost
    expect(runningCost.getTotalCost()).toBe(17.6); // Cost remains the same
  });

  test('formats cost correctly based on actual cost', () => {
    // Uses the model set in beforeEach ('anthropic/claude-3-7-sonnet')
    runningCost.addCost(3.123456);
    expect(runningCost.getFormattedCost()).toBe('$3.1235');
  });

  test('provides detailed statistics including total cost', () => {
    runningCost.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    runningCost.addCost(0.5); // Actual cost provided
    const stats = runningCost.getStats();

    expect(stats.callCount).toBe(1);
    expect(stats.totalCost).toBe(0.5);
    expect(stats.formattedCost).toBe('$0.5000');
    // Ensure removed fields are not present
    expect(stats).not.toHaveProperty('estimatedCost');
    expect(stats).not.toHaveProperty('inputCost');
    expect(stats).not.toHaveProperty('outputCost');
    expect(stats).not.toHaveProperty('usingActualCost');
    expect(stats).not.toHaveProperty('inputTokens');
    expect(stats).not.toHaveProperty('outputTokens');
    expect(stats).not.toHaveProperty('totalTokens');
  });

  test('resets all counters including actual cost', () => {
    runningCost.addCost(0.123);
    runningCost.reset();

    expect(runningCost.callCount).toBe(0);
    expect(runningCost.actualCost).toBe(0);
  });

  test('addCost validates cost input', () => {
    // Cost parameter is optional and can be null/undefined
    expect(() => runningCost.addCost(null)).not.toThrow();
    expect(() => runningCost.addCost(undefined)).not.toThrow();
    // But if provided, it must be a number
    expect(() => runningCost.addCost('0.5')).toThrow('Cost must be a number if provided');
    expect(() => runningCost.addCost(-0.1)).toThrow('Cost cannot be negative');
  });

  test('returns this for method chaining', () => {
    const result = runningCost.addCost(0.1);
    expect(result).toBe(runningCost);

    const resetResult = runningCost.reset();
    expect(resetResult).toBe(runningCost);
  });
});
