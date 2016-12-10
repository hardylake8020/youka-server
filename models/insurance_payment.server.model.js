/**
 * Created by zenghong on 15/11/16.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var InsurancePaymentSchema = new Schema({
    object: {
      type: String,
      default: 'InsurancePayment'
    },
    orders: [{
      type: Schema.Types.Mixed
    }],
    status: {
      type: 'String',
      enum: ['unpay', 'payed'],
      default: 'unpay'
    },
    company:{
      type: Schema.Types.ObjectId,
      ref: 'Company',
      require:true
    },
    buy_count:{
      type:Number,
      default:0
    },
    price_total:{
      type:Number,
      default:0
    },
    coverage_total:{
      type:Number,
      default:0
    },
    message_detail:{
      type: Schema.Types.Mixed,
      default: {}
    },
    other_info: {
      type: Schema.Types.Mixed,
      default: {}
    }
  });

  InsurancePaymentSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('InsurancePayment', InsurancePaymentSchema);
};