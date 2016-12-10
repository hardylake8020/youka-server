/**
 * Created by Wayne on 15/8/6.
 */

/*
 * 测试模块：路单逻辑
 * 测试目标：批量分配运单到司机，可以设置路单. 父订单和子订单都可以看到
 * 所有入口：批量分配运单接口
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
  var user_A, company_A, driver_1;
  var assignInfo_driver, order_A1, order_A2, order_A3;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    driver_1 = {username: '13052118915', password: '111111'};

    assignInfo_driver = {
      type: 'driver',
      driver_id: '',
      road_order_name: ''
    };

    order_A1 = {
      order_number: '1'
    };
    order_A2 = {
      order_number: '2'
    };
    order_A3 = {
      order_number: '3'
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

  var userA, tokenA, companyA;
  var driver1,tokenD1;
  var orderA1, orderA2, orderA3;
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
    it('should return driver1 and tokenD1 when driver1 sign in', function (done) {
      DriverWebAPI.signIn(driver_1.username, driver_1.password, true, function (err, result) {
        tokenD1 = result.access_token;

        driver1.username.should.equal(driver_1.username);
        done();
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

  });

  //driver1 提交事件
  describe('Test For Batch assign orders without setting road order', function () {
    it('should be success when companyA create orderA1', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A1, companyA.default_group, true, function (err, orderEntity) {
        orderA1 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA2', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A2, companyA.default_group, true, function (err, orderEntity) {
        orderA2 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA3', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A3, companyA.default_group, true, function (err, orderEntity) {
        orderA3 = orderEntity;
        done();
      });
    });

    it('should no road order when batch assign with road_order_name null', function (done) {
      delete assignInfo_driver.road_order_name;
      assignInfo_driver.driver_id = driver1._id.toString();
      assignInfo_driver.order_ids = [orderA1._id.toString(), orderA2._id.toString(), orderA3._id.toString()];

      OrderWebAPI.batchAssignOrder(tokenA, assignInfo_driver, true, function (err, result) {
        Order.find({execute_driver: assignInfo_driver.driver_id}, function (err, findOrders) {
          should.not.exist(err);
          findOrders.length.should.equal(3);
          findOrders.forEach(function (findOrder) {
            should.not.exist(findOrder.road_order);
          });

          Order.findOne({_id: orderA1._id.toString()}, function (err, findOrderA1) {
            should.not.exist(findOrderA1.road_order);

            Order.findOne({_id: orderA2._id.toString()}, function (err, findOrderA2) {
              should.not.exist(findOrderA2.road_order);

              Order.findOne({_id: orderA3._id.toString()}, function (err, findOrderA3) {
                should.not.exist(findOrderA3.road_order);

                done();
              });
            });
          });
        });
      });
    });

    //重新创建
    it('should be success when companyA create orderA1 again', function (done) {
      order_A1.order_number = '21';
      OrderWebAPI.createOrder(tokenA, order_A1, companyA.default_group, true, function (err, orderEntity) {
        orderA1 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA2 again', function (done) {
      order_A1.order_number = '22';
      OrderWebAPI.createOrder(tokenA, order_A2, companyA.default_group, true, function (err, orderEntity) {
        orderA2 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA3 again', function (done) {
      order_A1.order_number = '23';
      OrderWebAPI.createOrder(tokenA, order_A3, companyA.default_group, true, function (err, orderEntity) {
        orderA3 = orderEntity;
        done();
      });
    });

    it('should no road order when batch assign with road_order_name empty string', function (done) {
      assignInfo_driver.road_order_name = '';
      assignInfo_driver.driver_id = driver1._id.toString();
      assignInfo_driver.pickup_contact_name = '2222';
      assignInfo_driver.order_ids = [orderA1._id.toString(), orderA2._id.toString(), orderA3._id.toString()];

      OrderWebAPI.batchAssignOrder(tokenA, assignInfo_driver, true, function (err, result) {
        Order.find({execute_driver: assignInfo_driver.driver_id}, function (err, findOrders) {
          should.not.exist(err);
          findOrders.length.should.equal(6);

          done();
        });
      });

    });

  });

  describe('Test For Batch assign orders with setting road order', function () {
    //重新创建
    it('should be success when companyA create orderA1 once more', function (done) {
      order_A1.order_number = '31';
      OrderWebAPI.createOrder(tokenA, order_A1, companyA.default_group, true, function (err, orderEntity) {
        orderA1 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA2 once more', function (done) {
      order_A1.order_number = '32';
      OrderWebAPI.createOrder(tokenA, order_A2, companyA.default_group, true, function (err, orderEntity) {
        orderA2 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA3 once more', function (done) {
      order_A1.order_number = '33';
      OrderWebAPI.createOrder(tokenA, order_A3, companyA.default_group, true, function (err, orderEntity) {
        orderA3 = orderEntity;
        done();
      });
    });

    it('should get road order when batch assign with road_order_name', function (done) {
      assignInfo_driver.road_order_name = 'abcd@#@97946846';
      assignInfo_driver.driver_id = driver1._id.toString();
      assignInfo_driver.pickup_contact_name = '3333';
      assignInfo_driver.order_ids = [orderA1._id.toString(), orderA2._id.toString(), orderA3._id.toString()];

      OrderWebAPI.batchAssignOrder(tokenA, assignInfo_driver, true, function (err, result) {
        Order.find({'road_order.name': assignInfo_driver.road_order_name, execute_driver: assignInfo_driver.driver_id}, function (err, findOrders) {
          should.not.exist(err);
          findOrders.length.should.equal(3);
          findOrders.forEach(function (findOrder) {
            findOrder.road_order.name.should.equal(assignInfo_driver.road_order_name);
            should.exist(findOrder.road_order._id);
          });

          Order.findOne({_id: orderA1._id.toString()}, function (err, findOrderA1) {
            findOrderA1.road_order.name.should.equal(assignInfo_driver.road_order_name);
            should.exist(findOrderA1.road_order._id);

            Order.findOne({_id: orderA2._id.toString()}, function (err, findOrderA2) {
              findOrderA2.road_order.name.should.equal(assignInfo_driver.road_order_name);
              should.exist(findOrderA2.road_order._id);

              Order.findOne({_id: orderA3._id.toString()}, function (err, findOrderA3) {
                findOrderA3.road_order.name.should.equal(assignInfo_driver.road_order_name);
                should.exist(findOrderA3.road_order._id);

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
