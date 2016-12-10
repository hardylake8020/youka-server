/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var CompanySchema = new Schema({
    object: {
      type: String,
      default: 'company'
    },
    name: {
      type: String,
      unique: true,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    employees: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    contact_name: {
      type: String,
      default: ''
    },
    contact_phone: {
      type: String,
      default: ''
    },
    business_license: {
      type: String,
      default:''
    },
    photo: {
      type: String,
      default: ''
    },
    creator: {
      type: String,
      default: ''
    },
    modify_info: {
      type: Schema.Types.Mixed
    },
    auth_status:{
      type:String,
      enum: ['normal','processing','authed'],
      default:'normal'
    },
    verify_result_text: {
      type: String,
      default: ''
    },
    default_group: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    },
    create_time: {
      type: Date,
      default: Date.now
    },
    update_time: {
      type: Date,
      default: Date.now
    },
    max_order_count_per_day: {
      type: Number,
      default: 1000
    }
  });

  CompanySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  CompanySchema.statics.isExist = function (idString, callback) {
    console.log(idString);

    this.findOne({
      _id: mongoose.Types.ObjectId(idString)
    }, function (err, company) {
      callback({err: err, exist: !(company === null || company === undefined)});
    });
  };
  appDb.model('Company', CompanySchema);

};
