/**
 * Created by elinaguo on 15/3/24.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
//纪录实际货物提交信息
  var ActualGoodsRecordSchema = new Schema({
    goods_name: {
      type: String
    },
    count: {
      type: Number
    },
    weight: {
      type: Number
    },
    volume: {
      type: Number
    },
    count_unit: {
      type: String
    },
    weight_unit: {
      type: String
    },
    volume_unit: {
      type: String
    }
  });

  ActualGoodsRecordSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('ActualGoodsRecord', ActualGoodsRecordSchema);

  var TransportEventSchema = new Schema({
    object: {
      type: String,
      default: 'transport'
    },
    event_id: {
      type: String
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    driver_name: {
      type: String
    },
    driver_phone: {
      type: String
    },
    driver_plate_numbers: [{
      type: String,
      trim: true,
      default: ''
    }],
    type: {
      type: String,
      enum: ['pickupSign', 'pickup', 'deliverySign', 'delivery', 'halfway','confirm'],
      required: true
    },
    address: {
      type: String
    },
    time: {
      type: Date,
      default: Date.now
    },
    //用于记录司机的备注信息
    description: {
      type: String,
      default: ''
    },
    damaged: {
      type: Boolean,
      default: false
    },
    pickup_missing_packages: {
      type: Boolean,
      default: false
    },
    //缺件(实际交货件数不同于发货件数)
    delivery_missing_packages: {
      type: Boolean,
      default: false
    },
    pickup_deferred: {  //提货延迟
      type: Boolean,
      default: false
    },
    delivery_deferred: {  //交货延迟
      type: Boolean,
      default: false
    },
    //地址偏差异常
    address_difference: {
      type: Boolean,
      default: false
    },
    //地址偏差距离
    address_difference_distance: {
      type: Number
    },
    location: {
      type: [Number]//[longitude,latitude]
    },
    credential_photos: [{
      type: String
    }],
    goods_photos: [{
      type: String
    }],
    halfway_photos: [{
      type: String
    }],
    photos: {
      type: [Schema.Types.Mixed]
    },
    voice_file: {
      type: String,
      default: ''
    },
    order_codes: [{
      type: String
    }],
    //是否扫码交货
    delivery_by_qrcode: {
      type: Boolean,
      default: false
    },
    //实际货物信息，之前的单货物记录，以后不用了，单旧数据还要支持。
    actual_goods_record: {
      type: Schema.Types.Mixed
    },
    //实际收到的多货物记录
    actual_more_goods_record: [{
      type: Schema.Types.Mixed
    }],
    is_wechat: {
      type: Boolean,
      default: false
    },
    //识别的车牌号码列表
    recognize_plates: [{
      type: String
    }],
    //司机车牌不匹配
    driver_plate_difference: {
      type: Boolean,
      default: false
    },
    //提货送货车牌不匹配
    transport_plate_difference: {
      type: Boolean,
      default: false
    }
  });

  TransportEventSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('TransportEvent', TransportEventSchema);

};
