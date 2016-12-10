/**
 * Created by Wayne on 15/12/16.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  /*
  * 注释
  * salesman, nickname, email字段需要被更新
  * 1、微信端绑定关注人时
  * 2、web端创建关注人时
  * 3、web端更新关注人时
  */
  var SalesmanCompanySchema = new Schema({
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    salesman: {
      type: Schema.Types.ObjectId,
      ref: 'Salesman'
    },
    nickname:{
      type: String,
      default: ''
    },
    email:{
      type: String,
      default: ''
    }
  });

  SalesmanCompanySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });
  appDb.model('SalesmanCompany', SalesmanCompanySchema);
};
