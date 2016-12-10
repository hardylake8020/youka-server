/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {

  var ProvinceSchema = new Schema({
    object: {
      type: String,
      default: 'Province'
    },
    name: {
      type: String
    },
    cities: [{
      type: Schema.Types.Mixed
    }]
  });

  ProvinceSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('Province', ProvinceSchema);
};