const express = require('express');
const VCard = require('../models/vcard');
const sanitize = require('mongo-sanitize');
const router = new express.Router();

router.get('/:cardId', function(req, res, err) {

});

module.exports = router;
