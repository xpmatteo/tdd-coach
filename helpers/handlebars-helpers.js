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
  },
  
  /**
   * Convert to string helper
   * Usage: {{toString value}}
   */
  toString: function(value) {
    return value ? value.toString() : '';
  },
  
  /**
   * Custom lookup helper to access array elements by index and then a property
   * Usage: {{lookup array index "property"}}
   */
  lookup: function(array, index, prop) {
    if (!array || !array[index]) return '';
    return prop ? array[index][prop] : array[index];
  },
  
  /**
   * Format date helper
   * Usage: {{formatDate dateString}}
   */
  formatDate: function(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  }
};