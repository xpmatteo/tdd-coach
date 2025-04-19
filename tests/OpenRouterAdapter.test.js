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
    expect(createMock).toHaveBeenCalledWith({
      model: 'test-model',
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User prompt' }
      ]
    });
  });

  test('transformResponse transforms OpenRouter response to Anthropic format', async () => {
    const adapter = new OpenRouterAdapter('test-key', 'test-model');
    
    const openRouterResponse = {
      id: 'test-id',
      choices: [{ message: { content: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
    };
    
    const transformedResponse = adapter.transformResponse(openRouterResponse);
    
    // Check that the response is transformed to Anthropic format
    expect(transformedResponse).toEqual({
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
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
    expect(response).toEqual({
      id: 'test-id',
      content: [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
      }
    });
  });
});
