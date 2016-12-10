/**
 * Created by elinaguo on 15/3/25.
 */
'use strict';

var appDb = require('../../libraries/mongoose').appDb,
  Group = appDb.model('Group'),
  UserGroup = appDb.model('UserGroup'),
  groupService = require('../services/group'),
  groupError = require('../errors/group');

exports.requireGroup = function (req, res, next) {
  var groupId;

  if (req.body.group_id) {
    groupId = req.body.group_id;
  } else {
    groupId = req.query.group_id;
  }

  if (!groupId) {
    return res.send({err: groupError.group_id_null});
  }

  Group.findOne({_id: groupId, $or: [{delete_status: {$exists: false}}, {delete_status: false}]}, function (err, group) {
    if (err) {
      return res.send({err: groupError.internal_system_error});
    }
    if (!group) {
      return res.send({err: groupError.group_not_exist});
    }

    req.group = group;
    next();
  });
};

exports.requireUserGroup = function (req, res, next) {
  var currentUser = req.user;
  var groupId;

  if (req.body.group_id) {
    groupId = req.body.group_id;
  } else {
    groupId = req.query.group_id;
  }

  if (!groupId) {
    return res.send({err: groupError.group_id_null});
  }

  UserGroup.findOne({user: currentUser._id, group: groupId}, function (err, findUserGroup) {
    if (err) {
      return res.send({err: groupError.internal_system_error});
    }
    if (!findUserGroup) {
      return res.send({err: groupError.user_not_exist_in_group});
    }

    next();
  });
};

//获取用户可见的组。公司管理员可以看到本公司所有的组
exports.getUserViewGroupIds = function (req, res, next) {
  var currentUser = req.user;

  groupService.findUserViewGroupIds(currentUser, function (err, groupIds) {
    if (err) {
      return res.send(err);
    }

    req.groupIds = groupIds;

    next();
  });
};