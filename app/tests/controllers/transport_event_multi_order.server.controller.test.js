/**
* Created by Wayne on 15/5/14.
*/

'use strict';

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),
  appDb = require('../../../libraries/mongoose').appDb,
  transportEventError = require('../../errors/transport_event'),

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
  TransportEvent = appDb.model('TransportEvent'),
  Trace = appDb.model('Trace');


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

//司机获取验证码
function driverGetSMSCode(username, callback) {
  agent.post(config.serverAddress + 'driver/getsmsverifycode')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//司机注册
function driverSignup(username, password, smsInfo, callback) {
  agent.post(config.serverAddress + 'driver/signup')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password,
      sms_verify_id: smsInfo._id,
      sms_verify_code: smsInfo.code
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//司机登录
function driverSignIn(username, password, callback) {
  agent.post(config.serverAddress + 'driver/signin')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      callback(res,res.body);
    });
}

//邀请合作公司
function inviteCompany(company_name, access_token, callback) {
  agent.post(config.serverAddress + 'company/invitebycompanyname')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      company_name: company_name,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
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
      res.body.status.should.equal('accepted');
      res.body.username.should.equal(username);
      callback(err, res.body);
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
      callback(err, res.body);
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

//司机提交事件
function driverUpload(access_token, order_ids, eventType, callback) {
  agent.post(config.serverAddress + 'transport_event/multiUpload')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_ids: order_ids,
      type: eventType,
      address: '浦东',
      longitude: '34.5',
      latitude: '120.5'
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
}

//根据指定的订单Id获取司机上传的事件
function getDriverUploadEvent(access_token, order_id, callback) {
  agent.get(config.serverAddress + 'transport_event')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: order_id
    })
    .end(function (err, res) {
      callback(err, res.body);
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

//用户公开注册，激活，登录，创建订单，邀请司机，司机注册，用户分配订单给司机
describe('TransportEvent with Multi Orders for Test', function () {
  var userA, userB, userC, companyA, companyB, companyC, driverA1,
    driverB1, driverB2, driverC1, assignInfoA, assignInfoB, assignInfoC;

  before(function (done) {
    userA = {username: '541149886@qq.com', password: '111111'};
    userB = {username: '595631400@qq.com', password: '111111'};
    userC = {username: '10983066@qq.com', password: '111111'};

    companyA = {name: 'companyA', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    companyB = {name: 'companyB', address: 'Shanghai', photo: 'photo', employees: 'employee'};
    companyC = {name: 'companyC', address: 'Shanghai', photo: 'photo', employees: 'employee'};

    driverA1 = {username: '13052118915', password: '111111'};
    driverB1 = {username: '13918429709', password: '111111'};
    driverB2 = {username: '18321740710', password: '111111'};
    driverC1 = {username: '13472423583', password: '111111'};

    assignInfoA = [{
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
      },
      {
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

    assignInfoB = [{
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
    },
      {
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

    assignInfoC = [{
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

  describe('drivers batch pickup or delivery orders::', function () {
    var user_A, user_B, user_C, access_token_A, access_token_B, access_token_C,
      company_A, company_B, company_C, driver_A1, driver_B1, driver_B2, driver_C1,
      access_token_d_A1, access_token_d_B1, access_token_d_B2, access_token_d_C1,
      order_A1, order_A2, order_B1, order_B2, order_C1, order_C2, order_d_A1, order_d_A2,
      order_d_B1, order_d_B21, order_d_B2, order_d_B22, order_d_C1, order_d_C2;

    //用户注册激活
    it('should return the user_A and activate', function (done) {
      userSignup(userA.username, userA.password, function (userEntity) {
        userEntity.username.should.equal(userA.username);

        user_A = userEntity;
        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });
    it('should return the user_B and activate', function (done) {
      userSignup(userB.username, userB.password, function (userEntity) {
        userEntity.username.should.equal(userB.username);

        user_B = userEntity;
        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });
    it('should return the user_C and activate', function (done) {
      userSignup(userC.username, userC.password, function (userEntity) {
        userEntity.username.should.equal(userC.username);

        user_C = userEntity;
        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户登录
    it('should return the access_token_A of user_A', function (done) {
      userSignin(userA.username, userA.password, function (result) {
        should.not.exist(result.err);
        access_token_A = result.access_token;
        done();
      });
    });
    it('should return the access_token_B of user_B', function (done) {
      userSignin(userB.username, userB.password, function (result) {
        should.not.exist(result.err);
        access_token_B = result.access_token;
        done();
      });
    });
    it('should return the access_token_C of user_C', function (done) {
      userSignin(userC.username, userC.password, function (result) {
        should.not.exist(result.err);
        access_token_C = result.access_token;
        done();
      });
    });

    //用户创建公司
    it('should return the company_A of user_A', function (done) {
      createComany(companyA.name, companyA.address, companyA.photo, companyA.employees, access_token_A, function (companyEntity) {
        companyEntity.name.should.equal(companyA.name);
        companyEntity.address.should.equal(companyA.address);

        company_A = companyEntity;
        done();
      });
    });
    it('should return the company_B of user_B', function (done) {
      createComany(companyB.name, companyB.address, companyB.photo, companyB.employees, access_token_B, function (companyEntity) {
        companyEntity.name.should.equal(companyB.name);
        companyEntity.address.should.equal(companyB.address);

        company_B = companyEntity;
        done();
      });
    });
    it('should return the company_C of user_C', function (done) {
      createComany(companyC.name, companyC.address, companyC.photo, companyC.employees, access_token_C, function (companyEntity) {
        companyEntity.name.should.equal(companyC.name);
        companyEntity.address.should.equal(companyC.address);

        company_C = companyEntity;
        done();
      });
    });

    //司机注册并登录
    it('should return the driver_A1 and access_token_d_A1', function (done) {
      driverGetSMSCode(driverA1.username, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.err);

        var smsInfo = result;

        driverSignup(driverA1.username, driverA1.password, smsInfo, function (err, result) {
          should.not.exist(err);
          should.not.exist(result.err);

          driverSignIn(driverA1.username, driverA1.password, function (err, result) {
            result.driver.username.should.equal(driverA1.username);
            result.access_token.should.not.equal(undefined);

            access_token_d_A1 = result.access_token;
            Driver.findOne({username: driverA1.username}, function (err, driverEntity) {
              driver_A1 = driverEntity;
              done();
            });
          });
        });
      });
    });
    it('should return the driver_B1 and access_token_d_B1', function (done) {
      driverGetSMSCode(driverB1.username, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.err);

        var smsInfo = result;

        driverSignup(driverB1.username, driverB1.password, smsInfo, function (err, result) {
          should.not.exist(err);
          should.not.exist(result.err);

          driverSignIn(driverB1.username, driverB1.password, function (err, result) {
            result.driver.username.should.equal(driverB1.username);
            result.access_token.should.not.equal(undefined);

            access_token_d_B1 = result.access_token;
            Driver.findOne({username: driverB1.username}, function (err, driverEntity) {
              driver_B1 = driverEntity;
              done();
            });
          });
        });
      });
    });
    it('should return the driver_B2 and access_token_d_B2', function (done) {
      driverGetSMSCode(driverB2.username, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.err);

        var smsInfo = result;

        driverSignup(driverB2.username, driverB2.password, smsInfo, function (err, result) {
          should.not.exist(err);
          should.not.exist(result.err);

          driverSignIn(driverB2.username, driverB2.password, function (err, result) {
            result.driver.username.should.equal(driverB2.username);
            result.access_token.should.not.equal(undefined);

            access_token_d_B2 = result.access_token;
            Driver.findOne({username: driverB2.username}, function (err, driverEntity) {
              driver_B2 = driverEntity;
              done();
            });
          });
        });
      });
    });
    it('should return the driver_C1 and access_token_d_C1', function (done) {
      driverGetSMSCode(driverC1.username, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.err);

        var smsInfo = result;

        driverSignup(driverC1.username, driverC1.password, smsInfo, function (err, result) {
          should.not.exist(err);
          should.not.exist(result.err);

          driverSignIn(driverC1.username, driverC1.password, function (err, result) {
            result.driver.username.should.equal(driverC1.username);
            result.access_token.should.not.equal(undefined);

            access_token_d_C1 = result.access_token;
            Driver.findOne({username: driverC1.username}, function (err, driverEntity) {
              driver_C1 = driverEntity;
              done();
            });
          });
        });
      });
    });

    //邀请合作公司
    it('should be success when companyA invite companyB', function (done) {
      inviteCompany(companyB.name, access_token_A, function (err, result) {
        should.not.exist(result.err);
        result.partner.toString().should.equal(company_B._id.toString());

        done();
      });
    });
    it('should be success when companyA invite companyC', function (done) {
      inviteCompany(companyC.name, access_token_A, function (err, result) {
        should.not.exist(result.err);
        result.partner.toString().should.equal(company_C._id.toString());

        done();
      });
    });

    //邀请合作司机
    it('should be success when companyA invite driverA1', function (done) {
      userInviteDriver(driverA1.username, access_token_A, function (err, result) {
        should.not.exist(result.err);
        result.username.should.equal(driverA1.username);
        result.company._id.toString().should.equal(company_A._id.toString());

        done();
      });
    });
    it('should be success when companyB invite driverB1', function (done) {
      userInviteDriver(driverB1.username, access_token_B, function (err, result) {
        should.not.exist(result.err);
        result.username.should.equal(driverB1.username);
        result.company._id.toString().should.equal(company_B._id.toString());

        done();
      });
    });
    it('should be success when companyB invite driverB2', function (done) {
      userInviteDriver(driverB2.username, access_token_B, function (err, result) {
        should.not.exist(result.err);
        result.username.should.equal(driverB2.username);
        result.company._id.toString().should.equal(company_B._id.toString());

        done();
      });
    });
    it('should be success when companyC invite driverC1', function (done) {
      userInviteDriver(driverC1.username, access_token_C, function (err, result) {
        should.not.exist(result.err);
        result.username.should.equal(driverC1.username);
        result.company._id.toString().should.equal(company_C._id.toString());

        done();
      });
    });

    //创建运单
    it('should return the order_A1 created by user_A', function (done) {
      createOrder(company_A.default_group, '123456789*0', 'zwmei', 'zwmei', access_token_A, function (err, result) {
        result.status.should.equal('unAssigned');

        Order.findOne({_id: result._id}).populate('order_detail').exec(function(err, orderEntity) {
          orderEntity.order_detail.order_number.should.equal('123456789*0');

          order_A1 = orderEntity;
          done();
        });
      });
    });
    it('should return the order_A2 created by user_A', function (done) {
      createOrder(company_A.default_group, '123456789*1', 'zwmei', 'zwmei', access_token_A, function (err, result) {
        result.status.should.equal('unAssigned');

        Order.findOne({_id: result._id}).populate('order_detail').exec(function(err, orderEntity) {
          orderEntity.order_detail.order_number.should.equal('123456789*1');

          order_A2 = orderEntity;
          done();
        });
      });
    });

    //分配运单
    it('should be success when assign order_A1 to companyB, companyC, driverA1', function (done) {
      assignInfoA[0].company_id = company_B._id.toString();
      assignInfoA[1].company_id = company_C._id.toString();
      assignInfoA[2].driver_id = driver_A1._id.toString();

      assignOrder(access_token_A, order_A1._id.toString(), assignInfoA, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoA.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoA.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.toString().should.equal(order_A1._id.toString());
          eachOrder.create_company.toString().should.equal(company_A._id.toString());

          if (eachOrder.execute_company && eachOrder.execute_company.toString() === company_B._id.toString()) {
            order_B1 = eachOrder;
          }else if (eachOrder.execute_company && eachOrder.execute_company.toString() === company_C._id.toString()) {
            order_C1 = eachOrder;
          }else {
            should.exist(eachOrder.execute_driver);
            eachOrder.execute_driver.toString().should.equal(driver_A1._id.toString());
            order_d_A1 = eachOrder;
          }
        });

        done();
      });
    });
    it('should be success when assign order_A2 to companyB, companyC, driverA1', function (done) {
      assignInfoA[0].company_id = company_B._id.toString();
      assignInfoA[1].company_id = company_C._id.toString();
      assignInfoA[2].driver_id = driver_A1._id.toString();

      assignOrder(access_token_A, order_A2._id.toString(), assignInfoA, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoA.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoA.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.toString().should.equal(order_A2._id.toString());
          eachOrder.create_company.toString().should.equal(company_A._id.toString());

          if (eachOrder.execute_company && eachOrder.execute_company.toString() === company_B._id.toString()) {
            order_B2 = eachOrder;
          }else if (eachOrder.execute_company && eachOrder.execute_company.toString() === company_C._id.toString()) {
            order_C2 = eachOrder;
          }else {
            should.exist(eachOrder.execute_driver);
            eachOrder.execute_driver.toString().should.equal(driver_A1._id.toString());
            order_d_A2 = eachOrder;
          }
        });

        done();
      });
    });

    it('should be success when assign order_B1 to driverB1, driverB2', function (done) {
      assignInfoB[0].driver_id = driver_B1._id.toString();
      assignInfoB[1].driver_id = driver_B2._id.toString();

      assignOrder(access_token_B, order_B1._id.toString(), assignInfoB, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoB.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoB.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.toString().should.equal(order_B1._id.toString());
          eachOrder.create_company.toString().should.equal(company_B._id.toString());

          should.exist(eachOrder.execute_driver);

          if (eachOrder.execute_driver && eachOrder.execute_driver.toString() === driver_B1._id.toString()) {
            order_d_B1 = eachOrder;
          }else if (eachOrder.execute_driver && eachOrder.execute_driver.toString() === driver_B2._id.toString()) {
            order_d_B2 = eachOrder;
          }
        });

        done();
      });
    });
    it('should be success when assign order_B2 to driverB1, driverB2', function (done) {
      assignInfoB[0].driver_id = driver_B1._id.toString();
      assignInfoB[1].driver_id = driver_B2._id.toString();

      assignOrder(access_token_B, order_B2._id.toString(), assignInfoB, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoB.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoB.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.should.equal(order_B2._id);
          eachOrder.create_company.should.equal(company_B._id);

          should.exist(eachOrder.execute_driver);

          if (eachOrder.execute_driver && eachOrder.execute_driver.toString() === driver_B1._id.toString()) {
            order_d_B21 = eachOrder;
          }else if (eachOrder.execute_driver && eachOrder.execute_driver.toString() === driver_B2._id.toString()) {
            order_d_B22 = eachOrder;
          }
        });

        done();
      });
    });

    it('should be success when assign order_C1 to driverC1', function (done) {
      assignInfoC[0].driver_id = driver_C1._id.toString();

      assignOrder(access_token_C, order_C1._id.toString(), assignInfoC, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoC.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoC.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.should.equal(order_C1._id);
          eachOrder.create_company.should.equal(company_C._id);

          should.exist(eachOrder.execute_driver);

          order_d_C1 = eachOrder;
        });

        done();
      });
    });
    it('should be success when assign order_C2 to driverC1', function (done) {
      assignInfoC[0].driver_id = driver_C1._id.toString();

      assignOrder(access_token_C, order_C2._id.toString(), assignInfoC, function (err, result) {
        should.exist(result.assignedInfos);
        result.assignedInfos.length.should.equal(assignInfoC.length);

        result.assignedInfos.forEach(function (eachInfo) {
          eachInfo.is_assigned.should.equal(true);
        });

        should.exist(result.assignedOrderList);
        result.assignedOrderList.length.should.equal(assignInfoC.length);

        result.assignedOrderList.forEach(function(eachOrder) {
          eachOrder.parent_order.toString().should.equal(order_C2._id.toString());
          eachOrder.create_company.toString().should.equal(company_C._id.toString());
          should.exist(eachOrder.execute_driver);
          eachOrder.execute_driver.toString().should.equal(driver_C1._id.toString());

          order_d_C2 = eachOrder;
        });

        done();
      });
    });

    //司机提货
    it('should be error when driverB1 pickUp where order id is empty', function (done) {
      driverUpload(access_token_d_B1, '', 'pickup', function (err, result) {
        should.exist(result.err);
        result.err.type.should.equal(transportEventError.should_upload_orderId.type);

        done();
      });
    });
    it('should be success when driverB1 pickUp with order_d_B1', function (done) {
      driverUpload(access_token_d_B1, order_d_B1._id.toString(), 'pickup', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(1);
        result.success[0].order_id.toString().should.equal(order_d_B1._id.toString());

        Order.findOne({_id: order_d_B1._id}, function (err, orderEntity) {
          orderEntity.status.should.equal('unDeliverySigned');
          Order.findOne({_id: order_A1._id.toString()}, function (err, orderA1Entity) {
            orderA1Entity._id.toString().should.equal(order_A1._id.toString());
            orderA1Entity.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });
    it('should be success when driverB1 pickUp with order_d_B21', function (done) {
      driverUpload(access_token_d_B1, order_d_B21._id.toString(), 'pickup', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(1);
        result.success[0].order_id.toString().should.equal(order_d_B21._id.toString());

        Order.findOne({_id: order_d_B21._id}, function (err, orderEntity) {
          orderEntity.status.should.equal('unDeliverySigned');
          Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
            orderA2Entity._id.toString().should.equal(order_A2._id.toString());
            orderA2Entity.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });

    it('should be success when driverB2 pickUp with order_d_B2 and order_d_B22', function (done) {
      driverUpload(access_token_d_B2, [order_d_B2._id.toString(),order_d_B22._id.toString()], 'pickup', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_B2._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_B22._id.toString()) > -1).should.equal(true);

        //order_d_B2
        Order.findOne({_id: order_d_B2._id.toString()}, function (err, order1Entity) {
          order1Entity.status.should.equal('unDeliverySigned');
          Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
            orderA2Entity._id.toString().should.equal(order_A2._id.toString());
            orderA2Entity.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });
    it('should be success when driverC1 pickUp with order_d_C1 and order_d_C2', function (done) {
      driverUpload(access_token_d_C1, [order_d_C1._id.toString(),order_d_C2._id.toString()], 'pickup', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_C1._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_C2._id.toString()) > -1).should.equal(true);

        //order_d_C1
        Order.findOne({_id: order_d_C1._id.toString()}, function (err, order1Entity) {
          order1Entity.status.should.equal('unDeliverySigned');
          Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
            orderA2Entity._id.toString().should.equal(order_A2._id.toString());
            orderA2Entity.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });
    it('should be success when driverA1 pickUp with order_d_A1 and order_d_A2', function (done) {
      driverUpload(access_token_d_A1, [order_d_A1._id.toString(),order_d_A2._id.toString()], 'pickup', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_A1._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_A2._id.toString()) > -1).should.equal(true);


        //order_d_A1
        Order.findOne({_id: order_d_A1._id.toString()}, function (err, order1Entity) {
          order1Entity.status.should.equal('unDeliverySigned');
          Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
            orderA2Entity._id.toString().should.equal(order_A2._id.toString());
            orderA2Entity.status.should.equal('unDeliverySigned');
            done();
          });
        });
      });
    });

    //司机交货
    it('order_B1 and order_B2 should not be completed  when driverB1 delivery with order_d_B1 and order_d_B21', function (done) {
      driverUpload(access_token_d_B1, [order_d_B1._id.toString(),order_d_B21._id.toString()], 'delivery', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_B1._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_B21._id.toString()) > -1).should.equal(true);

        //order_d_B1
        Order.findOne({_id: order_d_B1._id.toString()}, function (err, order1Entity) {
          order1Entity.status.should.equal('completed');
          Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
            orderA2Entity._id.toString().should.equal(order_A2._id.toString());
            orderA2Entity.status.should.equal('unDeliveried');
            done();
          });
        });
      });
    });
    it('order_B1 and order_B2 should be completed when driverB2 delivery with order_d_B2 and order_d_B22', function (done) {
      driverUpload(access_token_d_B2, [order_d_B2._id.toString(),order_d_B22._id.toString()], 'delivery', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_B2._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_B22._id.toString()) > -1).should.equal(true);

        Order.findOne({_id: order_B1._id.toString()}, function (err, orderB1Entity) {
            orderB1Entity._id.toString().should.equal(order_B1._id.toString());
            orderB1Entity.status.should.equal('completed');

            Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
              orderA2Entity._id.toString().should.equal(order_A2._id.toString());
              orderA2Entity.status.should.equal('unDeliveried');
              done();
          });
        });
      });
    });
    it('order_C1 and order_C2 should be completed when driverC1 delivery with order_d_C1 and order_d_C2', function (done) {
      driverUpload(access_token_d_C1, [order_d_C1._id.toString(),order_d_C2._id.toString()], 'delivery', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_C1._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_C2._id.toString()) > -1).should.equal(true);

        Order.findOne({_id: order_C1._id.toString()}, function (err, orderC1Entity) {
            orderC1Entity._id.toString().should.equal(order_C1._id.toString());
            orderC1Entity.status.should.equal('completed');

            Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
              orderA2Entity._id.toString().should.equal(order_A2._id.toString());
              orderA2Entity.status.should.equal('unDeliveried');
              done();
          });
        });
      });
    });
    it('order_A1 and order_A2 should be completed when driverA1 delivery with order_d_A1 and order_d_A2', function (done) {
      driverUpload(access_token_d_A1, [order_d_A1._id.toString(),order_d_A2._id.toString()], 'delivery', function (err, result) {
        should.not.exist(result.err);
        should.exist(result.success);
        result.success.length.should.equal(2);

        var orderIds = [];
        orderIds.push(result.success[0].order_id.toString());
        orderIds.push(result.success[1].order_id.toString());
        (orderIds.indexOf(order_d_A1._id.toString()) > -1).should.equal(true);
        (orderIds.indexOf(order_d_A2._id.toString()) > -1).should.equal(true);

        Order.findOne({_id: order_A1._id.toString()}, function (err, orderA1Entity) {
            orderA1Entity._id.toString().should.equal(order_A1._id.toString());
            orderA1Entity.status.should.equal('completed');

            Order.findOne({_id: order_A2._id.toString()}, function (err, orderA2Entity) {
              orderA2Entity._id.toString().should.equal(order_A2._id.toString());
              orderA2Entity.status.should.equal('completed');
              done();
          });
        });
      });
    });

    //获取司机上传的事件
    //目前不支持获取司机订单的事件
    //it('should get 2 event when get order_d_B1 events', function (done) {
    //  getDriverUploadEvent(access_token_B, order_d_B1._id.toString(), function (err, result) {
    //    console.log(result, '***777');
    //
    //    should.exist(result.order);
    //    result.order.createUsername.should.equal(user_B.username);
    //
    //    result.events.length.should.equal(2);
    //
    //    done();
    //  });
    //});
    it('should get 4 event when get order_B1 events', function (done) {
      getDriverUploadEvent(access_token_B, order_B1._id.toString(), function (err, result) {
        should.exist(result.order);
        result.order.createUsername.should.equal(user_A.username);

        result.events.length.should.equal(4);
        done();
      });
    });
    it('should get 8 event when get order_A1 events', function (done) {
      getDriverUploadEvent(access_token_A, order_A1._id.toString(), function (err, result) {
        should.exist(result.order);
        result.order.createUsername.should.equal(user_A.username);

        result.events.length.should.equal(8);
        done();
      });
    });

    //获取订单分配详细信息
    it('should be success when get order_A1 details', function (done) {
      getOrderAssignedDetailById(access_token_A, order_A1._id.toString(), function (err, result) {
        should.not.exist(result.err);

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
