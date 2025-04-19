const AnthropicAdapter = require('../services/adapters/AnthropicAdapter');

// Mock the Anthropic client
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          id: 'test-id',
          content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            total_tokens: 150
          }
        })
      }
    };
  });
});

describe('AnthropicAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('constructor throws error if API key is missing', () => {
    expect(() => new AnthropicAdapter(null)).toThrow('Anthropic API key is required');
  });

  test('constructor sets default model if not provided', () => {
    const adapter = new AnthropicAdapter('test-key');
    expect(adapter.modelName).toBe('claude-3-7-sonnet-latest');
  });

  test('constructor uses provided model if specified', () => {
    const adapter = new AnthropicAdapter('test-key', 'test-model');
    expect(adapter.modelName).toBe('test-model');
  });

  test('createMessage sends request with correct parameters', async () => {
    const adapter = new AnthropicAdapter('test-key', 'test-model');
    
    // Mock the create method
    const createMock = jest.fn().mockResolvedValue({
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
    });
    
    adapter.client.messages.create = createMock;
    
    await adapter.createMessage({
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }],
      max_tokens: 500
    });
    
    // Check that the create method was called with the correct parameters
    expect(createMock).toHaveBeenCalledWith({
      model: 'test-model',
      max_tokens: 500,
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }]
    });
  });

  test('createMessage returns the response directly', async () => {
    const adapter = new AnthropicAdapter('test-key', 'test-model');
    
    const mockResponse = {
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
    };
    
    adapter.client.messages.create = jest.fn().mockResolvedValue(mockResponse);
    
    const response = await adapter.createMessage({
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }],
      max_tokens: 500
    });
    
    // Check the response matches the mock
    expect(response).toEqual(mockResponse);
  });
});
