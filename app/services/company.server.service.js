/**
 * Created by Wayne on 15/7/30.
 */

'use strict';

var companyError = require('../errors/company'),
  async = require('async'),
  appDb = require('../../libraries/mongoose').appDb,
  User = appDb.model('User'),
  Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  CompanyAddress = appDb.model('CompanyAddress'),
  InviteDriver = appDb.model('InviteDriver'),
  DriverCompany = appDb.model('DriverCompany'),
  InviteCompany = appDb.model('InviteCompany'),
  CompanyPartner = appDb.model('CompanyPartner'),
  OrderOption = appDb.model('OrderOption'),
  CompanyConfiguration = appDb.model('CompanyConfiguration'),
  Promise = require('promise'),
  mongoose = require('mongoose');


var driverEvaluationService = require('./driver_evaluation'),
  orderService = require('./order');

exports.deleteDriverCompany = function (driverId, companyId, callback) {
  if (!driverId || !companyId) {
    return callback(companyError.params_null);
  }
  DriverCompany.findOneAndRemove({driver: driverId, company: companyId}, function (err, driverCompanyEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, driverCompanyEntity);
  });
};

exports.deleteInviteDriver = function (driverPhone, companyId, callback) {
  if (!driverPhone || !companyId) {
    return callback(companyError.params_null);
  }
  InviteDriver.findOneAndRemove({username: driverPhone, company: companyId}, function (err, inviteDriverEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, inviteDriverEntity);
  });
};

exports.getInviteDriver = function (driverPhone, companyId, callback) {
  if (!driverPhone || !companyId) {
    return callback(companyError.params_null);
  }
  InviteDriver.findOne({username: driverPhone, company: companyId}, function (err, inviteDriverEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, inviteDriverEntity);
  });

};

exports.getCorporateDriver = function (driverId, companyId, callback) {
  if (!driverId || !companyId) {
    return callback(companyError.params_null);
  }
  DriverCompany.findOne({driver: driverId, company: companyId}, function (err, driverCompanyEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, driverCompanyEntity);
  });

};

exports.getCompanyAdminUser = function (companyId, callback) {
  if (!companyId) {
    return callback(companyError.params_null);
  }

  User.findOne({company: companyId, roles: 'companyAdmin'}, function (err, companyAdminUser) {
    if (err) {
      return callback(companyError.internal_system_error);
    }

    return callback(null, companyAdminUser);
  });
};

exports.getCompanyById = function (companyId, callback) {
  if (!companyId) {
    return callback(companyError.params_null);
  }

  Company.findOne({_id: companyId}, function (err, companyEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }

    return callback(null, companyEntity);
  });
};

exports.deleteInviteCompany = function (username, companyId, callback) {
  if (!username || !companyId) {
    return callback(companyError.params_null);
  }

  InviteCompany.findOneAndRemove({username: username, company: companyId}, function (err, inviteCompanyEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }

    return callback(null, inviteCompanyEntity);
  });
};

exports.deleteInviteCompanyById = function (inviteId, companyId, callback) {
  if (!inviteId || !companyId) {
    return callback(companyError.params_null);
  }

  InviteCompany.findOneAndRemove({_id: inviteId, company: companyId}, function (err, inviteCompanyEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }

    return callback(null, inviteCompanyEntity);
  });
};

exports.deleteCorporateCompany = function (partnerId, companyId, callback) {
  if (!partnerId || !companyId) {
    return callback(companyError.params_null);
  }

  CompanyPartner.findOneAndRemove({
    $or: [{company: companyId, partner: partnerId}, {
      company: partnerId,
      partner: companyId
    }]
  }, function (err, companyPartnerEntity) {
    if (err) {
      return callback(companyError.internal_system_error);
    }
    return callback(null, companyPartnerEntity);
  });
};

//获取合作司机和邀请的司机
exports.getPartnerDrivers = function (companyId, callback) {
  async.auto({
    findDriverCompany: function (findCallback) {
      DriverCompany.find({company: companyId}).populate('driver').exec(function (err, companyDrivers) {
        if (err) {
          return findCallback({err: companyError.internal_system_error});
        }

        if (!companyDrivers || companyDrivers.length === 0) {
          return findCallback(null, companyDrivers);
        }

        async.each(companyDrivers, function (item, asyncCallback) {
          if (!item.driver || !item.driver._id) {
            item.driver = {};
            return asyncCallback();
          }
          driverEvaluationService.getAllCountByDriverId(item.driver._id, function (err, allCount) {
            if (err) {
              return asyncCallback(err);
            }

            item.driver._doc.all_count = allCount;
            return asyncCallback();
          });

        }, function (err) {
          return findCallback(err, companyDrivers);
        });
      });
    },
    findInviteDriver: function (findCallback) {
      InviteDriver.find({company: companyId, status: 'inviting'}).exec(function (err, inviteDrivers) {
        if (err) {
          return findCallback({err: companyError.internal_system_error});
        }
        else {
          return findCallback(null, inviteDrivers);
        }
      });
    }
  }, function (err, results) {
    return callback(err, results);
  });
};

function findCompanyByName(name, callback) {
  Company.findOne({name: name}, function (err, company) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, company);
  });
}
function isPartner(currentCompanyId, partnerId, callback) {
  CompanyPartner.findOne({
      $or: [{company: currentCompanyId, partner: partnerId},
        {company: partnerId, partner: currentCompanyId}]
    },
    function (err, companyPartner) {
      if (err) {
        console.log(err);
        err = {err: companyError.internal_system_error};
      }
      return callback(err, companyPartner);
    });
}
function isInvited(currentCompanyId, partnerName, partnerEmail, callback) {
  var condition = {
    company: currentCompanyId,
    $or: []
  };

  if (partnerName) {
    condition.$or.push({name: partnerName});
  }
  if (partnerEmail) {
    condition.$or.push({username: partnerEmail});
  }
  if (condition.$or.length === 0) {
    return callback({err: companyError.invalid_params});
  }

  InviteCompany.findOne(condition, function (err, inviteCompany) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, inviteCompany);
  });
}
function isInnerStaff(currentCompanyId, partnerEmail, callback) {
  if (!partnerEmail) {
    return callback(null, false);
  }
  User.findOne({username: partnerEmail}, function (err, userEntity) {
    if (err) {
      console.log(err);
      return callback({err: companyError.internal_system_error});
    }
    if (userEntity && userEntity.company && userEntity.company.toString() === currentCompanyId.toString()) {
      return callback(null, true);
    }
    return callback(null, false);
  });
}
function createPartnerCompany(currentCompanyId, partnerCompanyId, callback) {
  var newCompanyPartner = new CompanyPartner({
    company: currentCompanyId,
    partner: partnerCompanyId
  });
  newCompanyPartner.save(function (err, partnerCompanyEntity) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, partnerCompanyEntity);
  });
}
function createInviteCompany(currentCompanyId, inviteName, inviteEmail, callback) {
  var newInviteCompany = new InviteCompany({
    username: inviteEmail || '',
    name: inviteName || '',
    company: currentCompanyId
  });
  newInviteCompany.save(function (err, inviteCompanyEntity) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, inviteCompanyEntity);
  });
}

function tryAddPartner(currentCompanyId, partnerName, callback) {
  findCompanyByName(partnerName, function (err, partner) {
    if (err) {
      return callback(err);
    }
    if (!partner) {  //合作公司不存在，则需要邀请
      return callback(null, false);
    }
    isPartner(currentCompanyId, partner._id, function (err, partnerCompany) {
      if (err) {
        return callback(err);
      }
      if (partnerCompany) {  //合作公司已存在，则返回成功
        return callback(null, true);
      }
      createPartnerCompany(currentCompanyId, partner._id, function (err, newPartnerCompany) {
        if (err) {
          return callback(err);
        }
        return callback(null, true);
      });
    });
  });
}
function tryInvite(currentCompanyId, partnerName, partnerEmail, callback) {
  isInnerStaff(currentCompanyId, partnerEmail, function (err, isInner) {
    if (err) {
      return callback(err);
    }
    if (isInner) {
      return callback({err: companyError.company_invite_itself});
    }

    isInvited(currentCompanyId, partnerName, partnerEmail, function (err, inviteCompany) {
      if (err) {
        return callback(err);
      }
      if (inviteCompany) {
        return callback(null, true);
      }
      createInviteCompany(currentCompanyId, partnerName, partnerEmail, function (err, newInviteCompany) {
        if (err) {
          return callback(err);
        }
        return callback(null, true);
      });
    });
  });
}
exports.batchInviteCompany = function (currentUser, partnerInfos, callback) {
  var currentCompany = currentUser.company;

  var successArray = [];
  var failedArray = [];
  async.eachSeries(partnerInfos, function (partnerItem, asyncCallback) {
    if (!currentCompany.name) {
      failedArray.push({err: companyError.name_null, info: partnerItem});
      return asyncCallback();
    }
    if (partnerItem.companyName === currentCompany.name) {
      failedArray.push({err: companyError.company_invite_itself, info: partnerItem});
      return asyncCallback();
    }
    if (partnerItem.email && !partnerItem.email.testMail()) {
      failedArray.push({err: companyError.invalid_params, info: partnerItem});
      return asyncCallback();
    }
    if (partnerItem.email === currentUser.username) {
      failedArray.push({err: companyError.company_invite_itself, info: partnerItem});
      return asyncCallback();
    }

    tryAddPartner(currentCompany._id, partnerItem.companyName, function (err, isSuccess) {
      if (err) {
        failedArray.push({err: err.err, info: partnerItem});
        return asyncCallback();
      }
      if (isSuccess) {
        successArray.push({info: partnerItem});
        return asyncCallback();
      }

      tryInvite(currentCompany._id, partnerItem.companyName, partnerItem.email, function (err, result) {
        if (err) {
          failedArray.push({err: err.err, info: partnerItem});
          return asyncCallback();
        }
        if (!result) {
          failedArray.push({err: companyError.invite_failed, info: partnerItem});
          return asyncCallback();
        }

        successArray.push({info: partnerItem});
        return asyncCallback();
      });
    });
  }, function (err) {

    return callback(null, {
      success: successArray,
      faileds: failedArray
    });
  });
};

function checkAddressExist(companyId, addressInfo, callback) {
  if (!companyId || !addressInfo || !addressInfo.detail) {
    return callback({err: companyError.invalid_params});
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
    return callback({err: companyError.invalid_params});
  }

  CompanyAddress.findOne(condition, function (err, companyAddress) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
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
function getAddressListByCondition(condition, limit, callback) {
  CompanyAddress.find(condition)
    .limit(limit)
    .exec(function (err, addressList) {
      if (err) {
        err = {err: companyError.internal_system_error};
      }
      return callback(err, addressList);
    });
}
function findAddressById(addressId, callback) {
  CompanyAddress.findOne({_id: addressId}, function (err, address) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, address);
  });
}
exports.checkAddressExist = function (companyId, addressInfo, callback) {
  return checkAddressExist(companyId, addressInfo, callback);
};
exports.getLocationInfoByAddress = function (companyId, address, callback) {
  return getLocationInfoByAddress(companyId, address, callback);
};
exports.getLocationInfosByAddresses = function (companyId, addressArray, callback) {
  return getLocationInfosByAddresses(companyId, addressArray, callback);
};

exports.createAddress = function (companyId, addressInfo, callback) {
  if (!companyId || !addressInfo || !addressInfo.detail) {
    return callback({err: companyError.invalid_params});
  }

  //检查地址是否存在
  checkAddressExist(companyId, addressInfo, function (err, companyAddress) {
    if (err) {
      return callback(err);
    }
    if (companyAddress) {
      return callback({err: companyError.address_exist});
    }
    companyAddress = new CompanyAddress({
      company: companyId,
      brief: addressInfo.brief || '',
      detail: addressInfo.detail
    });
    companyAddress.save(function (err, saveAddress) {
      if (err || !saveAddress) {
        err = {err: companyError.internal_system_error};
      }
      return callback(err, saveAddress);
    });
  });
};
exports.removeAddress = function (companyId, addressId, callback) {
  if (!companyId || !addressId) {
    return callback({err: companyError.invalid_params});
  }

  CompanyAddress.remove({_id: addressId, company: companyId}, function (err, raw) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    //raw 删除的个数
    return callback(err, raw);
  });
};
exports.updateAddress = function (companyId, addressInfo, callback) {
  if (!companyId || !addressInfo || !addressInfo._id || !addressInfo.detail || !addressInfo.latitude || !addressInfo.longitude) {
    return callback({err: companyError.invalid_params});
  }
  if (!parseFloat(addressInfo.latitude) || !parseFloat(addressInfo.longitude)) {
    return callback({err: companyError.invalid_location});
  }

  findAddressById(addressInfo._id, function (err, findAddress) {
    if (err) {
      return callback(err);
    }
    if (!findAddress) {
      return callback({err: companyError.address_not_exist});
    }

    findAddress.brief = addressInfo.brief || '';
    findAddress.detail = addressInfo.detail;
    findAddress.location = [parseFloat(addressInfo.latitude), parseFloat(addressInfo.longitude)];

    findAddress.save(function (err, saveAddress) {
      if (err || !saveAddress) {
        console.log(err);
        err = {err: companyError.internal_system_error};
      }
      return callback(err, saveAddress);
    });
  });
};

exports.captureAddress = function (companyId, addressInfo, callback) {
  if (!companyId || !addressInfo || !addressInfo._id || !addressInfo.detail) {
    return callback({err: companyError.invalid_params});
  }

  findAddressById(addressInfo._id, function (err, findAddress) {
    if (err) {
      return callback(err);
    }
    if (!findAddress) {
      return callback({err: companyError.address_not_exist});
    }

    orderService.captureAddressLocation(companyId, addressInfo.detail, function (err, location) {
      if (err) {
        return callback(err);
      }
      if (!location) {
        return callback({err: companyError.address_not_exist});
      }

      findAddress.location = [location[1],location[0]];
      findAddress.save(function (err, saveAddress) {
        if (err || !saveAddress) {
          console.log(err);
          err = {err: companyError.internal_system_error};
        }
        return callback(err, saveAddress);
      });

    });

  });
};

exports.getAddressList = function (companyId, callback) {
  if (!companyId) {
    return callback({err: companyError.invalid_params});
  }
  CompanyAddress.find({company: companyId}, function (err, addressList) {
    if (err) {
      err = {err: companyError.internal_system_error};
    }
    return callback(err, addressList);
  });
};
exports.getContactAddressList = function (companyId, inputAddress, callback) {
  if (!companyId || !inputAddress) {
    return callback({err: companyError.invalid_params});
  }

  var condition = {
    company: companyId,
    $or: [
      {
        brief: {$regex: inputAddress, $options: 'i'}
      },
      {
        detail: {$regex: inputAddress, $options: 'i'}
      }]
  };

  getAddressListByCondition(condition, 10, function (err, addressList) {
    return callback(err, addressList);
  });
};

function getCompanyConfiguration(companyId, callback) {
  if (!companyId) {
    return callback({err: companyError.invalid_params});
  }

  CompanyConfiguration.findOne({company: companyId}, function (err, configuration) {
    if (err) {
      console.log(err);
      err = {err: companyError.internal_system_error};
    }
    return callback(err, configuration);
  });
}

exports.getConfiguration = function (companyId, callback) {
  return getCompanyConfiguration(companyId, callback);
};

function createOrderOption(option) {
  var config = new OrderOption({
    must_entrance: option.must_entrance || false,
    must_entrance_photo: option.must_entrance_photo || false,
    must_take_photo: option.must_take_photo || false,
    must_confirm_detail: option.must_confirm_detail || false,
    entrance_photos: [],
    take_photos: []
  });

  if (option.entrance_photos && Array.isArray(option.entrance_photos) && option.entrance_photos.length > 0) {
    option.entrance_photos.forEach(function (item) {
      if (item.name) {
        config.entrance_photos.push({
          name: item.name,
          isPlate: (item.isPlate === 'true' || item.isPlate === true) ? true : false
        });
      }
    });
  }
  if (option.entrance_photos.length === 0) {
    config.must_entrance_photo = false;
  }
  if (option.take_photos && Array.isArray(option.take_photos) && option.take_photos.length > 0) {
    option.take_photos.forEach(function (item) {
      if (item.name) {
        config.take_photos.push({
          name: item.name,
          isPlate: (item.isPlate === 'true' || item.isPlate === true) ? true : false
        });
      }
    });
  }
  if (option.take_photos.length === 0) {
    config.must_take_photo = false;
  }

  return config;
}
exports.updateConfiguration = function (companyId, inputConfig, callback) {
  getCompanyConfiguration(companyId, function (err, configuration) {
    if (err) {
      return callback(err);
    }
    if (!configuration) {
      configuration = new CompanyConfiguration({
        company: companyId
      });
    }

    configuration.update_id = new mongoose.Types.ObjectId();
    if (inputConfig.pickup_option) {
      configuration.pickup_option = createOrderOption(inputConfig.pickup_option);
    }
    if (inputConfig.delivery_option) {
      configuration.delivery_option = createOrderOption(inputConfig.delivery_option);
    }
    if (inputConfig.push_option) {
      configuration.push_option = inputConfig.push_option;
    }

    configuration.save(function (err, saveConfiguration) {
      if (err || !saveConfiguration) {
        err = {err: companyError.internal_system_error};
      }

      return callback(err, saveConfiguration);
    });
  });
};

exports.testSendSalesmanSms = function(companyId, orderId){
  return testSendSalesmanSms(companyId, orderId);
};
// 是否允许公司创建的运单发送SMS
function testSendSalesmanSms(companyId, orderId){
  return new Promise(function(fulfill, reject){
    if(companyId){
      CompanyConfiguration.findOne({company: companyId}).exec(function(err, cc){
        if(err){
          return reject(err);
        }
        if(cc){
          if(cc.admin_option && cc.admin_option.send_salesman_sms){
            console.log('允许发送短信：', companyId, orderId);
            return fulfill(true);
          }else{
            console.log('不允许发送短信：', companyId, orderId);
            return fulfill(false);
          }
        }else{
          console.log('不允许发送短信：', companyId, orderId);
          return fulfill(false);
        }
      });
    }else{
      console.log('不允许发送短信：', companyId, orderId);
      return fulfill(false);
    }
  });
}









