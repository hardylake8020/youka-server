/**
 * Created by elinaguo on 15/3/18.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var InviteDriverSchema = new Schema({
    object:{
      type:String,
      default:'invitedriver'
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company'
    },
    status: {
      type: String,
      enum:['inviting','accepted','confused'],
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

  InviteDriverSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });


  /**
   * Find possible not used username
   */
  InviteDriverSchema.statics.invitingPartners = function (username, callback) {
    this.find({
      username: username
    }, function (err, inviteDrivers) {
      callback({err: err, list: inviteDrivers});
    });
  };


  InviteDriverSchema.statics.findInviteUser = function (idString, callback) {
    this.findOne({
      _id: mongoose.Types.ObjectId(idString)
    }, function (err, inviteuser) {
      callback(err, inviteuser);
    });
  };

  appDb.model('InviteDriver', InviteDriverSchema);
};