const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const router = new express.Router();

// Strategies
const LocalStrategy = require('passport-local').Strategy;
const LOCAL_STRATEGY_CONFIG = {
  usernameField: 'username',
  passwordField: 'password',
  session: false,
};

// Serializing user

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

// Defining Strategies
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({username: username}, function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null,
                  false,
                  {message: 'Incorrect username or username not found'});
    }
    user.comparePassword(password, function(err, response) {
      if (err) {
        return done(err);
      }
      if (response) {
        return done(null, user);
      }
      done(null, false, {message: 'Incorrect password or username'});
    });
  });
}));

// Routes
router.post('/users', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Authentication failed
      return res.status(400).send({
                                  success: false,
                                  message: 'authentication failed'});
    }
    req.login(user, function(err) {
      if (err) {
        return next(err);
      }
      const profile = {
        username: user.username,
        email: user.email,
        vcards: user.vcardProfiles,
      };
      const token = jwt.sign(user.toObject(), process.env.JWT_SECRET);
      const responseObject = {
        profile: profile,
        token: token,
      };
      return res.json(responseObject);
    });
  })(req, res, next);
});

router.post('/users/new', function(req, res, next) {
  // Need to validate this at some point
  let user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.save(function(err, user) {
    if (err) {
      return err;
    }
    res.send(user);
  });
});

module.exports = router;
