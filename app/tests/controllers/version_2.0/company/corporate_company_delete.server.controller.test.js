/**
 * Created by Wayne on 15/7/30.
 */


/*
 * 测试模块：删除合作公司
 * 测试目标：删除合作公司关系后，分配运单时看不到该公司的信息
 * 所有入口：删除与未注册公司的关系，删除与已注册公司的关系
 * */

'use strict';

var CompanyWebAPI = require('../../../common_function/core_business_logic/company'),
  DriverWebAPI = require('../../../common_function/core_business_logic/driver'),
  OrderWebAPI = require('../../../common_function/core_business_logic/order'),
  TransportEventWebAPI = require('../../../common_function/core_business_logic/transport_event'),
  UserWebAPI = require('../../../common_function/core_business_logic/user');

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../../config/config');

var appDb = require('../../../../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  Contact = appDb.model('Contact'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  Company = appDb.model('Company'),
  CompanyPartner = appDb.model('CompanyPartner'),
  Group = appDb.model('Group'),
  CustomerContact = appDb.model('CustomerContact'),
  InviteDriver = appDb.model('InviteDriver'),
  InviteCompany = appDb.model('InviteCompany'),
  Driver = appDb.model('Driver'),
  DriverCompany = appDb.model('DriverCompany'),
  TransportEvent = appDb.model('TransportEvent'),
  Trace = appDb.model('Trace');

describe('Test For Company Controller::', function () {
  var user_A, user_B, user_C, user_D, company_A, company_B, company_C, company_D;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: '595631400@qq.com', password: '111111'};
    user_C = {username: '10983066@qq.com', password: '111111'};
    user_D = {username: '13918429709@163.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_C = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_D = {name: 'companyD', address: 'Shanghai', photo: 'photo', employees: 'employee'};


    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          CompanyPartner.remove(function () {
            InviteCompany.remove(function () {
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

  var userA, tokenA, companyA, userB, tokenB, companyB, tokenC, userC, companyC, companyD;

  describe('Prepare Data For Test::', function () {
    it('should return userA when signUp userA', function (done) {
      UserWebAPI.signUp(user_A.username, user_A.password, true, function (err, userEntity) {
        UserWebAPI.activate(userEntity._id.toString(), function (err, data) {
          done();
        });
      });
    });
    it('should return userA when signIn userA', function (done) {
      UserWebAPI.signIn(user_A.username, user_A.password, true, function (err, result) {
        userA = result.user;
        tokenA = result.access_token;
        done();
      });
    });
    it('should return companyA when create companyA', function (done) {
      CompanyWebAPI.createCompany(tokenA, company_A.name,
        company_A.address, company_A.photo, company_A.employees, true, function (err, companyEntity) {
          companyA = companyEntity;
          done();
        });
    });

    it('should return userB when signUp userB', function (done) {
      UserWebAPI.signUp(user_B.username, user_B.password, true, function (err, userEntity) {
        UserWebAPI.activate(userEntity._id.toString(), function (err, data) {
          done();
        });
      });
    });
    it('should return userB when signIn userB', function (done) {
      UserWebAPI.signIn(user_B.username, user_B.password, true, function (err, result) {
        userB = result.user;
        tokenB = result.access_token;
        done();
      });
    });
    it('should return companyB when create companyB', function (done) {
      CompanyWebAPI.createCompany(tokenB, company_B.name,
        company_B.address, company_B.photo, company_B.employees, true, function (err, companyEntity) {
          companyB = companyEntity;
          done();
        });
    });

    it('should return userC when signUp userC', function (done) {
      UserWebAPI.signUp(user_C.username, user_C.password, true, function (err, userEntity) {
        UserWebAPI.activate(userEntity._id.toString(), function (err, data) {
          done();
        });
      });
    });
    it('should return userC when signIn userC', function (done) {
      UserWebAPI.signIn(user_C.username, user_C.password, true, function (err, result) {
        userC = result.user;
        tokenC = result.access_token;
        done();
      });
    });
    it('should return companyC when create companyC', function (done) {
      CompanyWebAPI.createCompany(tokenC, company_C.name,
        company_C.address, company_C.photo, company_C.employees, true, function (err, companyEntity) {
          companyC = companyEntity;
          done();
        });
    });

    it('should be success when companyA invite companyB', function (done) {
      CompanyWebAPI.inviteCompanyByCompanyName(tokenA, companyB.name, true, function (err, companyPartner) {
        companyPartner.company.toString().should.equal(companyA._id.toString());
        companyPartner.partner.toString().should.equal(companyB._id.toString());

        done();
      });
    });
    it('should be success when companyA invite companyD', function (done) {
      CompanyWebAPI.inviteCompanyByUserName(tokenA, user_D.username, function (err, result) {
        result.type.should.equal('signup_email_sent');
        InviteCompany.findOne({
          username: user_D.username,
          company: companyA._id.toString()
        }, function (err, inviteCompany) {
          inviteCompany.username.should.equal(user_D.username);
          inviteCompany.status.should.equal('inviting');

          done();
        });
      });
    });
    it('should be success when companyC invite companyA', function (done) {
      CompanyWebAPI.inviteCompanyByUserName(tokenC, userA.username, function (err, companyPartner) {
        companyPartner.company.toString().should.equal(companyC._id.toString());
        companyPartner.partner.toString().should.equal(companyA._id.toString());

        done();
      });
    });
  });

  describe('Test for delete invite company::', function () {
    it('should be success when companyA delete unknown inviting company', function (done) {
      CompanyWebAPI.deleteInviteCompany(tokenA, 'aaabbbccc', function (err, result) {
        result.success.should.equal(true);
        done();
      });
    });

    it('should be success when companyA delete invite companyD', function (done) {
      CompanyWebAPI.deleteInviteCompany(tokenA, user_D.username, function (err, result) {
        result.success.should.equal(true);

        InviteCompany.findOne({
          username: user_D.username,
          company: companyA._id.toString()
        }, function (err, inviteCompany) {
          should.not.exist(inviteCompany);

          done();
        });
      });
    });
  });

  describe('Test for delete partner company', function () {
    it('should be error when companyA delete unknown corporate company', function (done) {
      CompanyWebAPI.deleteCorporateCompany(tokenA, companyA._id.toString(), function (err, result) {
        result.success.should.equal(true);
        done();
      });
    });

    it('should be success when companyA delete corporate companyB', function (done) {
      CompanyWebAPI.deleteCorporateCompany(tokenA, companyB._id.toString(), function (err, result) {
        result.success.should.equal(true);

        CompanyPartner.findOne({
          company: companyA._id.toString(),
          partner: companyB._id.toString()
        }, function (err, partnerCompany) {
          should.not.exist(partnerCompany);

          InviteCompany.findOne({
            username: userB.username,
            company: companyA._id.toString()
          }, function (err, inviteCompany) {
            should.not.exist(inviteCompany);

            done();
          });
        });
      });
    });

    it('should be success when companyA delete corporate companyC', function (done) {
      CompanyWebAPI.deleteCorporateCompany(tokenA, companyC._id.toString(), function (err, result) {
        result.success.should.equal(true);

        CompanyPartner.findOne({
          company: companyA._id.toString(),
          partner: companyC._id.toString()
        }, function (err, partnerCompany) {
          should.not.exist(partnerCompany);

          InviteCompany.findOne({
            username: userC.username,
            company: companyA._id.toString()
          }, function (err, inviteCompany) {
            should.not.exist(inviteCompany);

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
          CompanyPartner.remove(function () {
            InviteCompany.remove(function () {
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
