'use strict';
/**
 * Module dependencies.
 */

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  fs = require('fs'),
  ejs = require('ejs'),
  q = require('q'),
  config = require('../../config/config'),
  userError = require('../errors/user'),
  emailLib = require('../libraries/email'),
  cryptoLib = require('../libraries/crypto'),
  appDb = require('../../libraries/mongoose').appDb;

var resetTempService = require('../services/reset_temp'),
  userService = require('../services/user');

//用户模型
var User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  CompanyPartner = appDb.model('CompanyPartner'),
  Company = appDb.model('Company'),
  InviteCompany = appDb.model('InviteCompany');

function verifyEmail(emailAddress, renderData, callback) {
  var templateFileName = path.join(__dirname, '../../web/zzqs2/templates/email_sent/email_sign_up.client.view.html');

  fs.readFile(templateFileName, 'utf8', function (err, str) {
    if (err) {
      console.log('fs.readFile(' + templateFileName + ') failed');
      return callback(userError.internal_system_error);
    }

    var html = ejs.render(str, renderData);

    emailLib.sendEmail(emailAddress, '柱柱签收网邮箱', html,
      function (err, result) {
        if (err) {
          console.log('emailLib.sendEmail(' + emailAddress + ') failed');
          return callback(userError.email_failed);
        }

        return callback(null, result);
      });
  });
}

exports.me = function (req, res, next) {
  var user = req.user || {};
  UserGroup.find({user: user._id}).populate('group').exec(function (err, userGroups) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    //delete user._doc._id; 前端需要id的值
    delete user._doc.password;
    user._doc.executeGroups = userGroups;
    return res.send(user);
  });
};

exports.sendActivateEmail = function (req, res, next) {
  var username = req.body.username || '';

  //邮箱正则
  var usernameReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!usernameReg.test(username)) {
    return res.send({err: userError.invalid_email});
  }

  User.findOne({username: username}, function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    if (!user) {
      return res.send({err: userError.account_not_exist});
    }

    if (user.email_verified) {
      return res.send({err: userError.account_has_activated});
    }

    var activateUrl = config.serverAddress + 'user/activate/' + user._id;

    var renderData = {
      logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
      username: user.username,
      urlAddress: activateUrl,
      action: '立即激活',
      description: '您已经成功创建新的柱柱签收账户。感谢您执行激活账户这一重要步骤。点击下面的按钮后，您即可通过自己的账户使用柱柱签收的全部服务。',
      websiteUrl: config.serverAddress
    };

    verifyEmail(user.username, renderData, function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log('再次发送注册邮箱发送返回：' + result);
    });
    return res.send(user);
  });
};
exports.employeeActivate = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';
  var token = req.body.token || '';

  if (!username || !username.testMail()) {
    return res.send({err: userError.invalid_email});
  }
  if (!password || password.length < 6) {
    return res.send({err: userError.invalid_password});
  }

  if (!token) {
    return res.send({err: userError.invalid_access_token});
  }

  userService.decryptUsername(token, function (err, username) {
    if (err) {
      return res.send(err);
    }
    if (!username) {
      return res.send({err: userError.account_not_exist});
    }

    userService.getUserByUsername(username, function (err, user) {
      if (err) {
        return res.send(err);
      }
      if (!user) {
        return res.send({err: userError.user_not_exist});
      }
      if (user.email_verified) {
        return res.send({err: userError.account_has_activated});
      }

      user.email_verified = true;
      user.password = user.hashPassword(password);
      user.save(function (err) {
        if (err) {
          return res.send({err: userError.internal_system_error});
        }

        var access_token = cryptoLib.encrypToken({_id: user._id, time: new Date()}, 'secret');
        return res.send({access_token: access_token});
      });
    });

  });
};

exports.activate = function (req, res, next) {
  var user = req.user || {};

  if (!user) {
    return res.send({err: userError.user_not_exist});
  }

  if (user.email_verified) {
    var access_token = cryptoLib.encrypToken({_id: user._id, time: new Date()}, 'secret');
    res.cookie('access_token', access_token);
    return res.redirect('/zzqs2/index');
  }

  user.email_verified = true;
  user.save(function (err) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    var access_token = cryptoLib.encrypToken({_id: user._id, time: new Date()}, 'secret');
    res.cookie('access_token', access_token);
    return res.redirect('/zzqs2/index');
  });
};

//body包含invite_user_id就是邀请注册，否则为开放注册
exports.signUp = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';

  //邮箱正则
  var usernameReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!usernameReg.test(username)) {
    return res.send({err: userError.invalid_email});
  }

  //密码验证
  if (password.length < 6) {
    return res.send({err: userError.invalid_password});
  }

  User.findOne({
    username: username
  }, function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    if (user && !user.email_verified) {
      return res.send({err: userError.account_not_activate});
    }
    else if (user && user.email_verified) {
      return res.send({err: userError.account_exist});
    }
    else {
      var newUser = new User();
      newUser.password = newUser.hashPassword(password);
      newUser.username = username;
      newUser.email_verified = true;
      newUser.save(function (err, user) {
        if (err) {
          return res.send({err: userError.internal_system_error});
        }
        // var activateUrl = config.serverAddress + 'user/activate/' + user._id;
        // var renderData = {
        //   logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
        //   username: user.username,
        //   urlAddress: activateUrl,
        //   action: '立即激活',
        //   description: '您已经成功创建新的柱柱签收账户。感谢您执行激活账户这一重要步骤。点击下面的按钮后，您即可通过自己的账户使用柱柱签收的全部服务。',
        //   websiteUrl: config.serverAddress
        // };
        //
        // verifyEmail(user.username, renderData, function (err, result) {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log('注册邮箱发送返回：' + result);
        // });
        //
        // delete user._doc.password;
        // delete user._doc.salt;

        return res.send(user);
      });
    }
  });
};

exports.signIn = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.password || '';

  //邮箱正则
  var mailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!mailReg.test(username)) {
    return res.send({err: userError.invalid_email});
  }

  //密码验证
  if (password.length < 6) {
    return res.send({err: userError.invalid_password});
  }

  User.findOne({
    username: username
  }, function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    if (!user) {
      return res.send({err: userError.account_not_exist});
    }

    // if (!user.email_verified) {
    //   return res.send({err: userError.account_not_activate});
    // }

    if (!user.authenticate(password)) {
      return res.send({err: userError.account_not_match});
    }

    var access_token = cryptoLib.encrypToken({_id: user._id, time: new Date()}, 'secret');

    delete user._doc.password;
    delete user._doc.salt;
    delete user._doc._id;

    return res.send({user: user, access_token: access_token});
  });
};

exports.profile = function (req, res, next) {
  var user = req.user || {};
  var profile = req.body.profile || {};

  var fileds = [
    'nickname',
    'phone',
    'photo',
    'job_title'
  ];

  fileds.forEach(function (key) {
    user[key] = profile[key] ? profile[key] : user[key];
  });

  user.save(function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    delete user._doc.password;
    delete user._doc._id;
    return res.send(user);
  });
};

exports.findById = function (req, res, next, id) {
  User.findOne({_id: id}, function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    if (!user) {
      return res.send({err: userError.user_not_exist});
    }
    req.user = user;
    next();
  });
};

exports.findByUsername = function (req, res, next, username) {
  User.findOne({username: username}, function (err, user) {
    if (err) {
      return res.send({err: userError.internal_system_error});
    }

    if (!user) {
      return res.send({err: userError.user_not_exist});
    }
    req.user = user;
    next();
  });
};

exports.sendResetPasswordEmail = function (req, res, next) {
  var username = req.query.username || '';

  User.findOne({username: username}).exec(function (err, userEntity) {
    if (err)
      return res.send({err: userError.internal_system_error});

    if (!userEntity)
      return res.send({err: userError.account_not_exist});

    if (!userEntity.email_verified)
      return res.send({err: userError.account_not_activate});

    resetTempService.getResetToken(userEntity.username, function (err, token) {
      var resetPasswordUrl = config.serverAddress + 'reset_password?token=' + token + '&username=' + userEntity.username;
      var renderData = {
        logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
        username: userEntity.username,
        urlAddress: resetPasswordUrl,
        action: '重置密码',
        description: '您已经成功申请了密码重置服务。点击下面的按钮后，您即可重置您的密码。',
        websiteUrl: config.serverAddress
      };

      verifyEmail(userEntity.username, renderData, function (err, result) {
        if (err) {
          console.log('email_failed:', userError.email_failed);
        }
        delete userEntity._doc.password;
        return res.send(userEntity);
      });
    });
  });
};

exports.updatePassword = function (req, res, next) {
  var username = req.body.username || '';
  var password = req.body.newPassword || '';
  var token = req.body.token || '';

  if (!username || !username.testMail()) {
    return res.send({err: userError.invalid_email});
  }
  if (!password || password.length < 6) {
    return res.send({err: userError.invalid_password});
  }

  if (!token) {
    return res.send({err: userError.invalid_access_token});
  }

  resetTempService.getUsernameById(token, function (err, username) {
    if (err) {
      return res.send(err);
    }
    if (!username) {
      req.err = {err: userError.account_not_exist};
      return next();
    }

    User.findOne({username: username})
      .populate('company')
      .exec(function (err, userEntity) {

        if (!req.logs)
          req.logs = [];

        if (err) {
          req.err = {err: userError.internal_system_error};
          req.logs.push({
            username: username,
            role: 'user',
            time: new Date().toISOString(),
            level: 'error',
            access_url: req.path,
            message: 'user.updatePassword.internal_system_error',
            error: {err: userError.internal_system_error}
          });
          return next();
        }

        if (!userEntity) {
          req.err = {err: userError.account_not_exist};
          req.logs.push({
            username: username,
            role: 'user',
            time: new Date().toISOString(),
            level: 'error',
            access_url: req.path,
            message: 'user.updatePassword.account_not_exist',
            error: {err: userError.account_not_exist}
          });
          return next();
        }

        if (!userEntity.email_verified) {
          req.err = {err: userError.account_not_activate};
          req.logs.push({
            username: username,
            role: 'user',
            time: new Date().toISOString(),
            level: 'error',
            access_url: req.path,
            message: 'user.updatePassword.account_not_activate',
            error: {err: userError.account_not_activate}
          });
          return next();
        }

        userEntity.password = userEntity.hashPassword(password);
        userEntity.save(function (err, newUserEntity) {
          if (err || !newUserEntity) {
            req.err = {err: userError.internal_system_error};
            req.logs.push({
              username: username,
              role: 'user',
              time: new Date().toISOString(),
              level: 'error',
              access_url: req.path,
              message: 'user.updatePassword.save.internal_system_error',
              error: {err: userError.internal_system_error}
            });
            return next();
          }

          var access_token = cryptoLib.encrypToken({_id: newUserEntity._id, time: new Date()}, 'secret');
          delete newUserEntity._doc.password;
          delete newUserEntity._doc._id;
          req.data = {access_token: access_token, user: newUserEntity};
          req.logs.push({
            username: username,
            role: 'user',
            time: new Date().toISOString(),
            level: 'info',
            access_url: req.path,
            message: 'user.updatePassword'
          });
          console.log('user.updatePassword end');
          return next();
        });
      });
  });


};

exports.signOut = function (req, res, next) {
  //前端不上传将token置为空
};

exports.getEmployeeActivePage = function (req, res, next) {
  var token = req.query.token || '';

  if (!token) {
    return res.send({err: userError.invalid_access_token});
  }

  userService.decryptUsername(token, function (err, username) {
    if (err) {
      return res.send(err);
    }
    if (!username) {
      return res.send({err: userError.account_not_exist});
    }
    userService.getUserByUsername(username, function (err, user) {
      if (err) {
        return res.send(err);
      }

      if (!user) {
        return res.send({err: userError.user_not_exist});
      }

      if (user.email_verified) {
        return res.redirect('/signin'); //直接进入登录页面
      }
      else {
        return res.sendfile(path.join(__dirname, '../../web/home_page/views/employee_activate.client.view.html'));
      }
    });

  });
};
