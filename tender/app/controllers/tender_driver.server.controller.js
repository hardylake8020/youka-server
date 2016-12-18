/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var grabService = require('../../../libraries/services/new_tender_driver'),
  fs = require('fs');


exports.grab = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;
  grabService.grab(currentDriver, tender._id, function (err, result) {
    return res.send(err || result);
  })
};

exports.getUnStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentPage = parseInt(req.query.currentPage || req.body.currentPage) || 1;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var condition = {
    currentPage: currentPage,
    limit: limit,
    sort: {created: -1}
  };

  grabService.getUnStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.getStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentPage = parseInt(req.query.currentPage || req.body.currentPage) || 1;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var status = req.query.status || req.body.status || 'unAssigned';

  var condition = {
    currentPage: currentPage,
    limit: limit,
    sort: {created: -1},
    status: status
  };

  grabService.getStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};


exports.assginDriver = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;

  grabService.assignDriver(tender, req.body.driver_number, function (err, result) {
    return res.send(err || result);
  })
};