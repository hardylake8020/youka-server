/**
 * Created by Wayne on 15/5/4.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (logDb) {
  var LogSchema = new Schema({
    object:{
      type:String,
      default:'log'
    },
    username: {
      type: String,
      default: 'system'
    },
    role: {
      type: String,
      default: 'other'
    },
    time: {
      type: Date
    },
    access_url: {
      type: String
    },
    level: {
      type: String
    },
    message: {
      type: String
    },
    meta: {
      type: Schema.Types.Mixed
    }
  });

  LogSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  logDb.model('Log', LogSchema);
};