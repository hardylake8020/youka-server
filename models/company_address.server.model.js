'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var CompanyAddressSchema = new Schema({
    object:{
      type:String,
      default:'companyAddress'
    },
    company:{
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    brief: {
      type: String
    },
    detail: {
      type: String
    },
    location: {
      type: [Number]//[longitude,latitude]
    }
  });

  CompanyAddressSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CompanyAddress', CompanyAddressSchema);

};
