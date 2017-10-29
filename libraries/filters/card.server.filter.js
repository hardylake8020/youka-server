'use strict';

var cryptoLib = require('../crypto'),
  cardService = require('../services/card'),
  error = require('../../errors/all');


exports.requireById = function (req, res, next) {
  var cardId = req.query.card_id || req.body.card_id || '';

  if (!cardId) {
    return res.send({ err: { type: 'card_id_not_exist' } });
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
