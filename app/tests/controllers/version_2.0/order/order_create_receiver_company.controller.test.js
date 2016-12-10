/**
 * Created by Wayne on 15/8/16.
 */

/*
 * 测试模块：创建运单时填写收货方信息receiver_company{company_id, company_name}
 * 测试目标：创建运单后，收货方信息应该被填写
 * 所有入口：单个运单创建
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
  async = require('async'),
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

describe('Test For Order Controller::', function () {
  var user_A, user_B, company_A, company_B;
  var order_A;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: '595631400@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    order_A = {
      order_number: '123456789'
    };

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

  var userA, tokenA, companyA, userB, tokenB, companyB;

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

    it('should be success when companyA invite companyB', function (done) {
      CompanyWebAPI.inviteCompanyByCompanyName(tokenA, companyB.name, true, function (err, companyPartner) {
        companyPartner.company.toString().should.equal(companyA._id.toString());
        companyPartner.partner.toString().should.equal(companyB._id.toString());

        done();
      });

    });

  });

  describe('Test For Create Order', function () {
    it('should be empty receiver when create with no receiver', function (done) {
      delete order_A.receiver_company_id;
      delete order_A.receiver_name;
      order_A.order_number = '1';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.should.equal('');
        newOrder.receiver_company.company_name.should.equal('');
        newOrder.receiver_name.should.equal('');

        done();
      });
    });

    it('should be not empty receiver_company_id and empty receiver_name when create with only receiver_company_id', function (done) {
      order_A.receiver_company_id = companyB._id.toString();
      delete order_A.receiver_name;
      order_A.order_number = '2';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.toString().should.equal(companyB._id.toString());
        newOrder.receiver_company.company_name.should.equal('');
        newOrder.receiver_name.should.equal('');

        done();
      });
    });

    it('should be no receiver_company_id and not exist receiver_name when create with only not exist receiver_name', function (done) {
      delete order_A.receiver_company_id;
      order_A.receiver_name = 'xxx公司';
      order_A.order_number = '3';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.should.equal('');
        newOrder.receiver_company.company_name.should.equal(order_A.receiver_name);
        newOrder.receiver_name.should.equal(order_A.receiver_name);

        done();
      });
    });

    it('should be exist receiver_company_id and exist receiver_name when create with only exist receiver_name', function (done) {
      delete order_A.receiver_company_id;
      order_A.receiver_name = companyB.name;
      order_A.order_number = '4';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.toString().should.equal(companyB._id.toString());
        newOrder.receiver_company.company_name.should.equal(companyB.name);
        newOrder.receiver_name.should.equal(companyB.name);

        done();
      });
    });


    it('should be exist receiver_company_id and exist receiver_name when create with exist receiver_company', function (done) {
      order_A.receiver_company_id = companyB._id;
      order_A.receiver_name = companyB.name;
      order_A.order_number = '5';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.toString().should.equal(companyB._id.toString());
        newOrder.receiver_company.company_name.should.equal(companyB.name);
        newOrder.receiver_name.should.equal(companyB.name);

        done();
      });
    });

    it('should be not exist receiver_company_id and exist receiver_name when create with exist receiver_name', function (done) {
      order_A.receiver_company_id = 'xxxxxid';
      order_A.receiver_name = companyB.name;
      order_A.order_number = '6';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, newOrder) {
        should.exist(newOrder.receiver_company);
        newOrder.receiver_company.company_id.toString().should.equal(order_A.receiver_company_id);
        newOrder.receiver_company.company_name.should.equal(companyB.name);
        newOrder.receiver_name.should.equal(companyB.name);

        done();
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
