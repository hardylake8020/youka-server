'use strict';

var mongoose = require('mongoose'),
  should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../config/config'),
  appDb = require('../../../libraries/mongoose').appDb,
  cryptoLib = require('../../libraries/crypto'),
  timeLib = require('../../libraries/time'),

  Order = appDb.model('Order'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  CompanyPartner = appDb.model('CompanyPartner'),
  InviteCompany = appDb.model('InviteCompany'),
  CompanyKey = appDb.model('CompanyKey');

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

//根据公司名称生成pk，sk，md5str
function generateCompanyKeys(companyName, callback) {
  agent.get(config.serverAddress + 'api/keys')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .query({
      companyName: companyName
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(res.body);
    });
}

function getOrderPage(sign, timestamp, company_id, order_number, callback) {
  agent.get(config.serverAddress + 'api/orderpage')
    .query({
      signature:sign,
      timestamp:timestamp,
      company_id:company_id,
      order_number:order_number
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(res.body);
    });
}

describe('Api Filter signature Unit Test', function () {
  before(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        InviteCompany.remove(function () {
          CompanyPartner.remove(function () {
            CompanyKey.remove(function () {
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

  var username_one = 'hardy@zhuzhuqs.com';
  var password = '123456';
  var user_one;
  //用户1注册激活
  it('should return a new and activated user with signup and activate', function (done) {
    userSignup(username_one, password, function (newUserOne) {
      user_one = newUserOne;
      userActivate(user_one._id, function (result) {
        done();
      });
    });
  });

  var user_one_access_token;
  it('should return a access_token after user_one signin', function (done) {
    userSignin(username_one, password, function (result) {
      user_one_access_token = result.access_token;
      done();
    });
  });

  var company_one_name = 'company_one_name',
    company_one_id = '',
    company_one_address = 'company_one_address',
    company_one_photo = 'company_one_photo',
    company_one_employees = 'company_one_employees',
    company_one;

  it('should return a new company with user_one create', function (done) {
    createComany(company_one_name, company_one_address, company_one_photo, company_one_employees, user_one_access_token, function (company) {
      company_one = company;
      company_one_id = company._id;
      company.name.should.equal(company_one_name);
      company.address.should.equal(company_one_address);
      done();
    });
  });

  var company_one_pk;
  var company_one_sk;
  var company_one_md5;
  it('should return an multi keys object with company_one_name', function (done) {
    generateCompanyKeys(company_one_name, function (result) {
      company_one_pk = result.public_key;
      company_one_sk = result.secret_key;
      company_one_md5 = result.md5_str;
      result.company.should.equal(company_one._id);
      result.md5_str.length.should.equal(32);
      done();
    });
  });

  it('should return an error of type equal empty_signature',function(done){
    getOrderPage('','','','',function(result){
      result.err.type.should.equal('empty_signature');
      done();
    });
  });

  var timestamp = timeLib.DateToyyyyMMddHHmmss(new Date());
  var signature = cryptoLib.toMd5(company_one_sk+'&'+company_one_pk+'&'+timestamp);
  it('should return an error of type equal empty_timestamp',function(done){
    getOrderPage(signature,'','','',function(result){
      result.err.type.should.equal('empty_timestamp');
      done();
    });
  });

  it('should return an error of type equal empty_company_id',function(done){
    getOrderPage(signature,timestamp,'','',function(result){
      result.err.type.should.equal('empty_company_id');
      done();
    });
  });

  it('should return an error of type equal internal_system_error',function(done){
    getOrderPage(signature,timestamp,'internal_system_error','',function(result){
      result.err.type.should.equal('internal_system_error');
      done();
    });
  });

  it('should return an error of type equal invalid_company_id',function(done){
    getOrderPage(signature,timestamp,user_one._id,'',function(result){
      result.err.type.should.equal('invalid_company_id');
      done();
    });
  });

  it('should return an error of type equal invalid_signature',function(done){
    getOrderPage('invalid_signature',timestamp,user_one._id,'',function(result){
      result.err.type.should.equal('invalid_company_id');
      done();
    });
  });
  after(function (done) {
    UserGroup.remove(function () {
      User.remove(function () {
        InviteCompany.remove(function () {
          CompanyPartner.remove(function () {
            CompanyKey.remove(function () {
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
});



