# Plan B: Interactive Test Capture and Validation System

## Overview
An interactive system that allows capturing real scenarios as test cases, manages prompt versions, and provides comprehensive comparison tools for detecting regressions in prompt performance.

## Core Components

### 1. Testing Mode
- Special application mode that captures test scenarios
- Integrates into existing application flow
- Records state transitions and LLM interactions
- Flags interesting scenarios for test case creation

### 2. Test Case Builder
- Interactive UI for creating and managing test cases
- Ability to edit captured scenarios
- Test case organization by TDD state and category
- Tagging system for easier filtering and management
- Expected outcome specification (proceed: "yes"/"no")

### 3. Batch Test Runner
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

### 4. Prompt Versioning
- Track changes to prompts with version history
- Git-like versioning for prompt templates
- Ability to revert to previous versions
- Diff view to see prompt changes between versions
- Annotations for prompt changes

### 5. Comparison Dashboard
- Compare prompt performance across versions
- Visual metrics on pass/fail rates
- Token usage statistics per prompt version
- Charts and graphs showing improvement over time
- Detailed view of failure points

## Implementation Strategy

### Phase 1: Test Case Capture
1. Add a testing mode toggle to the application
2. Implement state capture functionality that records:
   - Current TDD state
   - Test and production code
   - Test case selection
   - LLM responses
3. Create a "Save as Test Case" feature that appears after LLM interactions
4. Build a basic UI for reviewing captured test cases

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

## CLI Commands

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

2. **Test Management:**
   - User browses existing test cases
   - User edits or creates new test cases
   - User organizes test cases with tags and categories
   - User exports test cases for sharing

3. **Prompt Development:**
   - User creates new prompt version
   - User runs tests against new version
   - System reports on passing/failing tests
   - User refines prompts based on results

4. **Performance Analysis:**
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

1. **Storage:** Test cases should be stored in a structured format (JSON/YAML)
2. **Performance:** Batch testing should be optimized for API cost and speed
3. **Integration:** System should work alongside existing codebase without disruption
4. **Extensibility:** Design should accommodate new models or prompt formats
5. **Backup:** Test cases should be easily backed up and restored
