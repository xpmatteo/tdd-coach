const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const handlebarsHelpers = require('../helpers/handlebars-helpers');

// Register helpers
Object.keys(handlebarsHelpers).forEach(helperName => {
  Handlebars.registerHelper(helperName, handlebarsHelpers[helperName]);
});

// Load and compile prompt templates
const promptTemplates = {
  PICK: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/pick.hbs'), 'utf8'
  )),
  RED: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/red.hbs'), 'utf8'
  )),
  GREEN: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/green.hbs'), 'utf8'
  )),
  REFACTOR: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/refactor.hbs'), 'utf8'
  ))
};

/**
 * Generate appropriate prompt for current session state
 * @param {Session} session - The current session
 * @returns {string} - The formatted prompt to send to LLM
 */
exports.getPrompt = (session) => {
  if (!promptTemplates[session.state]) {
    throw new Error(`No prompt template for state: ${session.state}`);
  }

  // Determine current test case being worked on
  let currentTest = null;
  if (session.currentTestIndex !== null) {
    currentTest = session.testCases[session.currentTestIndex];
  }

  // Prepare context for template
  const context = {
    state: session.state,
    kataName: session.kataName,
    productionCode: session.productionCode,
    testCode: session.testCode,
    testCases: session.testCases,
    currentTest,
    selectedTestIndex: session.selectedTestIndex
  };

  // Apply template with context
  return promptTemplates[session.state](context);
};
