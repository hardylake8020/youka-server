/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var CompanyKey= new Schema({
    object:{
      type:String,
      default:'companyKey'
    },
    company:{
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    public_key:{
      type:String
    },
    secret_key:{
      type:String
    },
    md5_str:{
      type:String
    }
  });

  CompanyKey.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CompanyKey', CompanyKey);
};
