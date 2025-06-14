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
   
   By default, the application will use Anthropic's Claude.

## Usage

1. Start the server with hot reload: `npm start`
2. Open your browser and navigate to http://localhost:3000
3. Follow the guided TDD process to implement the FizzBuzz kata


## Development

Run the development server with hot reloading: `make dev`. 
This will also log to file `dev.log`

Run tests: `make test`
