/**
 * Created by Wayne on 15/11/13.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var InformSchema = new Schema({
      object: {
        type: String,
        default: 'inform'
      },
      type: {
        type: String,
        enum: ['/socket/web/abnormal_order/single'],
        default: ''
      },
      company_id: {
        type: String
      },
      //向多个组通知，通常只有一个组
      group_id: {
        type: String
      },
      //已读用户的id
      read_user_ids: [{
        type: String
      }],
      //通知的内容，目前
      //{title, text, sub_type, time}
      context: {
        type: Schema.Types.Mixed,
        default: {}
      },
      create_time_format: {
        type: String
      },
      update_time_format: {
        type: String
      }
    });

  InformSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  InformSchema.pre('save', function (next) {
    if (this.created)
      this.create_time_format = moment(this.created).format('YYYY-MM-DD HH:mm:ss');
    if (this.updated)
      this.update_time_format = moment(this.created).format('YYYY-MM-DD HH:mm:ss');
    next();
  });

  appDb.model('Inform', InformSchema);
}
;