/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var truckService = require('../../../libraries/services/truck'),
  fs = require('fs');


exports.create = function (req, res, next) {
  var curDriver = req.driver;
  truckService.create(curDriver, req.body.truck_info, function (err, result) {
    return res.send(err || result);
  });
};

exports.getListByDriver = function (req, res, next) {
  var curDriver = req.driver;
  truckService.create(curDriver, function (err, result) {
    return res.send(err || result);
  });
};