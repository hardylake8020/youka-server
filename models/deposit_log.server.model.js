'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var DepositLogSchema = new Schema({
    object: {
      type: String,
      default: 'DepositLog'
    },
    bidder: {
      type: Schema.Types.Mixed //{_id: bidderId, username: username, name: nickname}
    },
    //日志纪录类型
    type: {
      type: String,
      enum: ['save', 'extract', 'breachFreeze', 'breachRemoved', 'breachDeducted'],//存入保证金，提取保证金，冻结保证金，解除冻结，违约扣除保证金
      default: 'save'
    },
    //违约涉及的标书
    breach_tenders: {
      type: [Schema.Types.Mixed], //{_id: tenderId, order_number: orderNumber}
      default: []
    },
    //违约类型
    breach_type: {
      type: String,
      enum: ['', 'pickup', 'delivery'],//提货违约，交货违约。
      default: ''
    },
    amount: {
      type: Number,
      default: 0
    },
    //处理违约的人
    handle_breach_user: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    }
  });

  DepositLogSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('DepositLog', DepositLogSchema);
};
