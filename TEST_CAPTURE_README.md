# Test Capture System for TDD Coach

The Test Capture System allows you to record and save interactions with the TDD Coach for testing, debugging, and improving prompts over time.

## Getting Started

1. Enable test capture mode by setting `TEST_CAPTURE_MODE=true` in your `.env` file
2. Restart the application
3. When test capture mode is enabled, you'll see:
   - A navigation link to "Test Cases"
   - A "Save as Test Case" button in the coaching interface
   - A red indicator showing that test capture mode is enabled

## How It Works

1. The system automatically captures each interaction with the AI coach
2. After receiving feedback from the coach, you can save the interaction as a test case
3. Test cases are stored as JSON files in the `testCases` directory
4. Each test case includes:
   - The current TDD state
   - Test and production code
   - Test case selection
   - LLM response

## Usage

### Capturing Test Cases

1. Use the TDD Coach normally
2. After receiving feedback, click "Save as Test Case"
3. Enter a descriptive name for the test case
4. Click "Save"

### Viewing Test Cases

1. Click "Test Cases" in the navigation menu
2. Browse the list of saved test cases
3. Click "View" to see the details of a test case
4. Click "Delete" to remove a test case

## Test Case Storage

Test cases are stored as JSON files in the `testCases` directory. The filenames follow this format:

```
STATE_descriptive_name_TIMESTAMP.json
```

For example:
```
RED_fizzbuzz_divisible_by_three_2023-10-15T14-30-45.000Z.json
```

This format makes it easy to identify test cases by state and purpose.

## Directory Structure

```
/testCases            - Directory for storing test cases
  |- RED_*.json       - Test cases for RED state
  |- GREEN_*.json     - Test cases for GREEN state
  |- PICK_*.json      - Test cases for PICK state
  |- REFACTOR_*.json  - Test cases for REFACTOR state
```

## Future Plans

This test capture system is the foundation for a comprehensive test suite for prompt development:

1. **Phase 1: Test Case Capture** (current implementation)
2. Phase 2: Test Case Management
3. Phase 3: Prompt Versioning and Testing
4. Phase 4: Comparison and Analysis
