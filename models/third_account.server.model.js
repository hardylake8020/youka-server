/**
 * Created by elinaguo on 15/6/1.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var ThirdAccountSchema = new Schema({
    username: {   //系统内部账号关联
      type: String
    },
    user_type: {
      type: String,
      enum: ['user', 'driver']
    },
    //open_id,third_account_id两个合起来是第三方账户的唯一标识
    open_id: {
      type: String
    },
    third_account_id: {
      type: String
    },
    access_token: {    //第三方登录凭证,每次登录都会变，之后app登录之后如果需要访问qq获取数据需要拿此做凭证
      type: String
    },
    provider: {
      type: String,
      enum: ['qq','wechat','weibo']
    },
    nickname: {
      type: String
    },
    gender: {
      type: String
    },
    photo: {
      type: String
    },
    address: {
      type: String
    },
    remark: {
      type: String
    },
    others: {
      type: String
    },
    create_time: {
      type: Date,
      default: Date.now
    }
  });

  ThirdAccountSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('ThirdAccount', ThirdAccountSchema);

};