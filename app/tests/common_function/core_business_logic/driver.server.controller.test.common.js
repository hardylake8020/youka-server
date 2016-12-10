/**
 * Created by Wayne on 15/7/24.
 */
'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

//司机获取验证码
exports.getSMSCode = function (username, callback) {
  agent.post(config.serverAddress + 'driver/getsmsverifycode')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username
    })
    .end(function (err, res) {
      should.exist(res.body._id);
      should.not.exist(res.body.code);

      callback(err, res.body);
    });
};

//司机注册
exports.signUp = function (username, password, smsInfo, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'driver/signup')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password,
      sms_verify_id: smsInfo._id,
      sms_verify_code: smsInfo.code
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.username.should.equal(username);
      }

      callback(err, res.body);
    });
};

//司机登录
exports.signIn = function (username, password, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'driver/signin')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        should.exist(res.body.access_token);
        res.body.driver.username.should.equal(username);
      }

      callback(err, res.body);
    });
};

exports.apiDriverCheckByUsername = function (signature, company_id, timestamp, driver_number, callback) {
  agent.post(config.serverAddress + 'api/driver/exist/number')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      driver_number: driver_number,
      signature: signature,
      company_id: company_id,
      timestamp: timestamp
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};
