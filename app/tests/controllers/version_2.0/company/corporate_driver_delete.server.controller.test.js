/**
 * Created by Wayne on 15/7/30.
 */


/*
 * 测试模块：删除合作司机
 * 测试目标：删除合作司机关系后，分配运单时看不到该司机的信息
 * 所有入口：删除与未注册司机的关系，删除与已注册司机的关系
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
  Group = appDb.model('Group'),
  CustomerContact = appDb.model('CustomerContact'),
  InviteDriver = appDb.model('InviteDriver'),
  Driver = appDb.model('Driver'),
  DriverCompany = appDb.model('DriverCompany'),
  TransportEvent = appDb.model('TransportEvent'),
  Trace = appDb.model('Trace');

describe('Test For Company Controller::', function () {
  var user_A, user_B, user_C, company_A, company_B, company_C, driver_1,
    driver_2, driver_3;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: '595631400@qq.com', password: '111111'};
    user_C = {username: '10983066@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_C = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};
    driver_3 = {username: '18321740710', password: '111111'};

    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
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

  var userA, tokenA, companyA, userB, tokenB, companyB, userC, tokenC, companyC, driver1, driver2, driver3;

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

    it('should return driver1 when signUp driver1', function (done) {
      DriverWebAPI.getSMSCode(driver_1.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_1.username, driver_1.password, smsInfo, true, function (err, driverEntity) {
          driver1 = driverEntity;
          done();
        });
      });
    });

    it('should be success when companyA invite driver1', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_1.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_1.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });
    it('should be success when companyA invite driver3', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_3.username, function (err, inviteDriver) {
        inviteDriver.username.should.equal(driver_3.username);
        inviteDriver.status.should.equal('inviting');
        inviteDriver.company._id.toString().should.equal(companyA._id.toString());

        done();
      });
    });
  });

  describe('Test for delete invite driver::', function () {
    it('should be success when companyA delete unknown inviting driver', function (done) {
      CompanyWebAPI.deleteInviteDriver(tokenA, '11122223333', function (err, result) {
        result.success.should.equal(true);
        done();
      });
    });

    it('should be success when companyA delete invite driver3', function (done) {
      CompanyWebAPI.deleteInviteDriver(tokenA, driver_3.username, function (err, result) {
        result.success.should.equal(true);

        InviteDriver.findOne({
          username: driver_3.username,
          company: companyA._id.toString()
        }, function (err, inviteDriver) {
          should.not.exist(inviteDriver);

          done();
        });
      });
    });
  });

  describe('Test for delete company driver', function () {
    it('should be error when companyA delete unknown corporate driver', function (done) {
      CompanyWebAPI.deleteCorporateDriver(tokenA, companyA._id.toString(), function (err, result) {
        result.err.type.should.equal('driver_not_exist');

        done();
      });
    });

    it('should be error when companyA delete corporate driver1', function (done) {
      CompanyWebAPI.deleteCorporateDriver(tokenA, driver1._id.toString(), function (err, result) {
        result.success.should.equal(true);

        DriverCompany.findOne({
          company: companyA._id.toString(),
          driver: driver1._id.toString()
        }, function (err, driverCompany) {
          should.not.exist(driverCompany);

          InviteDriver.findOne({
            username: driver1.username,
            company: companyA._id.toString()
          }, function (err, inviteDriver) {
            should.not.exist(inviteDriver);

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