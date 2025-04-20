const OpenRouterAdapter = require('../services/adapters/OpenRouterAdapter');

// Mock the OpenAI client
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            id: 'test-id',
            choices: [
              {
                message: {
                  content: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}'
                }
              }
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150
            }
          })
        }
      }
    };
  });
});

describe('OpenRouterAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('constructor throws error if API key is missing', () => {
    expect(() => new OpenRouterAdapter(null, 'test-model')).toThrow('OpenRouter API key is required');
  });

  test('constructor throws error if model name is missing', () => {
    expect(() => new OpenRouterAdapter('test-key', null)).toThrow('OpenRouter model name is required');
  });

  test('createMessage sends request with correct parameters', async () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    // Mock the create method
    const createMock = jest.fn().mockResolvedValue({
      id: 'test-id',
      choices: [{ message: { content: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
    });
    
    adapter.client.chat.completions.create = createMock;
    
    await adapter.createMessage({
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }],
      max_tokens: 500
    });
    
    // Check that the create method was called with the correct parameters
    // Updated to include usage.include=true
    expect(createMock).toHaveBeenCalledWith({
      model: 'test-model',
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User prompt' }
      ],
      usage: { include: true }
    });
  });

  test('transformResponse transforms OpenRouter response to Anthropic format', async () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    const openRouterResponse = {
      id: 'test-id',
      choices: [{ message: { content: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      cost: 0.00123
    };
    
    const transformedResponse = adapter.transformResponse(openRouterResponse);
    
    // Check that the response is transformed to Anthropic format with cost
    expect(transformedResponse).toEqual({
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        cost: 0.00123
      }
    });
  });

  test('createMessage returns a transformed response', async () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    const response = await adapter.createMessage({
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User prompt' }],
      max_tokens: 500
    });
    
    // Check the response is in Anthropic format
    // Updated to include cost field (defaults to 0 if not provided)
    expect(response).toEqual({
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        cost: 0 // Now expected to be included
      }
    });
  });
  
  test('createMessage throws error when required parameters are missing', async () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    // Mock the create method
    adapter.client.chat.completions.create = jest.fn();
    
    // Test for missing messages
    await expect(adapter.createMessage({
      system: 'Test system prompt'
    })).rejects.toThrow('Missing required parameters');
    
    // Test for missing system prompt
    await expect(adapter.createMessage({
      messages: [{ role: 'user', content: 'Test user prompt' }]
    })).rejects.toThrow('Missing required parameters');
    
    // Test for empty messages array
    await expect(adapter.createMessage({
      system: 'Test system prompt',
      messages: []
    })).rejects.toThrow('Missing required parameters');
  });

  test('transformResponse handles missing cost', () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    const openRouterResponse = {
      id: 'test-id',
      choices: [{ message: { content: 'Test content' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      // No cost field
    };
    
    const result = adapter.transformResponse(openRouterResponse);
    
    expect(result.usage.cost).toBe(0); // Should default to 0
  });
});
