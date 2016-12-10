'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var DriverCompanySchema = new Schema({
    object:{
      type:String,
      default:'drivercompany'
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    }
  });

  DriverCompanySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('DriverCompany', DriverCompanySchema);
};
