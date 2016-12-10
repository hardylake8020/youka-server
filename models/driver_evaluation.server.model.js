/**
 * Created by Wayne on 15/11/3.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var DriverEvaluationSchema = new Schema({
    object: {
      type: String,
      default: 'DriverEvaluation'
    },
    driver_id: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    driver: {
      type: Schema.Types.Mixed
    },
    order: {
      type: Schema.Types.Mixed
    },
    user: {
      type: Schema.Types.Mixed
    },
    is_system: {
      type: Boolean,
      default: false
    },
    delete_status: {
      type: Boolean,
      default: false
    },
    level: {
      type: Number,
      default: 1
    },
    content_text: {
      type: String,
      default: '此用户未填写任何评论'
    },
    create_time_format: {
      type: String
    },
    update_time_format: {
      type: String
    }
  });

  DriverEvaluationSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  DriverEvaluationSchema.pre('save', function (next) {
    if (this.created) {
      this.create_time_format = moment(this.created).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.updated) {
      this.update_time_format = moment(this.updated).format('YYYY-MM-DD HH:mm:ss');
    }
    next();
  });

  appDb.model('DriverEvaluation', DriverEvaluationSchema);
};
