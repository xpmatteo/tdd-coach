# TDD Coach

A program that helps people practice Test-Driven Development through katas with AI coaching.

  <img src="./docs/tdd%20coach%203.png" alt="TDD Coach screenshot" width="600" style="padding-bottom: 2em;">

  <img src="./docs/tdd-coach%206.png" alt="TDD Coach screenshot" width="600">

## Description

The TDD Coach guides users through implementing coding katas using Test-Driven Development. It follows the TDD cycle:

1. **PICK**: Select a test case to implement
2. **RED**: Write a failing test
3. **GREEN**: Write the minimal code to make the test pass
4. **REFACTOR**: Improve the code while keeping tests passing

The application uses an LLM (Claude model from Anthropic) to provide personalized coaching feedback at each step of the process.

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your API key(s):
   ```
   # API Configurations
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here

   # LLM Provider Selection - Options: "anthropic" or "openrouter"
   LLM_PROVIDER=anthropic

   # OpenRouter Model Selection (only used when LLM_PROVIDER=openrouter)
   # Examples: "anthropic/claude-3-7-sonnet", "openai/gpt-4o", etc.
   OPENROUTER_MODEL=anthropic/claude-3-7-sonnet

   # Server Configuration
   PORT=3000
   ```
   
   You only need to set the API key(s) for the provider(s) you plan to use. By default, the application will use Anthropic's Claude.

## Usage

1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to http://localhost:3000
3. Follow the guided TDD process to implement the FizzBuzz kata

## Features

- Interactive UI with code editors
- Real-time AI coaching feedback with visual progress indicators
- Step-by-step TDD guidance with task-specific instructions for each state
- Hint system for when you get stuck
- Progress tracking for test cases
- Two-step test selection process (select → confirm)
- Dedicated coach feedback area with color-coded progress status (green for proceed, red for needs improvement)
- Token usage tracking and cost estimation for LLM interactions (displays in the UI)
- Persistent LLM feedback that's always preserved between page reloads
- Development mode toggle to skip LLM API calls and use fake positive responses
- Prompt Testing System for capturing, managing, and analyzing test cases for LLM prompts

## Technology Stack

- Node.js with Express for server-side logic
- HTMX for dynamic UI interactions without a separate frontend framework
- Handlebars for view and prompt templating
- CodeMirror for code editing
- AI coaching with either Anthropic Claude or any model available through OpenRouter

## Project Structure

See `DESIGN.md` for a detailed overview of the project structure and architecture.
See `AI_RULES.md` for coding standards and guidelines for AI coding assistants.

## Development

Run the development server with hot reloading:
```
npm run dev
```

Run tests:
```
npm test
```

### Testing

For testing, a MockAdapter is automatically used instead of real API calls to Anthropic or OpenRouter. This makes it possible to run tests without providing API keys.

## Prompt Testing System

The TDD Coach includes a comprehensive system for testing and improving the AI prompts. This feature helps capture real interactions, build a test suite, and analyze prompt performance over time.

### Enabling Prompt Testing Mode

1. Set `PROMPT_CAPTURE_MODE=true` in your `.env` file
2. Restart the application
3. Use the TDD Coach normally
4. After receiving feedback, click "Save as Prompt Test"

See [PROMPT_TESTING_SYSTEM.md](PROMPT_TESTING_SYSTEM.md) for detailed documentation.
