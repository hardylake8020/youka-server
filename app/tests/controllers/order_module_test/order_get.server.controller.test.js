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

//根据订单ID获取订单详情
function getOrderDetailById(access_token, orderId, callback) {
  agent.get(config.serverAddress + 'order/detail')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//获取用户未分配订单
function getUserUnassignedOrders(access_token, callback) {
  agent.post(config.serverAddress + 'order/unassigned')
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

describe('Order Get Module Unit Tests', function () {
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

    UserGroup.remove().exec(function () {
      User.remove().exec(function () {
        Group.remove().exec(function () {
          Company.remove().exec(function () {
            Order.remove().exec(done);
          });
        });
      });
    });
  });

  describe('user sign in to get order::', function () {

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

    // should be success when create order with more details
    it('should be success when create order with more details', function (done) {
      var orderItem = {
        order_number: '987654321',
        goods_name: 'books',
        details: [{name:'book1'}, {name:'book2'}]
      };

      createOrder(orderItem, default_group._id, access_token, function (result) {
        should.not.exist(result.err);

        done();
      });
    });

    /// get order by order id

    // should be error when get order by order id where order id is illegal
    it('should be error when get order by order id where order id is illegal', function (done) {
      getOrderById(access_token, '123', function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.internal_system_error.type);
        done();
      });
    });
    // should be error when get order by order id where order id is not exist
    it('should be error when get order by order id where order id is not exist', function (done) {
      getOrderById(access_token, new_user._id.toString(), function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.order_not_exist.type);
        done();
      });
    });

    // should be error when get order by order id where order id is not in any group
    it('should be error when get order by order id where user is not in any group', function (done) {
      var userGroupId;
      Order.findOne({}, function (err, orderEntity) {
        UserGroup.findOne({user: new_user._id}, function (err, userGroupEntity) {
          userGroupId = userGroupEntity._id;
          userGroupEntity.user = userGroupEntity.group;
          userGroupEntity.save(function (err) {
            getOrderById(access_token, orderEntity._id.toString(), function (err, result) {
              should.exist(result.err);
              result.err.type.should.equal(orderError.order_not_visible.type);

              userGroupEntity.user = new_user._id;
              userGroupEntity.save(function (err) {
                done();
              });
            });
          });
        });
      });
    });

    /// get user orders

    // should be error when get user orders where user is not email_verified
    it('should be error when get user orders where user is not email_verified', function (done) {
      User.findOne({_id: new_user._id}, function (err, userEntity) {
        userEntity.email_verified = false;
        userEntity.save(function (err) {
          getUserOrders(access_token, function (err, result) {
            should.exist(result.err);
            result.err.type.should.equal(userError.account_not_activate.type);

            userActivate(new_user._id, function (result) {
              done();
            });
          });
        });
      });
    });

    // should be error when get user orders where user is not in any group
    it('should be error when get user orders where user is not in any group', function (done) {
      var userGroupId;
      UserGroup.findOne({user: new_user._id}, function (err, userGroupEntity) {
        userGroupId = userGroupEntity._id;
        userGroupEntity.user = userGroupEntity.group;
        userGroupEntity.save(function (err) {
          getUserOrders(access_token, function (err, result) {
            should.exist(result.err);
            result.err.type.should.equal('not_in_any_group');

            userGroupEntity.user = new_user._id;
            userGroupEntity.save(function (err) {
              done();
            });
          });
        });
      });
    });

    /// get user unassigned orders

    // should be success when get user unassigned orders
    it('should be success when get user unassigned orders', function (done) {
      getUserUnassignedOrders(access_token, function (err, result) {
        result.orders.length.should.equal(1);
        done();
      });
    });

    /// get user order assigned detail by orderID

    //should be error when get user order assigned detail by orderID where orderID is empty
    it('should be error when get user order assigned detail by orderID where orderID is empty', function (done) {
      getOrderAssignedDetailById(access_token, '', function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.internal_system_error.type);

        done();
      });
    });

    //should be error when get user order assigned detail by orderID where orderID is not exist.
    it('should be error when get user order assigned detail by orderID where orderID is not exist', function (done) {
      getOrderAssignedDetailById(access_token, new_user._id.toString(), function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.order_not_exist.type);

        done();
      });
    });

    // should be error when get user order assigned detail by orderID where user is not email_verified
    it('should be error when get user order assigned detail by orderID where user is not email_verified', function (done) {
      User.findOne({_id: new_user._id}, function (err, userEntity) {
        userEntity.email_verified = false;
        userEntity.save(function (err) {
          Order.findOne({}, function (err, orderEntity) {
            getOrderAssignedDetailById(access_token, orderEntity._id.toString(), function (err, result) {
              should.exist(result.err);
              result.err.type.should.equal(userError.account_not_activate.type);

              userActivate(new_user._id, function (result) {
                done();
              });
            });
          });
        });
      });
    });


    /// get children orders

    // create a new order
    var order_item;
    it('should be success when create a order', function (done) {
      var orderObject = {
        order_number: '123456789*0',
        goods_name: 'macs'
      };

      createOrder(orderObject, default_group._id, access_token, function (result) {
        should.not.exist(result.err);
        result.detail.order_number.should.equal(orderObject.order_number);

        order_item = result;

        done();
      });
    });

    // assign the new order to sub-company
    var sub_order;
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

      assignOrder(access_token, order_item._id, assignInfo, function (err, result) {
        result.assignedOrderList.length.should.equal(1);
        result.assignedInfos[0].is_assigned.should.equal(true);

        sub_order = result.assignedOrderList[0];

        done();
      });
    });

    // should be success when get children orders by parent order id
    it('should be success when get children orders by parent order id', function (done) {
      getChildrenOrdersById(access_token, order_item._id, function (err, result) {
        should.not.exist(result.err);
        result.children[0]._id.should.equal(sub_order._id);

        done();
      });
    });
    it('should be success when get user order assigned detail by orderID', function (done) {
      getOrderAssignedDetailById(access_token, order_item._id.toString(), function (err, result) {
        should.not.exist(result.err);
        done();
      });
    });


    /// get user order detail info by order id

    it('should be error when get order detail by id where order id is empty', function (done) {
      getOrderDetailById(access_token, '', function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.internal_system_error.type);

        done();
      });
    });

    it('should be error when get order detail by id where order id is not exist', function (done) {
      getOrderDetailById(access_token, new_user._id, function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(orderError.order_not_exist.type);

        done();
      });
    });
    it('should be error when get order detail by id where user is not email_verified', function (done) {
      User.findOne({_id: new_user._id}, function (err, userEntity) {
        userEntity.email_verified = false;
        userEntity.save(function (err) {
          getOrderDetailById(access_token, order_item._id, function (err, result) {
            should.exist(result.err);
            result.err.type.should.equal(userError.account_not_activate.type);

            userActivate(new_user._id, function (result) {
              done();
            });
          });
        });
      });
    });

  });

  after(function (done) {
    UserGroup.remove().exec(function () {
      User.remove().exec(function () {
        Group.remove().exec(function () {
          Company.remove().exec(function () {
            Order.remove().exec(done);
          });
        });
      });
    });
  });

});
