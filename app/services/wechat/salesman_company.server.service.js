/**
 * Created by Wayne on 15/12/21.
 */

'use strict';

var appDb = require('../../../libraries/mongoose').appDb,
  async = require('async'),
  salesmanError = require('../../errors/wechat/salesman'),
  SalesmanCompany = appDb.model('SalesmanCompany');

function findSalesmanCompany(companyId, username, callback) {
  SalesmanCompany.findOne({company: companyId, username: username}, function (err, salesmanCompany) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }
    return callback(null, salesmanCompany);
  });
}

function createSalesmanCompanyWithInfo(companyId, salesman, userInfo, callback) {
  findSalesmanCompany(companyId, salesman.username, function (err, salesmanCompany) {
    if (err) {
      return callback(err);
    }
    if (!salesmanCompany) {
      salesmanCompany = new SalesmanCompany({
        company: companyId,
        username: salesman.username
      });
    }
    salesmanCompany.salesman = salesman._id;
    salesmanCompany.nickname = userInfo.nickname || '';
    salesmanCompany.email = userInfo.email || '';

    salesmanCompany.save(function (err, newSalesmanCompany) {
      if (err || !newSalesmanCompany) {
        return callback({err: salesmanError.internal_system_error});
      }
      return callback(null, newSalesmanCompany);
    });
  });
}
function createSalesmanCompanyOnlyUsername(companyId, username, callback) {
  findSalesmanCompany(companyId, username, function (err, salesmanCompany) {
    if (err) {
      return callback(err);
    }
    if (salesmanCompany) {
      return callback(null, salesmanCompany);
    }

    salesmanCompany = new SalesmanCompany({
      company: companyId,
      username: username
    });

    salesmanCompany.save(function (err, newSalesmanCompany) {
      if (err || !newSalesmanCompany) {
        return callback({err: salesmanError.internal_system_error});
      }
      return callback(null, newSalesmanCompany);
    });
  });
}

exports.createSalesmanCompanyWithInfo = function(companyId, salesman, userInfo, callback) {
  createSalesmanCompanyWithInfo(companyId, salesman, userInfo, callback);
};
exports.createSalesmanCompany = function (companyId, usernames, callback) {
  var salesmanArray = [];
  async.each(usernames, function (username, asyncCallback) {
    if (!username.testPhone()) {
      return asyncCallback();
    }
    createSalesmanCompanyOnlyUsername(companyId, username, function (err, salesmanCompany) {
      if (salesmanCompany) {
        salesmanArray.push({
          _id : salesmanCompany._id,
          email : salesmanCompany.email,
          nickname : salesmanCompany.nickname,
          username: username,
          company : salesmanCompany.company,
          salesman : salesmanCompany.salesman
        });
      }
      return asyncCallback();
    });
  }, function (err) {
    return callback(null, salesmanArray);
  });
};

exports.removeSalesmanCompanyByUsername = function (companyId, username, callback) {
  SalesmanCompany.remove({company: companyId, username: username}, function (err, raw) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }
    return callback();
  });
};
exports.removeSalesmanCompanyById = function (companyId, salesmanCompanyId, callback) {
  SalesmanCompany.remove({_id: salesmanCompanyId, company: companyId}, function (err, raw) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }
    return callback();
  });
};

exports.getListByCompanyIdWithDetail = function (companyId, callback) {
  SalesmanCompany.find({company: companyId})
    .populate('salesman')
    .exec(function (err, salesmanList) {
      if (err) {
        return callback({err: salesmanError.internal_system_error});
      }
      return callback(null, salesmanList);
    });
};
exports.getCompanySalesmanOnly = function (companyId, callback) {
  SalesmanCompany.find({company: companyId})
    .select('username nickname')
    .sort({created: 1})
    .exec(function (err, salesmanList) {
      if (err) {
        return callback({err: salesmanError.internal_system_error});
      }
      return callback(null, salesmanList);
    });
};

exports.updateSalesmanIdByUsername = function (username, salesmanId, callback) {
  if (!username || !username.testPhone() || !salesmanId) {
    return callback();
  }

  SalesmanCompany.update({username: username}, {salesman: salesmanId}, {multi: true}, function (err, raw) {
    if (err) {
      return callback({err: salesmanError.internal_system_error});
    }
    console.log('update salesman id result: ' + raw);
    return callback();
  });
};

exports.createSingleSalesmanCompany = function(companyId, salesman, callback) {
  console.log(companyId, salesman);
  if(!salesman.username){
    return callback({err : '#createSalesmanCompany salesman.username is required'});
  }
  findSalesmanCompany(companyId, salesman.username, function (err, salesmanCompany) {
    if (err) {
      return callback(err);
    }
    if (!salesmanCompany) {
      salesmanCompany = new SalesmanCompany({
        company: companyId,
        username: salesman.username
      });
    }
    salesmanCompany.nickname = salesman.nickname || '';
    salesmanCompany.email = salesman.email || '';

    salesmanCompany.save(function (err, newSalesmanCompany) {
      if (err || !newSalesmanCompany) {
        return callback({err: salesmanError.internal_system_error});
      }
      return callback(null, newSalesmanCompany);
    });
  });
};