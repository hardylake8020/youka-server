/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';
var publicLib = require('../libraries/public'),
  fs = require('fs'),
  ejs = require('ejs'),
  path = require('path'),
  groupError = require('../errors/group'),
  appDb = require('../../libraries/mongoose').appDb,
  async = require('async'),
  UserGroup = appDb.model('UserGroup'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),

  groupService = require('../services/group'),
  userService = require('../services/user');

exports.create = function (req, res, next) {
  var user = req.user || {};
  var company = req.company || {};
  var groupName = req.body.name || '';

  if (publicLib.isNullOrEmpty(groupName)) {
    return res.send({err: groupError.name_null});
  }

  Group.findOne({
    name: groupName,
    company: company._id,
    $or: [{delete_status: {$exists: false}}, {delete_status: false}]
  }, function (err, group) {
    if (err) {
      return res.send({err: groupError.internal_system_error});
    }
    if (group) {
      return res.send({err: groupError.group_exist});
    }
    var newGroup = new Group();
    newGroup.name = groupName;
    newGroup.company = company._id;

    var userGroup = new UserGroup();
    userGroup.user = user._id;
    userGroup.group = newGroup._id;
    newGroup.save(function (err, group) {
      if (err) {
        return res.send({err: groupError.internal_system_error});
      }
      userGroup.save(function (err) {
        if (err) {
          return res.send({err: groupError.internal_system_error});
        }
        return res.send(newGroup);
      });
    });
  });
};

exports.userListByGroup = function (req, res, next) {
  var group = req.group || {};
  UserGroup.find({group: group._id}).populate({
    path: 'user',
    select: '-password'
  }).exec(function (err, userGroups) {
    if (err) {
      req.err = {err: groupError.internal_system_error};
      return next();
    }
    var users = [];
    if (userGroups && userGroups.length > 0) {
      userGroups.forEach(function (userGroupItem) {
        users.push(userGroupItem.user);
      });
    }

    req.data = users;
    return next();
  });
};

//需要post group_id company_id user_ids
exports.inviteMultiUserToGroup = function (req, res, next) {
  var currentUser = req.user || {};
  var usernames = req.body.usernames || [];
  var group = req.group || {};
  var company = req.company || {};

  if (!usernames || usernames.length <= 0) {
    return res.send({err: groupError.name_null});
  }

  var errorArray = [];
  async.each(usernames, function (username, asyncCallback) {
    groupService.inviteUserToGroup(username, company, group, function (err, userGroup) {
      if (err) {
        errorArray.push(err);
      }
      return asyncCallback();
    });
  }, function(err) {
    if (err) {
      return res.send(err);
    }

    return res.send({errorArray: errorArray});
  });
};

exports.inviteUserToGroup = function (req, res, next) {
  var company = req.company || {};
  var group = req.group || {};
  var username = req.body.email || '';

  groupService.inviteUserToGroup(username, company, group, function (err, userGroup) {
    if (err) {
      return res.send(err);
    }

    return res.send(userGroup);
  });
};

//获取用户所在的组（管理员不一定在所有的组）
exports.getUserExecuteGroups = function (req, res, next) {
  var user = req.user || {};

  if (!user) {
    req.err = {err: groupError.user_not_exist};
    return next();
  }

  groupService.findUserExecuteGroups(user, function (err, groupEntities) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    else {
      if (!groupEntities) {
        req.err = {err: groupError.group_not_exist};
        return next();
      }

      async.each(groupEntities, function (groupItem, callback) {
        UserGroup.count({group: groupItem._id}, function (err, userCount) {
          if (err) {
            return callback(groupError.internal_system_error);
          }
          groupItem._doc.employee_count = userCount;
          return callback();
        });
      }, function (err) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = groupEntities;
        return next();
      });
    }
  });
};

//获取用户能看到的组（管理员能看到所有的组）
exports.getUserViewGroups = function (req, res, next) {
  var user = req.user || {};

  if (!user) {
    req.err = {err: groupError.user_not_exist};
    return next();
  }

  groupService.findUserViewGroups(user, function (err, groupEntities) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    else {
      if (!groupEntities) {
        req.err = {err: groupError.group_not_exist};
        return next();
      }

      async.each(groupEntities, function (groupItem, callback) {
        UserGroup.count({group: groupItem._id}, function (err, userCount) {
          if (err) {
            return callback(groupError.internal_system_error);
          }
          groupItem._doc.employee_count = userCount;
          return callback();
        });
      }, function (err) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        req.data = groupEntities;
        return next();
      });
    }

  });
};

exports.update = function (req, res, next) {

};

exports.getAll = function (req, res, next) {
  return res.send('group GetAll success');
};
exports.getByID = function (req, res, next) {
  return res.send('group GetByID success');
};

//移除用户组
//先移除组与员工的关系，再移除组。如果是默认组，则移除出错。
exports.removeUserGroup = function (req, res, next) {
  var currentUser = req.user || {};
  var group = req.group;

  if (!currentUser || !group) {
    req.err = {err: groupError.post_data_empty};
    return next();
  }

  if (group.name === 'default_group') {
    req.err = {err: groupError.forbid_delete_default_group};
    return next();
  }

  groupService.findGroupUsers(group._id, function (err, userGroupEntities) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    if (userGroupEntities && userGroupEntities.length > 0) {
      async.each(userGroupEntities, function (userGroupItem, eachCallback) {
        userGroupItem.remove(function (err, userGroupEntity) {
          if (err) {
            return eachCallback(groupError.internal_system_error);
          }
          else {
            return eachCallback();
          }
        });

      }, function (err) {
        if (err) {
          req.err = {err: err};
          return next();
        }

        group.delete_status = true;  //增加标志
        group.save(function (err, saveGroup) {
          if (err) {
            req.err = {err: groupError.internal_system_error};
            return next();
          }

          req.data = {success: true};
          return next();
        });

      });
    }
    else {
      group.delete_status = true;  //增加标志
      group.save(function (err, saveGroup) {
        if (err) {
          req.err = {err: groupError.internal_system_error};
          return next();
        }

        req.data = {success: true};
        return next();
      });

    }
  });

};

//从用户组中移除员工
//只移除员工与组的关系，不能移除默认组中的成员
exports.removeGroupUser = function (req, res, next) {
  var currentUser = req.user || {};
  var group = req.group || '';
  var removeUserId = req.body.group_user_id || req.body.group_user_id || '';

  if (!currentUser || !group || !removeUserId) {
    req.err = {err: groupError.post_data_empty};
    return next();
  }
  if (group.name === 'default_group') {
    req.err = {err: groupError.forbid_delete_default_group};
    return next();
  }

  //如果组中的成员已不存在，则提示已删除。
  groupService.findUserInGroupById(removeUserId, group._id, function (err, userGroupEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    if (!userGroupEntity) {
      req.err = {err: groupError.user_not_exist_in_group};
      return next();
    }

    userGroupEntity.remove(function (err, removeUserGroupEntity) {
      if (err) {
        req.err = {err: groupError.user_not_exist_in_group};
        return next();
      }

      UserGroup.count({group: group._id}, function (err, userGroupCount) {
        if (err) {
          req.err = {err: groupError.internal_system_error};
          return next();
        }
        //如果是最后一位员工，是否要删除此组
        if (userGroupCount <= 0) {
          group.delete_status = true;
          group.save(function (err, saveGroup) {
            if (err) {
              req.err = {err: groupError.internal_system_error};
              return next();
            }

            req.data = {group_delete: true};
            return next();
          });
        }
        else {
          req.data = {group_delete: false};
          return next();
        }

      });
    });
  });

};
