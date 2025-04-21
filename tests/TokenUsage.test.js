const TokenUsage = require('../models/TokenUsage');

describe('TokenUsage', () => {
  let tokenUsage;

  beforeEach(() => {
    // Mock environment variables if needed for tests
    // Use a known model for predictable pricing in tests
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
    // Check if pricing matches the default model (Claude)
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK);
  });

  test('setProvider forces provider to openrouter and sets model, updating pricing for Claude', () => {
    tokenUsage.setProvider('some-ignored-provider', 'anthropic/claude-3-haiku'); // Provider arg is ignored
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('anthropic/claude-3-haiku');
    // Check pricing is still Claude's
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_ANTHROPIC_PRICING.OUTPUT_COST_PER_MTOK);
  });

  test('setProvider forces provider to openrouter and sets model, updating pricing for GPT-4', () => {
    tokenUsage.setProvider('anthropic', 'openai/gpt-4o'); // Provider arg is ignored
    expect(tokenUsage.provider).toBe('openrouter');
    expect(tokenUsage.model).toBe('openai/gpt-4o');
    // Check pricing is now GPT-4's
    expect(tokenUsage.INPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_GPT4_PRICING.INPUT_COST_PER_MTOK);
    expect(tokenUsage.OUTPUT_COST_PER_MTOK).toBe(TokenUsage.OPENROUTER_GPT4_PRICING.OUTPUT_COST_PER_MTOK);
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

  test('calculates estimated cost correctly for OpenRouter with Anthropic models', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    // If no actual cost is provided, it should calculate based on rates
    expect(cost).toBe(18); // $3 for input + $15 for output = 18
  });
  
  test('calculates estimated cost correctly for OpenRouter with GPT-4 models', () => {
    tokenUsage.setProvider('openrouter', 'openai/gpt-4o');
    tokenUsage.addUsage(1_000_000, 1_000_000);
    const cost = tokenUsage.getEstimatedCost();
    // If no actual cost is provided, it should calculate based on rates
    expect(cost).toBe(40); // $10 for input + $30 for output = 40
  });

  test('returns actual cost when available, overriding calculation', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet'); // Rates would calculate to $18
    tokenUsage.addUsage(1_000_000, 1_000_000, 17.5); // Provide actual cost
    const cost = tokenUsage.getEstimatedCost();
    expect(cost).toBe(17.5); // Uses actual cost instead of calculation
  });

  test('formats cost correctly for default OpenRouter model (Claude)', () => {
    // Uses the model set in beforeEach ('anthropic/claude-3-7-sonnet')
    tokenUsage.addUsage(500_000, 100_000);
    // 0.5M * $3 (input) + 0.1M * $15 (output) = 1.5 + 1.5 = 3.0
    expect(tokenUsage.getFormattedCost()).toBe('$3.0000');
  });

  test('provides detailed statistics without actual cost', () => {
    tokenUsage.setProvider('openrouter', 'openai/gpt-4o'); // Use GPT-4 pricing
    tokenUsage.addUsage(100_000, 20_000); // No actual cost provided
    const stats = tokenUsage.getStats();

    expect(stats.inputTokens).toBe(100_000);
    expect(stats.outputTokens).toBe(20_000);
    expect(stats.totalTokens).toBe(120_000);
    expect(stats.callCount).toBe(1);
    // Estimated cost calculated based on GPT-4 rates
    // 0.1M * $10 (input) + 0.02M * $30 (output) = 1 + 0.6 = 1.6
    expect(stats.estimatedCost).toBeCloseTo(1.6);
    expect(stats.formattedCost).toBe('$1.6000');
    expect(stats.inputCost).toBeCloseTo(1.0);
    expect(stats.outputCost).toBeCloseTo(0.6);
    expect(stats.usingActualCost).toBe(false);
  });

  test('provides detailed statistics with actual cost', () => {
    tokenUsage.setProvider('openrouter', 'anthropic/claude-3-7-sonnet');
    tokenUsage.addUsage(100_000, 20_000, 0.5); // Actual cost provided
    const stats = tokenUsage.getStats();

    expect(stats.inputTokens).toBe(100_000);
    expect(stats.outputTokens).toBe(20_000);
    expect(stats.totalTokens).toBe(120_000);
    expect(stats.callCount).toBe(1);
    expect(stats.estimatedCost).toBe(0.5); // Uses the actual cost
    expect(stats.formattedCost).toBe('$0.5000');
    expect(stats.inputCost).toBeCloseTo(0.3); // Still calculated
    expect(stats.outputCost).toBeCloseTo(0.3); // Still calculated
    expect(stats.usingActualCost).toBe(true);
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
