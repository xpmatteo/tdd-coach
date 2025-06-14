const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const handlebarsHelpers = require('../helpers/handlebars-helpers');

// Register helpers
Object.keys(handlebarsHelpers).forEach(helperName => {
  Handlebars.registerHelper(helperName, handlebarsHelpers[helperName]);
});

// Load and compile system prompt templates
const systemPromptTemplates = {
  PICK: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/system/system-pick.hbs'), 'utf8'
  )),
  RED: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/system/system-red.hbs'), 'utf8'
  )),
  GREEN: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/system/system-green.hbs'), 'utf8'
  )),
  REFACTOR: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/system/system-refactor.hbs'), 'utf8'
  ))
};

// Load and compile user prompt templates
const userPromptTemplates = {
  PICK: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/user/user-pick.hbs'), 'utf8'
  )),
  RED: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/user/user-red.hbs'), 'utf8'
  )),
  GREEN: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/user/user-green.hbs'), 'utf8'
  )),
  REFACTOR: Handlebars.compile(fs.readFileSync(
    path.join(__dirname, '../prompts/user/user-refactor.hbs'), 'utf8'
  ))
};

/**
 * Generate appropriate prompts for current session state
 * @param {Session} session - The current session
 * @returns {Object} - Object containing system and user prompts
 */
exports.getPrompts = (session) => {
  const state = session.getState ? session.getState() : session.state;
  
  if (!systemPromptTemplates[state] || !userPromptTemplates[state]) {
    throw new Error(`No prompt templates for state: ${state}`);
  }

  // Determine current test case being worked on
  let currentTest = null;
  if (session.currentTestIndex !== null) {
    currentTest = session.testCases[session.currentTestIndex];
  }

  // Get code execution results if available
  const codeExecutionResults = session.getCodeExecutionResults ? 
    session.getCodeExecutionResults() : null;

  // Get previous versions if available
  const previousTestCode = session.getPreviousTestCode ? 
    session.getPreviousTestCode() : '';
  const previousProductionCode = session.getPreviousProductionCode ? 
    session.getPreviousProductionCode() : '';

  // Prepare context for templates
  const context = {
    state: state,
    kataName: session.kataName,
    productionCode: session.productionCode,
    testCode: session.testCode,
    testCases: session.testCases,
    currentTest,
    selectedTestIndex: session.selectedTestIndex,
    codeExecutionResults,
    hasCodeExecutionResults: !!codeExecutionResults,
    previousTestCode,
    previousProductionCode,
    hasPreviousTestCode: !!previousTestCode,
    hasPreviousProductionCode: !!previousProductionCode
  };

  // Apply templates with context
  return {
    system: systemPromptTemplates[state](context),
    user: userPromptTemplates[state](context)
  };
};
