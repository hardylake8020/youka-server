/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  Group = appDb.model('Group');

var that = exports;

exports.getDefaultGroup = function (companyId, callback) {
  Group.findOne({
    name: 'default_group',
    company: companyId,
    $or: [{delete_status: {$exists: false}}, {delete_status: false}]
  }, function (err, group) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!group) {
      return callback({err: error.business.group_not_exist});
    }
    return callback(null, group);
  });
};