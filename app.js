// app.js
// requiring env file
require('dotenv').config();

// app constants
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dbURI = process.env.DATABASE_URI;
const db = mongoose.connection;

// Passport setup
const passport = require('passport');
const flash = require('connect-flash');
const csurf = require('csurf');

// configure database and handling intial connection promise
mongoose.connect(dbURI, {useNewUrlParser: true});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('Mongo database is connected');
});

// configure app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

// configure passport
app.use(passport.initialize());
app.use(flash());

// Misc app and Router configuration
let domain = '.transfr.info';
const port = process.env.PORT || 8800;
if (process.env.NODE_ENV === 'debug') {
  domain = '.transfr.test';
}
let csrfOptions = {cookie: {
  httpOnly: true,
  secure: true,
  domain: domain,
  maxAge: 86400,
}};
const userauth = require('./routes/userauth.js');
const vcardmanager = require('./routes/vcardmanager.js');
const vcardpublic = require('./routes/vcardpublic.js');

app.use('/v1/users', userauth);
app.use(
  '/v1/userdata',
  csurf(csrfOptions),
  passport.authenticate('jwt', {session: false}),
  vcardmanager);
app.use('/v1/card', vcardpublic);
app.get('/', function(req, res) {
  res.json({message: 'Welcome to transfr.info REST API'});
});

// Error Handlers
if (process.env.NODE_ENV === 'production') {
  app.use(function(err, req, res, next) {
    const meta = {
      success: false,
      error: err.message,
    };
    res.status(err.status || 500).json({meta: meta});
  });
}

// Final configuration
app.listen(port);
console.log('Listening on ' + port);

// Cleanup on process kill
process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    console.log('Mongo connection closed on process kill');
    process.exit(0);
  });
});
module.exports = app;
