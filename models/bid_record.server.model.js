'use strict';
/**
 * Created by elinaguo on 15/3/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var BidRecordSchema = new Schema({
    object: {
      type: String,
      default: 'bidder'
    },
    tender: {
      type: Schema.Types.ObjectId,
      ref: 'Tender'
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: 'Bidder'
    },
    current_price: {
      type: Number,
      default: 0
    },
    all_price: {
      type: [Schema.Types.Mixed], //{price, time}
      default: []
    },
    status: {
      type: String,
      enum: ['unQuoted', 'quoted', 'success', 'failed', 'obsolete'], //未报价，已报价，已中标，未中标，已过时。
      default: 'unQuoted'
    },
    //是否已经查看过
    has_preview: {
      type: Boolean,
      default: false
    }
  });

  BidRecordSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  appDb.model('BidRecord', BidRecordSchema);
};
