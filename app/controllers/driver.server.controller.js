'use strict';
/**
 * Module dependencies.
 */

var driverError = require('../errors/driver'),
  orderError = require('../errors/order'),
  async = require('async'),
  pushLib = require('../libraries/getui'),
  q = require('q'),
  path = require('path'),
  smsLib = require('../libraries/sms'),
  cryptoLib = require('../libraries/crypto'),
  config = require('../../config/config'),
  appDb = require('../../libraries/mongoose').appDb,
  OrderService = require('../services/order'),
  userService = require('../services/user'),
  DriverService = require('../services/driver'),
  driverEvaluationService = require('../services/driver_evaluation'),
//用户模型
  Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  InviteDriver = appDb.model('InviteDriver'),
  DriverCompany = appDb.model('DriverCompany'),
  SMSVerify = appDb.model('SmsVerify'),
  TempDriverVersion = appDb.model('TempDriverVersion'),
  Order = appDb.model('Order'),
  ThirdAccount = appDb.model('ThirdAccount');

////以前Invite driver实现


exports.invite1 = function (req, res, next) {
  var user = req.user || {};
  var phone = req.body.username || '';
  var curCompany = user.company || {};

  if (!phone.testPhone()) {
    return res.send({err: driverError.invalid_phone});
  }

  async.auto({
    isDriverExist: function(autoCallback) {
      DriverService.getDriverByPhone(phone, function (err, driverEntity) {
        if (err) {
          err = {err: err};
        }
        return autoCallback(err, driverEntity);
      });
    },
    isDriverCompanyExist: ['isDriverExist', function(autoCallback, result) {
      if (!result.isDriverExist) {
        return autoCallback();
      }

      DriverService.getCorporateDriver(result.isDriverExist._id, curCompany._id, function(err, driverCompany){
        if (err) {
          return autoCallback({err: err});
        }
        if (driverCompany) {
          return autoCallback({err: driverError.has_been_partner});
        }

        return autoCallback();
      });

    }],
    createDriver: ['isDriverExist', 'isDriverCompanyExist', function(autoCallback, result) {
      if (result.isDriverExist) {
        return autoCallback(null, result.isDriverExist);
      }
      var password = '123456';

      var newDriver = new Driver();
      newDriver.username = phone;
      newDriver.password = newDriver.hashPassword(password);
      newDriver.save(function (err, saveDriver) {
        if (err) {
          err = {err: driverError.internal_system_error};
        }


        console.log('create a new driver: ' + phone + ', ' + password);
        //发送短信
        smsLib.sendDriverInviteSms(phone, curCompany.name, function (err, result) {});

        return autoCallback(err, saveDriver);
      });

    }],
    createDriverCompany: ['createDriver', function(autoCallback, result){
      DriverService.createDriverCompany(result.createDriver._id, curCompany._id, function(err, driverCompany) {
        if (err) {
          err = {err: err};
        }
        return autoCallback(err, driverCompany);
      });
    }]

  }, function(err, result){

    if (err) {
      return res.send(err);
    }

    return res.send(result.createDriver);

  });

};



exports.invite = function (req, res, next) {
  var user = req.user || {};
  var phone = req.body.username || '';
  var curCompany = user.company || '';

  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(phone)) {
    return res.send({err: driverError.invalid_phone});
  }
  else {
    Company.findOne({_id: curCompany}, function (err, company) {
      if (err) {
        return res.send({err: driverError.internal_system_error});
      }
      else if (!company) {
        return res.send({err: driverError.partner_not_exist});
      }
      else {
        smsLib.sendDriverInviteSms(phone, company.name, function (err, result) {
          if (err) {
            return res.send({err: driverError.invite_sms_error});
          }

          DriverService.getDriverByPhone(phone, function (err, driverEntity) {
            if (err) {
              req.err = {err: err};
              return next();
            }
            //司机已注册
            if (driverEntity) {
              DriverService.getInviteDriver(phone, curCompany._id, function (err, findInviteDriver) {
                if (err) {
                  req.err = {err: err};
                  return next();
                }
                if (!findInviteDriver) {
                  //先创建合作关系
                  DriverService.createDriverCompany(driverEntity._id, curCompany._id, function (err, createDriverCompany) {
                    if (err) {
                      req.err = {err: driverError.internal_system_error};
                      return next();
                    }

                    //再接收邀请
                    DriverService.createInviteDriver(phone, curCompany._id, 'accepted', function (err, createInviteDriver) {
                      if (err) {
                        req.err = {err: driverError.internal_system_error};
                        return next();
                      }
                      createInviteDriver._doc.company = curCompany; //目的在于客户端可以获取公司信息，当前的company字段时ObjectId
                      DriverService.pushInviteToDriver(driverEntity, createInviteDriver);
                      req.data = createInviteDriver;
                      return next();
                    });

                  });
                }
                else {
                  if (findInviteDriver.status === 'accepted') { //已成为合作伙伴
                    req.err = {err: driverError.has_been_partner};
                    return next();
                  }
                  else {
                    //创建合作关系
                    DriverService.createDriverCompany(driverEntity._id, curCompany._id, function (err, createDriverCompany) {
                      if (err) {
                        req.err = {err: driverError.internal_system_error};
                        return next();
                      }

                      //接收邀请
                      findInviteDriver.status = 'accepted';
                      findInviteDriver.save(function (err, saveInviteDriver) {
                        if (err || !saveInviteDriver) {
                          req.err = {err: driverError.internal_system_error};
                          return next();
                        }

                        saveInviteDriver._doc.company = curCompany; //目的在于客户端可以获取公司信息，当前的company字段时ObjectId
                        DriverService.pushInviteToDriver(driverEntity, saveInviteDriver);
                        req.data = saveInviteDriver;
                        return next();

                      });

                    });
                  }
                }

              });
            }
            else { //司机未注册

              //添加邀请记录
              DriverService.createInviteDriver(phone, curCompany._id, 'inviting', function (err, createInviteDriver) {
                if (err) {
                  req.err = {err: driverError.internal_system_error};
                  return next();
                }

                createInviteDriver._doc.company = curCompany;
                req.data = createInviteDriver;
                return next();
              });

            }

          });

        });
      }
    });
  }
};

exports.signUp = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';

  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(username)) {
    return res.send({err: driverError.invalid_phone});
  }

  //密码验证（至少6位）
  if (password.length < 6) {
    return res.send({err: driverError.invalid_password});
  }

  DriverService.getDriverByPhone(username, function (err, findDriver) {
    if (err) {
      return res.send({err:err});
    }
    if (findDriver && findDriver.password) {
      return res.send({err: driverError.account_exist});
    }

    if (!findDriver) {
      findDriver = new Driver();
    }

    findDriver.username = username;
    findDriver.password = findDriver.hashPassword(password);

    findDriver.save(function (err, driver) {
      if (err) {
        return res.send({err: driverError.internal_system_error});
      }
      else {
        DriverService.addCooperation(driver, function (err) {
          if (err) {
            req.err = {err: err};
            return next();
          }

          req.connection = req.connection ? req.connection : {};
          req.socket = req.socket ? req.socket : {};
          req.connection.socket = req.connection.socket ? req.connection.socket : {};
          delete driver._doc.password;
          return res.send(driver);

        });
      }
    });

  });
};

//获取短信验证码
exports.getSMSVerifyCode = function (req, res, next) {
  var phone = req.body.username || '';

  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(phone)) {
    return res.send({err: driverError.invalid_phone});
  }

  var code = smsLib.generateVerifyCode();
  var newSMSVerify = new SMSVerify();
  newSMSVerify.code = code;
  newSMSVerify.save(function (err, smsVerify) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    delete smsVerify._doc.code;
    smsLib.ypSendSmsVerifyCode(phone, code, function (err, result) {
      if (err) {
        return res.send({err: driverError.sms_send_error});
      }
      return res.send(smsVerify);
    });
  });
};

exports.signIn = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';
  var phoneId = req.body.phone_id || req.query.phone_id || '';

  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(username) && username.length > 11) {
    return res.send({err: driverError.invalid_phone});
  }

  //密码验证（至少6位）
  if (password.length < 6) {
    return res.send({err: driverError.invalid_password});
  }

  Driver.findOne({username: username}, function (err, driver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!driver) {
      return res.send({err: driverError.account_not_exist});
    }

    if (!driver.authenticate(password)) {
      return res.send({err: driverError.invalid_password});
    }

    if (driver.current_third_account) {
      driver.current_third_account = null;
    }

    var access_token = '';

    //phone_id，且phone_id不是当前传上来的phone_id。则通知之前的phone_id设备退出
    if (phoneId) {
      if (driver.phone_id && driver.phone_id !== phoneId) {
        DriverService.pushAccountDisconnectToDriver(driver);
      }

      if (!driver.phone_id || driver.phone_id !== phoneId) {
        driver.phone_id = phoneId;
        driver.save(function (err, saveDriver) {
          if (err || !saveDriver) {
            console.log(err);
            req.err = {err: driverError.internal_system_error};
            return next();
          }

          access_token = cryptoLib.encrypToken({_id: saveDriver._id, time: new Date()}, 'secret');
          delete saveDriver._doc.password;
          return res.send({access_token: access_token, driver: saveDriver});
        });
      }
      else {
        access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
        delete driver._doc.password;
        return res.send({access_token: access_token, driver: driver});
      }
    }
    else {
      access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
      delete driver._doc.password;
      return res.send({access_token: access_token, driver: driver});
    }
  });
};

exports.signOut = function (req, res, next) {
  return res.send('driver signout ok');
};

exports.getOrderById = function (req, res, next) {
  var currentDriver = req.driver || {};
  req.query = req.query || {};
  var order_id = req.query.order_id || '';

  Order.findOne({_id: order_id}).populate('order_detail pickup_contact delivery_contact').exec(function (err, orderEntity) {
    if (err) {
      return res.send({err: orderError.internal_system_error});
    }

    if (!orderEntity) {
      return res.send({err: orderError.order_not_exist});
    }

    if (orderEntity.execute_driver.toString() !== currentDriver._id.toString()) {
      return res.send({err: orderError.order_not_visible});
    }

    return res.send(orderEntity);
  });
};

//function getOrdersStatus(driver, status, callback) {
//  Order.find({execute_driver: driver._id, status: status})
//    .populate('order_detail pickup_contact delivery_contact')
//    .exec(function (err, orders) {
//      if (err) {
//        return callback(null);
//      }
//
//      return callback(orders);
//    });
//}
//function getMutiStatusOrders(driver, statusArray) {
//  var defered = q.defer();
//  var orderArray = [];
//  async.each(statusArray, function (status, callback) {
//
//    getOrdersStatus(driver, status, function (result) {
//      if (result) {
//        for (var index = 0; index < result.length; index++) {
//          orderArray.push(result[index]);
//        }
//      }
//      callback();
//    });
//  }, function (err) {
//    if (!err)
//      defered.resolve({orders: orderArray});
//  });
//  return defered.promise;
//}
//
//exports.getOrdersByStatuses = function (req, res, next) {
//  var currentDriver = req.driver || {};
//  req.query = req.query || {};
//  var statusArray = req.query.status || [];
//
//  getMutiStatusOrders(currentDriver, statusArray)
//    .then(function (result) {
//      return res.send(result);
//    }, function (err) {
//      return res.send(err);
//    });
//};

//之后处理，待验证
exports.getOrdersByStatuses = function (req, res, next) {
  var currentDriver = req.driver || {};
  req.query = req.query || {};
  var statusArray = req.query.status || ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped', 'unDeliverySigned', 'unDeliveried', 'completed'];
  var type = req.query.type || 'driver';

  OrderService.getDriverOrdersByDriverIdWithStatuses(currentDriver._id, statusArray, type, function (err, result) {
    if (err)
      return res.send(err);

    return res.send({orders: result.orders});
  });
};

exports.updateProfile = function (req, res, next) {
  var driver = req.driver || {};
  var profile = req.body.profile || '{}';
  profile = JSON.parse(profile);

  var fileds = [
    'nickname', //昵称（string）
    'birthday', //生日（Date）
    'phone',  //电话  （string）
    'photo',  //个人照片（string）
    'id_card_number', //身份证号码(string)
    'id_card_photo',   //身份证照片（string）
    'driving_date', //驾驶日期（Date）
    'driving_id_number',  //驾驶证号码（string）
    'driving_id_photo', //驾驶证照片（string）
    'travel_id_number', //行驶证号码（string）
    'travel_id_photo', //行驶证照片（string）
    'truck_photo',    //卡车照片（string）
    'plate_numbers',  //牌照号码（string ［］）
    'plate_photos',   //牌照照片（string［］）
    'operating_permits_photo'//运营证照片（string）
  ];

  fileds.forEach(function (key) {
    driver[key] = profile[key] ? profile[key] : driver[key];
  });

  // 计算年纪
  //function getAge(birthdayDate) {
  //  var birthday = {
  //    year: birthdayDate.getFullYear(),
  //    month: birthdayDate.getMonth() + 1,
  //    date: birthdayDate.getDate()
  //  };
  //  var now = new Date();
  //  var current = {
  //    year: now.getFullYear(),
  //    month: now.getMonth() + 1,
  //    date: now.getDate()
  //  };
  //
  //  if (current.year > birthday.year) {
  //    var age = current.year - birthday.year;
  //    if (current.month - birthday.month > 0) {
  //      return {
  //        age: age,
  //        unit: 'years'
  //      };
  //    }
  //    else if (current.month === birthday.month && current.date - birthday.date >= 0) {
  //      return {age: age, unit: 'years'};
  //    }
  //    else {
  //      if (age - 1 <= 0) {
  //        return {
  //          age: 12 - birthday.month + current.month,
  //          unit: 'months'
  //        };
  //      }
  //      else {
  //
  //        return {
  //          age: age - 1,
  //          unit: 'years'
  //        };
  //      }
  //    }
  //  }
  //  else if (current.year === birthday.year) {
  //    if (current.month - birthday.month > 0) {
  //      if (current.date - birthday.date >= 0) {
  //        return {
  //          age: current.month - birthday.month,
  //          unit: 'months'
  //        };
  //      }
  //      else {
  //        if (current.month - birthday.month <= 0) {
  //          return {
  //            age: (current.date - birthday.date),
  //            unit: 'days'
  //          };
  //        }
  //        else {
  //          return {
  //            age: (current.month - birthday.month - 1),
  //            unit: 'months'
  //          };
  //        }
  //
  //      }
  //    }
  //    else if (current.month === birthday.month && current.date - birthday.date >= 0) {
  //      return {
  //        age: (current.date - birthday.date),
  //        unit: 'days'
  //      };
  //    }
  //
  //    return {
  //      age: -1
  //    };
  //
  //  }
  //}
  //if (driver.birthday)
  //  driver.age = getAge(driver.birthday);

  driver.save(function (err, newDriver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }
    delete newDriver._doc.password;
    delete newDriver._doc._id;
    return res.send(newDriver);
  });
};

exports.getUpdatePasswordVerifyCode = function (req, res, next) {
  var username = req.body.username || '';
  var client = req.body.client || '';
  var isKuaiChuang = client === 'kuaichuan';

  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(username)) {
    return res.send({err: driverError.invalid_phone});
  }

  Driver.findOne({username: username}, function (err, driver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!driver) {
      return res.send({err: driverError.account_not_exist});
    }

    var code = smsLib.generateVerifyCode();
    var smsVerify = new SMSVerify({
      type: 'changePassword',
      code: code
    });

    smsVerify.save(function (err, smsVerify) {
      if (err || !smsVerify) {
        return res.send({err: driverError.internal_system_error});
      }

      if (isKuaiChuang) {
        smsLib.ypSendKuaiChuangSmsVerifyCode(username, code, function (err, result) {
          if (err) {
            return res.send({err: driverError.sms_send_error});
          }

          delete smsVerify._doc.code;
          return res.send(smsVerify);
        });
      }
      else {
        smsLib.ypSendSmsVerifyCode(username, code, function (err, result) {
          if (err) {
            return res.send({err: driverError.sms_send_error});
          }

          delete smsVerify._doc.code;
          return res.send(smsVerify);
        });
      }
    });
  });
};

exports.updatePassword = function (req, res, next) {
  var password = req.body.password || '';
  var username = req.body.username || '';
  var verifycode = req.body.sms_verify_code || '';
  var verify_id = req.body.sms_verify_id || '';

  //手机号验证(11位数字)
  var phoneRegex = /\d{11}/;
  if (!phoneRegex.test(username)) {
    return res.send({err: driverError.invalid_phone});
  }

  //密码验证（至少6位）
  if (password.length < 6) {
    return res.send({err: driverError.invalid_password});
  }

  SMSVerify.findOne({_id: verify_id}, function (err, smsVerify) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }

    if (!smsVerify) {
      return res.send({err: driverError.invalid_verify_id});
    }

    if (smsVerify.code !== verifycode) {
      return res.send({err: driverError.invalid_verify_code});
    }
    Driver.findOne({username: username}, function (err, driver) {
      if (err) {
        return res.send({err: driverError.internal_system_error});
      }
      if (!driver) {
        return res.send({err: driverError.account_not_exist});
      }
      driver.password = driver.hashPassword(password);
      driver.save(function (err, driverDoc) {
        if (err || !driverDoc) {
          return res.send({err: driverError.internal_system_error});
        }

        var access_token = cryptoLib.encrypToken({_id: driver._id, time: new Date()}, 'secret');
        delete driver._doc.password;
        delete driver._doc._id;
        return res.send({access_token: access_token, driver: driver});
      });
    });
  });
};

exports.updateDeviceId = function (req, res, next) {
  var driver = req.driver || {};
  var device_id = req.body.device_id || '';
  var type = req.body.type;

  if (!device_id) {
    return res.send({err: driverError.device_id_invalid});
  }

  Driver.findOne({
    $or: [
      {device_id: device_id},
      {device_id_ios: device_id}
    ]
  }, function (err, oldDriver) {
    if (err) {
      return res.send({err: driverError.internal_system_error});
    }
    else {
      async.auto({
        DeleteOldDriverRelation: function (callback) {
          if (oldDriver && oldDriver._id.toString() !== driver._id.toString()) {
            oldDriver.device_id_ios = null;
            oldDriver.device_id = null;
            oldDriver.save(function (err) {
              if (err)
                return callback({err: driverError.internal_system_error});

              return callback();
            });
          }
          else {
            return callback();
          }
        }
      }, function (err, result) {
        if (err) {
          return res.send(err);
        }
        else {
          if (type === 'ios') {
            driver.device_id = null;
            driver.device_id_ios = device_id;
          } else {
            driver.device_id_ios = null;
            driver.device_id = device_id;
          }
          driver.save(function (err) {
            if (err) {
              return res.send({err: driverError.internal_system_error});
            }
            else {
              return res.send({success: true});
            }
          });
        }
      });
    }
  });
  //删除之前设备id于用户的绑定
};

exports.version = function (req, res, next) {
  var version = req.body.version || req.query.version || '';
  var platform = req.body.platform || req.query.platform || '';
  var username = req.body.username || req.query.username || '';
  var type = req.body.type || req.query.type || '';

  if (version && platform && username) {
    DriverService.updateDriverVersionByUsername(version, platform, username, function (err, driver) {
      if (type === 'kuaichuan') {
        return res.send({version: config.app_kuaichuan_android_version, app_url: config.app_kuaichuan_android_url});
      }
      return res.send({version: config.app_version, app_url: config.serverAddress + 'zzqs2/toDownloadApp'});
    });
  }
  else {
    if (type === 'kuaichuan') {
      return res.send({version: config.app_kuaichuan_android_version, app_url: config.app_kuaichuan_android_url});
    }
    return res.send({version: '1009', app_url: config.serverAddress + 'zzqs2/toDownloadApp'});
  }
};

exports.versionIos = function (req, res, next) {
  var version = req.body.version || req.query.version || '';
  var platform = req.body.platform || req.query.platform || '';
  var username = req.body.username || req.query.username || '';
  if (version && platform && username) {
    DriverService.updateDriverVersionByUsername(version, platform, username, function (err, driver) {
      return res.send({version: config.app_version_ios, app_url: config.app_download_ios_redirect_url});
    });
  }
  else {
    return res.send({version: config.app_version_ios, app_url: config.app_download_ios_redirect_url});
  }
};

exports.getEvaluationPage = function (req, res, next) {
  var driverId = req.query.driver_id || '';
  var orderId = req.query.order_id || '';
  var companyId = req.query.company_id || '';

  if (!driverId || !orderId || !companyId) {
    return res.send({err: driverError.params_null});
  }
  driverEvaluationService.getByOrderIdAndDriverId(orderId, driverId, companyId, function (err, evaluation) {
    if (err) {
      return res.send(err);
    }
    if (evaluation) {
      userService.encryptId(evaluation._id, function (err, encryptId) {
        var content = {
          _id: encryptId,
          level: evaluation.level,
          content_text: evaluation.content_text
        };

        var returnValue = {order: evaluation.order, content: content};
        return res.render(path.join(__dirname, '../../web/popup_page/views/driver_evaluation.client.view.html'), {evaluation: JSON.stringify(returnValue)});
      });
    }
    else {
      OrderService.getOrderByOrderIdAndDriverId(orderId, driverId, function (err, findOrder) {
        if (err) {
          return res.send(err);
        }
        if (!findOrder) {
          return res.send({err: orderError.order_not_exist});
        }
        if (findOrder.status !== 'completed') {
          return res.send({err: {type: 'order_is_not_completed'}});
        }
        var returnValue = {order: findOrder, content: null};
        return res.render(path.join(__dirname, '../../web/popup_page/views/driver_evaluation.client.view.html'), {evaluation: JSON.stringify(returnValue)});
      });
    }
  });
};

exports.createEvaluation = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.query.order_id || '';
  var driverId = req.query.driver_id || '';
  var contentText = req.query.content_text || '';
  var level = parseInt(req.query.level) || 1;

  if (level > 3 || level < 1) {
    level = 1;
  }

  if (!orderId || !driverId) {
    return res.send({err: driverError.params_null});
  }

  driverEvaluationService.create(orderId, driverId, currentUser, false, level, contentText, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.updateEvaluation = function (req, res, next) {
  var evaluationId = req.query.evaluation_id || '';
  var contentText = req.query.content_text || '';
  var level = parseInt(req.query.level) || 1;

  if (level > 3 || level < 1) {
    level = 1;
  }
  if (!evaluationId) {
    return res.send({err: driverError.params_null});
  }

  userService.decryptId(evaluationId, function (err, decryptId) {
    driverEvaluationService.update(decryptId, false, level, contentText, function (err, result) {
      if (err) {
        return res.send(err);
      }
      return res.send(result);
    });
  });
};
exports.getEvaluationAllCount = function (req, res, next) {
  var currentDriver = req.driver || {};

  driverEvaluationService.getAllCountByDriverId(currentDriver._id, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};
exports.getEvaluationList = function (req, res, next) {
  var currentDriver = req.driver || {};
  var limit = parseInt(req.query.limit) || 10;
  var fromTime = req.query.from_time || '';
  var level = parseInt(req.query.level) || 0;

  if (level < 1 || level > 3) {
    level = 0;
  }

  if (limit < 0 || limit > 100) {
    limit = 10;
  }

  if (fromTime) {
    fromTime = new Date(fromTime);
    if (!fromTime.getTime()) {
      fromTime = new Date();
    }
  } else {
    fromTime = new Date();
  }

  driverEvaluationService.getSimpleList(currentDriver._id, fromTime, level, limit, function (err, evaluationList) {
    if (err) {
      return res.send(err);
    }

    return res.send(evaluationList);
  });
};

