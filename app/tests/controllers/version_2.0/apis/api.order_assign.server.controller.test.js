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
  OrderWebAPI = require('../../../common_function/core_business_logic/order'),
  TransportEventWebAPI = require('../../../common_function/core_business_logic/transport_event'),
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
  var user_A, company_A, group_name_A, signature_A, timestamp_A, driver_1, driver_2, order_A, order_B, assing_info_A, assing_info_B;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    group_name_A = '全体成员';

    driver_1 = {username: '13472423583', password: '111111'};
    driver_2 = {username: '13918429709', password: '111111'};

    order_A =
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      pickup_entrance_force: true,
      pickup_photo_force: true,
      delivery_entrance_force: true,
      delivery_photo_force: true,
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': '',
      'sender_name': 'asdfasd',
      'receiver_name': 'sda'
    };

    order_B = {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      pickup_entrance_force: true,
      pickup_photo_force: true,
      delivery_entrance_force: true,
      delivery_photo_force: true,
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': '',
      'sender_name': 'asdfasd',
      'receiver_name': 'sda'
    };

    assing_info_A = {
      type: 'driver',
      driver_id: '',
      driver_username: driver_1.username,
      pickup_contact_name: 'elina',
      pickup_contact_phone: '01032147895',
      pickup_contact_mobile_phone: '18321740710',
      pickup_contact_email: '',
      pickup_contact_address: 'pickup contact address1',
      delivery_contact_name: 'lalala',
      delivery_contact_phone: '',
      delivery_contact_mobile_phone: '13472423583',
      delivery_contact_address: '',
      delivery_contact_email: ''
    };
    assing_info_B = {
      type: 'driver',
      driver_id: '',
      driver_username: driver_2.username,
      pickup_contact_name: 'elina',
      pickup_contact_phone: '01032147895',
      pickup_contact_mobile_phone: '13472423583',
      pickup_contact_email: '',
      pickup_contact_address: 'pickup contact address2',
      delivery_contact_name: 'hardy',
      delivery_contact_phone: '',
      delivery_contact_mobile_phone: '18321740710',
      delivery_contact_address: '',
      delivery_contact_email: ''
    };


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

  var userA, tokenA, companyA, driver1, driver2, companyKey1, driverOrder1, driverOrder2;
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
    it('should return driver1 when signUp driver2', function (done) {
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

    it('should be success when companyA generate api keys', function (done) {
      CompanyKeyWebAPI.generateCompanyKeys(company_A.name, function (err, companyKeys) {
        companyKeys.company.should.equal(companyA._id.toString());
        companyKey1 = companyKeys;
        timestamp_A = timeLib.DateToyyyyMMddHHmmss(new Date());
        signature_A = cryptoLib.toMd5(companyKeys.secret_key + '&' + companyKeys.public_key + '&' + timestamp_A);
        done();
      });
    });

    it('should be success when companyA use api import orderA and orderB', function (done) {
      OrderWebAPI.apiBatchCreateOrder(group_name_A, signature_A, [order_A, order_B], companyA._id, timestamp_A, function (err, result) {
        result.success.should.equal(true);
        result.totalCount.should.equal(2);
        done();
      });
    });

    it('should success when companyA use api get order detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_B.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_B.order_number);
        done();
      });
    });
    it('should success when companyA use api get order detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_A.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_A.order_number);
        done();
      });
    });
  });

  describe('Test for api assign order detail::', function () {
    it('should success when companyA api assign order to driverA and driverB', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, [assing_info_A, assing_info_B], function (err, result) {
        result.success.should.equal(true);
        Order.findOne({
          'order_details.order_number': order_A.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(2);
          done();
        });
      });
    });

    it('should failed when companyA api assign orderA to driverA and driverB again', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, [assing_info_A, assing_info_B], function (err, result) {
        result.err.type.should.equal('order_has_assigned');
        Order.findOne({
          'order_details.order_number': order_A.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(2);
          done();
        });
      });
    });

    it('should failed when companyA api assign orderB to driverA with empty orderNumber', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, '', companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.err.type.should.equal('empty_order_number');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with invalid orderNumber', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, 'invalid_order_number', companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.err.type.should.equal('invalid_order_number');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with empty assign_infos', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, [], function (err, result) {
        result.err.type.should.equal('invalid_assign_infos');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with invalid assign_infos', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, 'safdfa', function (err, result) {
        result.err.type.should.equal('invalid_assign_infos');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with invalid assign_infos', function (done) {
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, '{"safsdf":"sadf"}', function (err, result) {
        result.err.type.should.equal('invalid_assign_infos');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with error assign info A', function (done) {
      assing_info_A.type = 'company';
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_B.order_number, companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.success.should.equal(false);
        result.err_infos[0].err.type.should.equal('type_error');
        done();
      });
    });

    it('should failed when companyA api assign orderB to driverA with error assign driver username', function (done) {
      assing_info_A.type = 'driver';
      assing_info_A.driver_username = 'driver_not_existed';
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_B.order_number, companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.success.should.equal(false);
        result.err_infos[0].err.type.should.equal('driver_not_existed');
        done();
      });
    });

    it('should success when companyA api assign orderB to driverA', function (done) {
      assing_info_A.type = 'driver';
      assing_info_A.driver_username = driver1.username;
      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_B.order_number, companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.success.should.equal(true);
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
