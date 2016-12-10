'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {

  var SMSVerifySchema = new Schema({
    object:{
      type:String,
      default:'smsverify'
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['changePassword', 'signup','wxBind'],
      default: 'signup'
    },
    create_time:{
      type: Date,
      default: Date.now,
      expires: 600
    }
  });

  SMSVerifySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  SMSVerifySchema.statics.GetCode = function (idString, callback) {
    this.findOne({
      _id: mongoose.Types.ObjectId(idString)
    }, function (err, verify) {
      if (verify === null || verify === undefined) {
        callback({
          error: err,
          code: null
        });
      }
      else {
        callback({
          error: err,
          code: verify.code
        });
      }
    });
  };

  SMSVerifySchema.statics.IsValidCode = function (idString, code, callback) {
    this.findOne({
      _id: mongoose.Types.ObjectId(idString)
    }, function (err, verify) {
      if (verify === null || verify === undefined) {
        callback({
          error: err,
          valid: false
        });
      }
      else {
        callback({
          error: err,
          valid: verify.code === code
        });
      }
    });
  };

  appDb.model('SmsVerify', SMSVerifySchema);

};