/**
 * Created by wd on 16/05/24.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var ReportTaskSchema = new Schema({
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    company_name: {
      type: String
    },
    begin_date: {
      type: Date,
      default: Date.now
    },
    end_date: {
      type: Date,
      default: Date.now
    },
    task_datetime: {
      type: Date,
      default: Date.now
    },
    email_list: {
      type: String,
      default: ''
    },
    send_flg: {
      type: Number,
      default: 0 //0：未发送、1：已发送、9：发送失败
    },
    dw_ticket: {
      type: String,
      default: ''
    },
    dw_cnt: {
      type: Number,
      default: 0
    }
  });

  ReportTaskSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('ReportTask', ReportTaskSchema);

};
