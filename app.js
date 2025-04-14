require('dotenv').config();

// Check for required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not defined');
  console.error('Please create a .env file based on .env.example and add your API key');
  process.exit(1);
}
const express = require('express');
const { engine } = require('express-handlebars');
const handlebarsHelpers = require('./helpers/handlebars-helpers');
const bodyParser = require('body-parser');
const path = require('path');

const sessionController = require('./controllers/sessionController');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

// Session routes
app.get('/session/new', sessionController.newSession);
app.post('/session/submit', sessionController.submitCode);
app.post('/session/hint', sessionController.getHint);
app.post('/session/restart', sessionController.restartSession);

// Start server
app.listen(PORT, () => {
  console.log(`TDD Coach app listening at http://localhost:${PORT}`);
  console.log('Using Anthropic API key:', process.env.ANTHROPIC_API_KEY.substring(0, 5) + '...');
});