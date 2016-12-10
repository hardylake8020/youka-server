'use strict';
var path = require('path'),
  config = require('../../config/config'),
  userService = require('../services/user');
var wechatService = require('../services/wechat/wechat');


exports.index = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/index.client.view.html'));
};

exports.mobile = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/mobile/views/index.client.view.html'));
};

exports.signin = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/signin.client.view.html'));
};

exports.signup = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/signup.client.view.html'));
};

exports.signout = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/signout.client.view.html'));
};

//exports.resetPassword = function (req, res, next) {
//  return res.sendfile(path.join(__dirname, '../../web/platform/reset_password.client.view.html'));
//};

exports.resetPassword = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/reset_password.client.view.html'));
};

exports.forgetPassword = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/forget_password.client.view.html'));
};

exports.activate = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/account_activate.client.view.html'));
};

exports.activateSuccess = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/activate_success.client.view.html'));
};

exports.activateFailed = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/activate_failed.client.view.html'));
};
//
//exports.employeeActivate = function (req, res, next) {
//  var username = req.query.username;
//  return res.render(path.join(__dirname, '../../web/platform/employee_activate.client.view.html'), {username: username});
//};

exports.zzqsLogin = function (req, res, next) {

  var accessToken = req.query.token;

  //目的，为了在url中隐藏token
  res.cookie('access_token', req.query.token);

  return res.redirect('/zzqs2/index');
};

exports.zzqsIndex = function (req, res, next) {
  var Cookies = {};
  var cookieString = req.headers.cookie;
  if (cookieString) {
    cookieString.split(';').forEach(function (Cookie) {
      var parts = Cookie.split('=');
      Cookies[parts[0].trim()] = ( parts[1] || '' ).trim();
    });
  }
  var test = Cookies.access_token;
  res.clearCookie('access_token');
  return res.render(path.join(__dirname, '../../web/zzqs2/index.html'), {test: test,pushAddress:config.pushAddress});
};

exports.browserUpgrade = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/upgrade.client.view.html'));
};

exports.downloadApp = function (req, res, next) {
  return res.render(path.join(__dirname, '../../web/platform/download_app.client.view.html'), {apple_app_download: config.app_download_ios_redirect_url});
};

exports.toDownloadApp = function (req, res, next) {
  return res.download(path.join(__dirname, '../../web/zzqs2/resources/', config.app_download_android_url), config.app_download_android_url);
};


//App下载二维码
exports.getAppBarcode = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/images/index/', config.app_barcode_url));
};

exports.aboutUs = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/platform/about_us.client.view.html'));
};

//exports.activateInviteCompany = function (req, res, next) {
//  var encryptUsername = req.body.username || req.query.username || '';
//
//  var username;
//  userService.decryptUsername(encryptUsername, function (err, decodeUsername) {
//    if (err) {
//      req.err = {err: err};
//      return next();
//    }
//
//    username = decodeUsername;
//  });
//
//  return res.render(path.join(__dirname, '../../web/platform/invite_company_activate.client.view.html'), {username: username});
//};
//

// new implement

exports.homePage = function (req, res, next) {
  return res.render(path.join(__dirname, '../../web/home_page/views/index.client.view.html'), {apple_app_download: config.app_download_ios_redirect_url});
};

exports.homeSignIn = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/signin.client.view.html'));
};


exports.homeSignUp = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/signup.client.view.html'));
};


exports.homeAbout = function (req, res, next) {
  //wechatService.getwechatphotos();

  return res.sendfile(path.join(__dirname, '../../web/home_page/views/about.client.view.html'));
};


exports.homeContact = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/contact.client.view.html'));
};


exports.homeNews = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/news.client.view.html'));
};

exports.homeTutorial = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/tutorial.client.view.html'));
};

exports.homeArticle = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/article.client.view.html'));
};


exports.homeDownload = function (req, res, next) {
  return res.render(path.join(__dirname, '../../web/home_page/views/download.client.view.html'), {apple_app_download: config.app_download_ios_redirect_url});
};

exports.homeForget = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/home_page/views/forget_password.client.view.html'));
};

exports.homeIntroduction = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/wechat/views/wechat_introduction.client.view.html'));
};


//exports.employeeActivate = function (req, res, next) {
//  var username = req.query.username;
//  return res.sendfile(path.join(__dirname, '../../web/home_page/views/employee_activate.client.view.html')),{username: username};
//};

exports.inviteCompanyActivate = function (req, res, next) {
  var encryptUsername = req.body.username || req.query.username || '';

  var username;
  userService.decryptUsername(encryptUsername, function (err, decodeUsername) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    username = decodeUsername;
  });

  return res.sendfile(path.join(__dirname, '../../web/home_page/views/invite_company_activate.client.view.html'),{username: username});
};


exports.testWechat = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/wechat/wechat_driver/views/wechat_test.client.view.html'));
};