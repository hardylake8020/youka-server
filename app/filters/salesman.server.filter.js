/**
 * Created by zenghong on 15/11/16.
 */
'use strict';

var async = require('async'),
  orderError = require('../errors/order'),

  appDb = require('../../libraries/mongoose').appDb,
  cookieLib = require('../libraries/cookie'),
  SalesMan = appDb.model('Salesman');


exports.requireSalesman = function (req, res, next) {
  var openid = req.body.openid || req.query.openid || '';
  var cookie = cookieLib.getCookie(req);
  cookie.openid = cookie.salesman_openid || '';

  if (!openid) {
    if (cookie.openid && cookie.openid !== 'undefined') {
      openid = cookie.openid;
    }
  }

  if (!openid) {
    return res.send({err: {type: 'openid_empty'}});
  }


  SalesMan.findOne({wechat_openid: openid}).populate('company').exec( function (err, salesman) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }

    if (!salesman) {
      return res.send({err: {type: 'invalid_openid'}});
    }

    req.salesman = salesman;
    next();
  });
};