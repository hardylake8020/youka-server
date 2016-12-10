/**
 * Created by Wayne on 15/9/8.
 */

/*
 * 测试模块：运单查看
 * 测试目标：根据发货方或收货方去查询运单
 * 所有入口：getUserAllOrders
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

describe('Test For Order Controller::', function () {
  var user_A, user_B, user_C, company_A, company_B, company_C, order_A;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: '595631400@qq.com', password: '111111'};
    user_C = {username: '10983066@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_C = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};

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

  var userA, tokenA, companyA, userB, tokenB, companyB, userC, tokenC, companyC;

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
    it('should return companyA when create companyA', function(done) {
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
    it('should return companyB when create companyB', function(done) {
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
    it('should return companyC when create companyC', function(done) {
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
    it('should be success when companyA invite companyC', function (done) {
      CompanyWebAPI.inviteCompanyByCompanyName(tokenA, companyC.name, true, function (err, companyPartner) {
        companyPartner.company.toString().should.equal(companyA._id.toString());
        companyPartner.partner.toString().should.equal(companyC._id.toString());

        done();
      });
    });

  });

  describe('Test For Search By Sender Or Receiver::', function () {
    var orderA;
    it('should get no orders when create without sender and receiver', function (done) {
      delete order_A.receiver_name;
      delete order_A.sender_name;

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;

        OrderWebAPI.getUserAllOrders(tokenA, 1, 10, '', '', [{key:'viewer', value:'assign'}], function (err, result) {
          result.totalCount.should.equal(1);
          result.orders.length.should.equal(1);
          result.orders[0]._id.toString().should.equal(orderA._id.toString());
          result.orders[0].sender_company.company_id.should.equal('');
          result.orders[0].receiver_company.company_id.should.equal('');

          OrderWebAPI.getUserAllOrders(tokenA, 1, 10, '', '', null, function (err, result) {
            result.totalCount.should.equal(1);
            result.orders.length.should.equal(1);
            result.orders[0]._id.toString().should.equal(orderA._id.toString());
            done();
          });
        });

      });
    });

    it('should get one order when create with only sender', function (done) {
      delete order_A.receiver_name;
      order_A.sender_name = company_B.name;
      order_A.order_number = '00001';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;

        OrderWebAPI.getUserAllOrders(tokenA, 1, 10, '', '', [{key:'order_number', value:order_A.order_number},{key:'viewer', value:'assign'}], function (err, result) {
          result.totalCount.should.equal(1);
          result.orders.length.should.equal(1);
          result.orders[0]._id.toString().should.equal(orderA._id.toString());

          OrderWebAPI.getUserAllOrders(tokenB, 1, 10, '', '', [{key:'order_number', value:order_A.order_number},{key:'viewer', value:'sender'}], function (err, result) {
            result.totalCount.should.equal(1);
            result.orders.length.should.equal(1);
            result.orders[0]._id.toString().should.equal(orderA._id.toString());
            done();
          });
        });

      });
    });

    it('should get one order when create with sender and receiver', function (done) {
      order_A.receiver_name = company_C.name;
      order_A.sender_name = company_B.name;
      order_A.order_number = '00002';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;

        OrderWebAPI.getUserAllOrders(tokenA, 1, 10, '', '', [{key:'order_number', value:order_A.order_number},{key:'viewer', value:'assign'}], function (err, result) {
          result.totalCount.should.equal(1);
          result.orders.length.should.equal(1);
          result.orders[0]._id.toString().should.equal(orderA._id.toString());

          OrderWebAPI.getUserAllOrders(tokenB, 1, 10, '', '', [{key:'order_number', value:order_A.order_number},{key:'viewer', value:'sender'}], function (err, result) {
            result.totalCount.should.equal(1);
            result.orders.length.should.equal(1);
            result.orders[0]._id.toString().should.equal(orderA._id.toString());
            result.orders[0].sender_company.company_id.toString().should.equal(companyB._id.toString());

            OrderWebAPI.getUserAllOrders(tokenC, 1, 10, '', '', [{key:'order_number', value:order_A.order_number},{key:'viewer', value:'receiver'}], function (err, result) {
              result.totalCount.should.equal(1);
              result.orders.length.should.equal(1);
              result.orders[0]._id.toString().should.equal(orderA._id.toString());
              result.orders[0].receiver_company.company_id.toString().should.equal(companyC._id.toString());

              done();
            });
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
