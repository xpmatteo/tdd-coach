/**
 * Custom Handlebars helpers
 */
module.exports = {
  /**
   * Equality comparison helper
   * Usage: {{#if (eq var1 var2)}}...{{/if}}
   */
  eq: function(a, b) {
    return a === b;
  },
  
  /**
   * Not equal comparison helper
   * Usage: {{#if (neq var1 var2)}}...{{/if}}
   */
  neq: function(a, b) {
    return a !== b;
  },
  
  /**
   * Greater than helper
   * Usage: {{#if (gt var1 var2)}}...{{/if}}
   */
  gt: function(a, b) {
    return a > b;
  },
  
  /**
   * Less than helper
   * Usage: {{#if (lt var1 var2)}}...{{/if}}
   */
  lt: function(a, b) {
    return a < b;
  },
  
  /**
   * Logical AND helper
   * Usage: {{#if (and condition1 condition2)}}...{{/if}}
   */
  and: function(a, b) {
    return a && b;
  }
};