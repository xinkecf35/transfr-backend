const express = require('express');
const User = require('../models/user');
const VCard = require('../models/vcard');
const jsonpatch = require('fast-json-patch');
const router = new express.Router();

// Create a VCard Profile for User
router.post('/profiles', function(req, res, next) {
  const user = req.user;
  // Verify parameters are correct
  if (!VCard.verifyBody(req.body)) {
    const meta = {
      success: false,
      error: 'Missing required parameters, check body',
    };
    res.status(400).json({meta: meta});
  }
  // Create VCard and populate values
  const body = req.body;
  let profile = new VCard({
    description: body.description,
    name: body.name,
    fullName: body.fullName,
  });
  profile.setOptionalAttributes(req.body);
  profile.save().then(function(card) {
    user.vcards.push(card._id);
    return user.save();
  }).then(function() {
    return VCard.findById(profile._id, '-_id').exec();
  }).then(function(card) {
    const meta = {success: true};
    res.status(201).json({user: card, meta});
  }).catch(next);
});

// Get all user info.
router.get('/', function(req, res, next) {
  const username = req.user.username;
  let userQuery = User.
    findOne({username: username}).
    populate('vcards', '-_id').
    select('-_id').
    exec();
  const success = function(user) {
    if (user) {
      res.json(user);
    } else {
      res.status(400).json({success: false, error: 'no such user exists'});
    }
  };
  const failure = function(err) {
    console.log(err);
    next(err);
  };
  userQuery.then(success, failure);
});

/*
 * Route updates a specified profile(vCard) as parameterized in URL
 * Expects a valid JWT and vCard shortId in URL as PathParam and
 * JSON body as outlined in RFC 6902
 * Update operations are applied with Fast-JSON-Patch
 */

router.patch('/profiles/:profileId', function(req, res, next) {
  let validateError = jsonpatch.validate(req.body);
  if (validateError) {
    const meta = metaJson(validateError);
    res.status(400).json({meta: meta});
  } else {
    const profileId = req.params.profileId;
    let cardQuery = VCard.findOne({profileId: profileId}).exec();
    cardQuery.then(function(card) {
      if (card) {
        let results = jsonpatch.applyPatch(card, req.body, false);
        console.log(results);
        card.save();
        const meta = {success: true};
        res.json({meta, card});
      } else {
        throw new Error('no such profile');
      }
    }).catch(function(err) {
      console.log(err);
      const meta = {success: false, error: err.message};
      res.status(400).json({meta: meta});
    });
  }
});

/*
 * Route removes a specified profile as parameterized in URL
 * Expects a valid JWT and vCard shortId in URL as PathParam
 */
router.delete('/profiles/:profileId', function(req, res, next) {
  const cardQuery = VCard.findOneAndDelete({profileId: req.params.profileId});
  const deletePromise = cardQuery.exec();
  deletePromise.then(function(card) {
    if (card) {
      const filter = {username: req.user.username};
      const update = {$pull: {vcards: {$in: card._id}}};
      const options = {new: true};
      return User.
        findOneAndUpdate(filter, update, options).
        populate('vcards', '-_id');
    } else {
      throw new Error('no such record');
    }
  }).then(function(user) {
    if (user) {
      const meta = {success: true};
      res.json({user, meta});
    } else {
      throw new Error('no such user');
    }
  }).catch(function(err) {
    console.log(err);
    const meta = metaJson(err);
    res.status(400).json({meta: meta});
  });
});

module.exports = router;

/**
 * Returns Serializable meta information for a request failure
 * Effectively wraps a success and error key
 * @param {*} err error in question
 * @return {*} Serializable meta information about failure
 */
function metaJson(err) {
  return {success: false, error: err.message};
}
