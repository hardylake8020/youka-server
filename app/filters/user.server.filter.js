'use strict';

var cryptoLib = require('../libraries/crypto'),
  appDb = require('../../libraries/mongoose').appDb,
  userError = require('../errors/user'),
  User = appDb.model('User');

var findUser = function (req, callback) {
  var token;
  token = req.body.access_token || req.query.access_token;

  req.connection = req.connection || {};
  req.socket = req.socket || {};
  req.connection.socket = req.connection.socket || {};

  if (!token)
    return callback(userError.undefined_access_token);

  try {
    token = cryptoLib.decrpToken(token, 'secret');
  }
  catch (e) {
    return callback(userError.invalid_access_token);
  }

  User.findOne({_id: token._id}).populate('company').exec(function (err, user) {
    if (err)
      return callback(userError.internal_system_error);

    if (!user)
      return callback(userError.user_not_exist);

    return callback(null, user);
  });
};

//后台访问权限要求
exports.requireAdmin = function (req, res, next) {
  findUser(req, function (err, user) {
    if (err)
      return res.send({err: err});
    else {
      var isAdmin = false;

      if (user) {
        user.roles.every(function (value, index, arr) {
          if (value === 'admin') {
            isAdmin = true;
            return false;
          } else {
            return true;
          }
        });
      }

      if (!isAdmin)
        return res.send({err: userError.admin_authentication_failed});

      req.user = user;

      next();
    }
  });
};
//用户访问权限要求
exports.requireUser = function (req, res, next) {
  findUser(req, function (err, user) {
    if (err)
      return res.send({err: err});
    else if (user) {
      req.user = user;
      next();
    }
  });
};
//公司管理员访问权限要求（管理公司用户和组）
exports.requireCompanyAdmin = function (req, res, next) {
  findUser(req, function (err, user) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    var isCompanyAdmin = false;

    if (user.roles.indexOf('companyAdmin') > -1) {
      isCompanyAdmin = true;
    }

    if (!isCompanyAdmin) {
      req.err = {err: userError.admin_authentication_failed};
      return next();
    }

    req.user = user;
    next();
  });
};

exports.requireWeiChatUser = function (req, res, next) {
  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  User.findOne({weichat_openid: openid}, function (err, user) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }
    if (!user) {
      return res.send({err: {type: 'invalid_openid'}});
    }

    req.user = user;

    next();
  });
};