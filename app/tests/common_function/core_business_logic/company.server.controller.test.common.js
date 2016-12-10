/**
 * Created by Wayne on 15/7/24.
 */

'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

//创建公司
exports.createCompany = function( access_token, name, address, photo, emplyees, isSuccessCheck, callback) {
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
      if (isSuccessCheck) {
        res.body.name.should.equal(name);
        res.body.address.should.equal(address);
        should.exist(res.body.default_group);
      }

      callback(err, res.body);
    });
};

//邀请合作公司，通过用户邮箱
exports.inviteCompanyByUserName = function(access_token, username, callback) {
  agent.post(config.serverAddress + 'company/invitebyusername')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

//邀请合作公司，通过公司名称
exports.inviteCompanyByCompanyName = function(access_token, companyName, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'company/invitebycompanyname')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      company_name: companyName,
      access_token: access_token
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        should.exist(res.body.company);
        should.exist(res.body.partner);
      }

      callback(err, res.body);
    });
};

//用户接受邀请并注册
exports.acceptInvitingAndSignUp = function(username, password, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'company/invite_company/activate')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.user.username.should.equal(username);
      }

      callback(err, res.body);
    });
};

//用户邀请司机
exports.inviteDriver= function(access_token, username, callback) {
  agent.post(config.serverAddress + 'driver/invite')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

exports.deleteInviteDriver = function(access_token, driverPhone, callback) {
  agent.post(config.serverAddress + 'company/invite_driver/delete')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      driver_phone: driverPhone,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

exports.deleteCorporateDriver = function(access_token, driverId, callback) {
  agent.post(config.serverAddress + 'company/corporate_driver/delete')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      driver_id: driverId,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

exports.deleteInviteCompany = function(access_token, username, callback) {
  agent.post(config.serverAddress + 'company/invite_company/delete')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      username: username,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

exports.deleteCorporateCompany = function(access_token, partnerCompanyId, callback) {
  agent.post(config.serverAddress + 'company/corporate_company/delete')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      partner_id: partnerCompanyId,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};