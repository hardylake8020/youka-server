/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  CompanyAddress = appDb.model('CompanyAddress'),
  CompanyConfiguration = appDb.model('CompanyConfiguration'),
  Company = appDb.model('Company');

var that = exports;

function checkAddressExist(companyId, addressInfo, callback) {
  if (!companyId || !addressInfo || !addressInfo.detail) {
    return callback({err: error.params.invalid_value});
  }

  var condition = {
    company: companyId,
    $or: []
  };
  if (addressInfo.brief) {
    condition.$or.push({brief: addressInfo.brief});
  }
  if (addressInfo.detail) {
    condition.$or.push({detail: addressInfo.detail});
  }
  if (condition.$or.length === 0) {
    return callback({err: error.params.invalid_value});
  }

  CompanyAddress.findOne(condition, function (err, companyAddress) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, companyAddress);
  });
}

function getLocationInfoByAddress(companyId, address, callback) {
  var addressInfo;
  if (address) {
    addressInfo = {
      brief: address,
      detail: address
    };
  }

  checkAddressExist(companyId, addressInfo, function (err, companyAddress) {
    if (companyAddress) {
      return callback(null, {
        detail: companyAddress.detail,
        brief: companyAddress.brief,
        location: companyAddress.location
      });
    }
    return callback();
  });
}

function getLocationInfosByAddresses(companyId, addressArray, callback) {
  var locationArray = [];

  if (!companyId || !addressArray || addressArray.length === 0) {
    return callback(null, locationArray);
  }
  async.eachSeries(addressArray, function (addressItem, asyncCallback) {
    if (!addressItem) {
      locationArray.push(null);
      return asyncCallback();
    }
    getLocationInfoByAddress(companyId, addressItem, function (err, location) {
      locationArray.push(location);
      return asyncCallback();
    });
  }, function (err) {

    return callback(null, locationArray);
  });
}


function getCompanyConfiguration(companyId, callback) {
  if (!companyId) {
    return callback({err: error.params.empty});
  }

  CompanyConfiguration.findOne({company: companyId}, function (err, configuration) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, configuration);
  });
}

exports.getLocationInfoByAddress = function (companyId, address, callback) {
  return getLocationInfoByAddress(companyId, address, callback);
};

exports.getLocationInfosByAddresses = function (companyId, addressArray, callback) {
  return getLocationInfosByAddresses(companyId, addressArray, callback);
};

exports.getConfiguration = function (companyId, callback) {
  return getCompanyConfiguration(companyId, callback);
};

exports.getCompanyByName = function (name, callback) {
  if (!name) {
    return callback({err: error.params.empty});
  }
  Company.findOne({name: name}, function (err, companyEntity) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    return callback(null, companyEntity);
  });
};