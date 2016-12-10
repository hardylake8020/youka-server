/**
* Created by Wayne on 15/5/10.
*/
'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),
  orderError = require('../../errors/order'),
  userError = require('../../errors/user'),
  groupError = require('../../errors/group'),

  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  Contact = appDb.model('Contact'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  CustomerContact = appDb.model('CustomerContact'),
  InviteDriver = appDb.model('InviteDriver'),
  Driver = appDb.model('Driver'),
  DriverCompany = appDb.model('DriverCompany');


//开放注册
function userSignup(username, password, callback) {
  agent.post(config.serverAddress + 'user/signup')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      res.body.username.should.equal(username);
      should.not.exist(res.body.company);
      callback(res.body);
    });
}

//用户激活
function userActivate(user_id, callback) {
  agent.get(config.serverAddress + 'user/activate/' + user_id)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .end(function (err, res) {
      User.findOne({_id: user_id}, function (err, user) {
        user.email_verified.should.equal(true);
        callback(res.body);
      });
    });
}

//用户登录，返回用户和access_token
function userSignin(username, password, callback) {
  agent.post(config.serverAddress + 'user/signin')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      res.body.user.email_verified.should.equal(true);
      callback(res.body);
    });
}


describe('Order Create Module Unit Tests', function () {
  var userTestInfo, groupTestInfo, companyTestInfo, orderTestInfo;

  before(function (done) {
    userTestInfo = {
      username: '541149886@qq.com',
      password: '111111'
    };

    groupTestInfo = {
      name: 'test',
      display_name: 'test'
    };

    companyTestInfo = {
      name: 'testCompany',
      address: 'test address',
      employees: 'test employees'
    };

    orderTestInfo = {
      order_number: '123456789',
      goods_name: 'books'
    };

    UserGroup.remove().exec(function () {
      User.remove().exec(function () {
        Group.remove().exec(function () {
          Company.remove().exec(function () {
            Order.remove().exec(done);
          });
        });
      });
    });
  });

  describe('user singin to create order', function () {

    // user sign up
    var new_user;
    it('user should create success', function (done) {
      userSignup(userTestInfo.username, userTestInfo.password, function (userEntity){
        new_user = userEntity;
        done();
      });
    });

    // user activate
    it('user should activate success', function (done) {
      userActivate(new_user._id, function (result) {
          done();
        });
      });

    //user sing in
    var access_token;
    it('user should login success', function (done) {
      userSignin(userTestInfo.username, userTestInfo.password, function (userEntity) {
        access_token = userEntity.access_token;
        done();
      });
    });
  });

  after(function (done) {
    UserGroup.remove().exec(function () {
      User.remove().exec(function () {
        Group.remove().exec(function () {
          Company.remove().exec(function () {
            Order.remove().exec(done);
          });
        });
      });
    });
  });

});
