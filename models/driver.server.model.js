'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var DriverSchema = new Schema(
    {
      object: {
        type: String,
        default: 'driver'
      },
      // 用户名
      username: {
        type: String,
        unique: true,
        required: true,
        trim: true
      },
      password: {
        type: String,
        default: ''
      },
      // 头像
      photo: {
        type: String,
        default: ''
      },
      //用来发送push的设备号
      device_id: {
        type: String,
        default: ''
      },
      //用来发送ios push 的设备号
      device_id_ios: {
        type: String,
        default: ''
      },
      //手机的真实设备号
      phone_id: {
        type: String
      },
      //邮箱
      email: {
        type: String,
        trim: true,
        default: ''
      },
      // 昵称
      nickname: {
        type: String,
        trim: true,
        default: ''
      },

      birthday: {
        type: Date
      },
      age: {
        type: String//仅用于读取显示
      },
      // 身份证号
      id_card_number: {
        type: String,
        default: ''
      },
      //身份证照片
      id_card_photo: {
        type: String
      },
      //银行卡号
      bank_number: {
        type: String,
        default: ''
      },
      //银行卡照片
      bank_number_photo: {
        type: String,
        default: ''
      },
      // 驾驶证
      driving_id_number: {
        type: String,
        trim: true
      },
      // 驾驶证照片
      driving_id_photo: {
        type: String,
        trim: true,
        default: ''
      },
      // 行驶证
      travel_id_number: {
        type: String,
        trim: true,
        default: ''
      },
      // 行驶证照片
      travel_id_photo: {
        type: String,
        trim: true,
        default: ''
      },
      // 车牌号
      plate_number: {
        type: String,
        trim: true,
        default: ''
      },
      // 车牌号照片
      plate_photo: {
        type: String,
        trim: true,
        default: ''
      },
      // 车辆照片
      truck_photo: {
        type: String,
        trim: true,
        default: ''
      },
      //装车单照片
      truck_list_photo: {
        type: String,
        trim: true,
        default: ''
      },
      // 手机号
      phone: {
        type: String,
        trim: true,
        default: ''
      },
      create_time: {
        type: Date,
        default: Date.now
      },
      update_time: {
        type: Date,
        default: Date.now
      },
      // 驾龄
      driving_date: {
        type: Date
      },
      driving_year: {
        type: String,
        trim: true
      },
      operating_permits_photo: {
        type: String,
        trim: true,
        default: ''
      },
      deleted: {
        type: Boolean,
        trim: true
      },
      salt: {
        type: String,
        default: 'abcdefg'
      },
      temporary: {  //是否为临时司机
        type: Boolean,
        default: false
      },
      current_location: {
        type: [Number]
      },
      current_third_account: {
        type: Schema.Types.ObjectId,
        ref: 'ThirdAccount'
      },
      android_version: {
        type: String,
        default: ''
      },
      ios_version: {
        type: String,
        default: ''
      },
      wechat_profile: {
        type: Schema.Types.Mixed,
        default: {}
      },
      truck_number: {
        type: String,
        trim: true,
        default: ''
      },
      truck_type: {
        type: String,
        trim: true,
        default: ''
      }
    },
    {
      toObject: {
        virtuals: true,
        getters: true
      },
      toJSON: {
        virtuals: true,
        getters: true
      }
    }
  );

  DriverSchema.virtual('is_signup').get(function () {
    return (this.password && this.password.length > 0);
  });

  DriverSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  DriverSchema.methods.hashPassword = function (password) {
    if (this.salt && password) {
      return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
    } else {
      return password;
    }
  };

  /**
   * Create instance method for authenticating user
   */
  DriverSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password);
  };

  /**
   * Find possible not used username
   */
  DriverSchema.statics.driverExists = function (username, callback) {
    this.findOne({
      username: username
    }, function (err, driver) {
      callback({err: err, exist: !(driver === null || driver === undefined)});
    });
  };


  /**
   * Find possible not used username
   */
  DriverSchema.statics.findDriver = function (username, callback) {
    //TODO 处理username两边空格
    this.findOne({
      username: username
    }, function (err, driver) {
      callback({err: err, driver: driver});
    });
  };

  appDb.model('Driver', DriverSchema);
};