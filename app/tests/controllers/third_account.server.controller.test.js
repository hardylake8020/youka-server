'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  config = require('../../../config/config'),

  Driver = appDb.model('Driver'),
  ThirdAccount = appDb.model('ThirdAccount');

var username = '13472423583',
  password = '123456',
  agent = superagent.agent();


describe('Third account controller unit test', function () {
  before(function (done) {
    Driver.remove(function () {
      ThirdAccount.remove(function () {
        done();
      });
    });
  });


  var newOpenId = new Driver()._id.toString();
  var newThirdAccountId = new Driver()._id.toString();
  var newAccessTokenId = new Driver()._id.toString();

  describe('signin after the driver login use the third party account', function () {

    it('should return signin with false and binding with false: signin the account info the first time from qq',
      function (done) {
        var uploadData = {
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId,
          nickname: '透明',
          gender: '女',
          photo: '1.jpg',
          address: '上海浦东',
          remark: '',
          others: ''
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/signin')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            //console.log(res.body);
            res.body.loginSuccess.should.equal(false);
            res.body.bindAccount.should.equal(false);
            done();
          });
      });

    var driverUsername = '18321740710';
    var password = '123456';
    it('should return an error of invalid_phone: binding a driver with invalid username',
      function (done) {
        var uploadData = {
          username: '11112',
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.err.type.should.equal('invalid_phone');
            done();
          });
      });

    it('should return an error of invalid_password: binding a driver with invalid password',
      function (done) {
        var uploadData = {
          username: driverUsername,
          password: '111',
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.err.type.should.equal('invalid_password');
            done();
          });
      });

    it('should return an error of access_token_invalid: binding a driver with invalid access_token',
      function (done) {
        var uploadData = {
          username: driverUsername,
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: '12345'
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.err.type.should.equal('access_token_invalid');
            done();
          });
      });

    it('should return a success with true , access_token and driver: binding a driver after signin',
      function (done) {
        var uploadData = {
          username: driverUsername,
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.loginSuccess.should.equal(true);
            should.exists(res.body.access_token);
            res.body.driver.username.should.equal(driverUsername);
            should.exists(res.body.driver.current_third_account);
            done();
          });
      });

    it('should return an error of with account_has_binded: binding a driver after signin',
      function (done) {
        var uploadData = {
          username: '18321740715',
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.err.type.should.equal('account_has_binded');
            done();
          });
      });

    it('should return a success with true , access_token and driver: binding a same binded driver after signin',
      function (done) {
        var uploadData = {
          username: driverUsername,
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/accountbinding')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.loginSuccess.should.equal(true);
            should.exists(res.body.access_token);
            res.body.driver.username.should.equal(driverUsername);
            should.exists(res.body.driver.current_third_account);
            done();
          });
      });

    it('should return signin with false and binding with false: signin the account info the first time from qq',
      function (done) {
        var uploadData = {
          username: driverUsername,
          password: password,
          open_id: newOpenId,
          third_account_id: newThirdAccountId,
          provider: 'qq',
          user_type: 'driver',
          access_token: newAccessTokenId
        };

        agent.post(config.serverAddress + 'driver/thirdaccount/signin')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({uploadData: JSON.stringify(uploadData)})
          .end(function (err, res) {
            res.body.loginSuccess.should.equal(true);
            should.exists(res.body.access_token);
            res.body.driver.username.should.equal(driverUsername);
            should.exists(res.body.driver.current_third_account);
            done();
          });
      });

  });


  after(function (done) {
    Driver.remove(function () {
      ThirdAccount.remove(function () {
        done();
      });
    });
  });
});
