'use strict';

var mongoose = require('mongoose'),
  appDb = require('../../../libraries/mongoose').appDb,
  should = require('should'),
  superagent = require('superagent'),
  config = require('../../../config/config'),

  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  CompanyPartner = appDb.model('CompanyPartner'),
  InviteCompany = appDb.model('InviteCompany');

var agent = superagent.agent();


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


describe('Route Company Unit Test:', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        InviteCompany.remove(function () {
          CompanyPartner.remove(function () {
            Company.remove(function () {
              Group.remove(function () {
                done();
              });
            });
          });
        });
      });
    });
  });


  describe('Create company and invite partner :', function () {

    var password = '123456';

    var username_one = 'alisan1@live.cn';
    //用户1注册激活
    var user_one;
    it('should return the second user and activate', function (done) {
      userSignup(username_one, password, function (userEntity) {
        user_one = userEntity;

        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户1登录
    var user_one_access_token;
    it('should return the access_token of the second user', function (done) {
      userSignin(username_one, password, function (result) {
        user_one_access_token = result.access_token;
        done();
      });
    });

    var company_one_name = 'test company 1';
    //用户1创建公司1
    var user_one_company;
    it('should return the company of the second user', function (done) {
      var address = 'test address 1',
        photo = 'test photo 1',
        employees = 'test employees 1';
      //创建公司
      createComany(company_one_name, address, photo, employees, user_one_access_token, function (company) {
        company.name.should.equal(company_one_name);
        company.address.should.equal(address);

        user_one_company = company;
        done();
      });
    });

    //用户2注册激活
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

    //用户2登录
    var user_two_access_token;
    it('should return the access_token of the second user', function (done) {
      userSignin(username_two, password, function (result) {
        user_two_access_token = result.access_token;
        done();
      });
    });

    var company_two_name = 'test company 2';
    //用户2创建公司2
    var user_two_company;
    it('should return the company of the second user', function (done) {
      var address = 'test address 2',
        photo = 'test photo 2',
        employees = 'test employees 2';
      //创建公司
      createComany(company_two_name, address, photo, employees, user_two_access_token, function (company) {
        company.name.should.equal(company_two_name);
        company.address.should.equal(address);

        user_two_company = company;
        done();
      });
    });

    //用户1邀请通过公司2名称
    it('should return an record of company partner', function (done) {
      agent.post(config.serverAddress + 'company/invitebycompanyname')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          company_name: user_two_company.name,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          should.exist(res.body.company);
          should.exist(res.body.partner);
          done();
        });
    });

    //再次通过公司2名称邀请合作公司，返回错误提示‘已经为合作公司’
    it('should return an error which type is has_been_partner', function (done) {

      agent.post(config.serverAddress + 'company/invitebycompanyname')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          company_name: user_two_company.name,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('has_been_partner');
          done();
        });
    });

    //通过不存在的公司名邀请合作公司，返回错误提示‘公司不存在’
    it('should return an error which type is company_not_exist', function (done) {

      agent.post(config.serverAddress + 'company/invitebycompanyname')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          company_name: '不存在的公司名',
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('company_not_exist');
          done();
        });
    });

    //邀请自己的公司通过不存在的公司名邀请合作公司，返回错误提示‘不能邀请自己公司为合作伙伴’
    it('should return an error which type is company_invite_itself', function (done) {

      agent.post(config.serverAddress + 'company/invitebycompanyname')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          company_name: company_one_name,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('company_invite_itself');
          done();
        });
    });

    //用户1通过用户2邀请以合作的公司2为合作公司，返回错误提示‘已经为合作公司‘
    it('should return an error of has_been_partner', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_two,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.err.type.should.equal('has_been_partner');
          done();
        });
    });

    //用户3注册激活
    var username_three = '18321740710@163.com';
    var user_three;
    it('should return the third user and activate', function (done) {
      userSignup(username_three, password, function (userEntity) {
        user_three = userEntity;

        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户3登录
    var user_three_access_token;
    it('should return the access_token of the third user', function (done) {
      userSignin(username_three, password, function (result) {
        user_three_access_token = result.access_token;
        done();
      });
    });

    var company_three_name = 'test company 3';
    //用户3创建公司3
    var user_three_company;
    it('should return the company of the third user', function (done) {
      var address = 'test address 3',
        photo = 'test photo 3',
        employees = 'test employees 3';
      //创建公司
      createComany(company_three_name, address, photo, employees, user_three_access_token, function (company) {
        company.name.should.equal(company_three_name);
        company.address.should.equal(address);

        user_three_company = company;
        done();
      });
    });

    //  用户1邀请已存在的用户3
    it('should return an record of user company partner', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_three,
          access_token: user_one_access_token
        })
        .end(function (err, res) {

          should.exist(res.body.company);
          should.exist(res.body.partner);
          done();
        });
    });

    //  用户1邀请不存在的用户4
    var username_four = '1963968619@qq.com';
    it('should return an record of user4 company partner and a invite_company record', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_four,
          access_token: user_one_access_token
        })
        .end(function (err, res) {

          res.body.type.should.equal('signup_email_sent');

          InviteCompany.findOne({username: username_four}, {company: user_one_company._id}, function (err, inviteCompany) {
            should.exist(inviteCompany);
            done();
          });
        });
    });

    //  用户2邀请不存在的用户4
    it('should return an record of user4 company partner and a invite_company record', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_four,
          access_token: user_two_access_token
        })
        .end(function (err, res) {

          res.body.type.should.equal('signup_email_sent');

          InviteCompany.findOne({username: username_four}, {company: user_two_company._id}, function (err, inviteCompany) {
            should.exist(inviteCompany);
            done();
          });
        });
    });


    var user_four;
    it('should return the forth user and activate', function (done) {
      userSignup(username_four, password, function (userEntity) {
        user_four = userEntity;

        userActivate(userEntity._id, function (result) {
          done();
        });
      });
    });

    //用户4登录
    var user_four_access_token;
    it('should return the access_token of the forth user', function (done) {
      userSignin(username_four, password, function (result) {
        user_four_access_token = result.access_token;
        done();
      });
    });

    var company_four_name = 'test company 4';
    //用户3创建公司3
    var user_four_company;
    it('should return the company of the forth user and the partnership has been build', function (done) {
      var address = 'test address 4',
        photo = 'test photo 4',
        employees = 'test employees 4';

      //创建公司
      createComany(company_four_name, address, photo, employees, user_four_access_token, function (company) {
        company.name.should.equal(company_four_name);
        company.address.should.equal(address);

        user_four_company = company;

        CompanyPartner.findOne({
          $or: [{company: user_one_company._id, partner: user_four_company._id},
            {partner: user_one_company._id, company: user_four_company._id}]
        }, function (err, companyPartner) {

          should.exist(companyPartner);

          CompanyPartner.findOne({
            $or: [{company: user_two_company._id, partner: user_four_company._id},
              {partner: user_two_company._id, company: user_four_company._id}]
          }, function (err, companyPartner2) {

            should.exist(companyPartner2);
            done();

          });
        });

      });
    });

    //test 邀请未激活的用户
    //用户5开放注册
    var username_five = 'elina@zhuzhuqs.com';
    var user_five;
    it('should return the fifth user', function (done) {
      userSignup(username_five, password, function (userEntity) {
        user_five = userEntity;
        done();
      });
    });

    //  用户1邀请未激活的用户5
    it('should return error about user5 company partner and a invite_company record', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_five,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.type.should.equal('user_activate_email_sent');
          InviteCompany.findOne({username: username_five}, {company: user_one_company._id}, function (err, inviteCompany) {
            should.exist(inviteCompany);
            done();
          });
        });
    });

    //用户5激活
    it('should return activate the user_five', function (done) {
      userActivate(user_five._id, function (result) {
        done();
      });
    });

    //test 邀请没有完善公司资料的用户
    //  用户1邀请未完善公司资料的的用户5
    it('should return error about user5 company partner and a invite_company record', function (done) {

      agent.post(config.serverAddress + 'company/invitebyusername')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          username: username_five,
          access_token: user_one_access_token
        })
        .end(function (err, res) {
          res.body.type.should.equal('company_not_completed');
          InviteCompany.findOne({username: username_five}, {company: user_one_company._id}, function (err, inviteCompany) {
            should.exist(inviteCompany);
            done();
          });
        });
    });

    //用户5登录
    var user_five_access_token;
    it('should return the access_token of the five user', function (done) {
      userSignin(username_five, password, function (result) {
        user_five_access_token = result.access_token;
        done();
      });
    });

    var company_five_name = 'test company 5';
    //用户5创建公司5
    var user_five_company;
    it('should return the company of the fifth user and the partnership has been build', function (done) {
      var address = 'test address 5',
        photo = 'test photo 5',
        employees = 'test employees 5';

      //创建公司
      createComany(company_five_name, address, photo, employees, user_five_access_token, function (company) {
        company.name.should.equal(company_five_name);
        company.address.should.equal(address);

        user_five_company = company;
        InviteCompany.findOne({
          username: username_five,
          company: user_one_company._id
        }, function (err, inviteCompany) {
          inviteCompany.status.should.equal('accepted');

          CompanyPartner.findOne({
            $or: [{company: user_one_company._id, partner: user_five_company._id},
              {partner: user_one_company._id, company: user_five_company._id}]
          }, function (err, companyPartner) {

            should.exist(companyPartner);

            done();
          });
        });
      });
    });


  });

  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        InviteCompany.remove(function () {
          CompanyPartner.remove(function () {
            Company.remove(function () {
              Group.remove(function () {
                done();
              });
            });
          });
        });
      });
    });
  });

});
