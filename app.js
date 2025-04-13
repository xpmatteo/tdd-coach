require('dotenv').config();
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
});