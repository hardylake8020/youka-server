'use strict';

var async = require('async'),
  driverApiService = require('../../services/api/api.driver');

exports.checkDriverExistedByNumber = function (req, res, next) {
  var driverNumber = req.body.driver_number;

  driverApiService.findDriverByUsername(driverNumber, function (err, driver) {
    if (err) {
      return res.send(err);
    }
    if (!driver) {
      return res.send({existed: false});
    }
    return res.send({existed: true});
  });
};

exports.getCorporateDrivers = function (req, res, next) {
  var currentCompany = req.company;

  driverApiService.getCorporateDrivers(currentCompany._id, function (err, drivers) {
    if (err) {
      return res.send(err);
    }
    return res.send({drivers: drivers});
  });
};


