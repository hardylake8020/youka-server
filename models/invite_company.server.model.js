/**
 * Created by elinaguo on 15/3/18.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var InviteCompanySchema = new Schema({
    object: {
      type: String,
      default: 'invitecompany'
    },
    //被邀请公司邮箱
    username: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    //当前公司ID
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    status: {
      type: String,
      enum: ['inviting', 'accepted', 'confused'],
      default: 'inviting'
    },
    deleted: {
      type: Boolean,
      default: false
    },
    create_time: {
      type: Date,
      default: Date.now
    }
  });

  InviteCompanySchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  appDb.model('InviteCompany', InviteCompanySchema);
};