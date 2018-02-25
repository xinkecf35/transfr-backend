// app.js
// requiring env file
require('dotenv').config();
// app constants
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user.js');

// configure app to use body-parser

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

let port = process.env.PORT || 8800;

let router = express.Router();

router.get('/', function(req, res) {
  res.json({message: 'Hello World!'});
});

app.use('/api/v1', router);
app.listen(port);
console.log('Listening on ' + port);
