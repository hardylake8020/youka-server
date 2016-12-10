/**
 * Created by elinaguo on 15/3/24.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var ContactSchema = new Schema({
    object:{
      type:String,
      default:'contact'
    },
    name: {
      type: String
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    phone: {
      type: String
    },
    mobile_phone: {
      type: String
    },
    address: {
      type: String
    },
    //地址代号
    brief: {
      type: String
    },
    //地址经纬度
    location: {
      type: [Number]
    },
    email: {
      type: String
    }
  });

  ContactSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('Contact', ContactSchema);
};