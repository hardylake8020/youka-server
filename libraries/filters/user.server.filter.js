'use strict';

var cryptoLib = require('../crypto'),
  userService = require('../services/user'),
  error = require('../../errors/all');

var findUser = function (req, callback) {
  var token;
  token = req.body.access_token || req.query.access_token;

  req.connection = req.connection || {};
  req.socket = req.socket || {};
  req.connection.socket = req.connection.socket || {};

  if (!token)
    return callback({err: error.business.user_token_empty});

  try {
    token = cryptoLib.decrpToken(token, 'secret');
  }
  catch (e) {
    return callback({err: error.business.user_token_invalid});
  }

  userService.getUserByToken(token, function (err, user) {
    return callback(err, user);
  });
};

//后台访问权限要求
exports.requireAdmin = function (req, res, next) {
  findUser(req, function (err, user) {
    if (err)
      return res.send(err);
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

      if (!isAdmin) {
        return res.send({err: error.business.user_admin_authentication_failed});
      }

      req.user = user;
      next();
    }
  });
};
//用户访问权限要求
exports.requireUser = function (req, res, next) {
  findUser(req, function (err, user) {
    if (err) {
      return res.send(err);
    }
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
      req.err = err;
      return next();
    }
    var isCompanyAdmin = false;

    if (user.roles.indexOf('companyAdmin') > -1) {
      isCompanyAdmin = true;
    }

    if (!isCompanyAdmin) {
      return res.send({err: error.business.user_admin_authentication_failed});
    }

    req.user = user;
    next();
  });
};