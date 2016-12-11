/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var grabService = require('../../../libraries/services/new_tender_driver'),
  bidRecordService = require('../../../libraries/services/bid_record'),
  Promise = require('promise'),
  fs = require('fs');


exports.grab = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;
  grabService.grab(currentDriver, tender._id, function (err, result) {
    return res.send(err || result);
  })
};

exports.assignDriver = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;


};