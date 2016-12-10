'use strict';

var async = require('async'),
  cryptoLib = require('../libraries/crypto'),
  config = require('../../config/config'),
  appDb = require('../../libraries/mongoose').appDb;

//服务
var DriverService = require('../services/driver');

//错误
var thirdAccountError = require('../errors/third_account'),
  driverError = require('../errors/driver');

//模型
var Driver = appDb.model('Driver'),
  ThirdAccount = appDb.model('ThirdAccount');


//司机第三方账户登录
exports.driverSignin = function (req, res, next) {
  var uploadDataString = req.body.uploadData || {};

  var uploadData = JSON.parse(uploadDataString);

  var userType = uploadData.user_type || 'driver';

  var thirdAccountQueryCondition = {
    open_id: uploadData.open_id,
    third_account_id: uploadData.third_account_id,
    provider: uploadData.provider,
    user_type: userType
  };

  ThirdAccount.findOne(thirdAccountQueryCondition)
    .exec(function (err, thirdAccountEntity) {
      if (err) {
        req.err = {err: thirdAccountError.internal_system_error};
        return next();
      }

      async.auto({
        thirdEntity: function (callback) {
          if (thirdAccountEntity) {
            thirdAccountEntity.access_token = uploadData.access_token;
            thirdAccountEntity.user_type = userType;
            thirdAccountEntity.nickname = uploadData.nickname;
            thirdAccountEntity.gender = uploadData.gender;
            thirdAccountEntity.photo = uploadData.photo;
            thirdAccountEntity.address = uploadData.address;
            thirdAccountEntity.remark = uploadData.remark;
            thirdAccountEntity.others = uploadData.others;
            thirdAccountEntity.save(function (err, saveThirdAccount) {
              if (err || !saveThirdAccount) {
                return callback({err: thirdAccountError.internal_system_error});
              }

              return callback(null, saveThirdAccount);
            });
          } else {
            var newThirdAccount = new ThirdAccount({
              open_id: uploadData.open_id,
              third_account_id: uploadData.third_account_id,
              access_token: uploadData.access_token,
              user_type: userType,
              provider: uploadData.provider,
              nickname: uploadData.nickname,
              photo: uploadData.photo,
              address: uploadData.address,
              remark: uploadData.remark,
              gender: uploadData.gender,
              others: uploadData.others
            });

            newThirdAccount.save(function (err, saveThirdAccount) {
              if (err || !saveThirdAccount) {
                return callback({err: thirdAccountError.internal_system_error});
              }

              return callback(null, saveThirdAccount);
            });
          }
        }
      }, function (err, result) {
        if (err) {
          req.err = err;
          return next();
        }

        //未绑定账户，登录失败
        if (!result.thirdEntity.username) {
          req.data = {loginSuccess: false, bindAccount: false};
          return next();
        }

        //已绑定账户，登录
        var internalUsername = result.thirdEntity.username;
        Driver.findOne({username: internalUsername})
          .exec(function (err, driver) {
            if (err) {
              req.err = {err: driverError.internal_system_error};
              return next();
            }

            //已绑定账户不存在
            if (!driver) {
              req.err = {err: driverError.account_not_exist};
              return next();
            }

            //无需验证，直接登录
            var access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
            delete driver._doc.password;
            delete driver._doc._id;
            req.data = {
              loginSuccess: true,
              access_token: access_token,
              driver: driver
            };
            return next();
          });
      });
    });
};

//账户绑定
exports.accountBinding = function (req, res, next) {
  var uploadDataString = req.body.uploadData || {};

  var uploadData = JSON.parse(uploadDataString);

  var username = uploadData.username;
  var password = uploadData.password;

  var third_account_id = uploadData.third_account_id;
  var open_id = uploadData.open_id;
  var provider = uploadData.provider;
  var access_token = uploadData.access_token;
  var user_type = uploadData.user_type || 'driver';

  var phoneValidResult = DriverService.phoneValid(username);
  if (!phoneValidResult) {
    req.err = {err: thirdAccountError.invalid_phone};
    return next();
  }

  if (!DriverService.passwordInputValid(password)) {
    req.err = {err: thirdAccountError.invalid_password};
    return next();
  }

  ThirdAccount.findOne({
    third_account_id: third_account_id,
    open_id: open_id,
    provider: provider,
    user_type: user_type
  }).exec(function (err, thirdAccountEntity) {
    if (err) {
      req.err = {err: thirdAccountError.internal_system_error};
      return next();
    }

    if (!thirdAccountEntity) {
      req.err = {err: thirdAccountError.invalid_third_account};
      return next();
    }

    //判断第三方access_token是否过期
    if (thirdAccountEntity.access_token !== access_token) {
      req.err = {err: thirdAccountError.access_token_invalid};
      return next();
    }

    //已经绑定了其他账户
    if (thirdAccountEntity.username && thirdAccountEntity.username !== username){
      req.err = {err: thirdAccountError.account_has_binded};
      return next();
    }


    Driver.findOne({username: username}).exec(function(err, driver){
      if (err) {
        req.err = {err: thirdAccountError.internal_system_error};
        return next();
      }

      //账户存在，验证并登录
      if (driver) {
        //验证
        if (!driver.authenticate(password)) {
          req.err = {err: driverError.invalid_password};
          return next();
        }

        //加关联
        thirdAccountEntity.username = username;
        thirdAccountEntity.save(function (err, saveThirdAccount) {
          if (err || !saveThirdAccount) {
            req.err = {err: thirdAccountEntity.internal_system_error};
            return next();
          }

          //登录
          var access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
          delete driver._doc.password;
          delete driver._doc._id;
          req.data = {
            loginSuccess: true,
            access_token: access_token,
            driver: driver
          };
          return next();
        });
      }
      //账户不存在或者是未绑定账户，创建账户，直接登录
      else{
        var newDriver = new Driver();
        newDriver.username = username;
        newDriver.password = newDriver.hashPassword(password);
        newDriver.current_third_account = thirdAccountEntity._id;

        newDriver.save(function (err, driver) {
          if (err) {
            req.err = {err: driverError.internal_system_error};
            return next();
          }

          thirdAccountEntity.username = username;
          thirdAccountEntity.save(function (err, saveThirdAccount) {
            if (err || !saveThirdAccount) {
              req.err = {err: thirdAccountEntity.internal_system_error};
              return next();
            }

            var access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
            delete driver._doc.password;
            delete driver._doc._id;
            req.data = {
              loginSuccess: true,
              access_token: access_token,
              driver: driver
            };
            return next();
          });
        });
      }

    });
  });
};
