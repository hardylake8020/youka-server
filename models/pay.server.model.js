'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var PaySchema = new Schema(
    {
      object: {
        type: String,
        default: 'pay'
      },
      driver: {
        type: Schema.Types.ObjectId,
        require: true
      },

      // 用户名
      out_trade_no: {
        type: String,
        trim: true
      },
      total_fee: {
        type: Number,
        default: 0
      },
      // 头像
      nonce_str: {
        type: String,
        default: ''
      },
      is_valid:{
        type:Boolean,
        default:false
      }
    }
  );


  PaySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  appDb.model('Pay', PaySchema);
};