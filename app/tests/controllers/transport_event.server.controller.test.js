/**
* Created by elinaguo on 15/4/6.
*/
'use strict';

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),
  appDb = require('../../../libraries/mongoose').appDb,

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
  TransportEvent = appDb.model('TransportEvent');

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

//用户公开注册，激活，登录，创建订单，邀请司机，司机注册，用户分配订单给司机
describe('Route Driver upload transport evet test', function () {
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
                          TransportEvent.remove(function () {
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

  describe('Path post /transport_event/upload', function () {


    var username_one = 'alisan1@live.cn';
    var password = '123456';
    var driverName = '13472423583';


    //用户注册激活
    var user_one;
    it('should return the user and activate', function (done) {
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

    //用户1邀请司机
    it('should return a record for the second user to invite the driver', function (done) {
      userInviteDriver(driverName, user_one_access_token, function (result) {
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


    //用户二注册激活
    var username_two = '10983066@qq.com';
    var user_two;
    it('should return the second user and activate', function (done) {
      userSignup(username_two, password, function (user) {
        user_two = user;
        userActivate(user._id, function (result) {
          done();
        });
      });
    });

    //用户二登录
    var user_two_access_token;
    it('should return the access_token of the second user', function (done) {
      userSignin(username_two, password, function (result) {
        user_two_access_token = result.access_token;
        done();
      });
    });

    //用户二创建公司二
    var user_two_company;
    it('should return the company of the second user', function (done) {
      var name = 'test company2',
        address = 'test address2',
        photo = 'test photo2',
        employees = 'test employees 2';
      //创建公司
      createComany(name, address, photo, employees, user_two_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_two_company = company;
        done();
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

    //分配订单1给司机和公司2
    var driverOrder, companyOrder;

    //用户1分配订单1给公司2和司机
    it('should return an order list for company and driver', function (done) {

      var postData =
      {
        order_id: user_order_one._id,
        access_token: user_one_access_token,
        assign_infos: [{
          type: 'company',
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

          res.body.assignedOrderList.length.should.equal(2);
          should.exist(res.body.assignedOrderList[0].execute_company);
          should.exist(res.body.assignedOrderList[1].execute_driver);
          companyOrder = res.body.assignedOrderList[0];
          driverOrder = res.body.assignedOrderList[1];
          Order.findOne({_id: user_order_one._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');

            done();
          });
        });
    });

    //该司机提货签到订单1，返回错误'order_driver_not_match'
    it('should return an error event about order_driver_not_match', function (done) {
      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          access_token: driver_access_token,
          order_id: user_order_one._id,
          type: 'pickupSign',
          address: '浦东',
          longitude: '34.5',
          latitude: '120.5'
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          //console.log(res.body);
          res.body.err.type.should.equal('order_driver_not_match');
          done();
        });

    });

    //该司机提货签到不存在的订单，返回错误'order_not_exist'
    it('should return an error event about order_not_exist', function (done) {
      var postData =
      {
        access_token: driver_access_token,
        order_id: user_one._id,
        type: 'pickupSign',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);
          res.body.err.type.should.equal('order_not_exist');
          done();
        });

    });

    ////该司机提货签到司机订单，返回成功
    it('should return a success about pickupSign', function (done) {
      var postData =
      {
        access_token: driver_access_token,
        order_id: driverOrder._id,
        damaged: true,
        remark: '货损',
        type: 'pickupSign',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);
          TransportEvent.find().exec(function (err, transportEvents) {
            if (err)
              console.log(err);

            transportEvents[0].damaged.should.equal(true);

            Order.findOne({_id: user_order_one._id}, function (err, orderEntity) {
              if (err)
                console.log(err);

              orderEntity.damaged.should.equal(true);
              orderEntity.description.should.equal('test description');
              orderEntity.remark.should.equal(postData.remark+',');
              done();
            });
          });
        });

    });

    //该司机没有提货签到便操作交货,返回成功
    it('should return a success before pickupSign', function (done) {
      var postData =
      {
        access_token: driver_access_token,
        order_id: driverOrder._id,
        type: 'pickup',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);

          Order.findOne({_id: user_order_one._id}, function (err, order) {

            order.status.should.equal('unDeliverySigned');
            done();
          });
        });

    });

    //该司机提货司机订单，返回成功
    it('should return a success event about pickup', function (done) {

      var postData =
      {
        access_token: driver_access_token,
        order_id: driverOrder._id,
        type: 'pickup',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.err.type.should.equal('can_not_execute_pickup');

          done();
        });

    });

    //该司机交货签到司机订单，返回成功
    //it('should return a success event about deliverySign', function (done) {
    //  var postData =
    //  {
    //    access_token: driver_access_token,
    //      order_id: driverOrder._id,
    //      type: 'deliverySign',
    //      address: '浦东',
    //      longitude: '34.5',
    //      latitude: '120.5'
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

    //该司机交货司机订单，返回成功,并且大订单status 为unDeliveried；
    it('should return a success event about delivery but the status of the root order is unDeliveried', function (done) {
      var postData =
      {
        access_token: driver_access_token,
        order_id: driverOrder._id,
        damaged: false,
        description: '',
        type: 'delivery',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);

          Order.findOne({_id: user_order_one._id}, function (err, order) {

            order.status.should.equal('unDeliveried');
            done();
          });
        });

    });


    var driver_two, driver_two_access_token;
    var driver_two_name = '13472423583';
    //这个司机w进行注册登录并返回司机access_token
    it('should return the second driver access_token', function (done) {
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

    //用户2分配公司订单给司机2
    var driver_two_order;
    it('should return an order for the second driver', function (done) {

      var postData =
      {
        order_id: companyOrder._id,
        access_token: user_two_access_token,
        assign_infos: [{
          type: 'driver',
          driver_id: driver_two._id.toString(),
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

          res.body.assignedOrderList.length.should.equal(1);
          should.exist(res.body.assignedOrderList[0].execute_driver);
          driver_two_order = res.body.assignedOrderList[0];

          Order.findOne({_id: companyOrder._id}, function (err, order) {
            order.status.should.equal('unPickupSigned');
            done();
          });
        });
    });

    //该司机2提货签到司机订单，返回一天事件信息
    it('should return an transport event about driver2 pickupSign', function (done) {
      var postData =
      {
        access_token: driver_two_access_token,
        order_id: driver_two_order._id,
        type: 'pickupSign',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);
          done();
        });

    });

    //该司机2提货司机订单，返回一天事件信息
    it('should return an transport event about driver2 pickup', function (done) {
      var postData =
      {
        access_token: driver_two_access_token,
        order_id: driver_two_order._id,
        type: 'pickup',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);
          done();
        });

    });

    //该司机2交货签到司机订单，返回一天事件信息
    it('should return an transport event about driver2 deliverySign  but the status of the root order is unDeliveried', function (done) {
      var postData =
      {
        access_token: driver_two_access_token,
        order_id: driver_two_order._id,
        type: 'deliverySign',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.success);
          done();
        });

    });

    //该司机2交货司机订单，返回一天事件信息
    it('should return an transport event about driver2 delivery', function (done) {
      var postData =
      {
        access_token: driver_two_access_token,
        order_id: driver_two_order._id,
        type: 'delivery',
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5',
        event_id: driver_two_order._id.toString()
      };

      agent.post(config.serverAddress + 'transport_event/upload')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(postData)
        .end(function (err, res) {
          if (err)
            console.log(err);

        //  console.log(res.body, '1111111');

          should.exist(res.body.success);
          Order.findOne({_id: user_order_one._id}, function (err, order) {
            order.status.should.equal('completed');
            done();
          });
        });

    });

    //返回用户1的订单事件详情
    it('should return a transport events of order 1', function (done) {

      var orderId = user_order_one._id;

      agent.get(config.serverAddress + 'transport_event')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .query({
          access_token: user_one_access_token,
          order_id: orderId
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          should.exist(res.body.order.createUsername);
          res.body.events.length.should.equal(8);
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
