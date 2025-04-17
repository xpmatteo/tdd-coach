# Prompt Testing System for TDD Coach

## Overview

The Prompt Testing System is a comprehensive framework for capturing, managing, and analyzing test cases for LLM prompts. It helps improve the quality and reliability of AI coaching interactions by enabling systematic testing and refinement of prompts.

## Implementation Status

- **✅ Phase 1: Test Case Capture** - Implemented
- ⬜ Phase 2: Test Case Management
- ⬜ Phase 3: Prompt Versioning and Testing  
- ⬜ Phase 4: Comparison and Analysis

## Core Components

### 1. Test Case Capture (Implemented)
- Special application mode that captures test scenarios (enabled via environment variable)
- Integrates into existing application flow
- Records state transitions and LLM interactions
- Provides UI for saving interesting scenarios as test cases
- Stores test cases as JSON files with descriptive filenames
- *Session-based interaction capture (prevents data overwrites in multi-user scenarios)*
- *Separates test case capture functionality from regular LLM interaction tracking*

### 2. Test Case Management (Planned)
- Interactive UI for creating and managing test cases
- Ability to edit captured scenarios
- Test case organization by TDD state and category
- Tagging system for easier filtering and management
- Expected outcome specification (proceed: "yes"/"no")

### 3. Batch Test Runner (Planned)
- Run tests against different prompt versions
- Support for running subset of tests by:
  - TDD state (PICK, RED, GREEN, REFACTOR)
  - Tags or categories
  - Creation date
  - Previous failure status
- Token usage optimization strategies:
  - Cheaper model options
  - Token caching for repeated tests
  - Parallel execution options

### 4. Prompt Versioning (Planned)
- Track changes to prompts with version history
- Git-like versioning for prompt templates
- Ability to revert to previous versions
- Diff view to see prompt changes between versions
- Annotations for prompt changes

### 5. Comparison Dashboard (Planned)
- Compare prompt performance across versions
- Visual metrics on pass/fail rates
- Token usage statistics per prompt version
- Charts and graphs showing improvement over time
- Detailed view of failure points

## Getting Started

### Enabling Test Capture Mode

1. Set `PROMPT_CAPTURE_MODE=true` in your `.env` file:
   ```
   PROMPT_CAPTURE_MODE=true
   ```
2. Restart the application
3. When test capture mode is enabled, you'll see:
   - A navigation link to "Prompt Tests"
   - A "Save as Prompt Test" button in the coaching interface
   - A red indicator showing that test capture mode is enabled

### How It Works

1. The system automatically captures each interaction with the AI coach
2. After receiving feedback from the coach, you can save the interaction as a test case
3. Test cases are stored as JSON files in the `testCases` directory
4. Each test case includes:
   - The current TDD state
   - Test and production code
   - Test case selection
   - LLM response

### Usage

#### Capturing Test Cases

1. Use the TDD Coach normally
2. After receiving feedback, click "Save as Prompt Test"
3. Enter a descriptive name for the test case
4. Click "Save"

#### Viewing Test Cases

1. Click "Prompt Tests" in the navigation menu
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

## Future Implementation Plan

### Phase 2: Test Case Management
1. Develop a test case management interface
2. Implement categorization and tagging system
3. Add ability to edit test cases and expected outcomes
4. Create import/export functionality for test cases
5. Implement basic test execution against current prompts

### Phase 3: Prompt Versioning and Testing
1. Implement prompt versioning system
2. Create a batch test runner with filtering options
3. Develop token usage optimization strategies
4. Add model selection for testing
5. Implement detailed reporting on test results

### Phase 4: Comparison and Analysis
1. Build comparison dashboard for prompt versions
2. Implement visualization of test results
3. Create token usage reports
4. Add regression detection algorithms
5. Develop recommendation system for prompt improvements

## CLI Commands (Planned)

```bash
# Enter testing mode
npm run test:capture

# Run tests with the current prompts
npm run test:prompts

# Run tests with specific filters
npm run test:prompts -- --state=RED --tags=assertion,syntax

# Compare prompt versions
npm run test:compare -- --version=current --against=v1.2.0

# Show token usage report
npm run test:usage
```

## User Experience Flow

1. **Capture Mode:**
   - User enables testing mode
   - User performs normal TDD coaching session
   - System flags interesting scenarios
   - User saves relevant scenarios as test cases
   - User adds metadata and expected outcomes

2. **Test Management:** (Coming in Phase 2)
   - User browses existing test cases
   - User edits or creates new test cases
   - User organizes test cases with tags and categories
   - User exports test cases for sharing

3. **Prompt Development:** (Coming in Phase 3)
   - User creates new prompt version
   - User runs tests against new version
   - System reports on passing/failing tests
   - User refines prompts based on results

4. **Performance Analysis:** (Coming in Phase 4)
   - User compares prompt versions
   - User identifies regression points
   - User analyzes token usage
   - User makes data-driven decisions on prompt improvements

## Advantages

1. **Real-world Testing:** Captures actual scenarios from real usage
2. **Incremental Development:** Test suite grows organically as issues are encountered
3. **Visual Feedback:** Dashboard makes it easy to spot regressions
4. **Version Control:** Prompt history helps track changes and their impacts
5. **Cost Awareness:** Token usage tracking helps manage testing costs
6. **Continuous Improvement:** Facilitates data-driven prompt refinement

## Technical Considerations

1. **Storage:** Test cases are stored in a structured format (JSON)
2. **Performance:** Batch testing should be optimized for API cost and speed
3. **Integration:** System works alongside existing codebase without disruption
4. **Extensibility:** Design accommodates new models or prompt formats
5. **Backup:** Test cases can be easily backed up and restored
