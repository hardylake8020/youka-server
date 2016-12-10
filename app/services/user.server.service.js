'use strict';
/**
 * Module dependencies.
 */

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  q = require('q'),
  cryptoLib = require('../libraries/crypto'),
  userError = require('../errors/user'),
  appDb = require('../../libraries/mongoose').appDb;

//用户模型
var User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup');

exports.getGroups = function (userId, callback) {

  User.findOne({_id: userId}, function (err, user) {
    if (err) {
      return callback({err: userError.internal_system_error}, null);
    }

    if (!user) {
      return callback({err: userError.account_not_exist}, null);
    }

    if (!user.email_verified) {
      return callback({err: userError.account_not_activate}, null);
    }

    UserGroup.find({user: userId}).populate('group').exec(function (err, userGroups) {
      if (err) {
        return callback({err: userError.internal_system_error}, null);
      }

      return callback(null, userGroups);
    });
  });
};

exports.getGroupIdsByUser = function (userEntity, callback) {
  if (!userEntity) {
    return callback({err: userEntity.account_not_exist}, null);
  }

  if (!userEntity.email_verified) {
    return callback({err: userError.account_not_activate}, null);
  }

  UserGroup.find({user: userEntity._id}, 'group').exec(function (err, docs) {
    if (err) {
      return callback({err: userError.internal_system_error}, null);
    }

    if (!docs || docs.length === 0) {
      return callback({err: userError.not_in_any_group}, null);
    }

    var groupIds = [];
    docs.forEach(function (doc) {
      groupIds.push(doc.group);
    });

    return callback(null, groupIds);
  });
};

exports.isExistUser = function (username, callback) {
  if (!username) {
    return callback(false, null);
  }

  var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!emailReg.test(username)) {
    return callback(false, null);
  }

  User.findOne({username: username}, function (err, userEntity) {
    if (err) {
      return callback(false, null);
    }

    if (!userEntity) {
      return callback(false, null);
    }

    return callback(true, userEntity);
  });
};

exports.emailValid = function (emailString) {
  //邮箱正则
  var mailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!mailReg.test(emailString)) {
    return false;
  }
  return true;
};

exports.passwordInputValid = function (passwordString) {
//密码验证
  if (passwordString.length < 6) {
    return false;
  }

  return true;
};

exports.decryptUsername = function (encryptUsername, callback) {
  if (!encryptUsername) {
    return callback(userError.invalid_email);
  }

  var username = cryptoLib.decryptString(encryptUsername, 'secret');

  var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!emailReg.test(username)) {
    return callback(userError.invalid_email);
  }

  return callback(null, username);
};

exports.encryptUsername = function (username, callback) {
  if (!username) {
    return callback(userError.invalid_email);
  }

  var encryptUsername = cryptoLib.encryptString(username, 'secret');

  return callback(null, encryptUsername);
};

exports.encryptToken = function (userId, callback) {
  if (!userId) {
    return callback(userError.invalid_user_id);
  }

  var access_token = cryptoLib.encrypToken({_id: userId, time: new Date()}, 'secret');

  return callback(null, access_token);
};

exports.getUserByUsername = function (username, callback) {
  User.findOne({username: username}, function (err, user) {
    if (err) {
      return callback({err: userError.internal_system_error});
    }
    return callback(null,user);
  });
};

exports.encryptId = function (id, callback) {
  return callback(null, cryptoLib.encryptString(id.toString(), 'zz-secret'));
};
exports.decryptId = function (encryptId, callback) {
  return callback(null, cryptoLib.decryptString(encryptId, 'zz-secret'));
};