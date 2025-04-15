#Test Suite with Token Caching and Model Flexibility
## Core Components:

1. Test Case Repository: Store test cases as JSON files, organized by TDD states (PICK, RED, GREEN, REFACTOR)
2. API Interaction Layer: Wrapper around existing LLM service with caching and model selection
3. Test Runner: CLI tool to execute tests selectively or comprehensively
4. Results Analyzer: Compare expected vs. actual outputs from the API
5. Token Usage Reporter: Track and report usage for cost monitoring

## Implementation Strategy:

1. Create a /prompt-tests directory with subdirectories for each state
2. Each test case would contain:

   * Input state (test code, production code, test case selection)
   * Expected response (proceed: "yes"/"no")
   * Optional metadata (description, category of test)

4. Implement a token caching mechanism using file-based storage
5. Add model selection parameter to use cheaper models for testing
6. Develop a CLI script that runs the tests and reports results
7. Add token usage tracking and reporting specific to testing

## Command Example:
```bash
npm run test:prompts -- --state=RED --filter="missing-assertion"
```
