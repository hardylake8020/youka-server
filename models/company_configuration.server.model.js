/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');



module.exports = function (appDb) {

  var OrderOptionSchema = new Schema({
    //强制进场
    must_entrance: {
      type: Boolean,
      default: false
    },
    //强制进场拍照
    must_entrance_photo: {
      type: Boolean,
      default: false
    },
    //进场拍照要求
    entrance_photos: {
      type: [Schema.Types.Mixed]
    },
    //操作必须拍照
    must_take_photo: {
      type: Boolean,
      default: false
    },
    //拍照要求
    take_photos: {
      type: [Schema.Types.Mixed]
    },
    //强制货物明细确认
    must_confirm_detail: {
      type: Boolean,
      default: false
    }
  });

  OrderOptionSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('OrderOption', OrderOptionSchema);

  var PushOptionSchema = new Schema({
    abnormal_push: {
      type: Boolean,
      default: false
    },
    pickup_push: {
      type: Boolean,
      default: false
    },
    delivery_push: {
      type: Boolean,
      default: false
    },
    //提货迟到时长，超过次时长会推送异常
    pickup_deferred_duration: {
      type: Number
    },
    //交货提前推送时长，提前多长时间会推送给收货人
    delivery_early_duration: {
      type: Number
    }
  });

  PushOptionSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('PushOption', PushOptionSchema);

  // 后台管理员对公司的配置
  var AdminOptionSchema = new Schema({
    send_salesman_sms: { // 是否给公司的运单关注人发送短信通知
      type: Boolean,
      default: false
    }
  });
  AdminOptionSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('AdminOption', AdminOptionSchema);

  //与公司相关的配置
  var CompanyConfigurationSchema = new Schema({
    object: {
      type: String,
      default: 'CompanyConfiguration'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    update_id: {
      type: Schema.Types.ObjectId
    },
    pickup_option: {
      type: Schema.Types.Mixed
    },
    delivery_option: {
      type: Schema.Types.Mixed
    },
    push_option: {
      type: Schema.Types.Mixed
    },
    admin_option: {
      type: Schema.Types.Mixed
    }
  });

  CompanyConfigurationSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('CompanyConfiguration', CompanyConfigurationSchema);
};
