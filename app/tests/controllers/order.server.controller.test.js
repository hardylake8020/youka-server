/**
 * Created by elinaguo on 15/3/25.
 */
'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),

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

var OrderWebAPI = require('../common_function/core_business_logic/company');

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

//用户邀请司机
function userInviteDriver(username, access_token, callback) {
  agent.post(config.serverAddress + 'driver/invite')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      access_token: access_token
    })
    .end(function (err, res) {
      should.not.exist(err);
      should.exist(res.body);
      res.body.status.should.equal('inviting');
      res.body.username.should.equal(username);
      callback(res.body);
    });
}
//创建订单
function createOrder(groupId, order_number, pickup_contact_name, delivery_contact_name, access_token, callback) {
  var order_customer_name = 'test zhuzhu company';
  agent.post(config.serverAddress + 'order')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      order: {
        order_number: order_number,
        customer_name: order_customer_name,
        pickup_contact_name: pickup_contact_name,
        pickup_contact_phone: '18321740710',
        pickup_contact_address: '上海',
        delivery_contact_name: delivery_contact_name,
        delivery_contact_phone: '12345678910',
        delivery_contact_address: '成都',
        details: '',
        pickup_start_time: new Date(),
        delivery_start_time: new Date(),
        pickup_end_time: new Date(),
        delivery_end_time: new Date(),
        description: 'test description'
      },
      access_token: access_token,
      group_id: groupId
    })
    .end(function (err, res) {

      callback(res.body);

    });
}

function updateOrder(groupId, order_number, pickup_contact_name, delivery_contact_name, access_token, order_id, callback) {
  var order_customer_name = 'test zhuzhu company';
  agent.post(config.serverAddress + 'order/update')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      order: {
        order_number: order_number,
        customer_name: order_customer_name,
        pickup_contact_name: pickup_contact_name,
        pickup_contact_phone: '18321740710',
        pickup_contact_address: '上海',
        delivery_contact_name: delivery_contact_name,
        delivery_contact_phone: '12345678910',
        delivery_contact_address: '成都',
        details: '',
        pickup_start_time: new Date(),
        delivery_start_time: new Date(),
        pickup_end_time: new Date(),
        delivery_end_time: new Date(),
        description: 'test description',
        order_id: order_id
      },
      access_token: access_token,
      group_id: groupId
    })
    .end(function (err, res) {

      callback(res.body);

    });
}

//用户公开注册，激活，登录，创建订单,查看订单
describe('Route Order Unit Test:', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            Contact.remove(function () {
              OrderDetail.remove(function () {
                Order.remove(function () {
                  CustomerContact.remove(function () {
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


  var username = '18321740710@163.com',
    password = '123456';

  describe('Path post /order, get /order', function () {

    //用户开放注册
    var user_one;
    it('should return a new user with valid username and password', function (done) {
      userSignup(username, password, function (user) {
        user_one = user;
        done();
      });
    });

    //用户激活
    it('should return a successful result about activate the user', function (done) {
      userActivate(user_one._id, function (result) {
        done();
      });
    });

    //用户登录done
    var user_access_token;
    it('should return the access_token of the user', function (done) {
      userSignin(username, password, function (result) {
        user_access_token = result.access_token;
        done();
      });
    });

    //用户创建公司
    var user_company;
    it('should return the company of the user', function (done) {
      var name = 'test company',
        address = 'test address',
        photo = 'test photo',
        employees = 'test employees';
      //创建公司
      createComany(name, address, photo, employees, user_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_company = company;
        done();
      });
    });

    //没有运单号时 创建订单失败
    it('should return an error with order_number_null_error', function (done) {
      var default_group_id = user_company.groups[0]._id.toString();
      agent.post(config.serverAddress + 'order')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          order: {
            order_number: '',
            customer_name: 'test zhuzhu company',
            pickup_contact_name: 'elina',
            pickup_contact_phone: '18321740710',
            pickup_contact_address: '上海',
            delivery_contact_name: 'hardy',
            delivery_contact_phone: '12345678910',
            delivery_contact_address: '成都',
            details: ''
          },
          access_token: user_access_token,
          group_id: default_group_id
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('order_number_null_error');
          done();
        });
    });


    //没有指定group_id时 创建订单失败
    it('should return an error without group_id', function (done) {
      var order_number = 'test order number EMS201503250243';

      createOrder(null, order_number, 'elina', 'hardy', user_access_token, function (order) {
        order.err.type.should.equal('params_null');
        done();
      });
    });

    //正确创建订单1
    it('should return an order', function (done) {
      var default_group_id = user_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250243';

      createOrder(default_group_id, order_number, 'elina', 'hardy', user_access_token, function (order) {

        order.create_company.should.equal(user_company._id);
        order.create_group.should.equal(default_group_id);

        done();
      });
    });

    //正确创建订单2
    it('should return an order', function (done) {
      var default_group_id = user_company.groups[0]._id.toString();
      var order_number = 'test order number 2 EMS201503250243';

      createOrder(default_group_id, order_number, 'elina2', 'hardy2', user_access_token, function (order) {

        order.create_company.should.equal(user_company._id);
        order.create_group.should.equal(default_group_id);
        order.pickup_contact.name.should.equal('elina2');
        order.delivery_contact.name.should.equal('hardy2');
        done();
      });
    });


    //正确创建订单2并更新
    it('should return an order', function (done) {
      var default_group_id = user_company.groups[0]._id.toString();
      var order_number = 'test order number 2 EMS201503250243';
      createOrder(default_group_id, order_number, 'elina2', 'hardy2', user_access_token, function (order) {
        order.create_company.should.equal(user_company._id);
        order.create_group.should.equal(default_group_id);
        order.detail.order_number.should.equal(order_number);
        updateOrder(default_group_id, 'udpated_order_number', 'elina3', 'hardy3', user_access_token, order._id, function (newOrder) {
          newOrder.create_company.should.equal(user_company._id);
          newOrder.create_group.should.equal(default_group_id);
          newOrder.pickup_contact.name.should.equal('elina3');
          newOrder.delivery_contact.name.should.equal('hardy3');
          newOrder.detail.order_number.should.equal('udpated_order_number');
          Order.findOne({_id: order._id}).populate('pickup_contact delivery_contact order_detail').exec(function (err, queryOrder) {
            queryOrder.pickup_contact.name.should.equal('elina3');
            queryOrder.delivery_contact.name.should.equal('hardy3');
            queryOrder.order_detail.order_number.should.equal('udpated_order_number');
            done();
          });
        });
      });
    });

    //公开注册，激活，登录，创建2个订单, 查看当前用户组订单
    it('should return an order list with 3 records', function (done) {
      agent.get(config.serverAddress + 'order')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username,
          access_token: user_access_token
        })
        .end(function (err, res) {
          res.body.orders.length.should.equal(3);
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


//用户公开注册，激活，登录，创建订单，邀请司机，司机注册，用户分配订单给司机
describe('Route Order Assign and MutiAssign Unit Test', function () {
  before(function (done) {
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

  describe('Path post /order/multiassign', function () {
    var username_one = 'alisan1@live.cn';
    var password = '123456';
    var driverName = '18321740710';

    //用户注册激活
    var user_one;
    it('should return the second user and activate', function (done) {
      userSignup(username_one, password, function (userEntity) {
        user_one = userEntity;

        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户登录
    var user_one_access_token;
    it('should return the access_token of the second user', function (done) {
      userSignin(username_one, password, function (result) {
        user_one_access_token = result.access_token;
        done();
      });
    });

    //用户创建公司
    var user_one_company;
    it('should return the company of the second user', function (done) {
      var name = 'test company 1',
        address = 'test address 1',
        photo = 'test photo 1',
        employees = 'test employees 1';
      //创建公司
      createComany(name, address, photo, employees, user_one_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_one_company = company;
        done();
      });
    });

    //用户邀请司机
    it('should return a record for the second user to invite the driver', function (done) {
      userInviteDriver(driverName, user_one_access_token, function (result) {
        done();
      });
    });


    //用户注册激活
    var username_two = '10983066@qq.com';
    var user_two;
    it('should return the second user and activate', function (done) {
      userSignup(username_two, password, function (userEntity) {
        user_two = userEntity;

        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户登录
    var user_two_access_token;
    it('should return the access_token of the second user', function (done) {
      userSignin(username_two, password, function (result) {
        user_two_access_token = result.access_token;
        done();
      });
    });

    //用户创建公司
    var user_two_company;
    it('should return the company of the second user', function (done) {
      var name = 'test company 2',
        address = 'test address 2',
        photo = 'test photo 2',
        employees = 'test employees 2';

      //创建公司
      createComany(name, address, photo, employees, user_two_access_token, function (company) {

        company.name.should.equal(name);
        company.address.should.equal(address);

        user_two_company = company;
        done();
      });
    });

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

    var user_order_one;
    //用户1正确创建订单
    it('should return the first order', function (done) {
      var default_group_id = user_one_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250243';

      createOrder(default_group_id, order_number, 'elina', 'hardy', user_one_access_token, function (order) {

        order.create_company.should.equal(user_one_company._id);
        order.create_group.should.equal(default_group_id);

        user_order_one = order;
        done();
      });
    });

    //用户1查看订单1
    it('should return a order', function (done) {

      var default_group_id = user_one_company.groups[0]._id.toString();
      var order_id = user_order_one._id;
      agent.get(config.serverAddress + 'order/getorderbyid')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          access_token: user_one_access_token,
          order_id: order_id
        })
        .end(function (err, res) {
          res.body.create_user.should.equal(user_one._id);
          res.body.create_group.should.equal(default_group_id);
          done();
        });
    });

    //用户1查看订单详情1
    it('should return a order detail without children', function (done) {
      var order_id = user_order_one._id;
      agent.get(config.serverAddress + 'order/detail')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_one_access_token,
          order_id: order_id
        })
        .end(function (err, res) {
          should.exist(res.body._id);
          res.body._id.should.equal(order_id);
          should.not.exist(res.body.children);
          done();
        });
    });


    //分配订单1给司机
    var driverOrder;
    it('should return the first order for driver', function (done) {

      var driver_id = driver._id.toString();
      var postData =
      {
        order_id: user_order_one._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'driver',
          driver_id: driver_id,
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
        }]
      };

      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          driverOrder = res.body.assignedOrderList[0];
          res.body.assignedOrderList[0].delivery_contacts.name.should.equal(postData.assign_infos[0].delivery_contact_name);
          res.body.assignedOrderList[0].status.should.equal('unPickupSigned');
          res.body.assignedInfos[0].is_assigned.should.equal(true);

          Order.findOne({_id: user_order_one._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            done();
          });
        });

    });

    //司机查看订单1
    it('should return a order', function (done) {
      agent.get(config.serverAddress + 'driver/order/getbyid')
        .query({
          access_token: driver_access_token,
          order_id: driverOrder._id
        })
        .end(function (err, res) {
          should.exist(res.body.execute_driver);
          done();
        });
    });


    var user_order_two;
    //用户1正确创建订单2
    it('should return the second order', function (done) {
      var default_group_id = user_one_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250244';

      createOrder(default_group_id, order_number, 'elina2', 'hardy2', user_one_access_token, function (order) {

        order.create_company.should.equal(user_one_company._id);
        order.create_group.should.equal(default_group_id);

        user_order_two = order;
        done();
      });
    });

    //用户1分配订单2给公司2
    it('should return the second order for company', function (done) {

      var postData =
      {
        order_id: user_order_two._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'company',
          company_id: user_two_company._id,
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
        }]
      };
      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.assignedOrderList[0].delivery_contact.name.should.equal(postData.assign_infos[0].delivery_contact_name);
          res.body.assignedOrderList[0].execute_company.should.equal(user_two_company._id);
          res.body.assignedInfos[0].is_assigned.should.equal(true);

          Order.findOne({_id: user_order_two._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');

            done();
          });
        });
    });


    var user_order_three;
    //用户1正确创建订单3
    it('should return the third order', function (done) {
      var default_group_id = user_one_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250245';

      createOrder(default_group_id, order_number, 'elina3', 'hardy3', user_one_access_token, function (order) {

        order.create_company.should.equal(user_one_company._id);
        order.create_group.should.equal(default_group_id);

        user_order_three = order;
        done();
      });
    });


    //用户1分配订单3给公司2和司机
    var company_two_order;
    it('should return an order list for company and driver', function (done) {

      var postData =
      {
        order_id: user_order_three._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'company',
          company_id: user_two_company._id,
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
        }, {
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
        },
          {
            type: 'warehouse',
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
          }
        ]
      };
      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.assignedOrderList.length.should.equal(3);
          res.body.assignedInfos[0].is_assigned.should.equal(true);
          res.body.assignedInfos[1].is_assigned.should.equal(true);
          res.body.assignedInfos[2].is_assigned.should.equal(true);
          //company_two_order = res.body.assignedOrderList[0];

          res.body.assignedOrderList.every(function (value, index, arr) {
            if (value.type === 'company') {
              company_two_order = value;
              return false;
            }
            else {
              return true;
            }
          });

          Order.findOne({_id: user_order_three._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            Order.findOne({parent_order: user_order_three._id, type: 'warehouse'}, function (err, order) {
              order.execute_driver.toString().should.equal(driver._id.toString());
              //order.pickup_contact.toString().should.equal(order.delivery_contact.toString());
              order.status.should.equal('unDeliveried');
              Order.findOne({parent_order: user_order_three._id, type: 'driver'}, function (err, order) {
                order.execute_driver.toString().should.equal(driver._id.toString());
                order.status.should.equal('unPickupSigned');
                done();
              });
            });
          });
        });
    });


    //用户1查看订单详情3
    it('should return a order3 detail with 2 children', function (done) {
      var order_id = user_order_three._id;
      agent.get(config.serverAddress + 'order/detail')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_one_access_token,
          order_id: order_id
        })
        .end(function (err, res) {
          should.exist(res.body._id);
          res.body._id.should.equal(order_id);
          done();
        });
    });

    var driver_two, driver_two_access_token;
    var driver_two_name = '13472423583';
    //这个司机2进行注册登录并返回司机access_token
    it('should return a driver access_token', function (done) {
      //获取验证码
      agent.post(config.serverAddress + 'driver/getsmsverifycode')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: driver_two_name
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          var smsVerify = res.body;
          //注册
          agent.post(config.serverAddress + 'driver/signup')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
              username: driver_two_name,
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
                  username: driver_two_name,
                  password: password
                })
                .end(function (err, res) {

                  res.body.driver.username.should.equal(driver_two_name);
                  res.body.access_token.should.not.equal(undefined);

                  Driver.findOne({username: res.body.driver.username}, function (err, driverEntity) {

                    driver_two = driverEntity;

                    driver_two_access_token = res.body.access_token;
                    done();
                  });

                });
            });
        });

    });

    //公司2邀请合作司机driver2
    it('should be success when company_two invite driver_two', function (done) {
      OrderWebAPI.inviteDriver(user_two_access_token, driver_two.username, function (err, result) {
        done();
      });
    });

    //用户2把分配给公司2的订单分配给司机2
    var driver_two_order;
    it('should return the driver2 order for company order', function (done) {

      var driver_id = driver_two._id.toString();

      var postData =
      {
        order_id: company_two_order._id,
        access_token: user_two_access_token,
        assign_infos: [{
          type: 'driver',
          driver_id: driver_id,
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
        }]
      };

      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          driver_two_order = res.body.assignedOrderList[0];
          res.body.assignedOrderList[0].delivery_contacts.name.should.equal(postData.assign_infos[0].delivery_contact_name);
          res.body.assignedOrderList[0].status.should.equal('unPickupSigned');
          res.body.assignedInfos[0].is_assigned.should.equal(true);

          Order.findOne({_id: company_two_order._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            done();
          });
        });

    });


    //用户1查看订单详情3
    it('should return a order3 detail with 2 children and the first child has 1 child', function (done) {
      var order_id = user_order_three._id;
      agent.get(config.serverAddress + 'order/detail')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_one_access_token,
          order_id: order_id
        })
        .end(function (err, res) {

          should.exist(res.body._id);

          res.body._id.should.equal(order_id);


          done();
        });
    });

    var user_order_four;
    //用户1正确创建订单4
    it('should return the four order', function (done) {
      var default_group_id = user_one_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250246';

      createOrder(default_group_id, order_number, 'elina4', 'hardy4', user_one_access_token, function (order) {

        order.create_company.should.equal(user_one_company._id);
        order.create_group.should.equal(default_group_id);

        user_order_four = order;
        done();
      });
    });

    //用户1分配订单4,分成三段，其中一段分配给公司2，其余两段未定
    it('should return an order list for company and null', function (done) {

      var postData =
      {
        order_id: user_order_four._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'company',
          is_assigned: false,
          company_id: user_two_company._id,
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
          type: '',
          company_id: '',
          is_assigned: false,
          pickup_contact_name: '',
          pickup_contact_phone: '',
          pickup_contact_mobile_phone: '',
          pickup_contact_email: '',
          delivery_contact_name: '',
          delivery_contact_phone: '',
          delivery_contact_mobile_phone: '',
          delivery_contact_address: '',
          delivery_contact_email: ''
        },
          {
            type: '',
            company_id: '',
            is_assigned: false,
            pickup_contact_name: '',
            pickup_contact_phone: '',
            pickup_contact_mobile_phone: '',
            pickup_contact_email: '',
            delivery_contact_name: '',
            delivery_contact_phone: '',
            delivery_contact_mobile_phone: '',
            delivery_contact_address: '',
            delivery_contact_email: ''
          }]
      };
      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.assignedOrderList.length.should.equal(1);
          res.body.assignedInfos[0].is_assigned.should.equal(true);
          res.body.assignedInfos[1].is_assigned.should.not.equal(true);
          res.body.assignedInfos[1].is_assigned.should.not.equal('true');

          Order.findOne({_id: user_order_four._id}, function (err, order) {
            order.status.should.equal('assigning');

            done();
          });
        });
    });

    //用户1继续分配订单4,第二段分配给司机,第三段分配给仓库管理员
    var driver_order;
    it('should return an order of the driver who is assigned to the remaining order', function (done) {
      var postData =
      {
        order_id: user_order_four._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'company',
          is_assigned: true,
          company_id: user_two_company._id,
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
        },
          {
            type: 'warehouse',
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
          }
        ]
      };

      agent.post(config.serverAddress + 'order/continueassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.assignedOrderList.length.should.equal(2);
          res.body.assignedInfos.length.should.equal(2);
          res.body.assignedInfos[0].is_assigned.should.equal(true);
          res.body.assignedInfos[1].is_assigned.should.equal(true);

          driver_order = res.body.assignedOrderList[0];

          Order.findOne({_id: user_order_four._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            done();
          });
        });
    });

    it('should return an unPickupSigned order list for 3 records', function (done) {

      var postData =
      {
        access_token: driver_access_token,
        status: ['unPickupSigned', '']
      };

      agent.get(config.serverAddress + 'driver/order/getbystatus')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.orders.length.should.equal(3);
          done();
        });
    });

    it('should return an unDeliveried order list for 1 records', function (done) {

      var postData =
      {
        access_token: driver_access_token,
        status: ['unDeliveried', ''],
        type: 'warehouse'
      };

      agent.get(config.serverAddress + 'driver/order/getbystatus')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.orders.length.should.equal(2);
          done();
        });
    });


    ////该司机提货签到司机订单，返回成功
    //it('should return a success about pickupSign', function (done) {
    //  var postData =
    //  {
    //    access_token: driver_access_token,
    //    order_id: driver_order._id,
    //    driver: driver,
    //    type: 'pickupSign',
    //    address: '浦东',
    //    longitude: '34.5',
    //    latitude: '120.5'
    //  };
    //
    //  agent.post(config.serverAddress + 'transport_event/upload')
    //    .set('Content-Type', 'application/x-www-form-urlencoded')
    //    .send(postData)
    //    .end(function (err, res) {
    //      if (err)
    //        console.log(err);
    //
    //      should.exist(res.body.success);
    //      done();
    //    });
    //
    //});
    //
    //it('should return an unPickupSigned or unPickuped orderList with 4 length', function (done) {
    //  var postData =
    //  {
    //    access_token: driver_access_token,
    //    status: ['unPickupSigned', 'unPickuped']
    //  };
    //
    //  agent.get(config.serverAddress + 'driver/order/getbystatus')
    //    .set('Content-Type', 'application/x-www-form-urlencoded')
    //    .query(postData)
    //    .end(function (err, res) {
    //      if (err)
    //        console.log(err);
    //
    //      res.body.orders.length.should.equal(4);
    //      done();
    //    });
    //});

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

function bacthCreateOrder(infos, groupId, access_token, callback) {
  agent.post(config.serverAddress + 'order/batchcreate')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      infos: infos,
      group_id: groupId,
      access_token: access_token
    })
    .end(function (err, res) {
      if (err)
        return callback(err, null);
      return callback(null, res.body);
    });

}

describe('Order: Export Orders By Filter --', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        Company.remove(function () {
          Group.remove(function () {
            Contact.remove(function () {
              OrderDetail.remove(function () {
                Order.remove(function () {
                  CustomerContact.remove(function () {
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

  var username = '18321740710@163.com',
    password = '123456';
  var driverName = '13472423583';


  describe('Path post /order/export', function () {

    //用户开放注册
    var user_one;
    it('should return a new user with valid username and password', function (done) {
      userSignup(username, password, function (user) {
        user_one = user;
        done();
      });
    });

    //用户激活
    it('should return a successful result about activate the user', function (done) {
      userActivate(user_one._id, function (result) {
        done();
      });
    });

    //用户登录
    var user_access_token;
    it('should return the access_token of the user', function (done) {
      userSignin(username, password, function (result) {
        user_access_token = result.access_token;
        done();
      });
    });

    //用户创建公司
    var user_company;
    it('should return the company of the user', function (done) {
      var name = 'test company',
        address = 'test address',
        photo = 'test photo',
        employees = 'test employees';
      //创建公司
      createComany(name, address, photo, employees, user_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_company = company;
        done();
      });
    });

    //用户邀请司机
    it('should return a record for the second user to invite the driver', function (done) {
      userInviteDriver(driverName, user_access_token, function (result) {
        done();
      });
    });

    it('should return a object with a success = true and the totalRecordCount = 2: batch order create', function (done) {
      var orders = [
        {
          createInfo: {
            order_number: 'batch order number 1',
            customer_name: 'apple company',
            pickup_contact_name: 'elina',
            pickup_contact_phone: '18321740710',
            pickup_contact_address: '上海',
            delivery_contact_name: 'hardy',
            delivery_contact_phone: '12345678913',
            delivery_contact_address: '成都',
            details: [],
            pickup_start_time: new Date('2015-4-27 10:00').toISOString(),
            delivery_start_time: new Date('2014-5-29 10:30').toISOString(),
            pickup_end_time: new Date('2015-4-27 10:30').toISOString(),
            delivery_end_time: new Date('2015-5-29 11:00').toISOString(),
            description: 'test description 1'
          },
          assignInfos: []
        },
        {
          createInfo: {
            order_number: 'batch order number 2',
            customer_name: 'orange company',
            pickup_contact_name: 'elina2',
            pickup_contact_phone: '18321740710',
            pickup_contact_address: '上海',
            delivery_contact_name: 'hardy2',
            delivery_contact_phone: '12345678913',
            delivery_contact_address: '成都',
            details: [],
            pickup_start_time: new Date('2015-4-27 10:00').toISOString(),
            delivery_start_time: new Date('2014-5-29 10:30').toISOString(),
            pickup_end_time: new Date('2015-4-27 10:30').toISOString(),
            delivery_end_time: new Date('2015-5-29 11:00').toISOString(),
            description: 'test description 1'
          },
          assignInfos: []
        }];

      bacthCreateOrder(orders, user_company.default_group, user_access_token, function (err, result) {
        result.success.should.equal(true);
        result.totalCount.should.equal(2);
        result.successCount.should.equal(2);
        done();
      });
    });

    it('should return an order list with 2 records', function (done) {
      agent.get(config.serverAddress + 'order/export')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        //.send({
        //  username: username,
        //  query: {
        //  }
        //})
        .query({
          access_token: user_access_token,
          startDate: new Date('2015-4-27 10:00').toISOString(),
          endDate: new Date('2017-5-30 10:00').toISOString()
        })
        .end(function (err, res) {
          res.body.orders.length.should.equal(2);
          done();
        });
    });

    var user_order_one;
    //用户1正确创建订单
    it('should return the first order', function (done) {
      var default_group_id = user_company.groups[0]._id.toString();
      var order_number = 'test order number EMS201503250243';

      createOrder(default_group_id, order_number, 'elina', 'hardy', user_access_token, function (order) {

        order.create_company.should.equal(user_company._id);
        order.create_group.should.equal(default_group_id);

        user_order_one = order;
        done();
      });
    });
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
    //分配订单1给司机
    var driverOrder;
    it('should return the first order for driver', function (done) {

      var driver_id = driver._id.toString();
      var postData =
      {
        order_id: user_order_one._id,
        access_token: user_access_token,
        assign_infos: [{
          type: 'driver',
          driver_id: driver_id,
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
        }]
      };

      agent.post(config.serverAddress + 'order/multiassign')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          driverOrder = res.body.assignedOrderList[0];
          res.body.assignedOrderList[0].delivery_contacts.name.should.equal(postData.assign_infos[0].delivery_contact_name);
          res.body.assignedOrderList[0].status.should.equal('unPickupSigned');
          res.body.assignedInfos[0].is_assigned.should.equal(true);

          Order.findOne({_id: user_order_one._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            done();
          });
        });

    });
    it('should return an order list with 3 records', function (done) {
      agent.get(config.serverAddress + 'order/export')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_access_token,
          startDate: new Date('2015-4-27 10:00').toISOString(),
          endDate: new Date('2017-5-30 10:00').toISOString()
        })
        .end(function (err, res) {
          res.body.orders.length.should.equal(3);
          done();
        });
    });
    it('should return an order list with 1 records', function (done) {
      agent.get(config.serverAddress + 'order/export')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_access_token,
          startDate: new Date('2015-4-27 10:00').toISOString(),
          endDate: new Date('2017-5-30 10:00').toISOString(),
          customer_name: 'test zhuzhu company'
        })
        .end(function (err, res) {
          res.body.orders.length.should.equal(1);
          done();
        });
    });


    it('should return an order list with 1 records', function (done) {
      agent.get(config.serverAddress + 'order/export')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_access_token,
          startDate: new Date('2015-4-27 10:00').toISOString(),
          endDate: new Date('2017-5-30 10:00').toISOString(),
          customer_name: 'test zhuzhu company'
        })
        .end(function (err, res) {
          res.body.orders.length.should.equal(1);
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


