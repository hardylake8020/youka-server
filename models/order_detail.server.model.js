/**
 * Created by elinaguo on 15/3/24.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var DetailSchema = new Schema(
    {
      object:{
        type:String,
        default:'orderdetail'
      },
      name: {
        type: String
      },
      status: {
        type: String
      },
      description: {
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

  DetailSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  var OrderDetailSchema = new Schema({
    order_number: {
      type: String,
      required: true,
      trim: true
    },
    order_number_search:{
      type:String,
      default:''
    },
    refer_order_number:{
      type:String
    },
    //原始订单号
    original_order_number:{
      type:String
    },
    goods_name:{
      type:String
    },
    count: {
      type: Number,
      default:0
    },
    weight: {
      type: Number,
      default:0
    },
    volume: {
      type: Number,
      default:0
    },
    count_unit: {
      type: String
    },
    weight_unit: {
      type: String
    },
    volume_unit: {
      type: String
    },
    //运费
    freight_charge: {
      type: Number
    },
    create_time: {
      type: Date,
      default: Date.now
    },
    update_time: {
      type: Date,
      default: Date.now
    },
    details: [DetailSchema],
    //多货物的记录
    //货物名称name, 数量count, 单位unit, 数量count2, 单位unit2, 数量count3, 单位unit3
    goods: [{
     type: Schema.Types.Mixed
    }]
  });

  OrderDetailSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  var GoodsDetailSchema = new Schema({
    name: {
      type: String,
      default: ''
    },
    count: {
      type: Number
    },
    unit: {
      type: String
    },
    //附近单位显示
    count2: {
      type: Number
    },
    unit2: {
      type: String
    },
    count3: {
      type: Number
    },
    unit3: {
      type: String
    },
    price: {
      type: Number
    }
  });

  appDb.model('Detail', DetailSchema);
  appDb.model('OrderDetail', OrderDetailSchema);
  appDb.model('GoodsDetail', GoodsDetailSchema);
};