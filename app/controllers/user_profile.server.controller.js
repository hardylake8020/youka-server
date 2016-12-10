/**
 * Created by Wayne on 15/7/10.
 */

'use strict';

var userError = require('../errors/user'),
  userProfileError = require('../errors/user_profile'),
  userProfileService = require('../services/user_profile');


exports.getUserProfile = function (req, res, next) {
  var currentUser = req.user || {};

  userProfileService.getUserProfile(currentUser._id, function (err, userProfileEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {user_profile: userProfileEntity};
    return next();
  });
};

exports.setFollowCustomizeColumns = function (req, res, next) {
  var currentUser = req.user || {};
  var customizeColumns = req.body.customize_columns_follow || req.query.customize_columns_follow || [];

  if (customizeColumns.length <= 0) {
    req.err = {err: userProfileError.params_null};
    return next();
  }

  userProfileService.setFollowCustomizeColumns(currentUser._id, customizeColumns, function (err, userProfileEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {user_profile: userProfileEntity};
    return next();
  });

};

exports.setAssignCustomizeColumns = function (req, res, next) {
  var currentUser = req.user || {};
  var customizeColumns = req.body.customize_columns_assign || req.query.customize_columns_assign || [];

  if (customizeColumns.length <= 0) {
    req.err = {err: userProfileError.params_null};
    return next();
  }

  userProfileService.setAssignCustomizeColumns(currentUser._id, customizeColumns, function (err, userProfileEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    req.data = {user_profile: userProfileEntity};
    return next();
  });

};

exports.setMaxPageCount = function (req, res, next) {
  var currentUser = req.user || {};
  var columnName = req.query.column_name || '';
  var maxPageCount = parseInt(req.query.max_page_count) || 0;

  if (!columnName || !maxPageCount) {
    req.err = {err: userProfileError.params_null};
    return next();
  }

  switch (columnName) {
    case 'max_page_count_follow':
      userProfileService.setFollowPageMaxCount(currentUser._id, maxPageCount, function (err, userProfileEntity) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = {user_profile: userProfileEntity};
        return next();
      });
      break;
    case 'max_page_count_assign':
      userProfileService.setAssignPageMaxCount(currentUser._id, maxPageCount, function (err, userProfileEntity) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = {user_profile: userProfileEntity};
        return next();
      });
      break;

    default:
      req.err = {err: {type: 'invalid_params'}};
      return next();
  }
};