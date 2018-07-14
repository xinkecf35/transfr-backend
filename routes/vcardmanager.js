const express = require('express');
const User = require('../models/user.js');
const VCard = require('../models/vcard.js');
const router = new express.Router();

// Create a VCard Profile for User
router.post('/:userId/profiles', function(req, res, next) {
  let username = (req.params.userId).toString();
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
    profile.save();
    user.vcards.push(profile._id);
    res.status(201).send(profile);
  });
});

// Get all user info.
router.get(':userId/', function(req, res, next) {

});

// Get VCard Profiles for User

router.get('/:userId/profiles', function(req, res, next) {

});

module.exports = router;
