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
   OPENROUTER_API_KEY=your_openrouter_api_key_here

   # OpenRouter Model Selection
   # Examples: "anthropic/claude-3-7-sonnet", "openai/gpt-4o", etc.
   OPENROUTER_MODEL=anthropic/claude-3-7-sonnet

   # Server Configuration
   PORT=3000
   ```
   
   By default, the application will use Anthropic's Claude.

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
- Accurate API cost tracking for LLM interactions using data from OpenRouter (displays in the UI)
- Persistent LLM feedback that's always preserved between page reloads
- Development mode toggle to skip LLM API calls and use fake positive responses

## Technology Stack

- Node.js with Express for server-side logic
- HTMX for dynamic UI interactions without a separate frontend framework
- Handlebars for view and prompt templating
- AI coaching with any model available through OpenRouter

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
