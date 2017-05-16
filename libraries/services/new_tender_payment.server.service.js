/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all'),
  dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment'),
  Promise = require('promise'),
  Excel = require('exceljs');

var appDb = require('../mongoose').appDb,
  Tender = appDb.model('Tender'),
  Driver = appDb.model('Driver'),
  Contact = appDb.model('Contact'),
  Order = appDb.model('Order'),
  Pay = appDb.model('Pay'),
  TransportEvent = appDb.model('TransportEvent'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;


exports.examine = function (tender, user, callback) {
  if (tender.status != 'completed') {
    return callback({err: {type: 'tender_not_completed'}});
  }

  tender.examined = true;
  tender.examined_username = user.username;
  tender.save(function (err, saveTender) {
    if (err || !saveTender) {
      return callback({err: error.system.db_error});
    }

    return callback(null, saveTender);
  });
};

exports.payment = function (tender, user, type, number, callback) {
  var payType = [
    'real_pay_top_cash',
    'real_pay_top_card',
    'real_pay_last_cash',
    'real_pay_last_card',
    'real_pay_tail_cash',
    'real_pay_tail_card',
    'real_pay_ya_jin',
  ];


  if (payType.indexOf(type) < 0) {
    return callback({err: {type: 'invalid_type'}});
  }
  tender[type + '_time'] = new Date();
  tender[type + '_username'] = user ? user.username : '';
  tender.save(function (err, saveTender) {
    if (err || !saveTender) {
      return callback({err: error.system.db_error});
    }
    return callback(null, saveTender);
  });
};

exports.getPaymentTenderList = function (created, type, callback) {
  var query = {};
  if (type == 'payment') {
    query = {
      $or: [
        {'can_pay_top': true, real_pay_top_cash_time: {$ne: null}},
        {'can_pay_tail': true, real_pay_tail_cash_time: {$ne: null}},
        {'can_pay_last': true, real_pay_last_cash_time: {$ne: null}},
        {'can_pay_ya_jin': true, real_pay_ya_jin_time: {$ne: null}}
      ]
    };
  }

  if (type == 'unpayment') {
    query = {
      $or: [
        {'can_pay_top': true, real_pay_top_cash_time: null},
        {'can_pay_tail': true, real_pay_tail_cash_time: null},
        {'can_pay_last': true, real_pay_last_cash_time: null},
        {'can_pay_ya_jin': true, real_pay_ya_jin_time: null}
      ]
    };
  }

  if (created) {
    query.created = {$lte: new Date(created)};
  }
  Tender.find(query).sort({created: -1}).limit(10).exec(function (err, results) {
    if (err || !results) {
      return callback({err: error.system.db_error});
    }
    return callback(null, results);
  });
};

var crypto = require('crypto');
var xml2js = require('xml2js');
var agent = require('superagent').agent();

exports.getWechatPayToken = function (driver, callback) {
  var pay = new Pay({
    out_trade_no: 'trade' + new Date().getTime(),
    driver: driver,
    total_fee: 1,
    nonce_str: new Date().getTime(),
    is_valid: false
  });

  pay.save(function (err, savePay) {
    if (err || !savePay) {
      return callback({err: error.system.db_error});
    }

    var body = '测试预付款';
    var mch_create_ip = '123.58.128.254';
    var mch_id = '755437000006';
    var nonce_str = savePay.nonce_str;
    var notify_url = 'http://' + mch_create_ip + ':3006/tender/driver/test_notifiy_url';
    var out_trade_no = savePay.out_trade_no;
    var total_fee = savePay.total_fee;
    var service = 'unified.trade.pay';
    var sk = '7daa4babae15ae17eee90c9e';

    var str = 'body=' + body +
      '&mch_create_ip=' + mch_create_ip +
      '&mch_id=' + mch_id +
      '&nonce_str=' + nonce_str +
      '&notify_url=' + notify_url +
      '&out_trade_no=' + out_trade_no +
      '&service=' + service +
      '&total_fee=' + total_fee +
      '&key=' + sk;
    console.log('str', str);
    var sign = crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();

    console.log(sign);
    var json = {
      "xml": {
        "service": service,
        "body": body,
        "notify_url": notify_url,
        "mch_id": mch_id,
        "nonce_str": nonce_str,
        "total_fee": total_fee,
        "out_trade_no": out_trade_no,
        "mch_create_ip": mch_create_ip,
        "sign": sign
      }
    };


    var builder = new xml2js.Builder();
    var xml = builder.buildObject(json);
    var parseString = xml2js.parseString;


    agent.post('https://pay.swiftpass.cn/pay/gateway')
      .set('Content-Type', 'application/xml')
      .send(xml)
      .end(function (err, result) {
        if (err) {
          console.log('testPreWechatPay res.err =================================================================>');
          console.log(err);
          return callback(err);
        }
        console.log('testPreWechatPay res.body =================================================================>');
        console.log(result.text);

        parseString(result.text, {explicitArray: false, ignoreAttrs: true}, function (err, data) {
          return callback(null, data.xml);
        });
      });

  });

};

exports.test_notifiy_url = function (data, callback) {
  console.log(data || {});
  return callback(null, {success: true});
};

exports.payTest = function () {
  console.log('test  pay tEST ===============>');

  var sk = '7daa4babae15ae17eee90c9e';
  var appid = 'wx2a5538052969956e';


  var str = 'body=测试支付&mch_create_ip=127.0.0.1&mch_id=755437000006&nonce_str=1409196838&notify_url=http://227.0.0.1:9001/tender/driver/test_notifiy_url&out_trade_no=141903606228&service=unified.trade.query';
  str += '&key=7daa4babae15ae17eee90c9e';
  var sign = crypto.createHash('md5').update(str).digest('hex').toUpperCase();
  console.log(sign);


  var json = {
    "xml": {
      "service": "unified.trade.query",
      "body": "测试支付",
      "notify_url": 'http://227.0.0.1:9001/tender/driver/test_notifiy_url',
      "mch_id": "755437000006",
      "nonce_str": "1409196838",
      "out_trade_no": "141903606228",
      "mch_create_ip": "127.0.0.1",
      "sign": sign
    }
  };


  console.log('json -> xml');
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(json);

  console.log(xml);

  agent.post('https://pay.swiftpass.cn/pay/gateway')
    .set('Content-Type', 'application/xml')
    .send(xml)
    .end(function (err, res) {
      console.log('res.err =================================================================>');
      console.log(err);
      console.log('res.body =================================================================>');
      console.log(res.text);
    });


  // // var json = parser.toJson(xml);
  // console.log("to json -> %s", json);
};
