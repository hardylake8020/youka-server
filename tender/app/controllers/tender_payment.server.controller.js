/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var newTenderService = require('../../../libraries/services/new_tender_payment'),
  fs = require('fs');

exports.examine = function (req, res, next) {
  var tender = req.tender;
  var user = req.user;
  newTenderService.examine(tender, user, function (err, result) {
    return res.send(err || result);
  });
};

exports.payment = function (req, res, next) {
  var tender = req.tender;
  var user = req.user;

  if (!req.body.type) {
    return res.send({err: {type: 'empty_type'}});
  }

  newTenderService.payment(tender, user, req.body.type, req.body.number, function (err, result) {
    return res.send(err || result);
  });
};

exports.getPaymentTenderList = function (req, res, next) {
  var created = req.body.created || '';
  var type = req.body.type || 'unpayment';

  newTenderService.payment(created, type, function (err, result) {
    return res.send(err || result);
  });
};