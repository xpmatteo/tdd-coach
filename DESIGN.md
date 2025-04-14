# TDD Coach - Design Document

## Overview

TDD Coach is an educational application designed to help users learn Test-Driven Development through guided kata exercises. The application provides real-time feedback from an AI coach (using the Anthropic Claude API) to guide users through the TDD cycle.

## Core Features

1. **TDD State Machine**: Guides users through the PICK → RED → GREEN → REFACTOR cycle
2. **Test Case Management**: Tracks progress through test cases for a kata
3. **AI Coaching**: Provides contextual feedback and hints based on user's code
4. **Code Editing**: Integrated editors for writing test and production code

## Technology Stack

- **Backend**: Node.js with Express
- **Templating**: Handlebars for both UI and LLM prompts
- **UI Enhancements**: HTMX for dynamic updates without a separate frontend framework
- **Code Editors**: CodeMirror for in-browser code editing
- **AI Integration**: Anthropic Claude API for coaching feedback

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

The PICK state implements a two-step selection process:
1. User selects a test case (which is stored but not yet marked as IN_PROGRESS)
2. LLM evaluates if the selection is appropriate
3. If approved, the test case is marked as IN_PROGRESS and the state advances to RED

### 2. State Pattern Implementation

The application uses the State design pattern to manage the TDD cycle states:

- **Base State Class**: Defines common interface for all states
  - `getName()`: Returns the name of the state
  - `onEnter()`: Actions to perform when entering the state
  - `onExit()`: Actions to perform when exiting the state
  - `getNextState()`: Returns the next state in the TDD cycle
  - `canSelectTestCase()`: Whether this state allows test case selection
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

### 3. Prompt Templates

The application uses Handlebars templates to generate prompts for the LLM, with different templates for each state in the TDD cycle:

- `pick.hbs`: Guides the user in selecting the next test case
- `red.hbs`: Evaluates if the test properly fails for the right reason
- `green.hbs`: Evaluates if the implementation makes the test pass
- `refactor.hbs`: Evaluates code quality improvements

The "Help Me" hint feature also adopts the same color scheme as the main feedback, using matching border colors to provide a consistent visual experience.

### 4. LLM Integration

The LLM service:
- Sends formatted prompts to the Anthropic Claude API
- Requests responses in JSON format
- Extracts feedback comments, hints, and a binary proceed/don't proceed signal

### 5. UI Architecture

The UI follows the layout specified in the requirements:
- Top panel displays context (current state)
- Middle panels show test cases (with scrollable overflow), production code, and test code
- Coach feedback section below the code editors with color-coded backgrounds:
  - Light green with black text when feedback indicates progression (proceed: "yes")
  - Light pink with black text when feedback indicates improvement needed (proceed: "no")
- Bottom panel contains action buttons

All panels maintain consistent fixed heights with scrollable content areas to ensure the action buttons remain visible regardless of content size.

HTMX is used for dynamic updates without a separate frontend framework.

## Data Flow

1. User selects a test case or submits code
2. Server updates session state and generates appropriate LLM prompt
3. LLM evaluates code and returns structured feedback
4. Server processes feedback using state-specific logic and applies visual styling (green/pink) based on the "proceed" field 
5. If feedback processing indicates success, session advances to next state

## Future Enhancements

1. **Multiple Katas**: Add support for additional kata exercises beyond FizzBuzz
2. **User Accounts**: Save progress and history across sessions
3. **Enhanced Feedback**: Additional feedback enhancements like animated transitions or success celebrations
4. **Code Execution**: Run tests in a sandbox to verify they actually fail/pass
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
3. LLM evaluates if the test fails appropriately
4. If proceed is "yes", state advances to GREEN
5. If proceed is "no", user remains in RED state with feedback

### 3. GREEN State
1. User writes minimal code to make the test pass
2. User clicks Submit
3. LLM evaluates if the implementation is correct and minimal
4. If proceed is "yes", state advances to REFACTOR
5. If proceed is "no", user remains in GREEN state with feedback

### 4. REFACTOR State
1. User improves code quality while keeping tests passing
2. User clicks Submit
3. LLM evaluates if the refactoring is appropriate
4. If proceed is "yes" and there are more tests, current test is marked DONE and state advances to PICK
5. If proceed is "yes" and all tests are DONE, session is complete and state advances to COMPLETE
6. If proceed is "no", user remains in REFACTOR state with feedback

### 5. COMPLETE State
1. Session is complete, user is shown a congratulatory message
2. User can restart or exit

## Implementation Notes

- The app currently supports only the FizzBuzz kata
- All session data is stored in memory (not persistent)
- The application doesn't run tests; it relies on the LLM to evaluate code
- Handlebars helpers are used for conditional logic in templates
- State pattern is used to manage the TDD cycle, making the code more maintainable

## Prompt Design Principles

1. **Clarity**: Each prompt clearly indicates the current state and expectations
2. **Context**: Full context (code, test cases, current state) is provided to the LLM
3. **Structure**: Responses are structured as JSON with comments, hints, and proceed fields
4. **Educational**: Feedback is designed to be instructive rather than just evaluative
5. **State-Specific**: Different prompts for different states, with specialized handling (e.g., handling temporary selections in PICK state)

## State Pattern Benefits

Implementing the State pattern has provided several benefits:

1. **Better code organization**: State-specific logic is now encapsulated in dedicated classes
2. **Improved maintainability**: Adding new states or modifying existing state behavior is simpler
3. **Enhanced readability**: The code is now more self-documenting
4. **Reduced complexity**: The Session class is now less complex with fewer responsibilities
5. **More flexibility**: New behaviors can be added to specific states without affecting others
6. **Elimination of switch statements**: Removed complex conditional logic from the Session class
7. **Explicit state transitions**: State changes are now more explicit and easier to follow
