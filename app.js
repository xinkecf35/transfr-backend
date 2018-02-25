// app.js
// requiring env file
require('dotenv').config();

// app constants
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dbURI = process.env.DATABASE_URI;
const db = mongoose.connection;

// Object models
const User = require('./models/user.js');
const VCardProfile = require('./models/VCardProfile.js');

// Passport setup
const passport = require('passport');
const flash = require('connect-flash');


// configure database and handling intial connection promise
mongoose.connect(dbURI);
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// configure app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// configure passport
app.use(passport.initialize());
app.use(flash());

// Misc app and Router configuration

let port = process.env.PORT || 8800;

let router = express.Router();
let userauth = require('./routes/userauth.js');

router.get('/', function(req, res) {
  res.json({message: 'Welcome to transfr.info REST API'});
});

app.use('/api/v1/', userauth);
app.use('/api/v1', router);

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
