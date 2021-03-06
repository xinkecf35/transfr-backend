const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const sanitize = require('mongo-sanitize');
const User = require('../models/user.js');
const PassportLocal = require('passport-local');
const PassportJWT = require('passport-jwt');
const csurf = require('csurf');

const router = new express.Router();

let domain = '.transfr.info';
if (process.env.NODE_ENV === 'debug') {
  domain = '.transfr.test';
}

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
const cookieExtractor = function(req) {
  if (req && req.cookies) {
    return req.cookies['jwt'];
  } else {
    return null;
  }
};
const extractors = [
  PassportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  cookieExtractor,
];
const JWT_STRATEGY_CONFIG = {
  jwtFromRequest: PassportJWT.ExtractJwt.fromExtractors(extractors),
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
    const verify = function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username or username not found',
        });
      }
      user.comparePassword(password, function(err, response) {
        if (err) {
          return done(err);
        }
        if (response) {
          return done(null, user);
        }
        done(null, false, {
          message: 'Incorrect password or username',
        });
      });
    };
    User.findOne({username: username}, '+password', verify);
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

const options = {
  cookie: {
    httpOnly: true,
    secure: true,
    domain: domain,
    maxAge: 86400, // one day in seconds
  },
  ignoreMethods: ['POST']};
router.post('/', csurf(options), function(req, res, next) {
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
        iss: 'https://api.transfr.info',
        created: current.toISOString(),
      };
      const age = 86400;
      const token = jwt.sign(claims, process.env.JWT_SECRET, {
        expiresIn: age,
      });
      // Set JWT cookie
      let options = {
        httpOnly: true,
        secure: true,
        domain: domain,
        maxAge: age*1000,
      };
      // NOTE: for logout, we will set a cryptographic nonce set in the JWT
      // and store that to sessionStorage; we log out by removing that nonce
      // For authentication, that nonce must be there and compared
      res.cookie('jwt', token, options);
      const csrf = req.csrfToken();
      return res.status(200).json({claims, token, csrf});
    });
  })(req, res, next);
});

router.post('/token', function(req, res, next) {
  if (req.query.logout) {
    const options = {
      httpOnly: true,
      secure: true,
      domain: domain,
    };
    res.clearCookie('jwt', options);
    res.clearCookie('_csrf', options);
    const meta = {success: true, message: 'logging out'};
    res.json({meta});
  }
});

router.get('/google-auth/callback', function(req, res, next) {

});

/*
 * User data management
 */

// Update user
router.patch('/user/', function(req, res, next) {
  passport.authenticate('jwt', function(err, user, info) {
    if (err) {
      next(err);
    }
  });
});

// Creates a new user
router.post('/new', function(req, res, next) {
  req.body = sanitize(req.body);
  let user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.name = req.body.name;
  user.save(function(err, user) {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // username is not unique
        const meta = {
          success: false,
          error: 'username is not unique',
        };
        res.status(403).json(meta);
      } else {
        // Call error handler
        next(err);
      }
    }
    if (user) {
      const meta = {
        success: true,
        message: 'account successfully created',
      };
      const success = {
        created: user.created,
        username: user.username,
      };
      res.status(201).json({meta, success});
    }
  });
});

module.exports = router;
