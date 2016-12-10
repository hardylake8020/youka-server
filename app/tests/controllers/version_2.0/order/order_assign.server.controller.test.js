/**
 * Created by Wayne on 15/7/27.
 */

/*
* 测试模块：运单分配
* 测试目标：分配完成后，会产生分配时间，execute_drivers, execute_companies.
* 所有入口：第一次分配，继续分配，批量分配
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
  var user_A, user_B, user_C, company_A, company_B, company_C, driver_1,
    driver_2, driver_3, assignInfo_A, assignInfo_B, assignInfo_C, order_A;

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

    assignInfo_A = [{
      type: 'company',
      company_id: '',
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
        type: 'company',
        company_id: '',
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

    assignInfo_B = [{
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

    assignInfo_C = [{
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

  var userA, tokenA, companyA, userB, tokenB, companyB, userC, tokenC, companyC, driver1, driver2;

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
    it('should be success when companyA invite driver2', function (done) {
      CompanyWebAPI.inviteDriver(tokenA, driver_2.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_2.username);
        driverCompany.company._id.toString().should.equal(companyA._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

    it('should be success when companyB invite driver1', function (done) {
      CompanyWebAPI.inviteDriver(tokenB, driver_1.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_1.username);
        driverCompany.company._id.toString().should.equal(companyB._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });
    it('should be success when companyC invite driver2', function (done) {
      CompanyWebAPI.inviteDriver(tokenC, driver_2.username, function (err, driverCompany) {
        driverCompany.username.should.equal(driver_2.username);
        driverCompany.company._id.toString().should.equal(companyC._id.toString());
        driverCompany.status.should.equal('accepted');
        done();
      });
    });

  });

  describe('Test For multiAssign Function::', function () {
    var orderA, orderB, orderC, driverOrder1, driverOrder2;
    it('should return orderA when userA create orderA', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //orderA会增加分配时间字段
    it('should return orderB and orderC when userA assign orderA to orderB and orderC', function (done) {
      assignInfo_A[0].company_id = companyB._id.toString();
      assignInfo_A[1].company_id = companyC._id.toString();

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, true, function (err, result) {
        if (result.assignedOrderList[0].execute_company.toString() === companyB._id.toString()) {
          orderB = result.assignedOrderList[0];
          orderC = result.assignedOrderList[1];
        }
        else {
          orderB = result.assignedOrderList[1];
          orderC = result.assignedOrderList[0];
        }

        orderB.order_details.order_number.should.equal(orderA.order_details.order_number);
        orderB.execute_company.should.equal(companyB._id.toString());
        orderC.order_details.order_number.should.equal(orderA.order_details.order_number);
        orderC.execute_company.should.equal(companyC._id.toString());

        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          should.exist(orderAEntity.assign_time);
          new Date(orderAEntity.assign_time).getTime().should.be.above(10000);
          orderAEntity.execute_companies.length.should.equal(2);

          done();
        });
      });
    });

    //orderB会增加分配时间字段，execute_drivers字段， orderA会增加execute_drivers字段。
    it('should return driverOrder1 when useB assign orderB to driver1', function (done) {
      assignInfo_B[0].driver_id = driver1._id.toString();

      OrderWebAPI.assignOrder(tokenB, orderB._id.toString(), assignInfo_B, true, function (err, result) {
        driverOrder1 = result.assignedOrderList[0];
        driverOrder1.execute_driver.should.equal(driver1._id.toString());
        Order.findOne({_id: orderB._id.toString()}, function (err, orderBEntity) {
          new Date(orderBEntity.assign_time).getTime().should.be.above(10000);
          orderBEntity.execute_drivers.length.should.equal(1);
          orderBEntity.execute_drivers[0]._id.toString().should.equal(driver1._id.toString());

          Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
            orderAEntity.execute_drivers.length.should.equal(1);
            orderAEntity.execute_drivers[0]._id.toString().should.equal(driver1._id.toString());

            done();
          });
        });

      });
    });

    //orderC会增加分配时间字段，execute_drivers字段， orderA的execute_drivers字段会增加driver2。
    it('should return driverOrder2 when useC assign orderC to driver2', function (done) {
      assignInfo_C[0].driver_id = driver2._id.toString();

      OrderWebAPI.assignOrder(tokenC, orderC._id.toString(), assignInfo_C, true, function (err, result) {
        driverOrder2 = result.assignedOrderList[0];
        driverOrder2.execute_driver.should.equal(driver2._id.toString());
        Order.findOne({_id: orderC._id.toString()}, function (err, orderCEntity) {
          new Date(orderCEntity.assign_time).getTime().should.be.above(10000);
          orderCEntity.execute_drivers.length.should.equal(1);
          orderCEntity.execute_drivers[0]._id.toString().should.equal(driver2._id.toString());

          Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
            orderAEntity.execute_drivers.length.should.equal(2);
            orderAEntity.execute_drivers[1]._id.toString().should.equal(driver2._id.toString());

            done();
          });
        });

      });
    });

  });

  describe('Test For continueAssign Function::', function () {
    var orderA, orderB, orderC, driverOrder1, driverOrder2;
    //创建orderA。
    it('should return orderA when userA create orderA', function (done) {
      order_A.order_number = '23456789';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });

    //分配给公司
    //两段中先分配第一段, orderA会增加分配时间字段
    it('should return orderB when userA assign orderA to orderB', function (done) {
      assignInfo_A[0].company_id = companyB._id.toString();
      assignInfo_A[1].company_id = '';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        orderB = result.assignedOrderList[0];

        orderB.order_details.order_number.should.equal(orderA.order_details.order_number);
        orderB.execute_company.should.equal(companyB._id.toString());

        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          should.exist(orderAEntity.assign_time);
          new Date(orderAEntity.assign_time).getTime().should.be.above(10000);
          orderAEntity.execute_companies.length.should.equal(1);
          orderAEntity.execute_companies[0]._id.toString().should.equal(companyB._id.toString());

          done();
        });
      });
    });

    //两段中先分配第二段, orderA会增加分配时间字段
    it('should return orderB when userA assign orderA to orderB', function (done) {
      assignInfo_A[0].company_id = companyB._id.toString();
      assignInfo_A[0].is_assigned = true;
      assignInfo_A[1].company_id = companyC._id.toString();
      OrderWebAPI.continueAssignOrder(tokenA, orderA._id.toString(), assignInfo_A, true, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        orderC = result.assignedOrderList[0];

        orderC.order_details.order_number.should.equal(orderA.order_details.order_number);
        orderC.execute_company.should.equal(companyC._id.toString());

        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          orderAEntity.execute_companies.length.should.equal(2);
          orderAEntity.execute_companies[1]._id.toString().should.equal(companyC._id.toString());

          done();
        });
      });
    });


    //创建orderA。
    it('should return orderA when userA create orderA', function (done) {
      order_A.order_number = '3456789';

      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });

    //分配给司机
    //两段中先分配第一段, orderA会增加分配时间字段
    it('should return driverOrder1 when userA assign orderA to order1', function (done) {
      assignInfo_A[0].company_id = '';
      assignInfo_A[0].type = 'driver';
      assignInfo_A[0].driver_id = driver1._id.toString();
      delete assignInfo_A[0].is_assigned;

      assignInfo_A[1].company_id = '';
      assignInfo_A[1].type = 'driver';
      assignInfo_A[1].driver_id = '';
      delete assignInfo_A[1].is_assigned;

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(1);

        result.assignedOrderList[0].order_details.order_number.should.equal(orderA.order_details.order_number);
        result.assignedOrderList[0].execute_driver.should.equal(driver1._id.toString());

        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          should.exist(orderAEntity.assign_time);
          new Date(orderAEntity.assign_time).getTime().should.be.above(10000);
          orderAEntity.execute_drivers.length.should.equal(1);
          orderAEntity.execute_drivers[0]._id.toString().should.equal(driver1._id.toString());

          done();
        });
      });
    });

    //两段中先分配第二段, orderA会增加分配时间字段
    it('should return driverOrder2 when userA assign orderA to driverOrder2', function (done) {
      assignInfo_A[0].company_id = '';
      assignInfo_A[0].type = 'driver';
      assignInfo_A[0].driver_id = driver1._id.toString();
      assignInfo_A[0].is_assigned = true;

      assignInfo_A[1].company_id = '';
      assignInfo_A[1].type = 'driver';
      assignInfo_A[1].driver_id = driver2._id.toString();
      delete assignInfo_A[1].is_assigned;

      OrderWebAPI.continueAssignOrder(tokenA, orderA._id.toString(), assignInfo_A, true, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        orderC = result.assignedOrderList[0];

        result.assignedOrderList[0].order_details.order_number.should.equal(orderA.order_details.order_number);
        result.assignedOrderList[0].execute_driver.should.equal(driver2._id.toString());

        Order.findOne({_id: orderA._id.toString()}, function (err, orderAEntity) {
          orderAEntity.execute_drivers.length.should.equal(2);
          orderAEntity.execute_drivers[1]._id.toString().should.equal(driver2._id.toString());

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
