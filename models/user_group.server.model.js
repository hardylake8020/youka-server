/**
 * Created by elinaguo on 15/3/25.
 */
'use strict';

//modules dependencies
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
//Group Schema define
  var UserGroupSchema = new Schema({
    object: {
      type: String,
      default: 'usergroup'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    }
  });

  UserGroupSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('UserGroup', UserGroupSchema);
};
