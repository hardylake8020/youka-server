/**
* Created by elinaguo on 15/3/25.
*/
'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),

  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  Contact = appDb.model('Contact'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  CustomerContact = appDb.model('CustomerContact');


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
      callback(res.body);
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

//创建客户联系人
function createCustomerContact(company_id, customerContactName, access_token, callback) {
  var postData = {
    company_id: company_id,
    customer_name: customerContactName,
    access_token: access_token
  };

  agent.post(config.serverAddress + 'customer_contact')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send(postData)
    .end(function (err, res) {
      callback(res.body);
    });
}

var username = '18321740710@163.com',
  password = '123456';


describe('Route Customer Contact Unit Test: ', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            CustomerContact.remove(function () {
              done();
            });
          });
        });
      });
    });
  });

  //用户公开注册，激活，登录，创建公司，创建两条客户联系人纪录并显示所有联系人
  describe('Path post /customer_contact, get /customer_contact:', function () {

    //用户开放注册
    var user_one;
    it('should return a new user', function (done) {
      userSignup(username, password, function (user) {
        user_one = user;
        done();
      });
    });

    //用户激活
    it('should return a successful result about activate the user', function (done) {
      userActivate(user_one._id, function (result) {
        done();
      });
    });

    //用户登录
    var user_access_token;
    it('should return the access_token of the user', function (done) {
      userSignin(username, password, function (result) {
        user_access_token = result.access_token;
        done();
      });
    });

    //用户创建公司
    var user_company;
    it('should return the company of the user', function (done) {
      var name = 'test company',
        address = 'test address',
        photo = 'test photo',
        employees = 'test employees';
      //创建公司
      createComany(name, address, photo, employees, user_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_company = company;
        done();
      });
    });

    //创建顾客联系人
    it('should return a customer contact', function (done) {

      var customerContactName_one = 'Allen 物流公司集团';

      createCustomerContact(user_company._id, customerContactName_one, user_access_token, function (customor_contact_one) {

        customor_contact_one.customer_name.should.equal(customerContactName_one);
        done();
      });

    });

    //创建第二个顾客联系人
    it('should resturn the second customer contact', function (done) {

      var customerContactName_two = 'Hardy 物流公司';
      createCustomerContact(user_company._id, customerContactName_two, user_access_token, function (customor_contact_two) {
        customor_contact_two.customer_name.should.equal(customerContactName_two);
        done();
      });
    });

    //获取公司所有联系人，返回两条记录
    it('should return a customer contact list with 2 records', function (done) {
      agent.get(config.serverAddress + 'customer_contact')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          company_id: user_company._id,
          access_token: user_access_token
        })
        .end(function (err, res) {
          res.body.length.should.equal(2);
          done();
        });
    });
  });

  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            CustomerContact.remove(function () {
              done();
            });
          });
        });
      });
    });
  });
});


