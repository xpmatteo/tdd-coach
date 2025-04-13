# TDD Coach

A program that helps people learn Test-Driven Development through katas with AI coaching.

## Description

The TDD Coach guides users through implementing coding katas using the Test-Driven Development approach. It follows the TDD cycle:

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
3. Create a `.env` file based on `.env.example` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3000
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to http://localhost:3000
3. Follow the guided TDD process to implement the FizzBuzz kata

## Features

- Interactive UI with code editors
- Real-time AI coaching feedback
- Step-by-step TDD guidance
- Hint system for when you get stuck
- Progress tracking for test cases
- Two-step test selection process (select → confirm)
- Dedicated coach feedback area

## Technology Stack

- Node.js with Express for server-side logic
- HTMX for dynamic UI interactions without a separate frontend framework
- Handlebars for view and prompt templating
- CodeMirror for code editing
- Anthropic's Claude for AI coaching

## Project Structure

- `/controllers` - Route handlers and application logic
- `/models` - Data models and kata definitions
- `/public` - Static assets (CSS, JavaScript)
- `/routes` - Express routes
- `/services` - Business logic for LLM integration and prompts
- `/templates` - Handlebars templates for LLM prompts
- `/views` - Handlebars templates for UI

## Development

Run the development server with hot reloading:
```
npm run dev
```

Run tests:
```
npm test
```