/**
 * Created by Wayne on 16/3/17.
 */


var path = require('path'),
  async = require('async'),
  error = require('../../errors/all'),

  appDb = require('../mongoose').appDb,
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup');

var that = exports;

exports.getUserByToken = function (token, callback) {
  if (!token) {
    return callback({err: error.business.user_token_empty});
  }

  that.getUserById(token._id, function (err, user) {
    return callback(err, user);
  });
};
exports.getUserById = function (id, callback) {
  if (!id) {
    return callback({err: error.params.empty});
  }

  User.findOne({_id: id}).populate('company').exec(function (err, user) {
    if (err)
      return callback({err: error.system.db_error});

    if (!user)
      return callback({err: error.business.user_token_invalid});

    return callback(null, user);
  });
};

exports.getGroups = function (userId, callback) {

  User.findOne({_id: userId}, function (err, user) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (!user) {
      return callback({err: error.business.user_account_not_exist});
    }

    if (!user.email_verified) {
      return callback({err: error.business.user_account_not_activate});
    }

    UserGroup.find({user: userId}).populate('group').exec(function (err, userGroups) {
      if (err) {
        err = {err: error.system.db_error};
      }

      return callback(err, userGroups);
    });
  });
};