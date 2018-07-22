const express = require('express');
const User = require('../models/user.js');
const VCard = require('../models/vcard.js');
const router = new express.Router();

// Create a VCard Profile for User
router.post('/profiles', function(req, res, next) {
  const username = req.user.username;
  User.findOne({username: username}, function(err, user) {
    if (err) {
      next(err);
    }
    if (!user) {
      // Uh, this should not be triggered considering
      // authentication should have failed first,
      // missing some assumption maybe?
      return res.status(500).send('How the hell did you get here!?');
    }
    const body = req.body;
    if (!VCard.verifyBody(body)) {
      res.status(400).send('Missing required parameters; check body');
    }
    let profile = new VCard({
      description: body.description,
      name: body.name,
      fullName: body.fullName,
    });
    profile.setOptionalAttributes(body);
    profile.save(function(err) {
      if (err) {
        next(err);
      } else {
        user.vcards.push(profile._id);
        user.save(function(err) {
          if (err) {
            next(err);
          } else {
            res.status(201).send(profile);
          }
        });
      }
    });
  });
});

// Get all user info.
router.get('/', function(req, res, next) {
  const username = req.user.username;
  User.findOne({username: username}).populate('vcards').exec(
    function(err, vcards) {
      if (err) {
        next(err);
      }
      if (!vcards) {
        res.status(500).send('Unable to retrieve data');
      }
      res.json(vcards);
    });
});

router.delete('/profiles/:profileId', function(req, res, next) {
  const cardQuery = VCard.findOneAndDelete({profileId: req.params.profileId});
  const deletePromise = cardQuery.exec();
  deletePromise.then(function(card) {
    if (card) {
      const filter = {username: req.user.username};
      const update = {$pull: {vcards: {$in: card._id}}};
      const options = {new: true};
      return User.findOneAndUpdate(filter, update, options);
    } else {
      res.json({success: false, error: 'no such record'});
    }
  }).then(function(user) {
    if (user) {
      const meta = {success: true};
      const body = {user, meta};
      res.json(body);
    }
  }).catch(function(err) {
    console.log(err);
    next(err);
  });
});

module.exports = router;
