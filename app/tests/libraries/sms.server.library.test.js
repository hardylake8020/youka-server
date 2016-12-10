'use strict';

var smsLib = require('../../libraries/sms'),
  mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  SmsVerify = appDb.model('SmsVerify');

describe('Libraries Sms Unit Test', function () {
  before(function (done) {
    SmsVerify.remove(function () {
      done();
    });
  });
  //describe('Method sendVerifyCode', function () {
  //  it('should return code 000000', function (done) {
  //    smsLib.sendVerifyCode(
  //      '13472423583',
  //      smsLib.generateVerifyCode(),
  //      function (err, result) {
  //        console.log(result);
  //        done();
  //      });
  //  });
  //});

  //describe('Method sendSmsContent', function () {
  //  it('should return code 000000', function (done) {
  //    smsLib.sendSmsContent(
  //      '13472423583',
  //      '测试公司',
  //      function (err, result) {
  //        console.log(result);
  //        done();
  //      });
  //  });
  //});
  after(function (done) {
    SmsVerify.remove(function () {
      done();
    });
  });
});
