/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');


module.exports = function (appDb) {
//与用户个人相关的配置
  var UserProfileSchema = new Schema({

    user_id: {
      type: Schema.Types.ObjectId
    },
    //创建运单时，对该运单提货前是否强制司机进场
    pickup_entrance_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单提货时是否强制司机拍照
    pickup_photo_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单交货前是否强制司机进场
    delivery_entrance_force: {
      type: Boolean,
      default: false
    },
    //创建运单时，对该运单交货时是否强制司机拍照
    delivery_photo_force: {
      type: Boolean,
      default: true
    },
    //客户自定义列表显示字段，历史原因，现在应该不用了。
    customize_columns: [{
      type: String
    }],
    customize_columns_follow: [{
      type: String
    }],
    customize_columns_assign: [{
      type: String
    }],

    //运单创建时选择的执行组
    order_execute_group: {
      type: String,
      default: ''
    },
    max_page_count_follow: {
      type: Number,
      default: 10
    },
    max_page_count_assign: {
      type: Number,
      default: 10
    }
  });

  UserProfileSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('UserProfile', UserProfileSchema);
};
