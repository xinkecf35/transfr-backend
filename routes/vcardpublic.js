const express = require('express');
const VCard = require('../models/vcard');
const sanitize = require('mongo-sanitize');
const router = new express.Router();

/*
 * This route allows public access to a specified profile
 * Route requires a PathParam to indicate what profile to return
 * Returns a object that is safe for public use;
 * strips ObjectId and profileId from record
 */

router.get('/:cardId', function(req, res, next) {
  let cardId = sanitize(req.params.cardId);
  let cardQuery = VCard.
    findOne({profileId: cardId}).
    select('-_id -profileId -__v').
    exec();
  cardQuery.then(function(card) {
    if (card) {
      const meta = {sucesss: true};
      res.json({meta, card});
    } else {
      let error = new Error('no such card');
      error.status = 404;
      throw error;
    }
  }).catch(next);
});

module.exports = router;
