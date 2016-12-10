'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var TempDriverVersionSchema = new Schema({
    username: {
      type: String
    },
    platform: {
      type: String
    },
    driver_id: {
      type: String
    },
    version: {
      type: String
    }
  });

  TempDriverVersionSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('TempDriverVersion', TempDriverVersionSchema);

};
