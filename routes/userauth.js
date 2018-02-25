const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user.js');

// Strategies
const LocalStrategy = require('passport-local').Strategy;
const LOCAL_STRATEGY_CONFIG = {
  usernameField: 'username',
  passwordField: 'password',
  session: false,
};

// Serializing user

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function(err, user) {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

// Defining Strategies
passport.use(new LocalStrategy(LOCAL_STRATEGY_CONFIG,
                                function(username, password, done) {
    User.findOne({username: username}, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (user.password != password) {
        return done(null, false);
      }
      console.log('Success');
      return done(null, user);
    });
  }
));


// Routes
router.post('/users',
            passport.authenticate('local', {failureRedirect: '/error'}),
            function(req, res) {
              res.end();
});

module.exports = router;
