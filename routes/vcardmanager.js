const express = require('express');
const User = require('../models/user');
const VCard = require('../models/vcard');
const jsonpatch = require('fast-json-patch');
const sanitize = require('mongo-sanitize');
const router = new express.Router();

// Create a VCard Profile for User
router.post('/profiles', function(req, res, next) {
  const user = req.user;
  // Verify parameters are correct
  const body = sanitize(req.body);
  if (!VCard.verifyBody(body)) {
    const meta = {
      success: false,
      error: 'Missing required parameters, check body',
    };
    res.status(400).json({meta: meta});
  }
  // Create VCard and populate values
  let profile = new VCard({
    description: body.description,
    name: body.name,
    fullName: body.fullName,
  });
  profile.setOptionalAttributes(body);
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
router.get('/user', function(req, res, next) {
  const username = req.user.username;
  let userQuery = User.
    findOne({username: username}).
    populate('vcards', '-_id').
    select('-_id').
    exec();
  const success = function(user) {
    if (!user) {
      res.status(404).json({success: false, error: 'no such user exists'});
    }
    const meta = {success: true};
    res.json({meta, user});
  };
  const failure = function(err) {
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

router.patch('/profile/:profileId', function(req, res, next) {
  const body = sanitize(req.body);
  let validateError = jsonpatch.validate(body);
  if (validateError) {
    const meta = metaJson(validateError);
    res.status(400).json({meta: meta});
  }
  const profileId = sanitize(req.params.profileId);
  let cardQuery = VCard.findOne({profileId: profileId}).exec();
  cardQuery.then(function(card) {
    if (!card) {
      let error = new Error('no such profile');
      error.status = 404;
      throw error;
    }
    body.forEach((operation) => {
      if (operation.op !== 'remove') {
        jsonpatch.applyOperation(card, operation, false);
      } else {
        // Actually removes value from document
        const newOp = replaceRemoveOperation(operation);
        jsonpatch.applyOperation(card, newOp, false);
      }
    });
    return card.save();
  }).then(function(card) {
    const meta = {success: true};
    res.json({meta, card});
  }).catch(next);
});

/*
 * Route removes a specified profile as parameterized in URL
 * Expects a valid JWT and vCard shortId in URL as PathParam
 */
router.delete('/profile/:profileId', function(req, res, next) {
  const profileId = sanitize(req.params.profileId);
  const cardQuery = VCard.findOneAndDelete({profileId: profileId});
  const deletePromise = cardQuery.exec();
  deletePromise.then(function(card) {
    if (!card) {
      throw new Error('no such record');
    }
    const filter = {username: req.user.username};
    const update = {$pull: {vcards: {$in: card._id}}};
    const options = {new: true};
    return User.
      findOneAndUpdate(filter, update, options).
      populate('vcards', '-_id');
  }).then(function(user) {
    if (!user) {
      let error = new Error('no such user');
      error.status = 404;
      throw error;
    }
    const meta = {success: true};
    res.json({meta, user});
  }).catch(next);
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

/**
 * Returns a replace operation to subsitute remove operation while
 * while working on Mongoose Documents by creating a replace operation
 * that set a value that is undefined and thereby actually removing the
 * value
 * @param {*} operation The original remove operation
 * @return {*} New replace operation with undefined value
 */
function replaceRemoveOperation(operation) {
  return {
    op: 'replace',
    path: operation.path,
    value: undefined,
  };
}

