// This file contains any global JavaScript functionality not handled inline
// Currently, CodeMirror initialization is handled directly in the session.handlebars template

// Register HTMX events
document.addEventListener('htmx:beforeSwap', function(event) {
  // You could add loading indicators here
});

document.addEventListener('htmx:afterSwap', function(event) {
  // Reinitialize any components after HTMX updates the DOM
  if (window.productionEditor) {
    window.productionEditor.refresh();
  }
  if (window.testEditor) {
    window.testEditor.refresh();
  }
});

// Helper to show/hide hint
function toggleHint() {
  const hintElement = document.getElementById('hint');
  if (hintElement) {
    hintElement.classList.toggle('d-none');
  }
}