// backend/middleware/session.js
const session = require('express-session');
const config = require('../config');

module.exports = session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: config.session.cookie,
  name: config.session.cookie.name
});