/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  UserProfile = appDb.model('UserProfile');

var that = exports;


function getUserProfile(userId, callback) {
  if (!userId) {
    return callback({err: error.params.empty});
  }

  UserProfile.findOne({user_id: userId}, function (err, findEntity) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!findEntity) {
      return callback(null, null);
    }
    return callback(null, findEntity);

  });
}
exports.getUserProfile = function (userId, callback) {
  return getUserProfile(userId, callback);
};