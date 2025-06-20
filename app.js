require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const handlebarsHelpers = require('./helpers/handlebars-helpers');
const bodyParser = require('body-parser');
const path = require('path');

const sessionController = require('./controllers/sessionController');
const createNewSessionHandler = require('./handlers/newSessionHandler');
const createGetSessionHandler = require('./handlers/getSessionHandler');
const createSubmitCodeHandler = require('./handlers/submitCodeHandler');
const createGetHintHandler = require('./handlers/getHintHandler');
const createRestartSessionHandler = require('./handlers/restartSessionHandler');
const SessionManager = require('./services/sessionManager');
const SessionPersistenceService = require('./services/sessionPersistenceService');
const ViewDataBuilder = require('./services/viewDataBuilder');
const CodeExecutor = require('./services/codeExecutor');
const { getPrompts } = require('./services/promptService');
const { getLlmFeedback } = require('./services/llmService');
const katas = require('./models/katas');

const llmService = require('./services/llmService');
const OpenRouterAdapter = require('./services/adapters/OpenRouterAdapter');

const app = express();
const PORT = process.env.PORT || 3000;

// Check for required environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY environment variable is not defined');
  console.error('Please create a .env file based on .env.example and add your OpenRouter API key');
  process.exit(1);
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars setup
app.engine('handlebars', engine({
  helpers: handlebarsHelpers
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Create session manager and handlers
const persistenceService = new SessionPersistenceService();
const sessionManager = new SessionManager(sessionController.sessions, persistenceService);
const viewDataBuilder = new ViewDataBuilder();
const codeExecutor = new CodeExecutor();
const promptService = { getPrompts };
const llmServiceWrapper = { getLlmFeedback };
const newSessionHandler = createNewSessionHandler(katas, sessionManager);
const getSessionHandler = createGetSessionHandler(sessionManager, viewDataBuilder);
const submitCodeHandler = createSubmitCodeHandler(sessionManager, codeExecutor, promptService, llmServiceWrapper, viewDataBuilder);
const getHintHandler = createGetHintHandler(sessionManager, promptService, llmServiceWrapper);
const restartSessionHandler = createRestartSessionHandler(sessionManager, viewDataBuilder);

// Routes
app.get('/', (req, res) => {
  const kataList = Object.entries(katas).map(([key, kata]) => ({
    key,
    name: kata.name,
    description: kata.description
  }));
  res.render('home', { katas: kataList });
});

// Session routes
app.get('/session/new', newSessionHandler);
app.get('/session/:id', getSessionHandler);
app.post('/session/submit', submitCodeHandler);
app.post('/session/hint', getHintHandler);
app.post('/session/restart', restartSessionHandler);



// Merge predefined sessions into sessionController.sessions
const predefinedSessions = require('./models/predefinedSessions');
Object.entries(predefinedSessions.sessions).forEach(([key, session]) => {
  sessionController.sessions.set(key, session);
});

// --- LLM Adapter Initialization ---
const llmAdapter = new OpenRouterAdapter(
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku-20240307' // Default model
);
llmService.init(llmAdapter);
// --- End LLM Adapter Initialization ---

// Start server
app.listen(PORT, () => {
  console.log(`TDD Coach app listening at http://localhost:${PORT}`);
});
