/**
 * Created by Wayne on 15/9/7.
 */

/*
 * 测试模块：批量创建运单时自动分配运单
 * 测试目标：批量创建运单时，如果有承运司机,且司机已注册，则自动分配给司机.否则返回未分配的数量
 * 所有入口：批量创建运单
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
  var user_A, company_A;
  var order_A, order_B;
  var driver_1, driver_2;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};

    order_A = {
      order_number: '123456789'
    };
    order_B = {
      order_number: '987654321'
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

  var userA, tokenA, companyA, driver1, driver2;

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
    it('should return driver2 when signUp driver2', function (done) {
      DriverWebAPI.getSMSCode(driver_2.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_2.username, driver_2.password, smsInfo, true, function (err, driverEntity) {
          driver2 = driverEntity;
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
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

  });

  describe('Test For Batch Create Order', function () {
    it('should not assign when batch create without drivers', function (done) {
      delete order_A.driver_username;
      delete order_B.driver_username;

      var orders = [{createInfo: order_A}, {createInfo: order_B}];

      OrderWebAPI.batchCreateOrder(tokenA, orders, companyA.default_group, true, function (err, result) {
        result.invalidReceiverCount.should.equal(2);
        result.invalidSenderCount.should.equal(2);
        result.successAssignCount.should.equal(0);
        done();
      });

    });

    it('should not assign when batch create with one not exist driver', function (done) {
      order_A.driver_username = '11122223333';
      delete order_B.driver_username;

      var orders = [{createInfo: order_A}, {createInfo: order_B}];

      OrderWebAPI.batchCreateOrder(tokenA, orders, companyA.default_group, true, function (err, result) {
        result.invalidReceiverCount.should.equal(2);
        result.invalidSenderCount.should.equal(2);
        result.successAssignCount.should.equal(0);
        done();
      });

    });

    it('should not assign when batch create with one illegal driver', function (done) {
      order_A.driver_username = 'abcdefg';
      delete order_B.driver_username;

      var orders = [{createInfo: order_A}, {createInfo: order_B}];

      OrderWebAPI.batchCreateOrder(tokenA, orders, companyA.default_group, true, function (err, result) {
        result.invalidReceiverCount.should.equal(2);
        result.invalidSenderCount.should.equal(2);
        result.successAssignCount.should.equal(0);
        done();
      });

    });

    it('should be one assign when batch create with one exist driver', function (done) {
      order_A.order_number = '00001';
      delete order_B.driver_username;

      var orders = [{createInfo: order_A, assignInfos: [{driver_username: driver1.username}]}, {createInfo: order_B}];
      OrderWebAPI.batchCreateOrder(tokenA, orders, companyA.default_group, true, function (err, result) {
        result.invalidReceiverCount.should.equal(2);
        result.invalidSenderCount.should.equal(2);
        result.successAssignCount.should.equal(1);

        Order.find({'order_details.order_number': order_A.order_number, execute_driver: driver1._id}, function (err, driverOrders) {
          driverOrders.length.should.equal(1);
          Order.find({'order_details.order_number': order_A.order_number, execute_driver: {$exists: false}}, function (err, parentOrders) {
            parentOrders.length.should.equal(1);
            parentOrders[0].status.should.equal('unPickupSigned');
            parentOrders[0].assign_status.should.equal('completed');

            done();
          });
        });
      });
    });

    it('should be two assign when batch create with two exist driver', function (done) {
      order_A.order_number = '00002';
      order_B.order_number = '00003';

      var orders = [{
        createInfo: order_A,
        assignInfos: [{driver_username: driver1.username}]
      },
        {
          createInfo: order_B,
          assignInfos: [{driver_username: driver2.username}]
        }];
      OrderWebAPI.batchCreateOrder(tokenA, orders, companyA.default_group, true, function (err, result) {
        result.invalidReceiverCount.should.equal(2);
        result.invalidSenderCount.should.equal(2);
        result.successAssignCount.should.equal(2);

        Order.find({'order_details.order_number': order_A.order_number, execute_driver: driver1._id}, function (err, driverOrders) {
          driverOrders.length.should.equal(1);
          Order.find({'order_details.order_number': order_A.order_number, execute_driver: {$exists: false}}, function (err, parentOrders) {
            parentOrders.length.should.equal(1);
            parentOrders[0].status.should.equal('unPickupSigned');
            parentOrders[0].assign_status.should.equal('completed');

            Order.find({'order_details.order_number': order_B.order_number, execute_driver: driver2._id}, function (err, driverOrders) {
              driverOrders.length.should.equal(1);

              Order.find({'order_details.order_number': order_B.order_number, execute_driver: {$exists: false}}, function (err, parentOrders) {
                parentOrders.length.should.equal(1);
                parentOrders[0].status.should.equal('unPickupSigned');
                parentOrders[0].assign_status.should.equal('completed');

                done();
              });
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
