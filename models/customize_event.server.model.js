/**
 * Created by Wayne on 15/8/18.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var CustomizeEventSchema = new Schema({
    content: {
      type: Schema.Types.Mixed
    },
    delete_status: {
      type: Boolean,
      default: false
    }

  });

  CustomizeEventSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CustomizeEvent', CustomizeEventSchema);
};