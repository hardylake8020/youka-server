'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var PaymentLogSchema = new Schema({
    object: {
      type: String,
      default: 'PaymentLog'
    },
    //付款方
    payer: {
      type: Schema.Types.Mixed
    },
    //收款方
    receiver: {
      type: Schema.Types.Mixed
    },
    //支付方式
    payment_way: {
      type: String,
      enum: ['wechatPay', 'aliPay', 'unionPay'],
      default: 'wechatPay'
    },
    payment_type: {
      type: String,
      enum: ['c2b', 'b2c', 'b2b'], //个人向企业付款，企业向个人付款，企业向企业付款
      default: 'c2b'
    },
    //交易商品
    commodity: {
      type: String,
      enum: ['deposit'], //保证金
      default: 'deposit'
    },
    //金额
    amount: {
      type: Number,
      default: 0
    }
  });

  PaymentLogSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('PaymentLog', PaymentLogSchema);
};
