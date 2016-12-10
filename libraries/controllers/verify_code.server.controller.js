'use strict';

var path = require('path'),
  async = require('async'),
  error = require('../../errors/all'),
  wechatService = require('../wechat');


exports.getWxBindCode = function (req, res, next) {
  var phone = req.query.phone || '';

  if (!phone || !phone.testPhone()) {
    return res.send({err: error.params.invalid_value});
  }

  wechatService.createWxBindVerifyCode(phone, function (err, verify) {
    if (err) {
      return res.send(err);
    }
    return res.send({_id: verify._id});
  });
};
