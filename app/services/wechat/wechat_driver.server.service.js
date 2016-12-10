/**
 * Created by zenghong on 15/12/3.
 */
'use strict';

var appDb = require('../../../libraries/mongoose').appDb,
  async = require('async'),
  driverError = require('../../errors/driver'),
  driverService = require('../../services/driver'),
  Driver = appDb.model('Driver');

function findDriverByOpenid(openid, callback) {
  Driver.findOne({'wechat_profile.openid': openid}, function (err, driver) {
    if (err) {
      return callback({err: driverError.internal_system_error});
    }
    return callback(null, driver);
  });
}

function findDriverByUsername(username, callback) {
  Driver.findOne({username: username}, function (err, driver) {
    if (err) {
      return callback({err: driverError.internal_system_error});
    }
    return callback(null, driver);
  });
}

exports.getByOpenid = function (openid, callback) {
  return findDriverByOpenid(openid, callback);
};

exports.bindWx = function (username, openid, wxProfile, callback) {
  async.auto({
    unbind: function (autoCallback) {
      findDriverByOpenid(openid, function (err, driver) {
        if (err) {
          return autoCallback(err);
        }
        if (driver) {
          driver.wechat_profile = {};
          driver.markModified('wechat_profile');
          driver.save(function (err, saveDriver) {
            if (err || !saveDriver) {
              return autoCallback({err: driverError.internal_system_error});
            }
            return autoCallback(null);
          });
        }
        else {
          return autoCallback(null);
        }
      });
    },
    bind: ['unbind', function (autoCallback, result) {
      findDriverByUsername(username, function (err, driver) {
        if (err) {
          return autoCallback(err);
        }

        if (!driver) {
          driver = new Driver({username: username});
        }

        driver.wechat_profile = wxProfile;
        driver.markModified('wechat_profile');
        driver.save(function (err, saveDriver) {
          if (err || !saveDriver) {
            return autoCallback({err: driverError.internal_system_error});
          }
          return autoCallback(null, saveDriver);
        });
      });
    }],
    acceptInvite: ['bind', function (autoCallback, result) {
      driverService.addCooperation(result.bind, function (err) {
        return autoCallback();
      });
    }]
  }, function (err, result) {
    return callback(err, result.bind);
  });
};