# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `make dev` - Start development server with hot reloading
- `make test` - Run the Jest test suite

### Testing
Tests use Jest framework. For focused testing, run individual test files:
- `npm test -- tests/services/llmService.test.js`
- `npm test -- --watch` for watch mode
- Always run all the tests with `make test` before declaring victory

## Project Architecture

### Core Concepts
This is a TDD (Test-Driven Development) coaching application that guides users through implementing coding katas with AI feedback. The application implements a state machine following the TDD cycle: PICK → RED → GREEN → REFACTOR → COMPLETE.

### Key Components

**Katas System (models/katas/)**
- Each kata definition is stored in its own file under models/katas/
- Each kata contains: name, description, initial code templates, and test cases
- Main katas.js file imports and exports all katas for easy access
- Supports multiple kata types (FizzBuzz, Leap Year, etc.)

**Handler Architecture (handlers/)**
- Express route handlers extracted using dependency injection pattern
- Each handler is created by a constructor function that accepts dependencies
- Handlers are pure functions that depend only on injected services
- Examples: newSessionHandler, getSessionHandler, submitCodeHandler

**Session Management (services/sessionManager.js)**
- Centralized session lifecycle management
- Handles session creation, retrieval, persistence, and storage
- Abstracts session operations from handlers
- Integrates with persistence service for session state saving

**View Data Builder (services/viewDataBuilder.js)**
- Responsible for preparing data for template rendering
- Centralizes view data preparation logic
- Builds session view data with feedback, costs, execution results

**Code Executor (services/codeExecutor.js)**
- Wrapper around code execution service
- Provides clean interface for handlers
- Executes user code server-side with fast custom Jest-like implementation

**Code Execution Service (services/codeExecutionService.js)**
- Fast custom Jest-like implementation with support for test.each() for tabular/parameterized tests
- Uses eval() in controlled environment for immediate feedback (local development only)
- Supports core Jest assertions and describe/test blocks
- Optimized for speed while maintaining compatibility with common Jest patterns

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
- **Dependency Injection**: Handler constructors accept dependencies for testability
- **Service Layer**: Business logic separated into focused service classes
- **Encapsulation**: Private fields in Session class

### Testing Strategy
- Jest for unit and integration tests
- Mock external services (LLM APIs) at adapter level
- Handlers tested with mocked service dependencies using dependency injection
- Each handler has comprehensive isolated tests covering all scenarios
- MockAdapter automatically used in test environment
- Test files organized by component type (handlers/, services/, models/)

### Environment Configuration
Requires `.env` file with:
- `OPENROUTER_API_KEY` - For LLM integration
- `OPENROUTER_MODEL` - Model selection (e.g., "anthropic/claude-3-7-sonnet")
- `PORT=3000` - Server port

### Architecture Evolution & Refactoring Approach

**Handler Extraction Pattern**
- Express route handlers should be extracted from controllers using dependency injection
- Use constructor functions that accept dependencies and return pure handler functions
- Each handler should be in its own file under handlers/ directory
- Dependencies are injected at application startup in app.js

**TDD Refactoring Process**
- Always write tests first when extracting functionality
- Extract one method at a time, ensuring tests pass after each extraction
- Update existing tests to remove references to moved functionality
- Maintain comprehensive test coverage throughout refactoring

**Service Layer Organization**
- Business logic should be separated into focused service classes
- Services should have single responsibilities (SessionManager, ViewDataBuilder, etc.)
- Services are injected into handlers, not imported directly
- Keep services stateless where possible

**Data Organization**
- Related data should be organized into directories (e.g., models/katas/)
- Each data file should contain a single concept or entity
- Use index files to aggregate exports from directories

### Current Limitations
- Session data is in-memory only (not persistent)
- Code execution limited to JavaScript with custom Jest-like syntax (supports test.each, core assertions)

When modifying this codebase, follow the established patterns and refer to docs/AI_RULES.md for detailed coding standards and conventions.