/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {

  var OrderRejectSchema = new Schema({
    object: {
      type: String,
      default: 'OrderReject'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    driver_phone: {
      type: String
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    order_details: {
      type: Schema.Types.Mixed
    }
  });

  OrderRejectSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('OrderReject', OrderRejectSchema);
};
