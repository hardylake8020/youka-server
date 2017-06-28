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
          data.xml.out_trade_no = out_trade_no;
          return callback(null, data.xml);
        });
      });

  });

};

exports.test_notifiy_url = function (out_trade_no, total_fee, data, callback) {
  Pay.findOne({
    out_trade_no: out_trade_no,
    total_fee: total_fee,

  }, function (err, result) {
    if (err || !result) {
      return callback('err');
    }

    if (result.is_valid) {
      return callback(null, 'success');
    }

    result.is_valid = true;
    result.data = {
      "bank_type": data.bank_type[0],
      "charset": data.charset[0],
      "fee_type": data.fee_type[0],
      "is_subscribe": data.is_subscribe[0],
      "mch_id": data.mch_id[0],
      "nonce_str": data.nonce_str[0],
      "openid": data.openid[0],
      "out_trade_no": data.out_trade_no[0],
      "out_transaction_id": data.out_transaction_id[0],
      "pay_result": data.pay_result[0],
      "result_code": data.result_code[0],
      "sign": data.sign[0],
      "sign_type": data.sign_type[0],
      "status": data.status[0],
      "sub_appid": data.sub_appid[0],
      "sub_is_subscribe": data.sub_is_subscribe[0],
      "sub_openid": data.sub_openid[0],
      "time_end": data.time_end[0],
      "total_fee": data.total_fee[0],
      "trade_type": data.trade_type[0],
      "transaction_id": data.transaction_id[0],
      "version": data.version[0],
    };
    result.save(function (err, savePay) {
      if (err || !savePay) {
        return callback('err');
      }
      return callback(null, 'success');
    });
  });
};

exports.wechatPayResult = function (driver, out_trade_no, callback) {
  Pay.findOne({out_trade_no: out_trade_no, is_valid: true, driver: driver._id}, function (err, result) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (!result) {
      return callback(null, {success: false});
    }
    return callback(null, {success: true});
  })
};

exports.driverPayList = function (driver, callback) {
  Pay.find({driver: driver._id, is_valid: true}, function (err, results) {
    if (err || !results) {
      return callback({err: error.system.db_error});
    }
    return callback(null, {pay_list: results});
  })
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


//测试卡号：622909443442019514
//银行行号： 309391000011
//账户类型：储蓄卡
//姓名：惠举
//
//测试卡号：4512906000064106
//银行行号： 309391000011
//账户类型：信用卡
//姓名：胡兰
//
//测试卡号：6222801234567888953
//银行行号：105100000017
//账户类型：储蓄卡
//姓名：张三
//
//测试账号：117010100100316139
//银行行号：309391000011
//账户类型：对公账户
//企业名称：X的测试账户


var crypto = require('crypto');
var fs = require('fs');

//银行付款测试
exports.bankPayTest = function () {

  var params = {
    acct_type: '0',
    appid: 'Q0000954',
    cur: 'CNY',
    order_no: new Date().getMilliseconds(),
    timestamp: getBankTimeStamp(),
    to_acct_name: '惠举',
    service: 'cib.epay.payment.pay',
    ver: '02',
    sign_type: 'RSA',
    to_bank_no: '309391000011',
    to_acct_no: '622909443442019514',
    trans_amt: '0.01',
    trans_usage: '运费',
    mac: ''
  };

  var paramsList = [];
  var paramString = '';
  for (var pro in params) {
    if (pro != 'mac')
      paramsList.push(pro + '=' + params[pro]);
  }
  paramsList.sort();
  console.log(paramsList);

  for (var i = 0; i < paramsList.length; i++) {
    paramString += (i == 0 ? paramsList[i] : ('&' + paramsList[i]));
  }
  console.log(paramString);

  var sign = crypto.createSign('RSA-SHA1').update(paramString);
  var signKey = fs.readFileSync('./key/privkey.pem').toString();
  var mac = sign.sign(signKey, 'base64');
  params.mac = mac;

  console.log(params);

  agent.post('https://3gtest.cib.com.cn:37031/payment/api')
    // agent.post('https://pay.cib.com.cn/payment/api')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send(params)
    .end(function (err, result) {
      if (err) {
        console.log('银行代付测试 res.err =================================================================>');
        console.log(err);
      }
      console.log('银行代付测试 res=================================================================>');
      if (result)
        console.log(result.text);
    });
};

exports.bankPayTest();

function getBankTimeStamp() {
  var d = new Date();
  return '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + d.getHours() + d.getMinutes() + d.getSeconds();
}









