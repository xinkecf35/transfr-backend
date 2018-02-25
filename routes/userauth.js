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
      return done(null, user);
    });
  }
));


// Routes
router.post('/users', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Authentication failed
      return res.status(401).send({
                                  success: false,
                                  message: 'authentication failed'});
    }
    req.login(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.send({success: true, message: 'authentication succeeded'});
    });
  })(req, res, next);
});


module.exports = router;
