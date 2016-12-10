/**
 * Created by Wayne on 15/7/27.
 */

/*
 * 测试模块：获取运单的所有位置信息
 * 测试目标：获取运单在运输途中的位置点
 * 所有入口：getTrace
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
  var user_A, user_B, user_C, user_D,
    company_A, company_B, company_C, company_D,
    driver_1, driver_2, driver_3, driver_4,
    assignInfo_A, assignInfo_B, assignInfo_C, assignInfo_D,
    driver1_traces, driver2_traces, driver3_traces, driver4_traces,
    order_A;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};
    user_B = {username: 'hardy@zhuzhuqs.com', password: '111111'};
    user_C = {username: '1963968619@qq.com', password: '111111'};
    user_D = {username: '13918429709@163.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_B = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_C = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    company_D = {name: 'companyD', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driver_1 = {username: '13052118915', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};

    driver_3 = {username: '13472423583', password: '111111'};
    driver_4 = {username: '18221260351', password: '111111'};

    assignInfo_A = [
      {
        type: 'driver'
      },
      {
        type: 'company'
      },
      {
        type: 'company'
      }
    ];

    assignInfo_B = [
      {
        type: 'company'
      }
    ];

    assignInfo_C = [
      {
        type: 'driver'
      },
      {
        type: 'driver'
      }
    ];

    assignInfo_D = [
      {
        type: 'driver'
      }
    ];

    order_A = {
      order_number: '123456789'
    };

    driver1_traces = [
      {
        address: 'address1',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'gps'
      },
      {
        address: 'address2',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'base_station'
      },
      {
        address: 'address3',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'gps'
      }
    ];
    driver2_traces = [
      {
        address: 'address2',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'base_station'
      },
      {
        address: 'address3',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'gps'
      }
    ];
    driver3_traces = [
      {
        address: 'address1',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
        type: 'gps'
      }
    ];
    driver4_traces = [
      {
        address: 'address1',
        longitude: 13.123,
        latitude: 12.123,
        time: new Date( ),
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
  var userA, userB, userC, userD,
    tokenA, tokenB, tokenC, tokenD,
    companyA, companyB, companyC, companyD,
    driver1, driver2, driver3, driver4,
    driverToken1, driverToken2, driverToken3, driverToken4,
    orderA, orderB, orderC, orderD,
    driverOrder1, driverOrder2, driverOrder3, driverOrder4;

  describe('Prepare Data For Test::', function () {
    //公司A相关初始化
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

    //公司B相关初始化
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

    //公司C相关初始化
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

    //公司D相关初始化
    it('should return userD when signUp userD', function (done) {
      UserWebAPI.signUp(user_D.username, user_D.password, true, function (err, userEntity) {
        UserWebAPI.activate(userEntity._id.toString(), function (err, data) {
          done();
        });
      });
    });
    it('should return userD when signIn userD', function (done) {
      UserWebAPI.signIn(user_D.username, user_D.password, true, function (err, result) {
        userD = result.user;
        tokenD = result.access_token;
        done();
      });
    });
    it('should return companyD when create companyD', function (done) {
      CompanyWebAPI.createCompany(tokenD, company_D.name,
        company_D.address, company_D.photo, company_D.employees, true, function (err, companyEntity) {
          companyD = companyEntity;
          done();
        });
    });


    //司机1注册登陆
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

    //司机2注册登陆
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

    //司机3注册登陆
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
        driverToken3 = result.access_token;

        driver3.username.should.equal(driver_3.username);
        done();
      });
    });

    //司机4注册登陆
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
        driverToken4 = result.access_token;

        driver4.username.should.equal(driver_4.username);
        done();
      });
    });

    //公司A邀请公司B,C和司机1
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

    it('should be success when companyA invite driver1', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_1.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_1.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    //公司B邀请公司D
    it('should be success when companyB invite companyD', function (done) {
      CompanyWebAPI.inviteCompanyByCompanyName(tokenB, companyD.name, true, function (err, companyPartner) {
        companyPartner.company.toString().should.equal(companyB._id.toString());
        companyPartner.partner.toString().should.equal(companyD._id.toString());
        done();
      });
    });


    //公司C邀请司机2,3
    it('should be success when companyC invite driver2', function (done) {
      CompanyWebAPI.inviteDriver(tokenC, driver_2.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_2.username);
        driverCompany.company._id.toString().should.equal(companyC._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    it('should be success when companyC invite driver3', function (done) {
      CompanyWebAPI.inviteDriver(tokenC, driver_3.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_3.username);
        driverCompany.company._id.toString().should.equal(companyC._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    //公司D邀请司机4
    it('should be success when companyD invite driver4', function (done) {
      CompanyWebAPI.inviteDriver(tokenD, driver_4.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_4.username);
        driverCompany.company._id.toString().should.equal(companyD._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    //公司A创建运单A
    it('should return orderA when userA create orderA', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });

    //公司A分配运单A给公司B，公司C，司机1
    it('should success when userA assign orderA to companyA,companyB,driver1', function (done) {
      assignInfo_A[0].driver_id = driver1._id;
      assignInfo_A[1].company_id = companyB._id;
      assignInfo_A[2].company_id = companyC._id;
      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, true, function (err, result) {
        orderB = result.assignedOrderList.filter(function (item) {
          return item.execute_company === companyB._id;
        })[0];
        orderB.execute_company.should.equal(companyB._id);
        orderC = result.assignedOrderList.filter(function (item) {
          return item.execute_company === companyC._id;
        })[0];
        orderC.execute_company.should.equal(companyC._id);
        driverOrder1 = result.assignedOrderList.filter(function (item) {
          return item.execute_driver === driver1._id;
        })[0];
        driverOrder1.execute_driver.should.equal(driver1._id);
        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          should.exist(orderAEntity.assign_time);
          new Date(orderAEntity.assign_time).getTime().should.be.above(10000);
          orderAEntity.execute_companies.length.should.equal(2);
          orderAEntity.execute_drivers.length.should.equal(1);
          done();
        });
      });
    });

    //公司B分配运单B给公司D
    it('should success when userB assign orderB to companyD', function (done) {
      assignInfo_B[0].company_id = companyD._id;
      OrderWebAPI.assignOrder(tokenB, orderB._id.toString(), assignInfo_B, true, function (err, result) {
        orderD = result.assignedOrderList[0];
        orderD.execute_company.should.equal(companyD._id);
        done();
      });
    });


    it('should success when userC assign orderC to driver2 , driver3', function (done) {
      assignInfo_C[0].driver_id = driver2._id;
      assignInfo_C[1].driver_id = driver3._id;
      OrderWebAPI.assignOrder(tokenC, orderC._id.toString(), assignInfo_C, true, function (err, result) {

        driverOrder2 = result.assignedOrderList.filter(function (item) {
          return item.execute_driver === driver2._id;
        })[0];
        driverOrder2.type.should.equal('driver');
        driverOrder2.execute_driver.should.equal(driver2._id);
        driverOrder3 = result.assignedOrderList.filter(function (item) {
          return item.execute_driver === driver3._id;
        })[0];
        driverOrder3.type.should.equal('driver');
        driverOrder3.execute_driver.should.equal(driver3._id);

        done();
      });
    });


    it('should success when userD assign orderD to driver4', function (done) {
      assignInfo_D[0].driver_id = driver4._id;
      OrderWebAPI.assignOrder(tokenD, orderD._id.toString(), assignInfo_D, true, function (err, result) {

        driverOrder4 = result.assignedOrderList[0];
        driverOrder4.type.should.equal('driver');
        driverOrder4.execute_driver.should.equal(driver4._id);
        done();
      });
    });
  });

  describe('Test for get /trace', function () {
    it('should return array with 4 empty item when get orderA traces', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        result.forEach(function (item) {
          item.traces.length.should.equal(0);
        });
        done();
      });
    });

    //driver1提货  点数1
    it('should be success when driver1 pickup driverOrder1', function (done) {
      TransportEventWebAPI.uploadEvent(driverToken1, driverOrder1._id, 'pickup', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          done();
        });
      });
    });
    it('should get 1 trace point after driver1 pickup driverOrder1', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(1);

        Trace.find({driver:driver1._id},function(err,traces){
          TransportEvent.findOne({driver:driver1._id},function(transportEvent){
            result.forEach(function (item) {
              if ([driver1._id].indexOf(item.driver) === -1)
                item.traces.length.should.equal(0);
            });

            done();
          });
        });
      });
    });
    ////driver1上传3个点    点数4
    it('should return success equal true when driver1 upload 3 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(3);
        Trace.find({driver: driver1._id}, function (err, traces) {
          traces.length.should.equal(4); //外加提货点
          Driver.findOne({_id: driver1._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver1_traces[0].longitude);
            driver.current_location[1].should.equal(driver1_traces[0].latitude);
            done();
          });
        });
      });
    });
    it('should get 4 trace point after driver1 upload 3 point', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        result.forEach(function (item) {
          if ([driver1._id].indexOf(item.driver) === -1)
            item.traces.length.should.equal(0);
        });

        done();
      });
    });

    //driver2提货签到  点数5
    it('should be success when driver2 pickupSign driverOrder2', function (done) {
      TransportEventWebAPI.uploadEvent(driverToken2, driverOrder2._id, 'pickupSign', true, function (err, result) {
        //获取提货后的运单，当前状态为unPickuped
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(0);
          done();
        });
      });
    });
    it('should get 5 trace point after driver2 pickupSign driverOrder2', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(1);

        result.forEach(function (item) {
          if ([driver1._id, driver2._id].indexOf(item.driver) === -1)
            item.traces.length.should.equal(0);
        });

        done();
      });
    });
    ////driver2上传2个点    点数7
    it('should return success equal true when driver2 upload 2 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken2, driver2_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(2);
        Trace.find({driver: driver2._id}, function (err, traces) {
          traces.length.should.equal(3); //外加提货签到点
          Driver.findOne({_id: driver2._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver2_traces[0].longitude);
            driver.current_location[1].should.equal(driver2_traces[0].latitude);
            done();
          });
        });
      });
    });
    it('should get 7 trace point after driver2 upload 2 point', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        result.forEach(function (item) {
          if ([driver1._id, driver2._id].indexOf(item.driver) === -1)
            item.traces.length.should.equal(0);
        });

        done();
      });
    });

    //driver3中途事件  点数8
    it('should be success when driver3 halfway driverOrder3', function (done) {
      TransportEventWebAPI.uploadEvent(driverToken3, driverOrder3._id, 'halfway', true, function (err, result) {
        //获取提货后的运单，当前状态为pickupSign
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(0);
          done();
        });
      });
    });
    it('should get 8 trace point after driver3 halfway driverOrder3', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(1);

        result.forEach(function (item) {
          if ([driver1._id, driver2._id, driver3._id].indexOf(item.driver) === -1)
            item.traces.length.should.equal(0);
        });

        done();
      });
    });
    ////driver3上传1个点    点数9
    it('should return success equal true when driver3 upload 1 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken3, driver3_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(1);
        Trace.find({driver: driver3._id}, function (err, traces) {
          traces.length.should.equal(2); //外加中途点
          Driver.findOne({_id: driver3._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver3_traces[0].longitude);
            driver.current_location[1].should.equal(driver3_traces[0].latitude);
            done();
          });
        });
      });
    });
    it('should get 9 trace point after driver3 upload 1 point', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(2);

        result.forEach(function (item) {
          if ([driver1._id, driver2._id, driver3._id].indexOf(item.driver) === -1)
            item.traces.length.should.equal(0);
        });

        done();
      });
    });

    //driver4提货  点数10
    it('should be success when driver4 pickup driverOrder4', function (done) {
      TransportEventWebAPI.uploadEvent(driverToken4, driverOrder4._id, 'pickup', true, function (err, result) {
        //获取提货后的运单，当前状态为unDeliverySign
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);  //一个运单当前只有一个在运司机
          done();
        });
      });
    });
    it('should get 10 trace point after driver4 pickup driverOrder4', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(2);

        var driver4Traces = result.filter(function (item) {
          return item.driver === driver4._id;
        })[0].traces;
        driver4Traces.length.should.equal(1);

        result.forEach(function (item) {
            item.traces.length.should.be.above(0);
        });

        done();
      });
    });
    ////driver4上传1个点    点数11
    it('should return success equal true when driver4 upload 1 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken4, driver4_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(1);
        Trace.find({driver: driver4._id}, function (err, traces) {
          traces.length.should.equal(2); //外加提货点
          Driver.findOne({_id: driver4._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver4_traces[0].longitude);
            driver.current_location[1].should.equal(driver4_traces[0].latitude);
            done();
          });
        });
      });
    });
    it('should get 11 trace point after driver4 upload 1 point', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(4);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(2);

        var driver4Traces = result.filter(function (item) {
          return item.driver === driver4._id;
        })[0].traces;
        driver4Traces.length.should.equal(2);

        result.forEach(function (item) {
            item.traces.length.should.be.above(0);
        });

        done();
      });
    });

    //driver1 交货  点数12
    it('should be success when driver1 delivery driverOrder1', function (done) {
      TransportEventWebAPI.uploadEvent(driverToken1, driverOrder1._id, 'delivery', true, function (err, result) {
        OrderWebAPI.getOnWayDriverOrders(tokenA, -1, function (err, result) {
          result.drivers.length.should.equal(1);
          done();
        });
      });
    });
    it('should get 12 trace point after driver1 pickup driverOrder1', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(5);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(2);

        var driver4Traces = result.filter(function (item) {
          return item.driver === driver4._id;
        })[0].traces;
        driver4Traces.length.should.equal(2);

        result.forEach(function (item) {
          item.traces.length.should.be.above(0);
        });

        done();
      });
    });

    ////driver1上传3个点    orderA点数12不变
    it('should return success equal true when driver1 upload 3 trace point', function (done) {
      TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
        result.success.should.equal(true);
        result.success_count.should.equal(3);
        Trace.find({driver: driver1._id}, function (err, traces) {
          traces.length.should.equal(8); //外加提货点
          Driver.findOne({_id: driver1._id}, function (err,driver) {
            driver.current_location[0].should.equal(driver1_traces[0].longitude);
            driver.current_location[1].should.equal(driver1_traces[0].latitude);
            done();
          });
        });
      });
    });
    it('should get 12 trace point after driver1 upload 3 point with order delivery', function (done) {
      TraceWebAPI.getTraces(tokenA, orderA._id, function (err, result) {
        var driver1Traces = result.filter(function (item) {
          return item.driver === driver1._id;
        })[0].traces;
        driver1Traces.length.should.equal(5);

        var driver2Traces = result.filter(function (item) {
          return item.driver === driver2._id;
        })[0].traces;
        driver2Traces.length.should.equal(3);

        var driver3Traces = result.filter(function (item) {
          return item.driver === driver3._id;
        })[0].traces;
        driver3Traces.length.should.equal(2);

        var driver4Traces = result.filter(function (item) {
          return item.driver === driver4._id;
        })[0].traces;
        driver4Traces.length.should.equal(2);

        result.forEach(function (item) {
          item.traces.length.should.be.above(0);
        });
        done();
      });
    });
  });

  //describe('Test for /traces/multiupload', function () {
  //  it('should return success equal true when driver1 upload 3 trace point', function (done) {
  //    TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
  //      result.success.should.equal(true);
  //      result.success_count.should.equal(3);
  //      Trace.find({driver: driver1._id}, function (err, traces) {
  //        traces.length.should.equal(3);
  //        Driver.findOne({_id: driver1._id}, function (err, driver) {
  //          driver.current_location[0].should.equal(driver1_traces[0].longitude);
  //          driver.current_location[1].should.equal(driver1_traces[0].latitude);
  //          done();
  //        });
  //      });
  //    });
  //  });
  //
  //  //返回true ，即使有非法点
  //  it('should return success equal true when driver 1 upload 3 trace with 2 bad point', function (done) {
  //    driver1_traces[2] = 'invalid_poin2';
  //    driver1_traces[1] = 'invalid_point1';
  //    driver1_traces[0].address = '上海市';
  //    TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
  //      result.success.should.equal(true);
  //      result.success_count.should.equal(1);
  //      Trace.find({driver: driver1._id, address: '上海市'}, function (err, traces) {
  //        traces.length.should.equal(1);
  //        done();
  //      });
  //    });
  //  });
  //
  //  it('should return true when driver 1 upload 0 trace', function (done) {
  //    driver1_traces = [];
  //    TraceWebAPI.multiUpload(driverToken1, driver1_traces, function (err, result) {
  //      result.success_count.should.equal(0);
  //      result.success.should.equal(true);
  //      done();
  //    });
  //  });
  //
  //  it('should return true when driver 1 upload a string', function (done) {
  //    driver1_traces = [];
  //    TraceWebAPI.multiUpload(driverToken1, 'sdfadsf', function (err, result) {
  //      result.success_count.should.equal(0);
  //      result.success.should.equal(true);
  //      done();
  //    });
  //  });
  //
  //  it('should return true when driver 1 upload a null', function (done) {
  //    driver1_traces = [];
  //    TraceWebAPI.multiUpload(driverToken1, null, function (err, result) {
  //      result.success_count.should.equal(0);
  //      result.success.should.equal(true);
  //      done();
  //    });
  //  });
  //});


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
