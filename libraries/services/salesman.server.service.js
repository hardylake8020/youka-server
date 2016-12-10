/**
 * Created by Wayne on 15/12/21.
 */

'use strict';

var async = require('async'),
  error = require('../../errors/all'),

  appDb = require('../mongoose').appDb,
  Salesman = appDb.model('Salesman'),
  SalesmanCompany = appDb.model('SalesmanCompany');


function findSalesmanCompany(companyId, username, callback) {
  SalesmanCompany.findOne({company: companyId, username: username}, function (err, salesmanCompany) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, salesmanCompany);
  });
}
function findSalesmanByUsername(username, callback) {
  Salesman.findOne({username: username, delete_status: false}, function (err, salesman) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }

    return callback(err, salesman);
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
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, newSalesmanCompany);
    });
  });
}

exports.getCompanySalesmanOnly = function (companyId, callback) {
  SalesmanCompany.find({company: companyId})
    .select('username')
    .sort({created: 1})
    .exec(function (err, salesmanList) {
      if (err) {
        return callback({err: error.system.db_error});
      }
      return callback(null, salesmanList);
    });
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

exports.findSalesmanByUsername = function (username, callback) {
  return findSalesmanByUsername(username, callback);
};