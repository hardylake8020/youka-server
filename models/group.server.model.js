/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var GroupSchema = new Schema({
    object: {
      type: String,
      default: 'group'
    },
    name: {
      type: String,
      required: true
    },
    display_name: {
      type: String
    },
    description: {
      type: String
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    delete_status: {
      type: Boolean,
      default: false
    }
  });

  GroupSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('Group', GroupSchema);
};
