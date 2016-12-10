/**
 * Created by Wayne on 15/12/21.
 */

'use strict';

var async = require('async'),
  error = require('../../errors/all'),

  appDb = require('../mongoose').appDb,
  DriverCompany = appDb.model('DriverCompany'),
  Driver = appDb.model('Driver');

var self = exports;

function getOneDriverByCondition(condition, callback) {
  Driver.findOne(condition, function (err, driver) {
    if (err) {
      err = {err: error.system.db_error};
    }
    return callback(err, driver);
  });
}
function getDriversByCondition(condition, callback) {
  Driver.find(condition)
    .exec(function (err, drivers) {
      if (err) {
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, drivers);
    });
}
function getDriverCompaniesByDriverId(condition, callback) {
  DriverCompany.find(condition, function (err, result) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, result);
  });
}

exports.getSignupedDriversByPhoneArray = function (phoneArray, callback) {
  self.getDriversByPhoneArray(phoneArray, function (err, drivers) {
    if (err) {
      return callback(err);
    }
    if (!drivers) {
      return callback(null, []);
    }

    var singupDrivers = drivers.filter(function (item) {
      return item.is_signup;
    });

    return callback(null, singupDrivers);
  });
};

exports.getDriversByPhoneArray = function (phoneArray, callback) {
  if (!phoneArray || !Array.isArray(phoneArray) || phoneArray.length === 0) {
    return callback({err: error.params.empty});
  }

  async.auto({
    checkPhone: function (checkCallback) {
      async.each(phoneArray, function (phoneItem, itemCallback) {
        if (!phoneItem || !phoneItem.testPhone()) {
          return itemCallback({err: error.business.phone_invalid});
        }
        return itemCallback();
      }, function (err) {
        return checkCallback(err);
      });
    },
    findDrivers: ['checkPhone', function (findCallback, result) {
      getDriversByCondition({username: {$in: phoneArray}}, function (err, drivers) {
        return callback(err, drivers);
      });
    }]

  }, function (err, result) {
    return callback(err, result.findDrivers);
  });

};

//去除了短信司机,没有限制公司
exports.getAssignDriver = function (assignInfo, companyId, callback) {
  if (!assignInfo) {
    return callback({err: error.params.empty});
  }
  if (assignInfo.driver_id) {

    Driver.findOne({_id: assignInfo.driver_id}).exec(function (err, driverEntity) {
      if (err) {
        console.log(err);
        err = {err: error.system.db_error};
      }

      return callback(err, driverEntity);
    });
  }
  else {
    return callback({err: error.business.driver_id_empty});
  }
};

exports.getDriverCompanyIdsByUsername = function (username, callback) {
  if (!username || !username.testPhone()) {
    return callback({err: error.params.invalid_value});
  }
  async.auto({
    findDriver: function (autoCallback) {
      getOneDriverByCondition({username: username}, function (err, driver) {
        if (err) {
          return autoCallback(err);
        }
        //不是司机也可以
        //if (!driver) {
        //  return autoCallback({err: error.business.driver_not_exist});
        //}
        return autoCallback(null, driver);
      });
    },
    findDriverCompanies: ['findDriver', function (autoCallback, result) {
      if (!result.findDriver) {
        return autoCallback(null, []);
      }
      getDriverCompaniesByDriverId({driver: result.findDriver._id}, function (err, driverCompanies) {
        return autoCallback(err, driverCompanies);
      });
    }],
    getCompanies: ['findDriverCompanies', function (autoCallback, result) {
      if (result.findDriverCompanies.length > 0) {
        var companyIds = result.findDriverCompanies.map(function (item) {
          return item.company.toString();
        });
        return autoCallback(null, companyIds);
      }
      else {
        return autoCallback(null, []);
      }
    }]

  }, function (err, result) {
    if (err) {
      return callback(err);
    }

    return callback(null, result.getCompanies);
  });
};

exports.getDriverByPhone = function (username, callback) {
  return getOneDriverByCondition({username: username}, callback);
};