/**
* Created by Wayne on 15/5/14.
*/

'use strict';

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),
  appDb = require('../../../libraries/mongoose').appDb,

  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  Contact = appDb.model('Contact'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  CustomerContact = appDb.model('CustomerContact'),
  InviteDriver = appDb.model('InviteDriver'),
  InviteCompany = appDb.model('InviteCompany'),
  CompanyPartner = appDb.model('CompanyPartner'),
  Driver = appDb.model('Driver'),
  DriverCompany = appDb.model('DriverCompany'),
  TransportEvent = appDb.model('TransportEvent'),
  Trace = appDb.model('Trace');

var userService = require('../../../app/services/user');


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
      callback(err, res.body);
    });
}

//邀请合作公司
function inviteCompany(username, access_token, callback) {
  agent.post(config.serverAddress + 'company/invitebyusername')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//用户接受邀请并注册
function acceptInvitingAndSignUp(username, password, callback) {
  userService.encryptUsername(username, function (err, token) {
    agent.post(config.serverAddress + 'company/company_signup')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        username: username,
        password: password,
        token: token
      })
      .end(function (err, res) {
        callback(err, res.body);
      });
  });
}


//用户通过用户名邀请合作公司，合作公司注册后不需要邮箱验证。
describe('Invite Company For Test', function () {
  var userA, userB, companyA, companyB;

  before(function (done) {
    userA = {username: '541149886@qq.com', password: '111111'};
    userB = {username: '13918429709@163.com', password: '111111'};

    companyA = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    companyB = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          InviteCompany.remove(function () {
            CompanyPartner.remove(function () {
              Group.remove(function () {
                Contact.remove(function () {
                  OrderDetail.remove(function () {
                    Order.remove(function () {
                      CustomerContact.remove(function () {
                        InviteDriver.remove(function () {
                          Driver.remove(function () {
                            DriverCompany.remove(function () {
                              TransportEvent.remove(function () {
                                Trace.remove(function () {
                                  done();
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  describe('invite by username::', function () {
    var user_A, access_token_A, user_B, access_token_B, company_A, company_B;

    //用户注册激活
    it('should return the user_A and activate', function (done) {
      userSignup(userA.username, userA.password, function (userEntity) {
        userEntity.username.should.equal(userA.username);

        user_A = userEntity;
        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户登录
    it('should return the access_token_A of user_A', function (done) {
      userSignin(userA.username, userA.password, function (result) {
        should.not.exist(result.err);
        access_token_A = result.access_token;
        done();
      });
    });

    //用户创建公司
    it('should return the company_A of user_A', function (done) {
      createComany(companyA.name, companyA.address, companyA.photo, companyA.employees, access_token_A, function (err, companyEntity) {
        should.not.exist(err);
        companyEntity.name.should.equal(companyA.name);
        companyEntity.address.should.equal(companyA.address);

        company_A = companyEntity;
        done();
      });
    });

    //使用用户名邀请合作公司，用户名还未注册
    it('should be success when companyA invite user_B as companyB', function (done) {
      inviteCompany(userB.username, access_token_A, function (err, result) {
        should.not.exist(result.err);
        InviteCompany.findOne({username: userB.username}, function (err, inviteCompanyEntity) {
          should.not.exist(err);
          should.exist(inviteCompanyEntity);
          inviteCompanyEntity.username.should.equal(userB.username);
          inviteCompanyEntity.company.toString().should.equal(company_A._id.toString());

          result.type.should.equal('signup_email_sent');
          done();
        });
      });
    });

    //用户userB接受邀请并注册
    it('should be success when user_B sign up for accepting the inviting', function (done) {
      acceptInvitingAndSignUp(userB.username, userB.password, function (err, data) {
        should.not.exist(err);
        should.exist(data.user);
        should.exist(data.access_token);
        data.user.username.should.equal(userB.username);

        user_B = data.user;
        access_token_B = data.access_token;
        done();
      });
    });

    it('should be success and create partner when user_B going to create company', function (done) {
      createComany(companyB.name, companyB.address, companyB.photo, companyB.employees, access_token_B, function (err, companyEntity) {
        should.not.exist(err);
        companyEntity.name.should.equal(companyB.name);
        companyEntity.address.should.equal(companyB.address);
        company_B = companyEntity;

        InviteCompany.findOne({username: user_B.username, company: company_A._id.toString()}, function (err, inviteCompanyEntity) {
          should.not.exist(err);
          inviteCompanyEntity.username.should.equal(user_B.username);
          inviteCompanyEntity.company.toString().should.equal(company_A._id.toString());
          inviteCompanyEntity.status.should.equal('accepted');

          CompanyPartner.findOne({company: company_B._id.toString(), partner: company_A._id.toString()}, function (err, companyPartnerEntity) {
            should.not.exist(err);
            companyPartnerEntity.company.toString().should.equal(company_B._id.toString());
            companyPartnerEntity.partner.toString().should.equal(company_A._id.toString());

            done();
          });
        });
      });
    });

  });

  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          InviteCompany.remove(function () {
            CompanyPartner.remove(function () {
              Group.remove(function () {
                Contact.remove(function () {
                  OrderDetail.remove(function () {
                    Order.remove(function () {
                      CustomerContact.remove(function () {
                        InviteDriver.remove(function () {
                          Driver.remove(function () {
                            DriverCompany.remove(function () {
                              TransportEvent.remove(function () {
                                Trace.remove(function () {
                                  done();
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });


});

