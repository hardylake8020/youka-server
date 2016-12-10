/**
 * Created by Wayne on 15/8/19.
 */

/*
 * 测试模块：运单分配
 * 测试目标：分配给临时司机（系统中不存在的司机）
 * 所有入口：第一次分配，继续分配，(重新分配，批量分配，暂时没有)
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
  Trace = appDb.model('Trace'),
  CustomizeEvent = appDb.model('CustomizeEvent');

var mongoose = require('mongoose');

describe('Test For Order Controller::', function () {
  var user_A, company_A, driver_1, assignInfo_A, assignInfo_B, order_A;

  before(function (done) {
    user_A = {username: '541149886@qq.com', password: '111111'};

    company_A = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driver_1 = {username: '13052118915', password: '111111'};

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
    }, {
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
                                  CustomizeEvent.remove(function () {
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

  var userA, tokenA, companyA;

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
  });

  describe('Test For multiAssign Function::', function () {
    var orderA;

    //<editor-fold desc="assign driver">
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 不存在
    it('should be failed when assign driver with driver_username null', function (done) {
      delete assignInfo_A[0].driver_username;
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 为空
    it('should be failed when assign driver with driver_username empty', function (done) {
      assignInfo_A[0].driver_username = '';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 不合法的字符串
    it('should be failed when assign driver with driver_username invalid string', function (done) {
      assignInfo_A[0].driver_username = 'akflf342347*&(jflak';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 长度不够
    it('should be failed when assign driver with driver_username invalid length', function (done) {
      assignInfo_A[0].driver_username = '123456';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 正常
    it('should be success when assign driver with driver_username legal length', function (done) {
      assignInfo_A[0].driver_username = '13918429709';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true); // 出错

        CustomizeEvent.find(
          {
            'content.driver': new mongoose.Types.ObjectId(result.assignedOrderList[0].execute_driver),
            'content.order': new mongoose.Types.ObjectId(result.assignedOrderList[0]._id),
            delete_status: false
          }, function (err, findEvent) {
            findEvent.length.should.equal(1);
            findEvent[0].content.event_type.should.equal('assign_driver');

            Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
              orderAEntity.status.should.equal('unPickupSigned');
              done();
            });

          });
      });
    });

    //</editor-fold>

    //<editor-fold desc="assign warehouse">
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 不存在
    it('should be failed when assign driver with driver_username null', function (done) {
      delete assignInfo_A[0].driver_username;
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'warehouse';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 为空
    it('should be failed when assign driver with driver_username empty', function (done) {
      assignInfo_A[0].driver_username = '';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'warehouse';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 不合法的字符串
    it('should be failed when assign driver with driver_username invalid string', function (done) {
      assignInfo_A[0].driver_username = 'akflf342347*&(jflak';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'warehouse';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 长度不够
    it('should be failed when assign driver with driver_username invalid length', function (done) {
      assignInfo_A[0].driver_username = '123456';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'warehouse';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        if (result.assignedInfos[0].is_assigned) {
          result.assignedInfos[0].is_assigned.should.equal(false); // 出错
        }

        Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
          orderAEntity.status.should.equal('assigning');
          done();
        });
      });
    });

    //重新创建orderA
    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });
    //driver_username 正常
    it('should be success when assign driver with driver_username legal length', function (done) {
      assignInfo_A[0].driver_username = '13918429709';
      assignInfo_A[0].driver_id = '';
      assignInfo_A[0].type = 'warehouse';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_A, false, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true); // 出错

        CustomizeEvent.find(
          {
            'content.driver': new mongoose.Types.ObjectId(result.assignedOrderList[0].execute_driver),
            'content.order': new mongoose.Types.ObjectId(result.assignedOrderList[0]._id),
            delete_status: false
          }, function (err, findEvent) {
            findEvent.length.should.equal(1);
            findEvent[0].content.event_type.should.equal('assign_driver');

            Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
              orderAEntity.status.should.equal('unPickupSigned');
              done();
            });

          });
      });
    });

    //</editor-fold>
  });

  describe('Test For continueAssign Function::', function () {
    var orderA;

    it('should return orderA when userA create orderA one', function (done) {
      OrderWebAPI.createOrder(tokenA, order_A, companyA.default_group, true, function (err, orderEntity) {
        orderA = orderEntity;
        done();
      });
    });

    //driver_username 两段分配
    it('should be success when continue assign driver with driver_username legal', function (done) {
      assignInfo_B[0].driver_username = '13918429709';
      assignInfo_B[0].driver_id = '';
      assignInfo_B[0].type = 'driver';

      delete assignInfo_B[1].driver_username;
      assignInfo_B[1].driver_id = '';
      assignInfo_B[1].type = 'driver';

      OrderWebAPI.assignOrder(tokenA, orderA._id.toString(), assignInfo_B, false, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true);
        if (result.assignedInfos[1].is_assigned) {
          result.assignedInfos[1].is_assigned.should.equal(false);
        }

        CustomizeEvent.find(
          {
            'content.driver': new mongoose.Types.ObjectId(result.assignedOrderList[0].execute_driver),
            'content.order': new mongoose.Types.ObjectId(result.assignedOrderList[0]._id),
            delete_status: false
          }, function (err, findEvent) {
            findEvent.length.should.equal(1);
            findEvent[0].content.event_type.should.equal('assign_driver');

            Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
              orderAEntity.status.should.equal('assigning');

              //继续分配
              assignInfo_B[0].is_assigned = true;
              assignInfo_B[1].driver_username = '18201866643';
              OrderWebAPI.continueAssignOrder(tokenA, orderA._id.toString(), assignInfo_B, false, function (err, result) {
                result.assignedOrderList.length.should.equal(1);
                result.assignedInfos[0].is_assigned.should.equal(true);

                CustomizeEvent.find(
                  {
                    'content.driver': new mongoose.Types.ObjectId(result.assignedOrderList[0].execute_driver),
                    'content.order': new mongoose.Types.ObjectId(result.assignedOrderList[0]._id),
                    delete_status: false
                  }, function (err, findEvent) {
                    findEvent.length.should.equal(1);
                    findEvent[0].content.event_type.should.equal('assign_driver');

                    Order.findOne({_id: orderA._id}, function (err, orderAEntity) {
                      orderAEntity.status.should.equal('unPickupSigned');
                      done();
                    });
                  });

              });
            });

          });
      });
    });
  });

  describe('Test For reAssign Function::', function () {

  });

  describe('Test For batchAssign Function::', function () {

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
                                  CustomizeEvent.remove(function () {
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

});
