/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  PaymentLog = appDb.model('PaymentLog');

var self = exports;

exports.create = function () {

};

exports.saveDepositByWechat = function (bidder, amount, callback) {
  if (!bidder || !bidder._id) {
    return callback({err: error.business.bidder_not_exist});
  }

  async.auto({
    wechatPay: function (autoCallback) {
      return autoCallback();
    },
    log: ['wechatPay', function (autoCallback, result) {
      var newPaymentLog = new PaymentLog({
        payer: {
          _id: bidder._id,
          username: bidder.username,
          nickname: bidder.wechat_profile.nickname || '',
          openid: bidder.wechat_profile.openid || ''
        },
        receiver: {
          _id: '',
          name: '柱柱科技'
        },
        amount: amount
      });
      newPaymentLog.save(function (err, saveLog) {
        if (err || !saveLog) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });

};

exports.extractDepositByWechat = function (bidder, amount, callback) {
  if (!bidder || !bidder._id) {
    return callback({err: error.business.bidder_not_exist});
  }

  async.auto({
    wechatPay: function (autoCallback) {
      return autoCallback();
    },
    log: ['wechatPay', function (autoCallback, result) {
      var newPaymentLog = new PaymentLog({
        payer: {
          _id: '',
          name: '柱柱科技'
        },
        receiver: {
          _id: bidder._id,
          username: bidder.username,
          nickname: bidder.wechat_profile.nickname || '',
          openid: bidder.wechat_profile.openid || ''
        },
        payment_type: 'b2c',
        amount: amount
      });
      newPaymentLog.save(function (err, saveLog) {
        if (err || !saveLog) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });

};