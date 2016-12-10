'use strict';


var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var CompanyPartnerSchema = new Schema({
    object:{
      type:String,
      default:'companypartner'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    }
  });

  CompanyPartnerSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CompanyPartner', CompanyPartnerSchema);
};