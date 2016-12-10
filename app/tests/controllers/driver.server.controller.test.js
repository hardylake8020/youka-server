'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  config = require('../../../config/config'),

  Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  InviteDriver = appDb.model('InviteDriver');

var username = '13472423583',
  password = '123456',
  agent = superagent.agent();

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
      callback(res.body);
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

//创建公司返回公司
function createComany(name, address, photo, emplyees, access_token, callback) {
  var postData = {
    name: name,
    address: address,
    photo: photo,
    employes: emplyees,
    access_token: access_token
  };

  agent.post(config.serverAddress + 'company')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send(postData)
    .end(function (err, res) {
      callback(res.body);
    });
}

describe('Route Driver Unit Test', function () {
  before(function (done) {
    User.remove(function () {
      Company.remove(function () {
        Group.remove(function () {
          InviteDriver.remove(function () {
            Driver.remove(function () {
              done();
            });
          });
        });
      });
    });
  });

  describe('Driver checks the partner list and accept the first one and confuse the second one', function () {
    //两个用户进行开放注册，激活， 登录，邀请同一个司机，这个司机注册登录查看合作司机列表，并且接受第一个公司要求，拒绝另一个公司

    //用户一注册激活
    var username_one = '10983066@qq.com';
    var user_one;
    it('should return the first user and activate', function (done) {
      userSignup(username_one, password, function (user) {
        user_one = user;

        userActivate(user._id, function (result) {
          done();
        });
      });
    });

    //用户一登录
    var user_one_access_token;
    it('should return the access_token of the first user', function (done) {
      userSignin(username_one, password, function (result) {
        user_one_access_token = result.access_token;
        done();
      });
    });

    //用户一创建公司一
    var user_one_company;
    it('should return the company of the first user', function (done) {
      var name = 'test company',
        address = 'test address',
        photo = 'test photo',
        employees = 'test employees';
      //创建公司
      createComany(name, address, photo, employees, user_one_access_token, function (company) {
        company.name.should.equal(name);
        company.address.should.equal(address);

        user_one_company = company;
        done();
      });
    });

    //用户一邀请司机
    it('should return a record for the first user to invite the driver', function (done) {
      userInviteDriver(username, user_one_access_token, function (result) {
        done();
      });
    });

    //用户二注册激活
    var username_two = 'alisan1@live.cn';
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

    //用户二邀请司机
    it('should return a record for the second user to invite the driver', function (done) {
      userInviteDriver(username, user_two_access_token, function (result) {
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
          username: username
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          var smsVerify = res.body;
          //注册
          agent.post(config.serverAddress + 'driver/signup')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({
              username: username,
              password: password,
              sms_verify_id: smsVerify._id,
              sms_verify_code: smsVerify.code
            })
            .end(function (err, res) {
              if (err)
                console.log(err);

              //console.log(res.body,'=====????????');

              //登录
              agent.post(config.serverAddress + 'driver/signin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  username: username,
                  password: password
                })
                .end(function (err, res) {

                  res.body.driver.username.should.equal(username);
                  res.body.access_token.should.not.equal(undefined);

                  driver_access_token = res.body.access_token;
                  driver = res.body.driver;
                  done();
                });
            });
        });

    });

    //这个司机更新设备id
    it('should return the driver with the device id', function (done) {
      //获取验证码
      agent.post(config.serverAddress + 'driver/device/update')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          access_token: driver_access_token,
          device_id: 'abcde'
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.success.should.equal(true);
          done();
        });
    });

    //司机获取partner列表，其中有两条记录
    it('should return a partner list for two partner', function (done) {
      agent.get(config.serverAddress + 'driver/partner')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username,
          access_token: driver_access_token
        })
        .end(function (err, res) {
          res.body.length.should.equal(2);
          done();
        });
    });


    ////司机接受第一个partner，拒绝第二个partner
    //it('should return two success for accepting the first and confusing a partner', function (done) {
    //  var postData = {
    //    username: username,
    //    access_token: driver_access_token,
    //    company_id: user_one_company._id
    //  };
    //  //接受第一个partner
    //  agent.post(config.serverAddress + 'driver/partner/accept')
    //    .set('Content-Type', 'application/x-www-form-urlencoded')
    //    .send(postData)
    //    .end(function (err, res) {
    //      res.body.success.should.equal(true);
    //
    //      //拒绝第二个partner
    //      agent.post(config.serverAddress + 'driver/partner/confuse')
    //        .set('Content-Type', 'application/x-www-form-urlencoded')
    //        .send({
    //          username: username,
    //          access_token: driver_access_token,
    //          company_id: user_two_company._id
    //        })
    //        .end(function (err, res) {
    //          res.body.success.should.equal(true);
    //          done();
    //        });
    //    });
    //});
    //
    //
    ////司机接受第一个partner，拒绝第二个partner
    //it('should return two success for accepting the first and confusing a partner again', function (done) {
    //  var postData = {
    //    username: username,
    //    access_token: driver_access_token,
    //    company_id: user_one_company._id
    //  };
    //  //接受第一个partner
    //  agent.post(config.serverAddress + 'driver/partner/accept')
    //    .set('Content-Type', 'application/x-www-form-urlencoded')
    //    .send(postData)
    //    .end(function (err, res) {
    //
    //      res.body.err.type.should.equal('driver_has_accepted_partner');
    //
    //      //拒绝第二个partner
    //      agent.post(config.serverAddress + 'driver/partner/confuse')
    //        .set('Content-Type', 'application/x-www-form-urlencoded')
    //        .send({
    //          username: username,
    //          access_token: driver_access_token,
    //          company_id: user_two_company._id
    //        })
    //        .end(function (err, res) {
    //
    //          res.body.err.type.should.equal('driver_has_confused_partner');
    //
    //
    //          done();
    //        });
    //    });
    //});

    //司机更新个人信息
    it('should return true after update profile', function (done) {
      agent.post(config.serverAddress + 'driver/profile')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          access_token: driver_access_token,
          profile: JSON.stringify({
            'nickname': '小黑',
            'birthday': '2014-4-20',
            'phone': '110',
            'photo': 'images/photos/1.jpg',
            'id_card_number': '410825198907852222',
            'id_card_photo': 'images/photos/2.jpg',
            'driving_id_number': '110331598908e0wrw',
            'travel_id_number': 'abcdeft',
            'driving_id_photo': 'images/photo/driver_id_photo.png', //驾驶证照片（string）
            'travel_id_photo': 'images/photo/travel_id_photo.png', //行驶证照片（string）
            'truck_photo': 'images/photo/1.png',    //卡车照片（string）
            'plate_numbers': ['132435', 'M1234', 'abde'],  //牌照号码（string ［］）
            'plate_photos': ['1.png', '2.png'],   //牌照照片（string［］）
            'operating_permits_photo': '3.png'
          })
        })
        .end(function (err, res) {
          if (err)
            console.log(err);

          res.body.id_card_photo.should.equal('images/photos/2.jpg');
          res.body.id_card_number.should.equal('410825198907852222');
          res.body.plate_numbers.length.should.equal(3);
          done();

        });
    });





  });

  after(function (done) {
    User.remove(function () {
      Company.remove(function () {
        Group.remove(function () {
          InviteDriver.remove(function () {
            Driver.remove(function () {
              done();
            });
          });
        });
      });
    });
  });
});





