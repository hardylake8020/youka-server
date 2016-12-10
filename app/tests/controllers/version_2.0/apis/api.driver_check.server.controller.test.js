/**
 * Created by Wayne on 15/7/30.
 */


/*
 * 测试模块：api获取运单信息
 * 测试目标：第三方通过接口获取运单详情
 * 所有入口：删除与未注册司机的关系，删除与已注册司机的关系
 * */

'use strict';

var CompanyWebAPI = require('../../../common_function/core_business_logic/company'),
  DriverWebAPI = require('../../../common_function/core_business_logic/driver'),
  CompanyKeyWebAPI = require('../../../common_function/core_business_logic/company_key'),
  UserWebAPI = require('../../../common_function/core_business_logic/user');

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  cryptoLib = require('../../../../libraries/crypto'),
  timeLib = require('../../../../libraries/time'),
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
  CompanyKey = appDb.model('CompanyKey'),
  TransportEvent = appDb.model('TransportEvent'),
  Trace = appDb.model('Trace');

describe('Test For Api OrderDetail Controller::', function () {
  var user_A, company_A, group_name_A, signature_A, timestamp_A, driver_1, driver_2, order_A, order_B;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    group_name_A = '全体成员';

    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};

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
                              CompanyKey.remove(function () {
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

  var userA, tokenA, companyA, driver1, companyKey1;
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
    it('should be success when companyA invite driver2', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_2.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_2.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('inviting');
        done();
      });
    });

    it('should be success when companyA generate api keys', function (done) {
      CompanyKeyWebAPI.generateCompanyKeys(company_A.name, function (err, companyKeys) {
        companyKeys.company.should.equal(companyA._id.toString());
        companyKey1 = companyKeys;
        timestamp_A = timeLib.DateToyyyyMMddHHmmss(new Date());
        signature_A = cryptoLib.toMd5(companyKeys.secret_key + '&' + companyKeys.public_key + '&' + timestamp_A);
        done();
      });
    });
  });

  describe('Test for api check driver by username::', function () {
    it('should be success check driver exist by username', function (done) {
      DriverWebAPI.apiDriverCheckByUsername(signature_A, companyA._id, timestamp_A, driver_1.username, function (err, result) {
        result.existed.should.equal(true);
        done();
      });
    });
    it('should be failed check driver exist by username', function (done) {
      DriverWebAPI.apiDriverCheckByUsername(signature_A, companyA._id, timestamp_A, driver_2.username, function (err, result) {
        result.existed.should.equal(false);
        done();
      });
    });
    it('should be failed check driver exist by username with empty username', function (done) {
      DriverWebAPI.apiDriverCheckByUsername(signature_A, companyA._id, timestamp_A, '', function (err, result) {
        result.err.type.should.equal('empty_driver_number');
        done();
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
                              CompanyKey.remove(function () {
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
