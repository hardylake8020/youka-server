'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var SalesmanSchema = new Schema({
    username: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: ''
    },
    wechat_openid: {
      type: String
    },
    wechat_profile: {
      type: Schema.Types.Mixed,
      default: {}
    },
    delete_status:{
      type:Boolean,
      default:false
    },
    //最后活跃时间, 查看运单详情，处理异常运单时记录
    last_active_time: {
      type: Date,
      default: new Date()
    }
  });

  SalesmanSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });
  appDb.model('Salesman', SalesmanSchema);
};
