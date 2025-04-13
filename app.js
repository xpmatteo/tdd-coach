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

// Routes
const sessionRoutes = require('./routes/session');

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
app.use('/session', sessionRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('home');
});

// Start server
app.listen(PORT, () => {
  console.log(`TDD Coach app listening at http://localhost:${PORT}`);
  console.log('Using Anthropic API key:', process.env.ANTHROPIC_API_KEY.substring(0, 5) + '...');
});