'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  config = require('../../../config/config'),

  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup');

var username = '1963968619@qq.com',
  agent = superagent.agent();


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

describe('Route User Unit Test:', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            done();
          });
        });
      });
    });
  });


  describe('User sign up,activate,sign in,and create company Success', function () {

    var username = '10983066@qq.com';
    var password = '123456';

    //用户开放注册
    var user_one;
    it('should return a new user with valid username and password', function (done) {
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

    //再次创建，就会失败
    it('should return the company of the user', function (done) {
      var name = 'test company',
        address = 'test address',
        photo = 'test photo',
        employees = 'test employees';
      //创建公司
      createComany(name, address, photo, employees, user_access_token, function (result) {
        result.err.type.should.equal('only_one_company');
        done();
      });
    });
  });


  describe('User signs up but not activate the account ,and sign in failed.', function () {

    var username = '1963968619@qq.com';
    var password = '123456';

    //用户开放注册
    var user_one;
    it('should return a new user with valid username and password', function (done) {
      userSignup(username, password, function (user) {
        user_one = user;
        done();
      });
    });

    //用户登录
    it('should return the access_token of the user', function (done) {
      agent.post(config.serverAddress + 'user/signin')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username,
          password: password
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('account_not_activate');
          done();
        });
    });

  });

  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            done();
          });
        });
      });
    });
  });
});

describe('Behavior open signup activate signin company invite:', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            done();
          });
        });
      });
    });
  });
  describe('Path /user/signup /user/activate /user/signin /company user/invite/multi:', function () {

    var username = '1963968619@qq.com',
      password = '123456',
      company_name = 'test company',
      company_address = 'test name',
      company_photo = 'test photo',
      company_employees = 'test employees';

    //用户开放注册
    var user_one;
    it('should return a new user with valid username and password', function (done) {
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
      //创建公司
      createComany(company_name, company_address, company_photo, company_employees, user_access_token, function (company) {
        company.name.should.equal(company_name);
        company.address.should.equal(company_address);

        user_company = company;
        done();
      });
    });

    //邀请两个未注册的用户
    it('should return a array with 0 length', function (done) {
      User.findOne({username: user_one.username}, function (err, user) {
        agent.post(config.serverAddress + 'group/invite/multiemployee')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            usernames: ['hardy@zhuzhuqs.com', 'elina@zhuzhuqs.com'],
            company_id: user_company._id,
            group_id: user_company.groups[0]._id.toString(),
            access_token: user_access_token
          })
          .end(function (err, res) {
            res.body.errorArray.length.should.equal(0);
            done();
          });
      });
    });

    //邀请一个已注册用户和一个未注册账号
    it('should return a array with 0 length', function (done) {
      User.findOne({username: user_one.username}, function (err, user) {
        agent.post(config.serverAddress + 'group/invite/multiemployee')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            usernames: ['hardy@zhuzhuqs.com', username],
            company_id: user_company._id,
            group_id: user_company.groups[0]._id.toString(),
            access_token: user_access_token
          })
          .end(function (err, res) {
            res.body.errorArray.length.should.equal(0);
            done();
          });
      });
    });

    //邀请一个已注册用户和一个错误账号
    it('should return a array with 1 length', function (done) {
      User.findOne({username: user_one.username}, function (err, user) {
        agent.post(config.serverAddress + 'user/invite/multi')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            usernames: ['hardy@zhuzhuqs.com', 'a@qq.com'],
            company_id: user_company._id,
            group_id: user_company.groups[0]._id.toString(),
            access_token: user_access_token
          })
          .end(function (err, res) {
            //res.body.err_array[1].err.type.should.equal('invalid_email');
            done();
          });
      });
    });

  });

  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            done();
          });
        });
      });
    });
  });
});




