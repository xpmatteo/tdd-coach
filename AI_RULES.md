## UI Design Principles

1. **Fixed Heights**: Use fixed heights with scrollable overflow for content areas to ensure consistent layout
2. **Visibility of Actions**: Ensure action buttons remain visible at all times
3. **Feedback Location**: Place feedback near the relevant action buttons
4. **Progressive Disclosure**: Reveal information in a logical sequence matching the TDD flow
5. **Visual Status**: Clearly indicate the current state and status of test cases with color coding for feedback (green for proceed, pink for needs improvement)
6. **CSS Organization**: Use specific classes over inline styles for consistent styling

# AI Rules for TDD Coach Project

This document provides guidelines for AI coding assistants when working on the TDD Coach project. Please follow these conventions and principles to maintain code quality and consistency.

## Coding Standards

### General Rules

1. **Simplicity First**: Prefer simple, straightforward implementations over complex ones
2. **Explicit Over Implicit**: Make behavior explicit rather than relying on "magic"
3. **Testability**: Write code that is easy to test
4. **Error Handling**: Validate inputs and handle errors gracefully
5. **Comments**: Use comments to explain "why" not "what"

### JavaScript Conventions

1. Use ES6+ syntax and features
2. Use `const` by default, `let` when needed, avoid `var`
3. Use arrow functions for anonymous functions
4. Use destructuring for cleaner code
5. Use async/await for asynchronous operations
6. Follow camelCase naming for variables and functions
7. Follow PascalCase for classes
8. Use JSDoc comments for functions and classes

## Project Structure

Maintain the established project structure:

```
/controllers      - Route handlers and business logic
/helpers          - Utility functions and handlebars helpers
/models           - Data models and business logic
/public           - Static assets (CSS, client-side JS)
/routes           - Express routes
/services         - Integration with external services (LLM)
/prompts          - Handlebars templates for LLM prompts
/views            - Handlebars templates for UI
/tests            - Test files
```

## Technology Guidelines

### HTMX

1. Use `hx-` attributes for dynamic behavior
2. Keep HTMX-related attributes at the beginning of an element's attribute list
3. Use `hx-target` to specify update targets
4. Use `hx-swap` to control how content is swapped

### Handlebars

1. Use triple braces `{{{var}}}` only for trusted HTML content
2. Use double braces `{{var}}` for regular variable interpolation
3. Use built-in helpers for conditional logic
4. Create named partials for reusable components
5. Keep templates focused on presentation, not business logic
6. Create custom helpers for complex conditional logic
7. Implement proper error handling for custom helpers
8. Use lookup helpers to access nested properties safely

### Express

1. Keep routes in the `/routes` directory
2. Use middleware for cross-cutting concerns
3. Handle errors centrally
4. Use route parameters for resource identifiers
5. Use query parameters for filtering and pagination

## AI Prompt Design

When writing or modifying LLM prompts:

1. **Be Explicit**: Clearly state what information you need from the LLM
2. **Provide Context**: Include all relevant information the LLM needs
3. **Structure Output**: Specify the format for LLM responses (JSON)
4. **Educational Focus**: Optimize for learning, not just task completion
5. **Test Edge Cases**: Consider how the LLM will respond to unusual inputs

## Testing Strategy

1. Write tests before implementing features
2. Use Jest for testing
3. Test each component in isolation
4. Use mocks for external dependencies (LLM API)
5. Test the happy path and edge cases

## Documentation

When adding or changing features:

1. Update README.md with user-facing changes
2. Update DESIGN.md with architectural changes
3. Add JSDoc comments to new functions and classes
4. Document any non-obvious behavior or workarounds

## State Management

1. Keep the Session state machine logic centralized
2. Use explicit state transitions
3. Validate state transitions
4. Handle invalid state transitions gracefully
5. Consider intermediate states (like test selection before confirmation)
6. Avoid immediate state changes that depend on external validation
7. Store temporary selections separately from confirmed selections

## Security Considerations

1. Sanitize all user inputs
2. Don't expose sensitive information (API keys)
3. Validate and escape output to prevent XSS
4. Use environment variables for configuration

## Performance

1. Keep prompt templates efficient and focused
2. Minimize dependencies
3. Consider caching for prompt templates
4. Use streaming responses where appropriate

