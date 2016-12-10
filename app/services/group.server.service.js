'use strict';
var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  q = require('q'),
  fs = require('fs'),
  ejs = require('ejs'),
  emailLib = require('../libraries/email'),
  config = require('../../config/config'),
  groupError = require('../errors/group'),
  appDb = require('../../libraries/mongoose').appDb,
  User = appDb.model('User'),
  Group = appDb.model('Group'),
  UserGroup = appDb.model('UserGroup'),
  groupService = require('../services/group'),
  userService = require('../services/user');


exports.getGroupById = function (groupId, callback) {
  if (!groupId) {
    return callback({err: groupError.group_id_null}, null);
  }

  Group.findOne({_id: groupId, $or: [
    {delete_status: {$exists: false}},
    {delete_status: false}
  ]}).exec(function (err, group) {
    if (err)
      return callback({err: groupError.internal_system_error}, null);

    if (!group)
      return callback({err: groupError.group_not_exist}, null);

    return callback(null, group);
  });
};

function isCompanyAdminUser(user, callback) {
  if (!user) {
    return callback(groupError.user_not_exist);
  }
  if (user.roles.indexOf('companyAdmin') > -1) {
    return callback(null, true);
  }
  else {
    return callback(null, false);
  }
}

exports.isUserInGroup = function (userId, groupId, callback) {
  if (!userId || !groupId) {
    return callback(groupError.params_null);
  }

  UserGroup.findOne({user: userId, group: groupId}, function (err, findUserGroup) {
    if (err) {
      return callback(groupError.internal_system_error);
    }
    if (!findUserGroup) {
      return callback(null, false);
    }
    else {
      return callback(null, true);
    }
  });
};

exports.findUserViewGroupIds = function (user, callback) {
  isCompanyAdminUser(user, function (err, isCompanyAdmin) {
    if (err) {
      return callback(err);
    }

    if (isCompanyAdmin) {
      Group.find({company: user.company, $or: [
        {delete_status: {$exists: false}},
        {delete_status: false}
      ]}).exec(function (err, groupEntities) {
        if (err) {
          return callback(groupError.internal_system_error);
        }
        var groupIds = groupEntities.map(function (item) {
          return item._id;
        });
        return callback(null, groupIds);
      });
    }
    else {
      UserGroup.find({user: user._id, $or: [{delete_status: {$exists: false}}, {delete_status: false}]})
        .exec(function (err, userGroupEntities) {
          if (err) {
            return callback(groupError.internal_system_error);
          }
          var groupIds = userGroupEntities.map(function (item) {
            return item.group;
          });

          return callback(null, groupIds);
        });
    }
  });
};

//查找用户可见的组,返回组信息
exports.findUserViewGroups = function (user, callback) {
  isCompanyAdminUser(user, function (err, isCompanyAdmin) {
    if (err) {
      return callback(err);
    }

    if (isCompanyAdmin) {
      Group.find({company: user.company, $or: [
        {delete_status: {$exists: false}},
        {delete_status: false}
      ]}).exec(function (err, groupEntities) {
        if (err) {
          return callback(groupError.internal_system_error);
        }

        return callback(null, groupEntities);
      });
    }
    else {
      UserGroup.find({user: user._id, $or: [{delete_status: {$exists: false}}, {delete_status: false}]})
        .populate('group')
        .exec(function (err, userGroupEntities) {
        if (err) {
          return callback(groupError.internal_system_error);
        }
        if (!userGroupEntities) {
          return callback(null, null);
        }
        var groupEntities = [];
        userGroupEntities.forEach(function (userGroup) {
          groupEntities.push(userGroup.group);
        });

        return callback(null, groupEntities);
      });
    }
  });
};
exports.findUserExecuteGroups = function (user, callback) {
  if (!user) {
    return callback(groupError.user_not_exist);
  }

  UserGroup.find({user: user._id}).populate('group').exec(function (err, userGroupEntities) {
    if (err) {
      return callback(groupError.internal_system_error);
    }
    if (!userGroupEntities) {
      return callback(null, null);
    }
    var groupEntities = [];
    userGroupEntities.forEach(function (userGroup) {
      groupEntities.push(userGroup.group);
    });

    return callback(null, groupEntities);
  });
};


exports.findGroupUsers = function (groupId, callback) {
  if (!groupId) {
    return callback(groupError.group_id_null);
  }

  UserGroup.find({group: groupId, $or: [
    {delete_status: {$exists: false}},
    {delete_status: false}
  ]}, function (err, userGroupEntities) {
    if (err) {
      return callback(groupError.internal_system_error);
    }

    return callback(null, userGroupEntities);
  });
};

exports.findUserInGroupById = function (userId, groupId, callback) {
  if (!userId || !groupId) {
    return callback(groupError.params_null);
  }

  UserGroup.findOne({user: userId, group: groupId}, function (err, userGroupEntity) {
    if (err) {
      return callback(groupError.internal_system_error);
    }
    return callback(null, userGroupEntity);
  });

};

function newUserGroup(user, group, callback) {
  UserGroup.findOne({user: user, group: group}, function (err, userGroup) {
    if (err) {
      return callback({err: groupError.internal_system_error});
    }

    if (userGroup) {
      return callback(null, userGroup);
    }

    userGroup = new UserGroup({
      user: user,
      group: group
    });

    userGroup.save(function (err, newUserGroup) {
      if (err || !newUserGroup) {
        return callback({err: groupError.internal_system_error});
      }
      return callback(null, newUserGroup);
    });
  });
}

function addUserToGroup(user, company, group, callback) {
  async.auto({
    saveDefaultUserGroup: function (autoCallback) {
      newUserGroup(user, company.default_group, autoCallback);
    },
    saveUserGroup: ['saveDefaultUserGroup', function (autoCallback, result) {
      newUserGroup(user, group, function (err, userGroup) {
        return autoCallback(err, userGroup);
      });
    }]
  }, function (err, result) {
    return callback(err, result.saveUserGroup);
  });
}

function verifyEmail(emailAddress, renderData, callback) {
  var templateFileName = path.join(__dirname, '../../web/zzqs2/templates/email_sent/email_sign_up.client.view.html');

  fs.readFile(templateFileName, 'utf8', function (err, str) {
    if (err) {
      console.log('fs.readFile(' + templateFileName + ') failed');
      return callback({err: groupError.internal_system_error});
    }

    var html = ejs.render(str, renderData);

    emailLib.sendEmail(emailAddress, '柱柱签收网邮箱', html, function (err, result) {
      if (err) {
        console.log('emailLib.sendEmail(' + emailAddress + ') failed');
        return callback({err: groupError.invalid_email});
      }

      return callback(null, result);
    });
  });
}

exports.addUserToGroup = function (user, company, group, callback) {
  addUserToGroup(user, company, group, callback);
};

exports.inviteUserToGroup = function (username, company, group, callback) {
  var isNew = false;

  userService.getUserByUsername(username, function (err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      isNew = true;
      user = new User();
      user.username = username;
      user.company = company._id;
      user.isInvited = true;
    }

    //用户没有加入公司
    if (!user.company) {
      user.company = company._id;
    }

    if (user.company.toString() !== company._id.toString()) {
      return callback({err: groupError.user_in_other_company});
    }

    user.save(function (err, saveUser) {
      if (err || !saveUser) {
        return callback({err: groupError.internal_system_error});
      }

      addUserToGroup(saveUser, company, group, function (err, userGroup) {
        if (err) {
          return callback(err);
        }

        if (isNew) {
          userService.encryptUsername(saveUser.username, function (err, token) {

            var activateUrl = config.serverAddress + 'user/employee_active_page?token=' + token + '&username=' + saveUser.username;
            var renderData = {
              logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
              username: saveUser.username,
              urlAddress: activateUrl,
              action: '立即注册',
              description: company.name + '邀请您加入柱柱签收网，成为公司员工。请点击下方链接，注册您的账户。',
              websiteUrl: config.serverAddress
            };

            verifyEmail(saveUser.username, renderData, function (err, result) {
              if (err) {
                return callback(err);
              }
              return callback(null, userGroup);
            });

          });
        }
        else {
          return callback(null, userGroup);
        }
      });
    });
  });
};