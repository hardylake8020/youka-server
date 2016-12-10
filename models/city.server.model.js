/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {

  var CitySchema = new Schema({
    object: {
      type: String,
      default: 'City'
    },
    adcode: {
      type: Number
    },
    name: {
      type: String
    },
    parent_city: {
      type: Schema.Types.ObjectId
    },
    province_name: {
      type: String
    },
    deleted_status: {
      type: Boolean,
      default: false
    },
    level: {
      type: Number
    }
  });

  CitySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('City', CitySchema);
};
