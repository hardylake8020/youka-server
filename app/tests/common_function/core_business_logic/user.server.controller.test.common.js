/**
 * Created by Wayne on 15/7/24.
 */

'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

var appDb = require('../../../../libraries/mongoose').appDb,
  User = appDb.model('User');

//开放注册
exports.signUp = function(username, password, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'user/signup')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.username.should.equal(username);
      }

      callback(err, res.body);
    });
};

//用户激活
exports.activate = function(user_id, callback) {
  agent.get(config.serverAddress + 'user/activate/' + user_id)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .end(function (err, res) {

      User.findOne({_id: user_id}, function (errInfo, user) {
        user.email_verified.should.equal(true);
        callback(err, res.body);
      });
    });
};

//用户登录，返回用户和access_token
exports.signIn = function(username, password, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'user/signin')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        should.exist(res.body.access_token);
        res.body.user.username.should.equal(username);
      }

      callback(err, res.body);
    });
};