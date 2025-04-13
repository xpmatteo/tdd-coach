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

The session tracks:
- Current state
- Test cases and their status (TODO, IN_PROGRESS, DONE)
- Production and test code
- The currently selected test case

### 2. Prompt Templates

The application uses Handlebars templates to generate prompts for the LLM, with different templates for each state in the TDD cycle:

- `pick.hbs`: Guides the user in selecting the next test case
- `red.hbs`: Evaluates if the test properly fails for the right reason
- `green.hbs`: Evaluates if the implementation makes the test pass
- `refactor.hbs`: Evaluates code quality improvements

### 3. LLM Integration

The LLM service:
- Sends formatted prompts to the Anthropic Claude API
- Requests responses in JSON format
- Extracts feedback comments, hints, and a binary proceed/don't proceed signal

### 4. UI Architecture

The UI follows the layout specified in the requirements:
- Top panel displays context (current state)
- Middle panels show test cases, production code, and test code
- Bottom panel contains action buttons

HTMX is used for dynamic updates without a separate frontend framework.

## Data Flow

1. User selects a test case or submits code
2. Server updates session state and generates appropriate LLM prompt
3. LLM evaluates code and returns structured feedback
4. Server processes feedback and updates UI accordingly
5. If feedback indicates "proceed: yes", session advances to next state

## Future Enhancements

1. **Multiple Katas**: Add support for additional kata exercises beyond FizzBuzz
2. **User Accounts**: Save progress and history across sessions
3. **Enhanced Feedback**: More detailed, visual feedback on test execution
4. **Code Execution**: Run tests in a sandbox to verify they actually fail/pass
5. **Offline Mode**: Allow for practicing without an internet connection
6. **Customizable Prompts**: Allow instructors to customize coaching style

## Implementation Notes

- The app currently supports only the FizzBuzz kata
- All session data is stored in memory (not persistent)
- The application doesn't run tests; it relies on the LLM to evaluate code
- Handlebars helpers are used for conditional logic in templates

## Prompt Design Principles

1. **Clarity**: Each prompt clearly indicates the current state and expectations
2. **Context**: Full context (code, test cases, current state) is provided to the LLM
3. **Structure**: Responses are structured as JSON with comments, hints, and proceed fields
4. **Educational**: Feedback is designed to be instructive rather than just evaluative