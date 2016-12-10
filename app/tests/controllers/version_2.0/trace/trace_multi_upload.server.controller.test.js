/**
 * Created by Wayne on 15/7/27.
 */

/*
 * 测试模块：批量上传地理位置
 * 测试目标：根据上传参数，返回相应结果，并在数据库中产生相应记录
 * 所有入口：第一次分配，继续分配，批量分配
 * */

'use strict';

var CompanyWebAPI = require('../../../common_function/core_business_logic/company'),
  DriverWebAPI = require('../../../common_function/core_business_logic/driver'),
  OrderWebAPI = require('../../../common_function/core_business_logic/order'),
  TraceWebAPI = require('../../../common_function/core_business_logic/trace'),
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

describe('Test For Trace Controller::', function () {
  var user_A, company_A, driver_1,
    driver_2, assignInfo_A, order_A, driver1_traces;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};

    assignInfo_A = [{
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

    driver1_traces = [
      {
        address: 'address1',
        longitude: 13.123,
        latitude: 12.123,
        time: '1900-10-10',
        type: 'gps'
      },
      {
        address: 'address2',
        longitude: '13.123',
        latitude: '12.123',
        time: '1900-10-10',
        type: 'base_station'
      },
      {
        address: 'address3',
        longitude: '13.123',
        latitude: '12.123',
        time: '1900-10-10',
        type: 'gps'
      }
    ];


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

  var userA, tokenA, companyA, driver1, driver2, driverToken1, driverToken2, orderA;

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
        driverToken1 = result.access_token;

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
        driverToken2 = result.access_token;

        driver2.username.should.equal(driver_2.username);
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
    it('should return orderA when userA create orderA', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });

    it('should success when userA assign orderA to driver1', function (done) {
      assignInfo_A[0].driver_id = driver1._id;
      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, true, function (err, result) {
        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          should.exist(orderAEntity.assign_time);
          new Date(orderAEntity.assign_time).getTime().should.be.above(10000);
          orderAEntity.execute_companies.length.should.equal(0);
          orderAEntity.execute_drivers.length.should.equal(1);
          done();
        });
      });
    });
  });

  describe('Test for /traces/multiupload', function () {
    it('should return success equal true when driver1 upload 3 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(3);
        Trace.find({driver: driver1._id}, function (err, traces) {
          traces.length.should.equal(3);
          Driver.findOne({_id: driver1._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver1_traces[0].longitude);
            driver.current_location[1].should.equal(driver1_traces[0].latitude);
            done();
          });
        });
      });
    });

    //返回true ，即使有非法点
    it('should return success equal true when driver 1 upload 3 trace with 2 bad point', function (done) {
      driver1_traces[2] = 'invalid_poin2';
      driver1_traces[1] = 'invalid_point1';
      driver1_traces[0].address = '上海市';
      TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(1);
        Trace.find({driver: driver1._id, address: '上海市'}, function (err, traces) {
          traces.length.should.equal(1);
          done();
        });
      });
    });

    it('should return true when driver 1 upload 0 trace', function (done) {
      driver1_traces = [];
      TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
        result.success_count.should.equal(0);
        result.success.should.equal(true);
        done();
      });
    });

    it('should return true when driver 1 upload a string', function (done) {
      driver1_traces = [];
      TraceWebAPI.multiUpload(driverToken1, 'sdfadsf', function (err, result) {
        result.success_count.should.equal(0);
        result.success.should.equal(true);
        done();
      });
    });

    it('should return true when driver 1 upload a null', function (done) {
      driver1_traces = [];
      TraceWebAPI.multiUpload(driverToken1, null, function (err, result) {
        result.success_count.should.equal(0);
        result.success.should.equal(true);
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
