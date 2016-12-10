/**
 * Created by elinaguo on 15/6/2.
 */
'use strict';
var driverError = require('../errors/driver'),
  pushLib = require('../libraries/getui'),
  cryptoLib = require('../libraries/crypto'),
  appDb = require('../../libraries/mongoose').appDb,
  Driver = appDb.model('Driver'),
  async = require('async'),
  Company = appDb.model('Company'),
  InviteDriver = appDb.model('InviteDriver'),
  DriverCompany = appDb.model('DriverCompany');
var self = exports;

exports.phoneValid = function (phoneString) {
  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(phoneString)) {
    return false;
  } else {
    if (phoneString.length === 11) {
      return true;
    } else {
      return false;
    }
  }
};
exports.passwordInputValid = function (passwordString) {
//密码验证
  if (passwordString.length < 6) {
    return false;
  }

  return true;
};

exports.getInviteRecord = function (driverPhone, callback) {
  if (!driverPhone) {
    return callback(driverError.params_null);
  }
  InviteDriver.find({username: driverPhone}, function (err, inviteDriverEntities) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    return callback(null, inviteDriverEntities);
  });

};

exports.getInviteDriver = function (driverPhone, companyId, callback) {
  if (!driverPhone || !companyId) {
    return callback(driverError.params_null);
  }
  InviteDriver.findOne({username: driverPhone, company: companyId}, function (err, inviteDriverEntity) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    return callback(null, inviteDriverEntity);
  });

};

exports.getCorporateDriver = function (driverId, companyId, callback) {
  if (!driverId || !companyId) {
    return callback(driverError.params_null);
  }
  DriverCompany.findOne({driver: driverId, company: companyId}, function (err, driverCompanyEntity) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    return callback(null, driverCompanyEntity);
  });

};

exports.createInviteDriver = function (driverPhone, companyId, status, callback) {
  if (!driverPhone || !companyId) {
    return callback(driverError.params_null);
  }
  if (!status) {
    status = 'inviting';
  }

  this.getInviteDriver(driverPhone, companyId, function (err, inviteDriverEntity) {
    if (err) {
      return callback(err);
    }
    if (inviteDriverEntity) {
      if (inviteDriverEntity.status !== status) {
        inviteDriverEntity.status = status;
      }
    }
    else {
      inviteDriverEntity = new InviteDriver({
        username: driverPhone,
        company: companyId,
        status: status
      });
    }

    inviteDriverEntity.save(function (err, saveEntity) {
      if (err) {
        return callback(driverError.internal_system_error);
      }

      return callback(null, saveEntity);
    });

  });

};

exports.createDriverCompany = function (driverId, companyId, callback) {
  if (!driverId || !companyId) {
    return callback(driverError.params_null);
  }

  DriverCompany.findOne({driver: driverId, company: companyId}, function (err, findDriverCompany) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    if (!findDriverCompany) {
      findDriverCompany = new DriverCompany({
        driver: driverId,
        company: companyId
      });
      findDriverCompany.save(function (err, saveDriverCompany) {
        if (err || !saveDriverCompany) {
          return callback(driverError.internal_system_error);
        }
        return callback(null, saveDriverCompany);
      });
    }
    else {
      return callback(null, findDriverCompany);
    }

  });
};

//返回一个司机实体
exports.getDriverByPhone = function (driverPhone, callback) {
  if (!driverPhone) {
    return callback(driverError.params_null);
  }

  Driver.findOne({username: driverPhone}, function (err, driverEntity) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    return callback(null, driverEntity);
  });

};

exports.getDriverById = function (driverId, callback) {
  if (!driverId) {
    return callback(driverError.params_null);
  }

  Driver.findOne({_id: driverId}, function (err, driverEntity) {
    if (err) {
      return callback(driverError.internal_system_error);
    }
    return callback(null, driverEntity);
  });

};

exports.pushInviteToDriver = function (driver, inviteDriver) {
  var pushData = {
    type: 'new_invite',
    invite_driver: inviteDriver,
    username: driver.username
  };

  if (driver.device_id) {
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }

  if (driver.device_id_ios) {
    pushLib.transmissionIosInfoPush(pushData, {
      message: '公司邀请通知',
      sound: 'new_invite.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }
};

exports.pushAccountDisconnectToDriver = function (driver) {
  var pushData = {
    type: 'account_disconnected',
    username: driver.username
  };

  if (driver.device_id) {
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }

  if (driver.device_id_ios) {
    pushLib.transmissionIosInfoPush(pushData, {
      message: '其他设备登陆通知'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }
};

exports.updateDriverCurTrace = function (lng, lat, driverId, callback) {
  Driver.findOne({_id: driverId}, function (err, driver) {
    lng = parseFloat(lng);
    lat = parseFloat(lat);
    if (lng && lat) {
      driver.current_location = [lng, lat];
    }
    driver.save(function (err, newDriver) {
      //不管成功与否 返回
      return callback();
    });
  });
};

function createNewTemporaryDriver(username, callback) {
  var phoneRegex = /\d{11}/;
  if (username && phoneRegex.test(username)) {
    Driver.findOne({username: username}, function (err, findDriver) {
      if (err) {
        return callback(driverError.internal_system_error);
      }
      if (!findDriver) {
        var newDriver = new Driver();
        newDriver.username = username;
        newDriver.password = newDriver.hashPassword('zz-temporary-driver' + username); //临时密码
        newDriver.temporary = true;

        newDriver.save(function (err, driverEntity) {
          if (err || !driverEntity) {
            return callback(driverError.internal_system_error);
          }
          else {
            return callback(null, driverEntity);
          }
        });
      }
      else {
        return callback(null, findDriver);
      }
    });
  }
  else {
    return callback(driverError.driver_id_or_name_null);
  }
}

//如果有driver_id, 则根据driver_id获取司机
//如果没有driver_id, 且includeTemporaryDriver 则根据driver_username查找司机，如果没有则创建司机
//return 1、err 2、空driver 3、driver
//exports.getAssignDriver = function (assignInfo, callback) {
//  if (!assignInfo) {
//    return callback(driverError.driver_id_or_name_null);
//  }
//  if (assignInfo.driver_id) {
//    Driver.findOne({_id: assignInfo.driver_id}, function (err, driverEntity) {
//      if (err) {
//        return callback(driverError.internal_system_error);
//      }
//      return callback(null, driverEntity);
//    });
//  }
//  else if (assignInfo.driver_username) {
//    createNewTemporaryDriver(assignInfo.driver_username, function (err, newDriver) {
//      if (err) {
//        return callback(err);
//      }
//      else {
//        return callback(null, newDriver);
//      }
//    });
//  }
//  else {
//    return callback(driverError.driver_id_or_name_null);
//  }
//
//};

exports.getAssignDriver = function (assignInfo, companyId, callback) {
  if (!assignInfo) {
    return callback(driverError.driver_id_or_name_null);
  }
  if (assignInfo.driver_id) {
    companyId = companyId || '';
    DriverCompany.findOne({
      driver: assignInfo.driver_id,
      company: companyId
    }).populate('driver').exec(function (err, companyDriver) {
      if (err) {
        return callback(driverError.internal_system_error);
      }
      if (!companyDriver) {
        return callback(null, null);
      }
      return callback(null, companyDriver.driver);
    });
  }
  else if (assignInfo.driver_username) {
    createNewTemporaryDriver(assignInfo.driver_username, function (err, newDriver) {
      if (err) {
        return callback(err);
      }
      else {
        return callback(null, newDriver);
      }
    });
  }
  else {
    return callback(driverError.driver_id_or_name_null);
  }
};

exports.updateDriverVersionByUsername = function (version, platform, username, callback) {
  Driver.findOne({username: username}, function (err, driver) {
    if (err || !driver) {
      return callback(err);
    }

    if (platform === 'android') {
      driver.android_version = version;
    }
    if (platform === 'ios') {
      driver.ios_version = version;
    }

    driver.save(function (err, driver) {
      if (err || !driver) {
        return callback(err);
      }
      return callback(null, driver);
    });
  });
};

exports.addCooperation = function (driver, callback) {
  if (!driver) {
    return callback(driverError.params_null);
  }
  self.getInviteRecord(driver.username, function (err, inviteEntities) {
    if (err) {
      return callback(err);
    }
    if (!inviteEntities || inviteEntities.length <= 0) {
      return callback(null, null);
    }

    async.each(inviteEntities, function (inviteDriver, eachCallback) {
      if (inviteDriver.status !== 'inviting') {
        return eachCallback();
      }

      //先创建合作关系
      self.createDriverCompany(driver._id, inviteDriver.company, function (err, createDriverCompany) {
        if (err) {
          return eachCallback(driverError.internal_system_error);
        }

        //接收邀请
        inviteDriver.status = 'accepted';
        inviteDriver.save(function (err, saveInviteDriver) {
          if (err || !saveInviteDriver) {
            return eachCallback(driverError.internal_system_error);
          }

          return eachCallback();
        });

      });

    }, function (err) {
      if (err) {
        return callback(err);
      }

      return callback(null, null);
    });

  });
};
