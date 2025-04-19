const LlmAdapterFactory = require('../services/adapters/LlmAdapterFactory');
const AnthropicAdapter = require('../services/adapters/AnthropicAdapter');
const OpenRouterAdapter = require('../services/adapters/OpenRouterAdapter');

// Mock the environment
const originalEnv = process.env;

// Mock the adapters
jest.mock('../services/adapters/AnthropicAdapter');
jest.mock('../services/adapters/OpenRouterAdapter');

describe('LlmAdapterFactory', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Mock implementations
    AnthropicAdapter.mockImplementation(() => ({
      createMessage: jest.fn()
    }));
    
    OpenRouterAdapter.mockImplementation(() => ({
      createMessage: jest.fn()
    }));
  });
  
  afterAll(() => {
    // Restore environment
    process.env = originalEnv;
  });

  test('createAdapter returns AnthropicAdapter when LLM_PROVIDER is not set', () => {
    delete process.env.LLM_PROVIDER;
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    
    const adapter = LlmAdapterFactory.createAdapter();
    
    expect(adapter).toBeDefined();
    expect(AnthropicAdapter).toHaveBeenCalledWith('test-anthropic-key', expect.any(String));
    expect(OpenRouterAdapter).not.toHaveBeenCalled();
  });

  test('createAdapter returns AnthropicAdapter when LLM_PROVIDER is set to anthropic', () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    
    const adapter = LlmAdapterFactory.createAdapter();
    
    expect(adapter).toBeDefined();
    expect(AnthropicAdapter).toHaveBeenCalledWith('test-anthropic-key', expect.any(String));
    expect(OpenRouterAdapter).not.toHaveBeenCalled();
  });

  test('createAdapter returns OpenRouterAdapter when LLM_PROVIDER is set to openrouter', () => {
    process.env.LLM_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    
    const adapter = LlmAdapterFactory.createAdapter();
    
    expect(adapter).toBeDefined();
    expect(OpenRouterAdapter).toHaveBeenCalledWith('test-openrouter-key', 'anthropic/claude-3-7-sonnet');
    expect(AnthropicAdapter).not.toHaveBeenCalled();
  });

  test('createAdapter throws error when LLM_PROVIDER is openrouter but no API key is provided', () => {
    process.env.LLM_PROVIDER = 'openrouter';
    delete process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    
    expect(() => LlmAdapterFactory.createAdapter()).toThrow('OPENROUTER_API_KEY environment variable is required');
  });

  test('createAdapter throws error when LLM_PROVIDER is openrouter but no model is provided', () => {
    process.env.LLM_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    delete process.env.OPENROUTER_MODEL;
    
    expect(() => LlmAdapterFactory.createAdapter()).toThrow('OPENROUTER_MODEL environment variable is required');
  });

  test('createAdapter defaults to Anthropic when unknown provider is specified', () => {
    process.env.LLM_PROVIDER = 'unknown-provider';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    
    const adapter = LlmAdapterFactory.createAdapter();
    
    expect(adapter).toBeDefined();
    expect(AnthropicAdapter).toHaveBeenCalledWith('test-anthropic-key', expect.any(String));
    expect(OpenRouterAdapter).not.toHaveBeenCalled();
  });
});
