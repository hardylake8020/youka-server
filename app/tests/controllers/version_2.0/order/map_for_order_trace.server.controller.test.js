/**
 * Created by Wayne on 15/8/3.
 */


/*
 * 测试模块：查找当前用户能看到的运输途中的订单
 * 测试目标：提货后未交货的运单由哪个司机在运，司机位置在哪
 * 所有入口：获取司机运单
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

describe('Test For Company Controller::', function () {
  var user_A, user_B, company_A, company_B, driver_1, driver_2, driver_3, driver_4, driver_5, driver_6;
  var assignInfo_two, assignInfo_company, assignInfo_driver, order_A;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: '595631400@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};
    driver_3 = {username: '18321740710', password: '111111'};
    driver_4 = {username: '18201866643', password: '111111'};
    driver_5 = {username: '13916773239', password: '111111'};
    driver_6 = {username: '13801965408', password: '111111'};

    assignInfo_two = [{
      type: '',
      company_id: '',
      driver_id: '',
      pickup_contact_name: 'elina',
      pickup_contact_phone: '01032147895',
      pickup_contact_mobile_phone: '18321740710',
      pickup_contact_email: '',
      delivery_contact_name: 'hardy',
      delivery_contact_phone: '',
      delivery_contact_mobile_phone: '',
      delivery_contact_address: '',
      delivery_contact_email: ''
    },
      {
        type: '',
        company_id: '',
        driver_id: '',
        pickup_contact_name: 'elina',
        pickup_contact_phone: '01032147895',
        pickup_contact_mobile_phone: '18321740710',
        pickup_contact_email: '',
        delivery_contact_name: 'hardy',
        delivery_contact_phone: '',
        delivery_contact_mobile_phone: '',
        delivery_contact_address: '',
        delivery_contact_email: ''
      }];

    assignInfo_company = [{
      type: 'company',
      driver_id: '',
      pickup_contact_name: 'elina',
      pickup_contact_phone: '01032147895',
      pickup_contact_mobile_phone: '18321740710',
      pickup_contact_email: '',
      delivery_contact_name: 'hardy',
      delivery_contact_phone: '',
      delivery_contact_mobile_phone: '',
      delivery_contact_address: '',
      delivery_contact_email: ''
    }];

    assignInfo_driver = [{
      type: 'driver',
      driver_id: '',
      pickup_contact_name: 'elina',
      pickup_contact_phone: '01032147895',
      pickup_contact_mobile_phone: '18321740710',
      pickup_contact_email: '',
      delivery_contact_name: 'hardy',
      delivery_contact_phone: '',
      delivery_contact_mobile_phone: '',
      delivery_contact_address: '',
      delivery_contact_email: ''
    }];

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
  var driver1, driver2, driver3, driver4, driver5, driver6, tokenD1, tokenD2, tokenD3, tokenD4, tokenD5, tokenD6;
  var orderA1, orderA2, orderA3, orderA4, orderB1, orderD1, orderD21, orderD22, orderD31, orderD32, orderD4;
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

    it('should return driver2 when signUp driver2', function (done) {
      DriverWebAPI.getSMSCode(driver_2.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_2.username, driver_2.password, smsInfo, true, function (err, driverEntity) {
          driver2 = driverEntity;
          done();
        });
      });
    });
    it('should return driver2 and tokenD2 when driver2 sign in', function (done) {
      DriverWebAPI.signIn(driver_2.username, driver_2.password, true, function (err, result) {
        tokenD2 = result.access_token;

        driver2.username.should.equal(driver_2.username);
        done();
      });
    });

    it('should return driver3 when signUp driver3', function (done) {
      DriverWebAPI.getSMSCode(driver_3.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_3.username, driver_3.password, smsInfo, true, function (err, driverEntity) {
          driver3 = driverEntity;
          done();
        });
      });
    });
    it('should return driver3 and tokenD3 when driver3 sign in', function (done) {
      DriverWebAPI.signIn(driver_3.username, driver_3.password, true, function (err, result) {
        tokenD3 = result.access_token;

        driver3.username.should.equal(driver_3.username);
        done();
      });
    });

    it('should return driver4 when signUp driver4', function (done) {
      DriverWebAPI.getSMSCode(driver_4.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_4.username, driver_4.password, smsInfo, true, function (err, driverEntity) {
          driver4 = driverEntity;
          done();
        });
      });
    });
    it('should return driver4 and tokenD4 when driver4 sign in', function (done) {
      DriverWebAPI.signIn(driver_4.username, driver_4.password, true, function (err, result) {
        tokenD4 = result.access_token;

        driver4.username.should.equal(driver_4.username);
        done();
      });
    });

    it('should return driver5 when signUp driver5', function (done) {
      DriverWebAPI.getSMSCode(driver_5.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_5.username, driver_5.password, smsInfo, true, function (err, driverEntity) {
          driver5 = driverEntity;
          done();
        });
      });
    });
    it('should return driver5 and tokenD5 when driver5 sign in', function (done) {
      DriverWebAPI.signIn(driver_5.username, driver_5.password, true, function (err, result) {
        tokenD5 = result.access_token;

        driver5.username.should.equal(driver_5.username);
        done();
      });
    });

    it('should return driver6 when signUp driver6', function (done) {
      DriverWebAPI.getSMSCode(driver_6.username, function (err, smsInfo) {
        DriverWebAPI.signUp(driver_6.username, driver_6.password, smsInfo, true, function (err, driverEntity) {
          driver6 = driverEntity;
          done();
        });
      });
    });
    it('should return driver6 and tokenD6 when driver6 sign in', function (done) {
      DriverWebAPI.signIn(driver_6.username, driver_6.password, true, function (err, result) {
        tokenD6 = result.access_token;

        driver6.username.should.equal(driver_6.username);
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
    it('should be success when companyA invite driver2', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_2.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_2.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });
    it('should be success when companyA invite driver3', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_3.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_3.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });
    it('should be success when companyA invite driver4', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_4.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_4.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    it('should be success when companyB invite driver5', function (done) {
      CompanyWebAPI.inviteDriver(tokenB, driver_5.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_5.username);
        driverCompany.company._id.toString().should.equal(companyB._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });
    it('should be success when companyB invite driver6', function (done) {
      CompanyWebAPI.inviteDriver(tokenB, driver_6.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_6.username);
        driverCompany.company._id.toString().should.equal(companyB._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    it('should be success when companyA create orderA1', function (done) {
      order_A.order_number = '1';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA1 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA2', function (done) {
      order_A.order_number = '2';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA2 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA3', function (done) {
      order_A.order_number = '3';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA3 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA4', function (done) {
      order_A.order_number = '4';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA4 = orderEntity;
        done();
      });
    });

    it('should return orderD1 when useA assign orderA1 to driver1', function (done) {
      assignInfo_driver[0].driver_id = driver1._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA1._id.toString(), assignInfo_driver, true, function (err, result) {
        orderD1 = result.assignedOrderList[0];
        orderD1.execute_driver.should.equal(driver1._id.toString());
        orderD1.order_details.order_number.should.equal(orderA1.order_details.order_number);

        done();
      });
    });

    it('should return orderD21 and orderD22 when useA assign orderA2 to driver2 and driver3', function (done) {
      assignInfo_two[0].type = 'driver';
      assignInfo_two[0].driver_id = driver2._id.toString();
      assignInfo_two[0].company_id = '';

      assignInfo_two[1].type = 'driver';
      assignInfo_two[1].driver_id = driver3._id.toString();
      assignInfo_two[1].company_id = '';

      OrderWebAPI.assignOrder(tokenA, orderA2._id.toString(), assignInfo_two, true, function (err, result) {
        if (result.assignedOrderList[0].execute_driver.toString() === driver2._id.toString()) {
          orderD21 = result.assignedOrderList[0];
          orderD22 = result.assignedOrderList[1];
        }
        else {
          orderD21 = result.assignedOrderList[1];
          orderD22 = result.assignedOrderList[0];
        }

        orderD21.execute_driver.should.equal(driver2._id.toString());
        orderD21.order_details.order_number.should.equal(orderA2.order_details.order_number);

        orderD22.execute_driver.should.equal(driver3._id.toString());
        orderD22.order_details.order_number.should.equal(orderA2.order_details.order_number);
        done();
      });
    });

    it('should return orderD4 when useA assign orderA4 to driver4', function (done) {
      assignInfo_driver[0].driver_id = driver4._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA4._id.toString(), assignInfo_driver, true, function (err, result) {
        orderD4 = result.assignedOrderList[0];
        orderD4.execute_driver.should.equal(driver4._id.toString());
        orderD4.order_details.order_number.should.equal(orderA4.order_details.order_number);

        done();
      });
    });

    it('should return orderB1 when useA assign orderA3 to companyB', function (done) {
      assignInfo_company[0].company_id = companyB._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA3._id.toString(), assignInfo_company, true, function (err, result) {
        orderB1 = result.assignedOrderList[0];
        orderB1.execute_company.should.equal(companyB._id.toString());
        orderB1.order_details.order_number.should.equal(orderA3.order_details.order_number);

        done();
      });
    });

    it('should return orderD31 and orderD32 when useB assign orderB1 to driver5 and driver6', function (done) {
      assignInfo_two[0].type = 'driver';
      assignInfo_two[0].driver_id = driver5._id.toString();
      assignInfo_two[0].company_id = '';

      assignInfo_two[1].type = 'driver';
      assignInfo_two[1].driver_id = driver6._id.toString();
      assignInfo_two[1].company_id = '';

      OrderWebAPI.assignOrder(tokenB, orderB1._id.toString(), assignInfo_two, true, function (err, result) {
        if (result.assignedOrderList[0].execute_driver.toString() === driver5._id.toString()) {
          orderD31 = result.assignedOrderList[0];
          orderD32 = result.assignedOrderList[1];
        }
        else {
          orderD31 = result.assignedOrderList[1];
          orderD32 = result.assignedOrderList[0];
        }

        orderD31.execute_driver.should.equal(driver5._id.toString());
        orderD31.order_details.order_number.should.equal(orderB1.order_details.order_number);

        orderD32.execute_driver.should.equal(driver6._id.toString());
        orderD32.order_details.order_number.should.equal(orderB1.order_details.order_number);
        done();
      });
    });

  });

  //  A1          A2              A3    A4
  //D1(d1)  D21(d2) D22(d3)       B1    D4(d4)
  //                        D31(d5) D32(d6)

  //driver1 提交事件
  describe('Test For orderD1 events', function () {
    it('should be no drivers when driver1 do nothing', function (done) {
      OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
        result.drivers.length.should.equal(0);

        done();
      });
    });

    it('should not get driver1 orders when driver1 pickup sign orderD1', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD1._id.toString(), 'pickupSign', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(0);

          done();
        });
      });
    });

    it('should get driver1 orders when driver1 pickup orderD1', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD1._id.toString(), 'pickup', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          var orderA1Result = result.allDriverOrders[result.drivers[0]._id.toString()];

          result.drivers[0]._id.toString().should.equal(driver1._id.toString());
          orderA1Result[0]._id.toString().should.equal(orderA1._id.toString());
          orderA1Result[0].order_details.order_number.should.equal(orderA1.order_details.order_number);
          orderA1Result[0].status.should.equal('unDeliverySigned');
          done();
        });
      });
    });

    it('should get driver1 orders when driver1 delivery sign orderD1', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD1._id.toString(), 'deliverySign', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          var orderA1Result = result.allDriverOrders[result.drivers[0]._id.toString()];

          result.drivers[0]._id.toString().should.equal(driver1._id.toString());
          orderA1Result[0]._id.toString().should.equal(orderA1._id.toString());
          orderA1Result[0].order_details.order_number.should.equal(orderA1.order_details.order_number);
          orderA1Result[0].status.should.equal('unDeliveried');

          done();
        });
      });
    });

    it('should not get driver1 orders when driver1 delivery orderD1', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD1._id.toString(), 'delivery', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(0);

          done();
        });
      });
    });

  });

  describe('Test For orderD21, orderD22, orderD31, orderD32, orderD4 events', function () {
    //orderD21, orderD31, orderD4, 提货
    it('should get three orders when orderD21, orderD31, orderD4 pickup', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD2, orderD21._id.toString(), 'pickup', true, function (err, result) {
        TransportEventWebAPI.uploadEvent(tokenD5, orderD31._id.toString(), 'pickup', true, function (err, result) {
          TransportEventWebAPI.uploadEvent(tokenD4, orderD4._id.toString(), 'pickup', true, function (err, result) {
            OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
              result.drivers.length.should.equal(3);

              var orderA2Result = result.allDriverOrders[driver2._id.toString()];
              var orderA3Result = result.allDriverOrders[driver5._id.toString()];
              var orderA4Result = result.allDriverOrders[driver4._id.toString()];

              orderA2Result[0]._id.toString().should.equal(orderA2._id.toString());
              orderA2Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
              orderA2Result[0].status.should.equal('unDeliverySigned');

              orderA3Result[0]._id.toString().should.equal(orderA3._id.toString());
              orderA3Result[0].order_details.order_number.should.equal(orderA3.order_details.order_number);
              orderA3Result[0].status.should.equal('unDeliverySigned');

              orderA4Result[0]._id.toString().should.equal(orderA4._id.toString());
              orderA4Result[0].order_details.order_number.should.equal(orderA4.order_details.order_number);
              orderA4Result[0].status.should.equal('unDeliverySigned');

              done();
            });
          });
        });
      });

    });

    it('should get one orders when set the max_driver_number 1', function (done) {
      OrderWebAPI.getOnWayDriverOrders(tokenA, 1, function (err, result) {
        result.drivers.length.should.equal(1);
        var driverIds = [driver2._id.toString(), driver5._id.toString(), driver4._id.toString()];
        driverIds.indexOf(result.drivers[0]._id.toString()).should.be.above(-1);

        done();
      });
    });
    it('should get two orders when set the max_driver_number 2', function (done) {
      OrderWebAPI.getOnWayDriverOrders(tokenA, 2, function (err, result) {
        result.drivers.length.should.equal(2);
        var driverIds = [driver2._id.toString(), driver5._id.toString(), driver4._id.toString()];
        driverIds.indexOf(result.drivers[0]._id.toString()).should.be.above(-1);
        driverIds.indexOf(result.drivers[1]._id.toString()).should.be.above(-1);

        done();
      });
    });
    it('should get three orders when set the max_driver_number 3', function (done) {
      OrderWebAPI.getOnWayDriverOrders(tokenA, 3, function (err, result) {
        result.drivers.length.should.equal(3);
        var driverIds = [driver2._id.toString(), driver5._id.toString(), driver4._id.toString()];
        driverIds.indexOf(result.drivers[0]._id.toString()).should.be.above(-1);
        driverIds.indexOf(result.drivers[1]._id.toString()).should.be.above(-1);
        driverIds.indexOf(result.drivers[2]._id.toString()).should.be.above(-1);

        done();
      });
    });
    it('should get three orders when set the max_driver_number 4', function (done) {
      OrderWebAPI.getOnWayDriverOrders(tokenA, 4, function (err, result) {
        result.drivers.length.should.equal(3);
        var driverIds = [driver2._id.toString(), driver5._id.toString(), driver4._id.toString()];
        driverIds.indexOf(result.drivers[0]._id.toString()).should.be.above(-1);
        driverIds.indexOf(result.drivers[1]._id.toString()).should.be.above(-1);
        driverIds.indexOf(result.drivers[2]._id.toString()).should.be.above(-1);

        done();
      });
    });

    //orderD21 交货， orderD22提货
    it('should get three orders when orderD21 delivery and orderD22 pickup', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD2, orderD21._id.toString(), 'delivery', true, function (err, result) {
        TransportEventWebAPI.uploadEvent(tokenD3, orderD22._id.toString(), 'pickup', true, function (err, result) {
          OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
            result.drivers.length.should.equal(3);

            var orderA2Result = result.allDriverOrders[driver3._id.toString()];
            var orderA3Result = result.allDriverOrders[driver5._id.toString()];
            var orderA4Result = result.allDriverOrders[driver4._id.toString()];

            orderA2Result[0]._id.toString().should.equal(orderA2._id.toString());
            orderA2Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
            orderA2Result[0].status.should.equal('unDeliverySigned');

            orderA3Result[0]._id.toString().should.equal(orderA3._id.toString());
            orderA3Result[0].order_details.order_number.should.equal(orderA3.order_details.order_number);
            orderA3Result[0].status.should.equal('unDeliverySigned');

            orderA4Result[0]._id.toString().should.equal(orderA4._id.toString());
            orderA4Result[0].order_details.order_number.should.equal(orderA4.order_details.order_number);
            orderA4Result[0].status.should.equal('unDeliverySigned');

            done();

          });
        });
      });
    });

    //orderD31 交货， orderD32提货
    it('should get three orders when orderD31 delivery and orderD32 pickup', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD5, orderD31._id.toString(), 'delivery', true, function (err, result) {
        TransportEventWebAPI.uploadEvent(tokenD6, orderD32._id.toString(), 'pickup', true, function (err, result) {
          OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
            result.drivers.length.should.equal(3);

            var orderA2Result = result.allDriverOrders[driver3._id.toString()];
            var orderA3Result = result.allDriverOrders[driver6._id.toString()];
            var orderA4Result = result.allDriverOrders[driver4._id.toString()];

            orderA2Result[0]._id.toString().should.equal(orderA2._id.toString());
            orderA2Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
            orderA2Result[0].status.should.equal('unDeliverySigned');

            orderA3Result[0]._id.toString().should.equal(orderA3._id.toString());
            orderA3Result[0].order_details.order_number.should.equal(orderA3.order_details.order_number);
            orderA3Result[0].status.should.equal('unDeliverySigned');

            orderA4Result[0]._id.toString().should.equal(orderA4._id.toString());
            orderA4Result[0].order_details.order_number.should.equal(orderA4.order_details.order_number);
            orderA4Result[0].status.should.equal('unDeliverySigned');

            done();
          });
        });
      });
    });

    //orderD4 交货
    it('should get two orders when orderD4 delivery', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD4, orderD4._id.toString(), 'delivery', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(2);

          var orderA2Result = result.allDriverOrders[driver3._id.toString()];
          var orderA3Result = result.allDriverOrders[driver6._id.toString()];

          orderA2Result[0]._id.toString().should.equal(orderA2._id.toString());
          orderA2Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
          orderA2Result[0].status.should.equal('unDeliverySigned');

          orderA3Result[0]._id.toString().should.equal(orderA3._id.toString());
          orderA3Result[0].order_details.order_number.should.equal(orderA3.order_details.order_number);
          orderA3Result[0].status.should.equal('unDeliverySigned');

          done();
        });
      });
    });

    //orderD22, orderD33 交货
    it('should not get orders when orderD22 delivery and orderD32 delivery', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD3, orderD22._id.toString(), 'delivery', true, function (err, result) {
        TransportEventWebAPI.uploadEvent(tokenD6, orderD32._id.toString(), 'delivery', true, function (err, result) {
          OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
            result.drivers.length.should.equal(0);

            done();
          });
        });
      });
    });

  });

  describe('Test For assign two order to same driver', function () {
    var orderD11, orderD12;

    it('should be success when companyA create orderA1', function (done) {
      order_A.order_number = '11';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA1 = orderEntity;
        done();
      });
    });
    it('should be success when companyA create orderA2', function (done) {
      order_A.order_number = '22';
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA2 = orderEntity;
        done();
      });
    });

    it('should return orderD11 when useA assign orderA1 to driver1', function (done) {
      assignInfo_driver[0].driver_id = driver1._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA1._id.toString(), assignInfo_driver, true, function (err, result) {
        orderD11 = result.assignedOrderList[0];
        orderD11.execute_driver.should.equal(driver1._id.toString());
        orderD11.order_details.order_number.should.equal(orderA1.order_details.order_number);

        done();
      });
    });
    it('should return orderD12 when useA assign orderA2 to driver1', function (done) {
      assignInfo_driver[0].driver_id = driver1._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA2._id.toString(), assignInfo_driver, true, function (err, result) {
        orderD12 = result.assignedOrderList[0];
        orderD12.execute_driver.should.equal(driver1._id.toString());
        orderD12.order_details.order_number.should.equal(orderA2.order_details.order_number);

        done();
      });
    });

    //orderD11, 提货
    it('should get driver1 one orders when driver1 pickup orderD11', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD11._id.toString(), 'pickup', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          result.drivers[0]._id.toString().should.equal(driver1._id.toString());

          var orderA1Result = result.allDriverOrders[result.drivers[0]._id.toString()];
          orderA1Result.length.should.equal(1);

          orderA1Result[0]._id.toString().should.equal(orderA1._id.toString());
          orderA1Result[0].order_details.order_number.should.equal(orderA1.order_details.order_number);
          orderA1Result[0].status.should.equal('unDeliverySigned');
          done();
        });
      });
    });
    //orderD12, 提货
    it('should get driver1 two orders when driver1 pickup orderD12', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD12._id.toString(), 'pickup', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          result.drivers[0]._id.toString().should.equal(driver1._id.toString());

          var orderA1Result = result.allDriverOrders[result.drivers[0]._id.toString()];
          orderA1Result.length.should.equal(2);

          if (orderA1Result[0]._id.toString() === orderA1._id.toString()) {
            orderA1Result[0].order_details.order_number.should.equal(orderA1.order_details.order_number);
            orderA1Result[0].status.should.equal('unDeliverySigned');

            orderA1Result[1].order_details.order_number.should.equal(orderA2.order_details.order_number);
            orderA1Result[1].status.should.equal('unDeliverySigned');
          }
          else {
            orderA1Result[1].order_details.order_number.should.equal(orderA1.order_details.order_number);
            orderA1Result[1].status.should.equal('unDeliverySigned');

            orderA1Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
            orderA1Result[0].status.should.equal('unDeliverySigned');
          }

          done();
        });
      });
    });

    //orderD11, 交货
    it('should get driver1 one orders when driver1 delivery orderD11', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD11._id.toString(), 'delivery', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          result.drivers[0]._id.toString().should.equal(driver1._id.toString());

          var orderA2Result = result.allDriverOrders[result.drivers[0]._id.toString()];
          orderA2Result.length.should.equal(1);

          orderA2Result[0]._id.toString().should.equal(orderA2._id.toString());
          orderA2Result[0].order_details.order_number.should.equal(orderA2.order_details.order_number);
          orderA2Result[0].status.should.equal('unDeliverySigned');
          done();
        });
      });
    });

    //orderD12, 交货
    it('should not get driver1 orders when driver1 delivery orderD12', function (done) {
      TransportEventWebAPI.uploadEvent(tokenD1, orderD12._id.toString(), 'delivery', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(0);

          done();
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
