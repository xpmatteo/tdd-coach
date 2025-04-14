const TokenUsage = require('../models/TokenUsage');

describe('TokenUsage', () => {
  let tokenUsage;

  beforeEach(() => {
    tokenUsage = new TokenUsage();
  });

  test('starts with zero values', () => {
    expect(tokenUsage.inputTokens).toBe(0);
    expect(tokenUsage.outputTokens).toBe(0);
    expect(tokenUsage.callCount).toBe(0);
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

  test('calculates estimated cost correctly', () => {
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    expect(cost).toBe(18); // $3 for input + $15 for output
  });

  test('formats cost correctly', () => {
    tokenUsage.addUsage(500_000, 100_000);
    expect(tokenUsage.getFormattedCost()).toBe('$3.000000');
  });

  test('provides detailed statistics', () => {
    tokenUsage.addUsage(100_000, 20_000);
    const stats = tokenUsage.getStats();

    expect(stats.inputTokens).toBe(100_000);
    expect(stats.outputTokens).toBe(20_000);
    expect(stats.totalTokens).toBe(120_000);
    expect(stats.callCount).toBe(1);
    expect(stats.estimatedCost).toBeCloseTo(0.6); // $0.3 for input + $0.3 for output
    expect(stats.formattedCost).toBe('$0.600000');
    expect(stats.inputCost).toBeCloseTo(0.3);
    expect(stats.outputCost).toBeCloseTo(0.3);
  });

  test('resets all counters', () => {
    tokenUsage.addUsage(100, 200);
    tokenUsage.reset();

    expect(tokenUsage.inputTokens).toBe(0);
    expect(tokenUsage.outputTokens).toBe(0);
    expect(tokenUsage.callCount).toBe(0);
  });

  test('validates input', () => {
    expect(() => tokenUsage.addUsage('100', 50)).toThrow();
    expect(() => tokenUsage.addUsage(100, '50')).toThrow();
    expect(() => tokenUsage.addUsage(-10, 50)).toThrow();
    expect(() => tokenUsage.addUsage(100, -20)).toThrow();
  });

  test('returns this for method chaining', () => {
    const result = tokenUsage.addUsage(100, 50);
    expect(result).toBe(tokenUsage);

    const resetResult = tokenUsage.reset();
    expect(resetResult).toBe(tokenUsage);
  });
});
