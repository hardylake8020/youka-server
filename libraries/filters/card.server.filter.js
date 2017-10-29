'use strict';

var cryptoLib = require('../crypto'),
  cardService = require('../services/card'),
  error = require('../../errors/all');


exports.requireById = function (req, res, next) {
  var cardId = req.query.card_id || req.body.card_id || '';

  if (!cardId) {
    req.card = {};
    return next
  }

  cardService.getOneById(cardId, function (err, card) {
    if (err) {
      return res.send(err);
    }

    // if (!card) {
    //   return res.send({err: error.business.tender_not_exist});
    // }

    req.card = card || {};
    next();
  });
};
