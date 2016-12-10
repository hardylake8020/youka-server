/**
 * Created by zenghong on 16/1/22.
 */
'use strict';

var path = require('path'),
  config = require('../../../config/config'),
  async = require('async'),
  superagent = require('superagent').agent(),
  appDb = require('../../../libraries/mongoose').appDb,
  cookieLib = require('../../libraries/cookie'),
  wechatDriverService = require('../../services/wechat/wechat_driver'),
  wechatService = require('../../services/wechat/wechat'),
  smsLib = require('../../libraries/sms'),
  driverService = require('../../services/driver'),
  orderService = require('../../services/order'),
  orderError = require('../../errors/order'),
  Order = appDb.model('Order'),
  SmsVerify = appDb.model('SmsVerify');

function driverBindPage(res, openid, accessToken) {
  return res.render(path.join(__dirname, '../../../web/wechat/wechat_driver/views/bind.client.view.html'), {
    openid: openid,
    access_token: accessToken
  });
}
function driverHomePage(res, driver) {
  delete driver._doc.password;
  delete driver._doc.salt;

  return res.render(path.join(__dirname, '../../../web/wechat/wechat_driver/views/index.client.view.html'), {driver: JSON.stringify(driver)});
}
function driverErrorPage(res, errType) {
  return res.render(path.join(__dirname, '../../../web/wechat/wechat_driver/views/error.client.view.html'), {errType: errType});
}

exports.indexPage = function (req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    driverService.getDriverByPhone('13918429709', function (err, driver) {
      return driverHomePage(res, driver);
    });
  }
  else {
    var cookie = cookieLib.getCookie(req);
    var cookieOpenid = cookie.driver_openid || '';

    if (!cookieOpenid && !req.query.code) {
      return driverErrorPage(res, 'can not get openid');
    }

    async.auto(
      {
        getOpenid: function (callback) {
          if (cookieOpenid !== 'undefined' && cookieOpenid) {
            return callback(null, {openid: cookieOpenid, access_token: null});
          }
          else {
            wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
              return callback(null, {openid: tokenInfo.openid, access_token: tokenInfo.access_token});
            });
          }
        },
        getDriver: ['getOpenid', function (callback, result) {
          var openid = result.getOpenid.openid;
          if (!openid || openid === 'undefined') {
            return callback({err: {type: 'invalid_openid'}});
          }
          wechatDriverService.getByOpenid(openid, function (err, driver) {
            return callback(err, driver);
          });
        }]
      },
      function (err, result) {
        if (err) {
          return driverErrorPage(res, err.err.type);
        }

        var driver = result.getDriver;
        var openid = result.getOpenid.openid;
        var accessToken = result.getOpenid.access_token;

        if (!driver || !driver.wechat_profile || !driver.wechat_profile.openid) {
          res = cookieLib.setCookie(res, 'driver_openid', '');

          if (!accessToken) {
            wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
              return driverBindPage(res, tokenInfo.openid, tokenInfo.access_token);
            });
          }
          else {
            return driverBindPage(res, openid, accessToken);
          }
        }
        else {
          res = cookieLib.setCookie(res, 'driver_openid', openid);
          return driverHomePage(res, driver);
        }
      });
  }

};

exports.singleOrderPage = function (req, res, next) {
  //return res.sendfile(path.join(__dirname, '../../../web/ddddd.jpg'));

  //driverService.getDriverByPhone('13918429709', function (err, driver) {
  //  Order.findOne({type: 'driver', execute_driver: driver._id, status: {$in: ['unPickupSigned', 'unPickuped']}}, function (err, order) {
  //    order = order || {};
  //
  //    return res.render(path.join(__dirname, '../../../web/wechat/wechat_driver/views/single_order.client.view.html'),
  //      {
  //        driver: JSON.stringify(driver),
  //        order: JSON.stringify(order)
  //      });
  //  });
  //});
  var currentOrder = req.currentOrder;
  var currentDriver = req.driver;

  return res.render(path.join(__dirname, '../../../web/wechat/wechat_driver/views/single_order.client.view.html'),
    {
      driver: JSON.stringify(currentDriver),
      order: JSON.stringify(currentOrder)
    });
};

exports.bindDriver = function (req, res, next) {
  var phone = req.body.phone || '';
  var openid = req.body.openid || '';
  var accessToken = req.body.access_token || '';
  var codeid = req.body.codeid || '';
  var code = req.body.code || '';

  wechatService.getVerifyCode(codeid, code, function (err, verify) {
    if (err) {
      return res.send(err);
    }

    wechatService.getUserInfo(accessToken, openid, function (err, userInfo) {
      if (err) {
        return res.send(err);
      }

      if (userInfo && !userInfo.openid) {
        console.log('get user info failed:');
        console.log(userInfo);
        return res.send({err: {type: 'get_wechat_info_failed'}});
      }

      wechatDriverService.bindWx(phone, openid, userInfo, function (err, result) {
        if (err) {
          return res.send(err);
        }
        res = cookieLib.setCookie(res, 'driver_openid', openid);
        return res.send(result);
      });
    });
  });
};

exports.unbindDriver = function (req, res, next) {
  var currentDriver = req.driver;

  wechatService.unbindObject(currentDriver, function (err, result) {
    res = cookieLib.setCookie(res, 'driver_openid', '');
    return res.send(err || {success: true});
  });
};

exports.getOrders = function (req, res, next) {
  var driver = req.driver;
  var skip = parseInt(req.body.skip) || 0;
  var limit = parseInt(req.body.limit) || 5;
  var statuses = req.body.statuses || [];

  if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
    return res.send({err: orderError.params_invalid});
  }

  orderService.getWechatDriverOrders(driver._id, statuses, skip, limit, function (err, orders) {
    return res.send(err || orders);
  });
};