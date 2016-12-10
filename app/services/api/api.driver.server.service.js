'use strict';

var async = require('async'),
  cryptoLib = require('../../libraries/crypto'),
  appDb = require('../../../libraries/mongoose').appDb,
  driverApiError = require('../../errors/apis/api.driver'),
  signatureApiError = require('../../errors/apis/api.signature'),
  DriverCompany = appDb.model('DriverCompany'),
  Driver = appDb.model('Driver');

exports.findDriverByUsername = function (driver_number, callback) {
  if (!driver_number) {
    return callback({err: driverApiError.empty_driver_number});
  }

  Driver.findOne({username: driver_number}, function (err, driver) {
    if (err) {
      return callback({err: driverApiError.internal_system_error}); 
    }

    return callback(null, driver);
  });
};

exports.getCorporateDrivers = function (companyId, callback) {
  if (!companyId) {
    return callback({err: signatureApiError.empty_company_id});
  }

  DriverCompany.find({company: companyId}, function (err, driverCompanyList) {
    if (err) {
      return callback({err: driverApiError.internal_system_error});
    }
    if (!driverCompanyList || driverCompanyList.length === 0) {
      return callback(null, []);
    }

    var driverIds = [];
    async.each(driverCompanyList, function (driverCompanyItem, asyncCallback) {
      driverIds.push(driverCompanyItem.driver);
      return asyncCallback();
    }, function (err) {

      Driver.find({_id: {$in: driverIds}, $or: [{deleted: {$exists: false}},{deleted: false}]})
        .select('username email nickname birthday age plate_numbers create_time')
        .sort({create_time: -1})
        .exec(function (err, drivers) {
          if (err) {
            return callback({err: driverApiError.internal_system_error});
          }
          return callback(null, drivers);
        });
    });
  });
};