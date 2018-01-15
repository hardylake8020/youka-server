'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  timestamps = require('mongoose-timestamp');
/**
 * User Schema
 */

module.exports = function (appDb) {
  var UserSchema = new Schema({
    object: {
      type: String,
      default: 'user'
    },
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    // isInvited: {
    //   type: Boolean,
    //   default: false
    // },
    password: {
      type: String,
      default: ''
    },
    roles: {
      type: [
        {
          type: String,
          enum: ['user', 'admin', 'companyAdmin', 'tenderExaminer', 'tenderPaymenter']
        }
      ],
      default: ['user']
    },
    nickname: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    email_verified: {
      type: Boolean,
      required: true,
      default: false
    },
    mobile_phone: {
      type: String
    }
  });

  UserSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  UserSchema.methods.hashPassword = function (password) {
    if (this.salt && password) {
      return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
    } else {
      return password;
    }
  };

  /**
   * Create instance method for authenticating user
   */
  UserSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password);
  };

  /**
   * Find possible not used username
   */
  UserSchema.statics.findUser = function (username, callback) {
    //TODO 处理username两边空格
    this.findOne({
      username: username
    }, function (err, user) {
      callback(err, user);
    });
  };

  appDb.model('User', UserSchema);

};