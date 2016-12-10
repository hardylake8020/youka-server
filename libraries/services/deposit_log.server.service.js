/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  DepositLog = appDb.model('DepositLog');


var self = exports;

exports.create = function (bidderId, bidderUsername, bidderNickname, type, breachTenders, breachType, amount, userId, callback) {
  if (!bidderId || !type) {
    return callback({err: error.params.invalid});
  }
  breachTenders = breachTenders || [];
  if (!Array.isArray(breachTenders)) {
    return callback({err: error.params.invalid});
  }

  var newLog = new DepositLog({
    bidder: {
      _id: bidderId.toString(),
      username: bidderUsername,
      nickname: bidderNickname || ''
    },
    type: type,
    breach_tenders: breachTenders,
    breach_type: breachType,
    amount: amount
  });
  if (userId) {
    newLog.handle_breach_user = userId;
  }

  newLog.save(function (err, saveLog) {
    if (err || !saveLog) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, saveLog);
  });
};

//存入保证金
exports.saveDeposit = function (bidderId, bidderUsername, bidderNickname, amount, callback) {
  self.create(bidderId, bidderUsername, bidderNickname, 'save', null, '', amount, null, function (err, depositLog) {
    return callback(err, depositLog);
  });
};
//提取保证金
exports.extractDeposit = function (bidderId, bidderUsername, bidderNickname, amount, callback) {
  self.create(bidderId, bidderUsername, bidderNickname, 'extract', null, '', amount, null, function (err, depositLog) {
    return callback(err, depositLog);
  });
};
//冻结保证金
exports.freezeBreach = function (bidderId, bidderUsername, bidderNickname, breachTenders, breachType, callback) {
  self.create(bidderId, bidderUsername, bidderNickname, 'breachFreeze', breachTenders, breachType, 0, null, function (err, depositLog) {
    return callback(err, depositLog);
  });
};
//解除保证金冻结状态
exports.removeBreach = function (bidderId, bidderUsername, bidderNickname, breachTenders, userId, callback) {
  self.create(bidderId, bidderUsername, bidderNickname, 'breachRemoved', breachTenders, '', 0, userId, function (err, depositLog) {
    return callback(err, depositLog);
  });
};
//违约扣除保证金
exports.deductBreach = function (bidderId, bidderUsername, bidderNickname, breachTenders, userId, callback) {
  self.create(bidderId, bidderUsername, bidderNickname, 'breachDeducted', breachTenders, '', 0, userId, function (err, depositLog) {
    return callback(err, depositLog);
  });
};




exports.getListByBidderId = function (bidderId, skipCount, limitCount, callback) {
  var query = DepositLog.find({'bidder._id': bidderId.toString()});

  if (skipCount && skipCount > 0) {
    query = query.skip(skipCount);
  }
  if (limitCount && limitCount > 0) {
    query = query.limit(limitCount);
  }

  query = query.sort({updated: -1});

  query.exec(function (err, list) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, list);
  });
};