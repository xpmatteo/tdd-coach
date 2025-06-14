# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm start` - Start the server (production mode)
- `npm run dev` - Start development server with hot reloading
- `npm test` - Run the Jest test suite

### Testing
Tests use Jest framework. For focused testing, run individual test files:
- `npm test -- tests/services/llmService.test.js`
- `npm test -- --watch` for watch mode

## Project Architecture

### Core Concepts
This is a TDD (Test-Driven Development) coaching application that guides users through implementing coding katas with AI feedback. The application implements a state machine following the TDD cycle: PICK → RED → GREEN → REFACTOR → COMPLETE.

### Key Components

**Session Model (models/Session.js)**
- Implements the TDD state machine using the State pattern
- Uses private fields (#) for encapsulation with controlled access via getters/setters
- Tracks test cases, code, execution results, and running costs
- Manages transitions between TDD states

**State Pattern (models/states/)**
- Each TDD phase is implemented as a separate state class
- States handle their own validation logic and transitions
- All states extend the base State class with consistent interface

**LLM Integration (services/llmService.js)**
- Uses adapter pattern to support multiple LLM providers via OpenRouter
- Separates system prompts (instructions) from user prompts (content)
- Returns structured responses (comments, hint, proceed) as JSON
- Tracks actual API costs from OpenRouter responses

**Code Execution (services/codeExecutionService.js)**
- Executes user code server-side in controlled Node.js environment
- Provides Jest-like testing framework (describe/test/expect)
- Includes timeout protection and error handling
- Results are shown to users and included in LLM prompts

**Prompt System (prompts/)**
- Uses Handlebars templates for both UI and LLM prompts
- Separate system/ and user/ prompt directories for each TDD state
- System prompts contain coaching instructions, user prompts contain context

### Technology Stack
- Backend: Node.js with Express
- UI: HTMX for dynamic updates (no separate frontend framework)
- Templating: Handlebars for both UI and prompts
- Code Editing: CodeMirror integration
- AI: OpenRouter API supporting various models (Claude, GPT, etc.)

### Error Handling Pattern
- Services throw specific error types with .type property
- Controllers catch errors and return structured JSON responses
- 500 status codes with error payloads for user-facing actions
- All errors are logged server-side

### Key Design Patterns
- **State Machine**: TDD cycle management
- **Adapter Pattern**: LLM provider abstraction
- **Factory Pattern**: LLM adapter creation
- **Encapsulation**: Private fields in Session class

### Testing Strategy
- Jest for unit and integration tests
- Mock external services (LLM APIs) at adapter level
- Controllers tested with mocked service dependencies
- MockAdapter automatically used in test environment

### Environment Configuration
Requires `.env` file with:
- `OPENROUTER_API_KEY` - For LLM integration
- `OPENROUTER_MODEL` - Model selection (e.g., "anthropic/claude-3-7-sonnet")
- `PORT=3000` - Server port

### Current Limitations
- Only supports FizzBuzz kata
- Session data is in-memory only (not persistent)
- Code execution limited to JavaScript with Jest-like syntax

When modifying this codebase, follow the established patterns and refer to docs/AI_RULES.md for detailed coding standards and conventions.