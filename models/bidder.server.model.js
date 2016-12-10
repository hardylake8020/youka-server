'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var BidderSchema = new Schema({
    object: {
      type: String,
      default: 'bidder'
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    real_names: {// key为cooperate_companies中的元素
      type: Schema.Types.Mixed
    },
    location: {
      type: [Number]
    },
    bind_time: {
      type: Date,
      required: true
    },
    wechat_profile: {
      type: Schema.Types.Mixed,
      default: {}
    },
    cooperate_companies: {
      type: [String], //id
      default: []
    },
    //保证金金额
    deposit_amount: {
      type: Number,
      default: 0
    },
    deposit_status: {
      type: String,
      enum: ['unpaid', 'paid', 'freeze', 'deducted'],//未缴纳，已缴纳，已冻结， 已扣除。
      default: 'unpaid'
    }
  });

  BidderSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('Bidder', BidderSchema);
};
