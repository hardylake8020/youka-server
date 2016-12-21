/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var newTenderService = require('../../../libraries/services/new_tender_driver'),
  fs = require('fs');


exports.grab = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;
  newTenderService.grab(currentDriver, tender._id, function (err, result) {
    return res.send(err || result);
  })
};

exports.getUnStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentCount = parseInt(req.query.currentCount || req.body.currentCount) || 0;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var condition = {
    currentCount: currentCount,
    limit: limit,
    sort: {created: -1}
  };

  newTenderService.getUnStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.getStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentCount = parseInt(req.query.currentCount || req.body.currentCount) || 0;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var status = req.query.status || req.body.status || 'unAssigned';

  var condition = {
    currentCount: currentCount,
    limit: limit,
    sort: {created: -1},
    status: status
  };

  newTenderService.getStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.assginDriver = function (req, res, next) {
  var currentDriver = req.driver;
  var curCard = req.card;
  var curTurck = req.truck;
  var tender = req.tender;

  newTenderService.assignDriver(tender, req.body.driver_number, curCard, curTurck, function (err, result) {
    return res.send(err || result);
  })
};