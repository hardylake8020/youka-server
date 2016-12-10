/**
 * Created by wd on 16/05/24.
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {

  var OnlineReportConfigSchema = new Schema({
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    company_name: {
      type: String
    },
    emails: {
      type: String,
      default: ''
    },
    start_send_time: {
      type: Date,
      default: Date.now
    },
    interval: {
      type: Number,
      default: 1
    }
  });

  OnlineReportConfigSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('OnlineReportConfig', OnlineReportConfigSchema);

};
