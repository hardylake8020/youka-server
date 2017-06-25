/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var truckService = require('../../../libraries/services/truck');


exports.create = function (req, res, next) {
  var curDriver = req.driver;
  truckService.create(curDriver, req.body.truck_info, function (err, result) {
    return res.send(err || result);
  });
};

exports.getListByDriver = function (req, res, next) {
  var curDriver = req.driver;
  truckService.getListByDriver(curDriver, function (err, result) {
    return res.send(err || result);
  });
};

exports.getById = function (req, res, next) {
  return res.send(req.truck);
};

exports.getAllSuppliers = function (req, res, next) {
  truckService.getAllSuppliers(req.body.keyword, function (err, result) {
    return res.send(err || result);
  });
//
};


exports.getAllDriversBySupplier = function (req, res, next) {
  truckService.getAllDriversBySupplier(req.driverById, req.body.keyword, function (err, result) {
    return res.send(err || result);
  });
//
};
