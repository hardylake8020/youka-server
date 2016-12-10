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

function createMultiOrdersApi(group_name, signature, order_infos, company_id, timestamp, callback) {
  agent.post(config.serverAddress + 'api/multiorder')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      group_name: group_name,
      signature: signature,
      order_infos: order_infos,
      company_id: company_id,
      timestamp: timestamp
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(res.body);
    });
}


describe('Api Key Generation Unit Test', function () {
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
  var timestamp;
  var signature;

  it('should return an multi keys object with company_one_name', function (done) {
    generateCompanyKeys(company_one_name, function (result) {
      company_one_pk = result.public_key;
      company_one_sk = result.secret_key;
      company_one_md5 = result.md5_str;
      timestamp = timeLib.DateToyyyyMMddHHmmss(new Date());
      signature = cryptoLib.toMd5(company_one_sk + '&' + company_one_pk + '&' + timestamp);

      result.company.should.equal(company_one._id);
      result.md5_str.length.should.equal(32);
      done();
    });
  });

  it('should return an err with type equal invalid_company_name', function (done) {
    generateCompanyKeys(null, function (result) {
      result.err.type.should.equal('invalid_company_name');
      done();
    });
  });

  it('should return an err with type equal company_not_exist', function (done) {
    generateCompanyKeys('not_exit_company', function (result) {
      result.err.type.should.equal('company_not_exist');
      done();
    });
  });


  it('should return an err with type equal invalid_group_name', function (done) {
    createMultiOrdersApi('', signature, [''], company_one_id, timestamp, function (result) {
      result.err.type.should.equal('invalid_group_name');
      done();
    });
  });

  it('should return an err with type equal invalid_order_infos', function (done) {
    createMultiOrdersApi('default_group', signature, 'invalid_order_infos', company_one_id, timestamp, function (result) {
      result.err.type.should.equal('invalid_order_infos');
      done();
    });
  });

  it('should return an err with type equal order_length_too_long', function (done) {
    var orderInfos = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      1
    ];
    createMultiOrdersApi('default_group', signature, orderInfos, company_one_id, timestamp, function (result) {
      result.err.type.should.equal('order_length_too_long');
      done();
    });
  });

  it('should return an err with type equal group_not_exist', function (done) {
    createMultiOrdersApi('not_exist_group', signature, [''], company_one_id, timestamp, function (result) {
      result.err.type.should.equal('group_not_exist');
      done();
    });
  });

  var order_test_infos = [
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    }
  ];

  it('should return an object with success equal true and successCount equal 2 ', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.totalCount.should.equal(2);
      result.successCount.should.equal(2);
      result.errorArray.length.should.equal(0);
      done();
    });
  });

  it('should return an object with success equal false and successCount equal 1', function (done) {
    order_test_infos[0].order_number = '';
    createMultiOrdersApi('default_group', signature, order_test_infos, company_one_id, timestamp, function (result) {
      result.success.should.equal(false);
      result.totalCount.should.equal(2);
      result.successCount.should.equal(1);
      result.errorArray.length.should.equal(1);
      done();
    });
  });

  var order_test_infos_100_count = [
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number1',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    },
    {
      'order_number': 'tes order number2',
      'refer_order_number': 'test ref number',
      'goods_name': 'tes goods name',
      'count': '12',
      'weight': '12',
      'volume': '123',
      'count_unit': '箱',
      'weight_unit': '吨',
      'volume_unit': '立方',
      'freight_charge': '',
      'customer_name': 'test customrer name',
      'pickup_start_time': '2015-06-03T07:09:00.000Z',
      'delivery_start_time': '2015-06-03T07:09:00.000Z',
      'pickup_end_time': '2015-06-03T15:59:59.999Z',
      'delivery_end_time': '2015-06-03T15:59:59.999Z',
      'description': 'test description',
      'group_id': '',
      'pickup_contact_name': 'test pickup contact',
      'pickup_contact_phone': '',
      'pickup_contact_mobile_phone': '13472423583',
      'pickup_contact_address': 'test pickup addresss',
      'pickup_contact_email': '',
      'delivery_contact_name': 'test delivery con',
      'delivery_contact_phone': '',
      'delivery_contact_mobile_phone': '13472423583',
      'delivery_contact_address': 'tes dilivery address',
      'delivery_contact_email': ''
    }
  ];

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an orject with success equal true and successCount equal 50', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.success.should.equal(true);
      result.successCount.should.equal(50);
      done();
    });
  });

  it('should return an err with type too_much_order_per_day', function (done) {
    createMultiOrdersApi('default_group', signature, order_test_infos_100_count, company_one_id, timestamp, function (result) {
      result.err.type.should.equal('too_much_order_per_day');
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
