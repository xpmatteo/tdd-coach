# TDD Coach - Design Document

## Overview

TDD Coach is an educational application designed to help users learn Test-Driven Development through guided kata exercises. The application provides real-time feedback from an AI coach (using the Anthropic Claude API) to guide users through the TDD cycle.

## Core Features

1. **TDD State Machine**: Guides users through the PICK → RED → GREEN → REFACTOR cycle
2. **Test Case Management**: Tracks progress through test cases for a kata
3. **AI Coaching**: Provides contextual feedback and hints based on user's code
4. **Code Editing**: Integrated editors for writing test and production code
5. **Code Execution**: Runs tests in-browser to verify they pass or fail as expected

## Technology Stack

- **Backend**: Node.js with Express
- **Templating**: Handlebars for both UI and LLM prompts
- **UI Enhancements**: HTMX for dynamic updates without a separate frontend framework
- **Code Editors**: CodeMirror for in-browser code editing
- **AI Integration**: Anthropic Claude API or OpenRouter API for coaching feedback
- **Code Execution**: Server-side JavaScript execution environment for test validation

## System Architecture

### 1. Session Management

The core of the application is the Session model, which implements a state machine following the TDD cycle:

- **PICK**: User selects a test case to implement
- **RED**: User writes a failing test
- **GREEN**: User writes minimal code to make the test pass
- **REFACTOR**: User improves code quality while keeping tests passing
- **COMPLETE**: Represents the final state when all tests are completed

The session tracks:
- Current state (implemented using the State pattern)
- Test cases and their status (TODO, IN_PROGRESS, DONE)
- Production and test code
- The currently selected test case
- The temporarily selected test case (when in PICK state before confirmation)
- Token usage for LLM interactions with cost estimation
- Code execution results for validating test and implementation behavior

The Session class uses proper encapsulation with private fields (using JavaScript's # syntax) and provides getters/setters for controlled access to its internal state.

The PICK state implements a two-step selection process:
1. User selects a test case (which is stored but not yet marked as IN_PROGRESS)
2. LLM evaluates if the selection is appropriate
3. If approved, the test case is marked as IN_PROGRESS and the state advances to RED

### 2. Code Execution

The Code Execution service:
- Executes user code on the server using a controlled Node.js environment
- Provides a JavaScript testing framework with Jest-like syntax (describe/test/expect)
- Captures test results (pass/fail status and error messages)
- Captures console output from executed code
- Implements security measures like timeout protection for infinite loops
- Returns structured results that can be displayed to users and included in LLM prompts

The code execution results enhance both the user and LLM feedback:
- Users can see if their tests actually pass or fail as expected
- The LLM receives concrete information about test execution rather than just reading the code
- Syntax errors and runtime errors are detected and displayed

### 3. State Pattern Implementation

The application uses the State design pattern to manage the TDD cycle states:

- **Base State Class**: Defines common interface for all states
  - `getName()`: Returns the name of the state
  - `onEnter()`: Actions to perform when entering the state
  - `onExit()`: Actions to perform when exiting the state
  - `getNextState()`: Returns the next state in the TDD cycle
  - `canSelectTestCase()`: Whether this state allows test case selection
  - `getDescription()`: Returns task-specific guidance for the current state
  - `processSubmission()`: Processes LLM feedback for state-specific actions

- **Concrete State Classes**:
  - `PickState`: Handles test case selection
  - `RedState`: Manages test writing phase
  - `GreenState`: Handles implementation phase
  - `RefactorState`: Manages code improvement phase
  - `CompleteState`: Final state when all tests are done

This pattern:
- Encapsulates state-specific behavior in dedicated classes
- Simplifies state transitions
- Makes the code more maintainable and extensible
- Eliminates complex switch statements
- Makes adding new states easier

### 4. Prompt Templates

The application uses Handlebars templates to generate prompts for the LLM, with different templates for each state in the TDD cycle:

#### System Prompts
Each state has a dedicated system prompt template that defines:
- The coaching persona (Kent Beck)
- State-specific evaluation criteria
- Response format requirements
- Guidelines for feedback style

System prompts are located in `/prompts/system/`:
- `pick.hbs`: Instructions for evaluating test case selection
- `red.hbs`: Instructions for evaluating failing tests
- `green.hbs`: Instructions for evaluating implementations
- `refactor.hbs`: Instructions for evaluating code improvements

#### User Prompts
Each state also has a dedicated user prompt template that provides:
- Current test case list and status
- Production and test code
- Selected or in-progress test case
- Code execution results (when applicable)

User prompts are located in `/prompts/user/`:
- `pick.hbs`: Context for test case selection
- `red.hbs`: Context for test writing phase
- `green.hbs`: Context for implementation phase
- `refactor.hbs`: Context for code refactoring phase

This separation leverages Claude's system/user message design, with system prompts providing persistent instructions and user prompts containing the content to evaluate.

### 5. LLM Integration

The LLM service:
- Uses an adapter pattern to support multiple LLM providers (Anthropic Claude and OpenRouter)
- Sends formatted prompts to the selected LLM API using system and user messages
- Requests responses in JSON format
- Extracts feedback comments, hints, and a binary proceed/don't proceed signal
- Tracks token usage and calculates estimated costs based on the provider and model being used
- Always stores the last LLM interaction in the session for consistent feedback rendering
- Supports a mock mode toggle that skips API calls and provides fake positive responses for testing and development
- Separates test capture functionality from regular LLM interaction tracking

#### LLM Adapter Architecture

The LLM service uses the Adapter pattern and Factory pattern to support multiple LLM providers:

- **LlmAdapterFactory**: Creates the appropriate adapter based on environment configuration
- **AnthropicAdapter**: Adapter for Anthropic Claude API
- **OpenRouterAdapter**: Adapter for OpenRouter API (which provides access to various models including Claude, GPT-4, etc.)

This design allows for:
- Easily switching between providers using environment variables
- Consistent interface for the rest of the application regardless of the provider being used
- Support for additional providers in the future with minimal changes to the codebase

#### Cost Tracking

Token usage and cost tracking is handled in two ways:

- **Anthropic API**: For direct Anthropic API calls, cost is estimated based on token usage and known pricing rates
- **OpenRouter API**: For OpenRouter API calls, we now use actual cost data returned by the API:
  - The OpenRouterAdapter adds `usage: { include: true }` to API requests
  - Actual cost information is extracted from the API response
  - TokenUsage class has been enhanced to accept and track actual cost data
  - When actual cost data is available, it takes precedence over estimated calculations
  - The UI displays the actual cost from the API rather than relying on estimates

This provides more accurate cost tracking for OpenRouter without requiring additional API calls.

### 6. UI Architecture

The UI follows the layout specified in the requirements:
- Top panel displays context (current state) and token usage cost (in the top right)
- Middle panels show test cases (with scrollable overflow), production code, and test code
- Code execution results are displayed with pass/fail indicators and error messages
- Coach feedback section below the code editors with color-coded backgrounds:
  - Light green with black text when feedback indicates progression (proceed: "yes")
  - Light pink with black text when feedback indicates improvement needed (proceed: "no")
- Bottom panel contains action buttons

All panels maintain consistent fixed heights with scrollable content areas to ensure the action buttons remain visible regardless of content size.

HTMX is used for dynamic updates without a separate frontend framework.

## Data Flow

1. User selects a test case or submits code
2. When not in PICK state, the server executes the code and captures execution results
3. Server updates session state and generates appropriate system and user prompts (including execution results)
4. LLM evaluates code and returns structured feedback
5. Server processes feedback using state-specific logic and applies visual styling (green/pink) based on the "proceed" field 
6. If feedback processing indicates success, session advances to next state

## Future Enhancements

1. **Multiple Katas**: Add support for additional kata exercises beyond FizzBuzz
2. **User Accounts**: Save progress and history across sessions
3. **Enhanced Feedback**: Additional feedback enhancements like animated transitions or success celebrations
4. **Full Test Runner**: Expand code execution to support more complex testing frameworks
5. **Offline Mode**: Allow for practicing without an internet connection
6. **Customizable Prompts**: Allow instructors to customize coaching style
7. **Extended State Pattern**: Add more specialized states for advanced TDD workflows

## User Experience Flow

### 1. PICK State
1. User is presented with radio buttons for test cases in TODO state
2. User selects a test case and clicks Submit
3. LLM evaluates if the selection is appropriate
4. If proceed is "yes", test case is marked as IN_PROGRESS and state advances to RED
5. If proceed is "no", user remains in PICK state with the same selection

### 2. RED State
1. User writes a failing test for the selected test case
2. User clicks Submit
3. Code is executed to verify if the test actually fails
4. LLM evaluates the code and execution results to determine if the test fails appropriately
5. If proceed is "yes", state advances to GREEN
6. If proceed is "no", user remains in RED state with feedback

### 3. GREEN State
1. User writes minimal code to make the test pass
2. User clicks Submit
3. Code is executed to verify if the test now passes
4. LLM evaluates the code and execution results to determine if the implementation is correct and minimal
5. If proceed is "yes", state advances to REFACTOR
6. If proceed is "no", user remains in GREEN state with feedback

### 4. REFACTOR State
1. User improves code quality while keeping tests passing
2. User clicks Submit
3. Code is executed to verify all tests still pass
4. LLM evaluates the code and execution results to determine if the refactoring is appropriate
5. If proceed is "yes" and there are more tests, current test is marked DONE and state advances to PICK
6. If proceed is "yes" and all tests are DONE, session is complete and state advances to COMPLETE
7. If proceed is "no", user remains in REFACTOR state with feedback

### 5. COMPLETE State
1. Session is complete, user is shown a congratulatory message
2. User can restart or exit

## Implementation Notes

- The app currently supports only the FizzBuzz kata
- All session data is stored in memory (not persistent)
- Code execution uses Node.js with a controlled environment and timeout protection
- Handlebars helpers are used for conditional logic in templates
- State pattern is used to manage the TDD cycle, making the code more maintainable

## Prompt Design Principles

1. **Clarity**: Each prompt clearly indicates the current state and expectations
2. **Context**: Full context (code, test cases, current state, execution results) is provided to the LLM
3. **Structure**: Responses are structured as JSON with comments, hints, and proceed fields
4. **Educational**: Feedback is designed to be instructive rather than just evaluative
5. **State-Specific**: Different prompts for different states, with specialized handling
6. **System/User Separation**: Instructions in system prompts, content to evaluate in user prompts

## Benefits of Code Execution

Adding code execution to the application provides several benefits:

1. **Objective Validation**: Tests are actually run to verify they fail or pass as expected
2. **Immediate Feedback**: Users see syntax errors and test results without waiting for LLM
3. **Enhanced LLM Context**: The LLM can give more accurate feedback based on real execution results
4. **Learning Reinforcement**: Users better understand the TDD cycle by seeing tests actually fail then pass
5. **Reduced LLM Hallucination**: Providing concrete execution results helps prevent the LLM from making incorrect assumptions about code behavior
6. **Better Developer Experience**: The application now more closely resembles a real TDD workflow with immediate test feedback

## Session Encapsulation Benefits

Improving the Session class with proper encapsulation has provided several advantages:

1. **Data Protection**: Private fields prevent unintended modification of internal state
2. **Controlled Access**: Explicit getter/setter methods enforce validation rules
3. **Implementation Hiding**: Internal details can be changed without affecting the external API
4. **Better Testing**: Clear interfaces make unit testing more straightforward
5. **Self-Documentation**: The public API clearly indicates what operations are permitted

## Prompt Structure Benefits

Using separate system and user prompts provides several advantages:

1. **Clarity**: Clear separation between instructions (system) and content to evaluate (user)
2. **Efficiency**: System instructions remain active without repetition, optimizing token usage
3. **Focus**: LLM can focus on evaluation criteria without constantly parsing through code
4. **Flexibility**: Easy to modify instruction style without changing content handling
5. **Improved Responses**: Claude gives better responses when using dedicated system prompts
6. **Kata-Specific Guidance**: System prompts can be tailored to specific katas while keeping the same structure
