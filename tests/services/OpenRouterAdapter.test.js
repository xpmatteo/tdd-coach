const OpenRouterAdapter = require('../../services/adapters/OpenRouterAdapter');

// Mock OpenAI client
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            id: 'mock-id',
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
            },
            // This is what we're testing - OpenRouter returns actual cost
            cost: 0.00123
          })
        }
      }
    };
  });
});

describe('OpenRouterAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new OpenRouterAdapter('fake-api-key', 'anthropic/claude-3-7-sonnet');
  });

  test('constructor throws error when apiKey is missing', () => {
    expect(() => new OpenRouterAdapter()).toThrow('OpenRouter API key is required');
  });

  test('constructor throws error when modelName is missing', () => {
    expect(() => new OpenRouterAdapter('fake-api-key')).toThrow('OpenRouter model name is required');
  });

  test('createMessage sends correct parameters and includes usage.include=true', async () => {
    const result = await adapter.createMessage({
      system: 'System prompt',
      messages: [{ role: 'user', content: 'User message' }],
      max_tokens: 1000
    });

    // Check that client.chat.completions.create was called with correct args
    expect(adapter.client.chat.completions.create).toHaveBeenCalledWith({
      model: 'anthropic/claude-3-7-sonnet',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' }
      ],
      usage: { include: true }
    });

    // Check that response is properly transformed
    expect(result).toHaveProperty('id', 'mock-id');
    expect(result).toHaveProperty('content', [{ text: '{"comments":"Test comment","hint":"Test hint","proceed":"yes"}', type: 'text' }]);
    expect(result).toHaveProperty('usage.input_tokens', 100);
    expect(result).toHaveProperty('usage.output_tokens', 50);
    expect(result).toHaveProperty('usage.total_tokens', 150);
    
    // Check that the cost was extracted
    expect(result).toHaveProperty('usage.cost', 0.00123);
  });

  test('transformResponse properly formats OpenRouter response', () => {
    const openRouterResponse = {
      id: 'response-id',
      choices: [
        {
          message: {
            content: 'Test content'
          }
        }
      ],
      usage: {
        prompt_tokens: 200,
        completion_tokens: 100,
        total_tokens: 300
      },
      cost: 0.00456
    };

    const result = adapter.transformResponse(openRouterResponse);

    expect(result).toEqual({
      id: 'response-id',
      content: [{ text: 'Test content', type: 'text' }],
      usage: {
        input_tokens: 200,
        output_tokens: 100,
        total_tokens: 300,
        cost: 0.00456
      }
    });
  });

  test('transformResponse handles missing usage', () => {
    const openRouterResponse = {
      id: 'response-id',
      choices: [
        {
          message: {
            content: 'Test content'
          }
        }
      ]
    };

    const result = adapter.transformResponse(openRouterResponse);

    expect(result).toEqual({
      id: 'response-id',
      content: [{ text: 'Test content', type: 'text' }],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        cost: 0
      }
    });
  });
});
