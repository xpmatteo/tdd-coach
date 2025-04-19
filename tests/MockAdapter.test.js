const MockAdapter = require('../services/adapters/MockAdapter');

describe('MockAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  test('constructor initializes with mock model name', () => {
    expect(adapter.modelName).toBe('mock-model');
  });

  test('createMessage returns a properly structured mock response', async () => {
    const response = await adapter.createMessage({
      system: 'Test system prompt',
      messages: [{ role: 'user', content: 'Test user prompt' }],
      max_tokens: 100
    });

    // Verify response structure
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('usage');

    // Verify content structure
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('text');
    expect(response.content[0]).toHaveProperty('type');
    expect(response.content[0].type).toBe('text');

    // Verify content can be parsed as JSON
    const parsedContent = JSON.parse(response.content[0].text);
    expect(parsedContent.comments).toBe('Test comment');
    expect(parsedContent.hint).toBe('Test hint');
    expect(parsedContent.proceed).toBe('yes');

    // Verify usage structure
    expect(response.usage.input_tokens).toBe(100);
    expect(response.usage.output_tokens).toBe(50);
    expect(response.usage.total_tokens).toBe(150);
  });
  
  test('createMessage throws error when required parameters are missing', async () => {
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
});
