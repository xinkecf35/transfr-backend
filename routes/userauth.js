const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const PassportLocal = require('passport-local');
const PassportJWT = require('passport-jwt');

const router = new express.Router();

/*
* Defining Passport Strategies
*/

// Strategies & options for Passport
const LocalStrategy = PassportLocal.Strategy;
const LOCAL_STRATEGY_CONFIG = {
  usernameField: 'username',
  passwordField: 'password',
  session: false,
};
const JWTStrategy = PassportJWT.Strategy;
const JWT_STRATEGY_CONFIG = {
  jwtFromRequest: PassportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
};

// Serializing user
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

// Local Strategy
passport.use(new LocalStrategy(LOCAL_STRATEGY_CONFIG,
  function(username, password, done) {
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

// JWT Strategy
passport.use(new JWTStrategy(JWT_STRATEGY_CONFIG,
  function(req, jwtPayload, done) {
    User.findOne({username: jwtPayload.sub}, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }));


/*
 * Authentication and authorization of users
 */

// Password authentication
router.post('/', function(req, res, next) {
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
      // Authentication successful, return a jwt
      let current = new Date();
      const claims = {
        sub: user.username,
        name: user.name,
        iss: 'https://transfr.info',
        created: current.toISOString(),
      };
      const token = jwt.sign(claims, process.env.JWT_SECRET, {
        expiresIn: 86400,
      });
      return res.status(201).json({claims, token});
    });
  })(req, res, next);
});

/*
 * User data management
 */

// Update user
router.patch('/', function(req, res, next) {
  passport.authenticate('jwt', function(err, user, info) {
  });
});

// Creates a new user
router.post('/new', function(req, res, next) {
  // Need to validate this at some point
  let user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.name = req.body.name;
  user.save(function(err, user) {
    if (err) {
      return err;
    }
    res.send(user);
  });
});

module.exports = router;
