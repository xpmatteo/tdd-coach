const LlmAdapterFactory = require('../services/adapters/LlmAdapterFactory');
const OpenRouterAdapter = require('../services/adapters/OpenRouterAdapter');
const MockAdapter = require('../services/adapters/MockAdapter');

// Mock the environment
const originalEnv = process.env;

// Mock the adapters
jest.mock('../services/adapters/OpenRouterAdapter');
jest.mock('../services/adapters/MockAdapter');

describe('LlmAdapterFactory', () => {
  beforeEach(() => {
    // Reset mocks first
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };
    // Ensure NODE_ENV is not 'test' unless explicitly set by a test
    delete process.env.NODE_ENV;
  });
  
  afterAll(() => {
    // Restore environment
    process.env = originalEnv;
  });

  test('createAdapter returns MockAdapter when forTesting is true', () => {
    // Set necessary env vars even though they won't be used for Mock
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.OPENROUTER_MODEL = 'test-model';

    const adapter = LlmAdapterFactory.createAdapter(true);
    
    expect(adapter).toBeDefined();
    expect(MockAdapter).toHaveBeenCalled();
    expect(OpenRouterAdapter).not.toHaveBeenCalled();
  });
  
  test('createAdapter returns MockAdapter when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    // Set necessary env vars even though they won't be used for Mock
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.OPENROUTER_MODEL = 'test-model';
    
    const adapter = LlmAdapterFactory.createAdapter();
    
    expect(adapter).toBeDefined();
    expect(MockAdapter).toHaveBeenCalled();
    expect(OpenRouterAdapter).not.toHaveBeenCalled();
    
    // Reset NODE_ENV for other tests
    delete process.env.NODE_ENV;
  });

  test('createAdapter returns OpenRouterAdapter in non-test environment', () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    
    const adapter = LlmAdapterFactory.createAdapter(false);
    
    expect(adapter).toBeDefined();
    expect(OpenRouterAdapter).toHaveBeenCalledWith('test-openrouter-key', 'anthropic/claude-3-7-sonnet');
    expect(MockAdapter).not.toHaveBeenCalled();
  });

  test('createAdapter throws error when no OpenRouter API key is provided', () => {
    delete process.env.NODE_ENV;
    delete process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_MODEL = 'anthropic/claude-3-7-sonnet';
    
    expect(() => LlmAdapterFactory.createAdapter(false)).toThrow('OPENROUTER_API_KEY environment variable is required');
  });

  test('createAdapter throws error when no OpenRouter model is provided', () => {
    delete process.env.NODE_ENV;
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    delete process.env.OPENROUTER_MODEL;
    
    expect(() => LlmAdapterFactory.createAdapter(false)).toThrow('OPENROUTER_MODEL environment variable is required');
  });
});
