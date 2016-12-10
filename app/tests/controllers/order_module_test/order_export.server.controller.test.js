/**
* Created by Wayne on 15/5/10.
*/

'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config'),
  orderError = require('../../../errors/order'),
  userError = require('../../../errors/user'),
  groupError = require('../../../errors/group'),

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

//创建公司返回公司
function createComany(name, address, photo, emplyees, access_token, callback) {
  agent.post(config.serverAddress + 'company')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      name: name,
      address: address,
      photo: photo,
      employes: emplyees,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(res.body);
    });
}

//创建单个订单
function createOrder(orderInfo, groupId, access_token, callback) {
  agent.post(config.serverAddress + 'order')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      order: orderInfo,
      group_id: groupId,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(res.body);
    });
}

//导出运单
function exportOrders(access_token, filterInfo, callback){
  agent.get(config.serverAddress + 'order/export')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      filter: filterInfo
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

describe('Order Export Module Unit Tests', function () {
  var userTestInfo, groupTestInfo, companyTestInfo, orderTestInfo;

  before(function (done) {
    userTestInfo = {
      username: '5411498861@qq.com',
      password: '111111'
    };

    groupTestInfo = {
      name: 'test',
      display_name: 'test'
    };

    companyTestInfo = {
      name: 'testCompany',
      address: 'test address',
      photo: 'test photo',
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

  describe('user sign in to export order::', function () {

    // user sign up
    var new_user;
    it('user should create success', function (done) {
      userSignup(userTestInfo.username, userTestInfo.password, function (userEntity){
        userEntity.username.should.equal(userTestInfo.username);
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

    // user sing in
    var access_token;
    it('user should login success', function (done) {
      userSignin(userTestInfo.username, userTestInfo.password, function (result) {
        result.user.username.should.equal(userTestInfo.username);
        access_token = result.access_token;

        done();
      });
    });

    // create company
    var new_company, default_group;
    it('company should create success', function (done) {
      createComany(companyTestInfo.name, companyTestInfo.address, companyTestInfo.photo,
        companyTestInfo.employees, access_token, function (companyEntity) {
          companyEntity.name.should.equal(companyTestInfo.name);
          should.exist(companyEntity.groups[0]._id);

          new_company = companyEntity;
          default_group = companyEntity.groups[0];

          done();
        });
    });

    // should be success when create order with more details
    it('should be success when create order with more details', function (done) {
      var orderItem = {
        order_number: '987654321',
        goods_name: 'books',
        details: [{name:'book1'}, {name:'book2'}]
      };

      createOrder(orderItem, default_group._id, access_token, function (result) {
        should.not.exist(result.err);

        done();
      });
    });

    /// export orders

    // should be error when export orders where user is not email_verified
    it('should be error when user is not email_verified', function (done) {
      User.findOne({_id: new_user._id}, function (err, userEntity) {
        userEntity.email_verified = false;
        userEntity.save(function (err) {
          exportOrders(access_token, null, function (err, result) {
            should.exist(result.err);
            result.err.type.should.equal(userError.account_not_activate.type);

            userActivate(new_user._id, function (result) {
              done();
            });
          });
        });
      });
    });

    // should be error when export orders where user is not in any group
    it('should be error when export orders where user is not in any group', function (done) {
      var userGroupId;
      UserGroup.findOne({user: new_user._id}, function (err, userGroupEntity) {
        userGroupId = userGroupEntity._id;
        userGroupEntity.user = userGroupEntity.group;
        userGroupEntity.save(function (err) {
          exportOrders(access_token, null, function (err, result) {
            should.exist(result.err);
            result.err.type.should.equal(orderError.group_id_null.type);

            userGroupEntity.user = new_user._id;
            userGroupEntity.save(function (err) {
              done();
            });
          });
        });
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
