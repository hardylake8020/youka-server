/**
 * Created by elinaguo on 15/6/1.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var OrderShareSchema = new Schema({
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    username: {
      type: String
    }
  });

  OrderShareSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });
  appDb.model('OrderShare', OrderShareSchema);
};
