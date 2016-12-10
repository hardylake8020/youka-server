/**
 * Created by zenghong on 15/11/16.
 */
'use strict';
var superagent = require('superagent').agent();
var config = require('../../config/config');

exports.executePaymentForInsurance = function (info, callback) {
  superagent.post(config.paymentAddress + 'union/pay')
    .set('Content-Type', 'application/json')
    .send({
      optional: info,
      total_fee: info.price_total,
      title: '运单保险支付',
      bill_no: info._id
    })
    .end(function (err, res) {
      return callback(err, res);
    });
};