/**
 * Created by Wayne on 15/8/18.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  //分配给临时司机的信息
  var AssignDriverEventSchema = new Schema({
    event_type: {
      type: String,
      default: 'assign_driver'
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  });

  AssignDriverEventSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('AssignDriverEvent', AssignDriverEventSchema);
};