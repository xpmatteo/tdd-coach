const TokenUsage = require('../models/TokenUsage');

describe('TokenUsage', () => {
  let tokenUsage;

  beforeEach(() => {
    tokenUsage = new TokenUsage();
  });
  
  test('setProvider with no arguments defaults to Anthropic pricing', () => {
    tokenUsage.setProvider();
    expect(tokenUsage.provider).toBe('anthropic');
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.ANTHROPIC_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK);
  });
  
  test('setProvider with openrouter and Claude model uses Claude pricing', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('anthropic/claude-3-7-sonnet');
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK);
  });
  
  test('setProvider with openrouter and GPT-4 model uses GPT-4 pricing', () => {
    tokenUsage.setProvider('openrouter', 'openai/gpt-4o');
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('openai/gpt-4o');
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_GPT4_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_GPT4_PRICING.OUTPUT_COST_PER_MTOK);
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

  test('calculates estimated cost correctly for Anthropic', () => {
    tokenUsage.setProvider('anthropic');
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    expect(cost).toBe(18); // $3 for input + $15 for output
  });
  
  test('calculates estimated cost correctly for OpenRouter with Anthropic models', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    expect(cost).toBe(18); // $3 for input + $15 for output
  });
  
  test('calculates estimated cost correctly for OpenRouter with GPT-4 models', () => {
    tokenUsage.setProvider('openrouter', 'openai/gpt-4o');
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    expect(cost).toBe(40); // $10 for input + $30 for output
  });

  test('formats cost correctly', () => {
    tokenUsage.setProvider('anthropic');
    tokenUsage.addUsage(500_000, 100_000);
    expect(tokenUsage.getFormattedCost()).toBe('$3.0000');
  });

  test('provides detailed statistics', () => {
    tokenUsage.setProvider('anthropic');
    tokenUsage.addUsage(100_000, 20_000);
    const stats = tokenUsage.getStats();

    expect(stats.inputTokens).toBe(100_000);
    expect(stats.outputTokens).toBe(20_000);
    expect(stats.totalTokens).toBe(120_000);
    expect(stats.callCount).toBe(1);
    expect(stats.estimatedCost).toBeCloseTo(0.6); // $0.3 for input + $0.3 for output
    expect(stats.formattedCost).toBe('$0.6000');
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
