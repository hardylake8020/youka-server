/**
 * Created by zenghong on 15/12/3.
 */
'use strict';

var appDb = require('../../../libraries/mongoose').appDb,
  async = require('async'),
  salesmanError = require('../../errors/wechat/salesman'),
  Salesman = appDb.model('Salesman'),
  SalesmanCompanyService = require('./salesman_company');

function findSalesmanById(id, callback) {
  Salesman.findOne({_id: id, delete_status: false}, function (err, salesman) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }

    return callback(null, salesman);
  });
}
function findSalesmanByUsername(username, callback) {
  Salesman.findOne({username: username, delete_status: false}, function (err, salesman) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }

    return callback(null, salesman);
  });
}
function findSalesmanByOpenId(openId, callback) {
  Salesman.findOne({wechat_openid: openId, delete_status: false}).populate('company').exec(function (err, salesman) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }

    return callback(null, salesman);
  });
}

function createSalesman(userInfo, callback) {
  if (!userInfo.username) {
    return callback({err: salesmanError.salesman_username_is_empty});
  }

  findSalesmanByUsername(userInfo.username, function (err, salesman) {
    if (err) {
      return callback(err);
    }

    if (salesman) {
      return callback(null, salesman);
    }

    salesman = new Salesman({
      username: userInfo.username
    });

    salesman.save(function (err, newSalesman) {
      if (err || !newSalesman) {
        return callback({err: salesmanError.internal_system_error});
      }

      return callback(null, newSalesman);
    });
  });
}
function createSalesmanToCompany(companyId, userInfo, callback) {
  createSalesman(userInfo, function (err, salesman) {
    if (err) {
      return callback(err);
    }
    SalesmanCompanyService.createSalesmanCompanyWithInfo(companyId, salesman, userInfo, function (err, salesmanCompany) {
      if (err) {
        return callback(err);
      }
      return callback(null, salesmanCompany);
    });
  });
}

exports.findSalesmanByUsername = function (username, callback) {
  return findSalesmanByUsername(username, callback);
};

exports.getSalesmanByUsernameList = function (usernameList, callback) {
  if (!usernameList || !Array.isArray(usernameList) || usernameList.length === 0) {
    return callback(null, []);
  }

  Salesman.find({username: {$in: usernameList}, delete_status: false}, function (err, salesmanList) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }

    return callback(null, salesmanList);
  });
};


exports.create = function (companyId, userInfo, callback) {
  createSalesmanToCompany(companyId, userInfo, callback);
};
exports.bathCreate = function (companyId, infos, callback) {
  var faileds = [];
  var success = [];
  async.eachSeries(infos, function (info, eachCallback) {
    createSalesmanToCompany(companyId, info, function (err, result) {
      if (err) {
        faileds.push({err: err, info: info});
      }
      else {
        success.push(info);
      }
      return eachCallback();
    });
  }, function () {
    return callback(null, {
      success: success,
      faileds: faileds
    });
  });
};
exports.update = function (companyId, userInfo, callback) {
  createSalesmanToCompany(companyId, userInfo, callback);
};

exports.getByOpenid = function (openid, callback) {
  return findSalesmanByOpenId(openid, callback);
};
exports.bindWx = function (username, openid, wxProfile, callback) {
  async.auto({
    findByOpenId: function (autoCallback) {
      findSalesmanByOpenId(openid, function (err, salesman) {
        if (err) {
          return autoCallback(err);
        }
        if (salesman) {
          salesman.wechat_openid = '';
          salesman.wechat_profile = {};
          salesman.markModified('wechat_profile');
          salesman.save(function (err, saveSalesman) {
            if (err || !saveSalesman) {
              return autoCallback({err: salesmanError.internal_system_error});
            }
            return autoCallback(null);
          });
        }
        else {
          return autoCallback(null);
        }
      });
    },
    bind: ['findByOpenId', function (autoCallback, result) {
      findSalesmanByUsername(username, function (err, salesman) {
        if (err) {
          return autoCallback(err);
        }

        if (!salesman) {
          salesman = new Salesman({username: username});
        }

        salesman.wechat_openid = openid;
        salesman.wechat_profile = wxProfile;
        salesman.markModified('wechat_profile');
        salesman.save(function (err, saveSalesman) {
          if (err || !saveSalesman) {
            return callback({err: salesmanError.internal_system_error});
          }

          SalesmanCompanyService.updateSalesmanIdByUsername(saveSalesman.username, saveSalesman._id, function (err) {
            if (err) {
              return autoCallback(err);
            }
            return autoCallback(null, saveSalesman);
          });
        });
      });
    }]
  }, function (err, result) {
    return callback(err, result);
  });
};
exports.unbindWx = function (openid, callback) {
  findSalesmanByOpenId(openid, function (err, salesman) {
    if (err) {
      return callback(err);
    }

    if (!salesman) {
      return callback({err: {type: 'invalid_openid'}});
    }

    salesman.wechat_openid = '';
    salesman.wechat_profile = {};
    salesman.markModified('wechat_profile');
    salesman.save(function (err, saveSalesman) {
      if (err) {
        return callback({err: {type: 'internal_system_error'}});
      }
      return callback(null, saveSalesman);
    });
  });
};
