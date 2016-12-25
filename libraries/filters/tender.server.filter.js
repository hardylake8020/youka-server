'use strict';

var cryptoLib = require('../crypto'),
  tenderService = require('../services/new_tender'),
  error = require('../../errors/all');


exports.requireById = function (req, res, next) {
  var tenderId = req.query.tender_id || req.body.tender_id || '';

  if (!tenderId) {
    return res.send({err: error.params.empty});
  }

  tenderService.getOneByUser(tenderId, function (err, tender) {
    if (err) {
      return res.send(err);
    }

    if (!tender) {
      return res.send({err: error.business.tender_not_exist});
    }

    req.tender = tender;
    next();
  });
};
