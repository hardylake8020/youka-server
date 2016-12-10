/**
 * Created by Wayne on 15/9/14.
 */

/*
 * 测试模块：api删除分段
 * 测试目标：第三方通过接口删除一段司机分配
 * 所有入口：api删除分段入口
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
  async = require('async'),
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

describe('Test For Api Order Controller::', function () {
  var user_A, company_A, group_name_A, signature_A, timestamp_A,
    driver_1, driver_2, order_A, order_B, order_C, order_D, assing_info_A, assing_info_B;
  var deepCopy;

  before(function (done) {
    deepCopy = function (source) {
      var result = {};
      for (var key in source) {
        result[key] = typeof source[key] === 'object' ? deepCopy(source[key]) : source[key];
      }
      return result;
    };

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
    order_B = deepCopy(order_A);
    order_B.order_number = 'tes order number2';
    order_C = deepCopy(order_A);
    order_C.order_number = 'tes order number3';
    order_D = deepCopy(order_A);
    order_D.order_number = 'tes order number4';

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
    assing_info_B = deepCopy(assing_info_A);
    assing_info_B.driver_username = driver_2.username;

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

  var userA, tokenA, companyA, driver1, tokenD1, driver2, companyKey1, driverOrder1, driverOrder2;

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
        done();
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
      OrderWebAPI.apiBatchCreateOrder(group_name_A, signature_A, [order_A, order_B, order_C, order_D], companyA._id, timestamp_A, function (err, result) {
        result.success.should.equal(true);
        result.totalCount.should.equal(4);
        done();
      });
    });

    it('should success when companyA use api get orderA detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_A.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_A.order_number);
        done();
      });
    });
    it('should success when companyA use api get orderB detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_B.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_B.order_number);
        done();
      });
    });
    it('should success when companyA use api get orderC detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_C.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_C.order_number);
        done();
      });
    });
    it('should success when companyA use api get orderC detail', function (done) {
      OrderWebAPI.apiGetOrderDetailData(group_name_A, signature_A, order_D.order_number, companyA._id, timestamp_A, function (err, order) {
        order.order_details.order_number.should.equal(order_D.order_number);
        done();
      });
    });

  });

  describe('Test for api delete order assign', function () {
    var assign_info_id;

    it('should be error when delete order assign at unAssigned status', function (done) {
      OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_A.order_number, '123456', function (err, result) {
        result.err.type.should.equal('assign_info_can_not_delete');
        done();
      });
    });

    it('should be success when assign orderA to driver1', function (done) {
      assing_info_A.driver_username = driver1.username;
      assing_info_A.type = 'driver';

      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_A.order_number, companyA._id, timestamp_A, [assing_info_A], function (err, result) {
        result.success.should.equal(true);
        Order.findOne({
          'order_details.order_number': order_A.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(1);
          order.execute_drivers[0].username.should.equal(driver1.username);
          assign_info_id = order.assigned_infos[0]._id.toString();
          should.exists(assign_info_id);

          Order.find({
            'order_details.order_number': order_A.order_number,
            execute_driver: {$exists: true}
          }, function (err, driverOrders) {
            driverOrders.length.should.equal(1);
            driverOrders[0].type.should.equal('driver');
            driverOrders[0].execute_driver.toString().should.equal(driver1._id.toString());
            done();
          });
        });
      });
    });

    it('should be error when delete order assign with invalid assign id', function (done) {
      OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_A.order_number, '123456', function (err, result) {
        result.err.type.should.equal('assign_info_not_exist');
        done();
      });
    });

    it('should be error when delete order assign with invalid assign type', function (done) {
      Order.findOne(
        {
          'order_details.order_number': order_A.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {

          var assignInfo = deepCopy(order.assigned_infos[0]);
          assignInfo.type = 'company';
          order.assigned_infos = [assignInfo];
          order.save(function (err, saveOrder) {
            OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_A.order_number, assign_info_id, function (err, result) {
              result.err.type.should.equal('assign_type_wrong');

              Order.findOne(
                {
                  'order_details.order_number': order_A.order_number,
                  execute_driver: {$exists: false}
                }, function (err, order) {
                  var assignInfo = deepCopy(order.assigned_infos[0]);
                  assignInfo.type = 'driver';
                  order.assigned_infos = [assignInfo];
                  order.save(function (err, saveOrder) {
                    done();
                  });
                });
            });
          });
        });
    });

    it('should be success when delete orderA assign with valid assign info', function (done) {
      Order.findOne({
        'order_details.order_number': order_A.order_number,
        execute_driver: {$exists: false}
      }, function (err, order) {
        var assign_id = order.assigned_infos[0]._id.toString();
        OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_A.order_number, assign_id, function (err, result) {
          result.success.should.equal(true);
          Order.findOne({
            'order_details.order_number': order_A.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.assigned_infos.length.should.equal(0);
            order.total_assign_count.should.equal(0);
            order.assigned_count.should.equal(0);
            order.execute_drivers.length.should.equal(0);
            order.status.should.equal('unAssigned');
            order.assign_status.should.equal('unAssigned');

            Order.findOne({
              'order_details.order_number': order_A.order_number,
              execute_driver: {$exists: true}
            }, function (err, order) {
              order.delete_status.should.equal(true);
              order.execute_drivers.length.should.equal(0);
              done();
            });
          });
        });
      });
    });

    //order_B
    it('should be success when assign orderB to driver1 and driver2', function (done) {
      assing_info_A.driver_username = driver1.username;
      assing_info_A.type = 'driver';
      assing_info_B.driver_username = driver2.username;
      assing_info_B.type = 'driver';

      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_B.order_number, companyA._id, timestamp_A, [assing_info_A, assing_info_B], function (err, result) {
        result.success.should.equal(true);
        Order.findOne({
          'order_details.order_number': order_B.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(2);
          if (order.execute_drivers[0].username === driver1.username) {
            order.execute_drivers[0].username.should.equal(driver1.username);
            order.execute_drivers[0]._id.toString().should.equal(driver1._id.toString());
            order.execute_drivers[1].username.should.equal(driver2.username);
            order.execute_drivers[1]._id.toString().should.equal(driver2._id.toString());
          }
          else {
            order.execute_drivers[0].username.should.equal(driver2.username);
            order.execute_drivers[0]._id.toString().should.equal(driver2._id.toString());
            order.execute_drivers[1].username.should.equal(driver1.username);
            order.execute_drivers[1]._id.toString().should.equal(driver1._id.toString());
          }

          should.exists(order.assigned_infos[0]._id.toString());
          should.exists(order.assigned_infos[1]._id.toString());

          Order.find({
            'order_details.order_number': order_B.order_number,
            execute_driver: {$exists: true}
          }, function (err, driverOrders) {
            driverOrders.length.should.equal(2);
            done();
          });
        });
      });
    });

    it ('should be success when driver1 pickup order', function (done) {
      Order.findOne({
        'order_details.order_number': order_B.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'pickup', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_B.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });

    it('should be error when delete orderB assign with pickup sub order', function (done) {
      Order.findOne({
        'order_details.order_number': order_B.order_number,
        execute_driver: {$exists: false}
      }, function (err, order) {
        var assign_id;
        if (order.assigned_infos[0].driver_username === driver1.username)
          assign_id = order.assigned_infos[0]._id.toString();
        else {
          assign_id = order.assigned_infos[1]._id.toString();
        }

        OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_B.order_number, assign_id, function (err, result) {
          result.err.type.should.equal('order_can_not_delete');
          done();
        });

      });
    });

    it('should be success when delete orderB assign with valid assign info', function (done) {
      Order.findOne({
        'order_details.order_number': order_B.order_number,
        execute_driver: {$exists: false}
      }, function (err, order) {
        var assign_id;
        if (order.assigned_infos[0].driver_username === driver2.username)
          assign_id = order.assigned_infos[0]._id.toString();
        else {
          assign_id = order.assigned_infos[1]._id.toString();
        }

        OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_B.order_number, assign_id, function (err, result) {
          result.success.should.equal(true);
          Order.findOne({
            'order_details.order_number': order_B.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.assigned_infos.length.should.equal(1);
            order.total_assign_count.should.equal(1);
            order.assigned_count.should.equal(1);
            order.execute_drivers.length.should.equal(1);
            order.status.should.equal('unDeliverySigned');
            order.assign_status.should.equal('completed');

            Order.findOne({
              'order_details.order_number': order_B.order_number,
              execute_driver: new mongoose.Types.ObjectId(driver2._id.toString())
            }, function (err, order) {
              order.delete_status.should.equal(true);
              order.execute_drivers.length.should.equal(0);
              done();
            });
          });

        });
      });
    });

    it ('should be success when driver1 delivery order', function (done) {
      Order.findOne({
        'order_details.order_number': order_B.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'delivery', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_B.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('completed');
            done();
          });
        });
      });
    });

    it('should be error when delete order assign at completed status', function (done) {
      OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_B.order_number, '123456', function (err, result) {
        result.err.type.should.equal('assign_info_can_not_delete');
        done();
      });
    });
  });

  describe('Test for api delete orderC assign with blank assign info before driver1 delivery', function () {
    it('should be success when assign orderC to driver1 and blank ', function (done) {
      assing_info_A.driver_username = driver1.username;
      assing_info_A.type = 'driver';
      delete assing_info_B.driver_username;
      delete assing_info_B.type;

      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_C.order_number, companyA._id, timestamp_A, [assing_info_A, assing_info_B], function (err, result) {
        result.success.should.equal(true);
        Order.findOne({
          'order_details.order_number': order_C.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(1);
          order.execute_drivers[0].username.should.equal(driver1.username);
          order.assigned_infos.length.should.equal(2);
          order.status.should.equal('assigning');
          order.assign_status.should.equal('assigning');

          if (order.assigned_infos[0].driver_username === driver1.username) {
            order.assigned_infos[1].driver_username.should.equal('');
            order.assigned_infos[1].driver_id.should.equal('');
            order.assigned_infos[1].order_id.should.equal('');
          }
          else {
            order.assigned_infos[0].driver_username.should.equal('');
            order.assigned_infos[0].driver_id.should.equal('');
            order.assigned_infos[0].order_id.should.equal('');
          }

          Order.find({
            'order_details.order_number': order_C.order_number,
            execute_driver: {$exists: true}
          }, function (err, driverOrders) {
            driverOrders.length.should.equal(1);
            driverOrders[0].type.should.equal('driver');
            driverOrders[0].execute_driver.toString().should.equal(driver1._id.toString());
            done();
          });
        });
      });
    });

    it ('should be success when driver1 pickup orderC', function (done) {
      Order.findOne({
        'order_details.order_number': order_C.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'pickup', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_C.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });

    it('should be success when delete orderC assign with blank assign', function (done) {
      Order.findOne({
        'order_details.order_number': order_C.order_number,
        execute_driver: {$exists: false}
      }, function (err, order) {
        var assign_id;
        if (order.assigned_infos[0].driver_username === driver1.username) {
          order.assigned_infos[0].driver_id.toString().should.equal(driver1._id.toString());
          order.assigned_infos[0].order_id.length.should.be.above(1);
          order.assigned_infos[0].is_assigned.should.equal(true);

          order.assigned_infos[1].order_id.length.should.equal(0);
          order.assigned_infos[1].is_assigned.should.equal(false);
          assign_id = order.assigned_infos[1]._id.toString();
        }
        else {
          order.assigned_infos[1].driver_id.toString().should.equal(driver1._id.toString());
          order.assigned_infos[1].order_id.length.should.be.above(1);
          order.assigned_infos[1].is_assigned.should.equal(true);

          order.assigned_infos[0].order_id.length.should.equal(0);
          order.assigned_infos[0].is_assigned.should.equal(false);
          assign_id = order.assigned_infos[0]._id.toString();
        }

        OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_C.order_number, assign_id, function (err, result) {
          result.success.should.equal(true);
          Order.findOne({
            'order_details.order_number': order_C.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('unDeliverySigned');
            order.assign_status.should.equal('completed');
            order.assigned_infos.length.should.equal(1);
            order.total_assign_count.should.equal(1);
            order.assigned_count.should.equal(1);
            order.execute_drivers.length.should.equal(1);

            done();
          });

        });

      });
    });

    it ('should be success when driver1 delivery order', function (done) {
      Order.findOne({
        'order_details.order_number': order_C.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'delivery', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_C.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('completed');
            order.assign_status.should.equal('completed');
            done();
          });
        });
      });
    });
  });

  describe('Test for api delete orderD assign with blank assign info after driver1 delivery', function () {
    it('should be success when assign orderD to driver1 and blank ', function (done) {
      assing_info_A.driver_username = driver1.username;
      assing_info_A.type = 'driver';
      delete assing_info_B.driver_username;
      delete assing_info_B.type;

      OrderWebAPI.apiAssignOrderToDriver(signature_A, order_D.order_number, companyA._id, timestamp_A, [assing_info_A, assing_info_B], function (err, result) {
        result.success.should.equal(true);
        Order.findOne({
          'order_details.order_number': order_D.order_number,
          execute_driver: {$exists: false}
        }, function (err, order) {
          order.execute_drivers.length.should.equal(1);
          order.execute_drivers[0].username.should.equal(driver1.username);
          order.assigned_infos.length.should.equal(2);
          order.status.should.equal('assigning');
          order.assign_status.should.equal('assigning');

          if (order.assigned_infos[0].driver_username === driver1.username) {
            order.assigned_infos[1].driver_username.should.equal('');
            order.assigned_infos[1].driver_id.should.equal('');
            order.assigned_infos[1].order_id.should.equal('');
          }
          else {
            order.assigned_infos[0].driver_username.should.equal('');
            order.assigned_infos[0].driver_id.should.equal('');
            order.assigned_infos[0].order_id.should.equal('');
          }

          Order.find({
            'order_details.order_number': order_D.order_number,
            execute_driver: {$exists: true}
          }, function (err, driverOrders) {
            driverOrders.length.should.equal(1);
            driverOrders[0].type.should.equal('driver');
            driverOrders[0].execute_driver.toString().should.equal(driver1._id.toString());
            done();
          });
        });
      });
    });

    it ('should be success when driver1 pickup orderD', function (done) {
      Order.findOne({
        'order_details.order_number': order_D.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'pickup', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_D.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });

    it ('should be success when driver1 delivery orderD', function (done) {
      Order.findOne({
        'order_details.order_number': order_D.order_number,
        execute_driver: new mongoose.Types.ObjectId(driver1._id.toString())
      }, function (err, driverOrder) {
        driverOrder.type.should.equal('driver');
        TransportEventWebAPI.uploadEvent(tokenD1, driverOrder._id.toString(), 'delivery', true, function (err, result) {

          //父订单状态
          Order.findOne({
            'order_details.order_number': order_D.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('unDeliveried');
            order.assign_status.should.equal('assigning');
            done();
          });
        });
      });
    });

    it('should be error when delete orderD assign with blank assign', function (done) {
      Order.findOne({
        'order_details.order_number': order_D.order_number,
        execute_driver: {$exists: false}
      }, function (err, order) {
        var assign_id;
        if (order.assigned_infos[0].driver_username === driver1.username) {
          order.assigned_infos[0].driver_id.toString().should.equal(driver1._id.toString());
          order.assigned_infos[0].order_id.length.should.be.above(1);
          order.assigned_infos[0].is_assigned.should.equal(true);

          order.assigned_infos[1].order_id.length.should.equal(0);
          order.assigned_infos[1].is_assigned.should.equal(false);
          assign_id = order.assigned_infos[1]._id.toString();
        }
        else {
          order.assigned_infos[1].driver_id.toString().should.equal(driver1._id.toString());
          order.assigned_infos[1].order_id.length.should.be.above(1);
          order.assigned_infos[1].is_assigned.should.equal(true);

          order.assigned_infos[0].order_id.length.should.equal(0);
          order.assigned_infos[0].is_assigned.should.equal(false);
          assign_id = order.assigned_infos[0]._id.toString();
        }

        OrderWebAPI.apiDeleteOrderAssign(signature_A, companyA._id, timestamp_A, order_D.order_number, assign_id, function (err, result) {
          result.success.should.equal(true);
          Order.findOne({
            'order_details.order_number': order_D.order_number,
            execute_driver: {$exists: false}
          }, function (err, order) {
            order.status.should.equal('completed');
            order.assign_status.should.equal('completed');
            order.assigned_infos.length.should.equal(1);
            order.total_assign_count.should.equal(1);
            order.assigned_count.should.equal(1);
            order.execute_drivers.length.should.equal(1);
            done();
          });

        });

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
