/**
* Created by Wayne on 15/5/10.
*/

'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config'),
  orderError = require('../../../errors/order'),
  userError = require('../../../errors/user'),
  groupError = require('../../../errors/group'),

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
  DriverCompany = appDb.model('DriverCompany');

var OrderWebAPI = require('../../common_function/core_business_logic/company');

//开放注册
function userSignup(username, password, callback) {
  agent.post(config.serverAddress + 'user/signup')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      res.body.username.should.equal(username);
      should.not.exist(res.body.company);
      callback(res.body);
    });
}

//用户激活
function userActivate(user_id, callback) {
  agent.get(config.serverAddress + 'user/activate/' + user_id)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .end(function (err, res) {
      User.findOne({_id: user_id}, function (err, user) {
        user.email_verified.should.equal(true);
        callback(res.body);
      });
    });
}

//用户登录，返回用户和access_token
function userSignin(username, password, callback) {
  agent.post(config.serverAddress + 'user/signin')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      res.body.user.email_verified.should.equal(true);
      callback(res.body);
    });
}

//创建公司返回公司
function createComany(name, address, photo, emplyees, access_token, callback) {
  agent.post(config.serverAddress + 'company')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      name: name,
      address: address,
      photo: photo,
      employes: emplyees,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(res.body);
    });
}

//创建单个订单
function createOrder(orderInfo, groupId, access_token, callback) {
  agent.post(config.serverAddress + 'order')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      order: orderInfo,
      group_id: groupId,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(res.body);
    });
}

//获取用户订单
function getUserOrders(access_token, callback) {
  agent.get(config.serverAddress + 'order')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

//根据订单Id获取订单
function getOrderById(access_token, orderId, callback) {
  agent.get(config.serverAddress + 'order/getorderbyid')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

//获取用户未分配订单
function getUserUnassignedOrders(access_token, callback) {
  agent.get(config.serverAddress + 'order/unassigned')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

//根据订单ID获取订单分配的详细信息
function getOrderAssignedDetailById(access_token, orderId, callback) {
  agent.get(config.serverAddress + 'order/assignedOrderDetail')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

//根据订单ID获取订单分配的详细信息
function getChildrenOrdersById(access_token, orderId, callback) {
  agent.get(config.serverAddress + 'order/childrenOrders')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId
    })
    .end(function (err, res) {
      if (err)
        callback(err, null);
      else
        callback(null, res.body);
    });
}

//分配订单
function assignOrder(access_token, orderId, assignInfos, callback) {
  agent.post(config.serverAddress + 'order/multiassign')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      assign_infos: assignInfos
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//继续分配订单
function continueAssign(access_token, orderId, assignInfos, callback) {
  agent.post(config.serverAddress + 'order/continueassign')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      assign_infos: assignInfos
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

describe('Order Assign Module Unit Tests', function () {
  var userTestInfo, groupTestInfo, companyTestInfo, orderTestInfo;

  before(function (done) {
    userTestInfo = {
      username: '54114988600@qq.com',
      password: '111111'
    };

    groupTestInfo = {
      name: 'test',
      display_name: 'test'
    };

    companyTestInfo = {
      name: 'testCompany',
      address: 'test address',
      photo: 'test photo',
      employees: 'test employees'
    };

    orderTestInfo = {
      order_number: '123456789',
      goods_name: 'books'
    };

    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            Contact.remove(function () {
              OrderDetail.remove(function () {
                Order.remove(function () {
                  CustomerContact.remove(function () {
                    Driver.remove(done);
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  describe('user sign in to assign order::', function () {

    // user sign up
    var new_user, sub_user;
    it('user should create success', function (done) {
      userSignup(userTestInfo.username, userTestInfo.password, function (userEntity){
        userEntity.username.should.equal(userTestInfo.username);
        new_user = userEntity;
        done();
      });
    });
    it('sub-user should create success', function (done) {
      userSignup('1391842970944@163.com', '111111', function (userEntity){
        userEntity.username.should.equal('1391842970944@163.com');
        sub_user = userEntity;
        done();
      });
    });

    // user activate
    it('user should activate success', function (done) {
      userActivate(new_user._id, function (result) {
        done();
      });
    });
    it('sub-user should activate success', function (done) {
      userActivate(sub_user._id, function (result) {
        done();
      });
    });

    // user sign in
    var access_token, sub_access_token;
    it('user should login success', function (done) {
      userSignin(userTestInfo.username, userTestInfo.password, function (result) {
        result.user.username.should.equal(userTestInfo.username);
        access_token = result.access_token;

        done();
      });
    });
    it('sub-user should login success', function (done) {
      userSignin(sub_user.username, '111111', function (result) {
        result.user.username.should.equal(sub_user.username);
        sub_access_token = result.access_token;

        done();
      });
    });

    // create company
    var new_company, default_group, sub_company, sud_default_group;
    it('company should create success', function (done) {
      createComany(companyTestInfo.name, companyTestInfo.address, companyTestInfo.photo,
        companyTestInfo.employees, access_token, function (companyEntity) {
          companyEntity.name.should.equal(companyTestInfo.name);
          should.exist(companyEntity.groups[0]._id);

          new_company = companyEntity;
          default_group = companyEntity.groups[0];

          done();
        });
    });
    it('sub-company should create success', function (done) {
      createComany('subCompany', 'sub-address', 'sub-photo',
        'sub-employees', sub_access_token, function (companyEntity) {
          companyEntity.name.should.equal('subCompany');
          should.exist(companyEntity.groups[0]._id);

          sub_company = companyEntity;
          sud_default_group = companyEntity.groups[0];

          done();
        });
    });

    var password = '123456';
    var driverName = '18321740710';
    var driver, driver_access_token;
    //这个司机进行注册登录并返回司机access_token
    it('should return a driver access_token', function (done) {
      //获取验证码
      agent.post(config.serverAddress + 'driver/getsmsverifycode')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: driverName
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          var smsVerify = res.body;
          //注册
          agent.post(config.serverAddress + 'driver/signup')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
              username: driverName,
              password: password,
              sms_verify_id: smsVerify._id,
              sms_verify_code: smsVerify.code
            })
            .end(function (err, res) {
              if (err)
                console.log(err);

              //登录
              agent.post(config.serverAddress + 'driver/signin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  username: driverName,
                  password: password
                })
                .end(function (err, res) {

                  res.body.driver.username.should.equal(driverName);
                  res.body.access_token.should.not.equal(undefined);

                  Driver.findOne({username: res.body.driver.username}, function (err, driverEntity) {

                    driver = driverEntity;

                    driver_access_token = res.body.access_token;
                    done();
                  });
                });
            });
        });
    });

    // multi assign

    it('should be error when assign a order where order id is empty', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: sub_company._id,
        is_assigned: false,
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
      assignOrder(access_token, '', assignInfo, function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.internal_system_error.type);

        done();
      });
    });
    it('should be error when assign a order where order id is not exist', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: sub_company._id,
        is_assigned: false,
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
      assignOrder(access_token, new_user._id.toString(), assignInfo, function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.order_not_exist.type);

        done();
      });
    });

    var order_assign;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0788',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);
        result.status.should.equal('unAssigned');

        order_assign = result;

        done();
      });
    });
    it('should be error when assign a order where assign info is empty', function (done) {
      assignOrder(access_token,order_assign._id,null, function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.assign_infos_null.type);
        done();
      });
    });

    it('should be success when assign a order to company', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: sub_company._id,
        is_assigned: false,
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
      assignOrder(access_token,order_assign._id,assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true);

        done();
      });
    });
    it('should be error when assign a order twice', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: sub_company._id,
        is_assigned: false,
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
      assignOrder(access_token, order_assign._id, assignInfo, function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.order_has_assigned.type);

        done();
      });
    });

    /// order assign to company
    var order_zero;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_zero = result;

        done();
      });
    });
    it('should be error when assign a order to company where company id is empty', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: '',
        is_assigned: false,
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

      assignOrder(access_token, order_zero._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(0);

        done();
      });
    });

    var order_one;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '1234**56789*0',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_one = result;

        done();
      });
    });
    it('should be error when assign a order to company where company id is not exist', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: new_user._id.toString(),
        is_assigned: false,
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

      assignOrder(access_token, order_one._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(0);

        done();
      });
    });

    var order_two, order_two_sub;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '1234**56789*0',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_two = result;

        done();
      });
    });
    it('should be success when assign a order to company', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: sub_company._id,
        is_assigned: false,
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

      assignOrder(access_token, order_two._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true);

        order_two_sub = result.assignedOrderList[0];

        done();
      });
    });
    it('should be success when get children orders by parent order id', function (done) {
      getChildrenOrdersById(access_token, order_two._id.toString(), function (err, result) {
        should.not.exist(result.err);
        result.children[0]._id.should.equal(order_two_sub._id);

        done();
      });
    });

    /// order assign to driver
    var order_driver_one;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0123',
        goods_name: 'macos'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_driver_one = result;

        done();
      });
    });
    it('should be error when assign a order to driver where driver id is empty', function (done) {
      var assignInfo = [{
        type: 'driver',
        driver_id: '',
        is_assigned: false,
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

      assignOrder(access_token, order_driver_one._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        done();
      });
    });

    //公司2邀请合作司机driver2
    it('should be success when company invite driver', function (done) {
      OrderWebAPI.inviteDriver(access_token, driver.username, function (err, result) {
        done();
      });
    });

    var order_driver_two;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0123',
        goods_name: 'macos'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_driver_two = result;

        done();
      });
    });
    it('should be error when assign a order to driver where driver id is not exist', function (done) {
      var assignInfo = [{
        type: 'driver',
        driver_id: new_user._id.toString(),
        is_assigned: false,
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

      assignOrder(access_token, order_driver_two._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(0);
        done();
      });
    });

    var order_driver_three;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0123',
        goods_name: 'macos'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_driver_three = result;

        done();
      });
    });
    it('should be success when assign a order to driver', function (done) {
      var assignInfo = [{
        type: 'driver',
        driver_id: driver._id.toString(),
        is_assigned: false,
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

      assignOrder(access_token, order_driver_three._id.toString(), assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true);
        done();
      });
    });

    /// continue assign
    var order_continue;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '1234588789*0788',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);
        result.status.should.equal('unAssigned');

        order_continue = result;

        done();
      });
    });
    it('should be error when continue assign order where assign info is null', function (done) {
      continueAssign(access_token, order_continue._id.toString(), null, function (err, result) {
        result.err.type.should.equal(orderError.assign_infos_null.type);
        done();
      });
    });
    it('should be error when continue assign order where order id is empty', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: new_user._id.toString(),
        is_assigned: false,
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
      continueAssign(access_token, '', assignInfo, function (err, result) {
        result.err.type.should.equal(orderError.internal_system_error.type);
        done();
      });
    });
    it('should be error when continue assign order where order id is not exist', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: new_user._id.toString(),
        is_assigned: false,
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
      continueAssign(access_token, new_user._id.toString(), assignInfo, function (err, result) {
        result.err.type.should.equal(orderError.order_not_exist.type);
        done();
      });
    });
    it('should be error when continue assign order where order is not assign', function (done) {
      var assignInfo = [{
        type: 'company',
        company_id: new_user._id.toString(),
        is_assigned: false,
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
      continueAssign(access_token, order_continue._id.toString(), assignInfo, function (err, result) {
        result.err.type.should.equal(orderError.order_not_assigning.type);
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
                    Driver.remove(done);
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
