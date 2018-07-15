const express = require('express');
const User = require('../models/user.js');
const VCard = require('../models/vcard.js');
const router = new express.Router();

// Create a VCard Profile for User
router.post('/:userId/profiles', function(req, res, next) {
  const username = (req.params.userId).toString();
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
    VCard.setOptionalAttributes(body, profile);
    profile.save(function(err) {
      if (err) {
        next(err);
      }
    });
    user.vcards.push(profile._id);
    user.save();
    res.status(201).send(profile);
  });
});

// Get all user info.
router.get('/:userId', function(req, res, next) {
  const username = (req.params.userId).toString();
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

router.delete('/:userId/profiles/:profileId', function(req, res, next) {
  // Santizing query paths
  const username = (req.params.userId).toString();
  const profileId = (req.params.profileId).toString();

  // Parameters for findOneAndUpdate
  const filter = {username: username};
  const update = {$pull: {vcards: {$in: profileId}}};
  const options = {new: true}

  User.findOneAndUpdate(filter, update, options, function(err, user) {
    if (err) {
      next(err);
    }
    res.json(user);
  });
});

module.exports = router;
