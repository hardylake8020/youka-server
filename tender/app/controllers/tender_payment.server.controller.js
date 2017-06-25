/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var newTenderService = require('../../../libraries/services/new_tender_payment'),
  agent = require('superagent').agent(),
  fs = require('fs');

exports.examine = function (req, res, next) {
  var tender = req.tender;
  var user = req.user;
  newTenderService.examine(tender, user, function (err, result) {
    return res.send(err || result);
  });
};

exports.payment = function (req, res, next) {
  var tender = req.tender;
  var user = req.user;

  if (!req.body.type) {
    return res.send({err: {type: 'empty_type'}});
  }

  newTenderService.payment(tender, user, req.body.type, req.body.number, function (err, result) {
    return res.send(err || result);
  });
};

exports.getPaymentTenderList = function (req, res, next) {
  var created = req.body.created || '';
  var type = req.body.type || 'unpayment';

  newTenderService.getPaymentTenderList(created, type, function (err, result) {
    return res.send(err || result);
  });
};


exports.getWechatPayToken = function (req, res, next) {
  newTenderService.getWechatPayToken(req.driver, function (err, result) {
    return res.send(err || result);
  });
};

exports.test_notifiy_url = function (req, res, next) {
  console.log('test_notifiy_url success');
  var result = req.body.xml || {};
  if (result.status[0] != '0' || result.result_code[0] != '0') {
    console.log(result.status != '0');
    return res.send('faild');
  }

  var total_fee = parseInt(result.total_fee[0]) || 0;
  var out_trade_no = result.out_trade_no[0] || '';

  console.log('test_notifiy_url success');

  newTenderService.test_notifiy_url(out_trade_no, total_fee, result, function (err, result) {
    return res.send('success');
  });
};

exports.wechatPayResult = function (req, res, next) {
  var out_trade_no = req.body.out_trade_no || '';
  var driver = req.driver;
  newTenderService.wechatPayResult(driver, out_trade_no, function (err, result) {
    return res.send(err || result);
  });
};

exports.driverPayList = function (req, res, next) {
  var driver = req.driver;
  newTenderService.driverPayList(driver, function (err, result) {
    return res.send(err || result);
  });
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


//银行付款测试
exports.bankPayTest = function () {
  var Timestamp = getBankTimeStamp();
  var Appid = '28053608';
  var Service = 'cib.epay.payment.pay';
  var Ver = '02';
  var sign_type = 'RSA';
  // var sub_mrch = '';
  var order_no = new Date().getMilliseconds();
  var to_bank_no = '309391000011';
  var to_acct_no = '622909443442019514';
  var to_acct_name = '惠举';
  var acct_type = '0';
  var Cur = 'CNY';
  var trans_amt = '0.01';
  var trans_usage = '运费';
  var Mac = '';


};

function getBankTimeStamp() {
  var d = new Date();
  return '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + d.getHours() + d.getMinutes() + d.seconds();
}


// exports.payTest = function () {
//   console.log('test  pay tEST ===============>');
//
//   var sk = '7daa4babae15ae17eee90c9e';
//   var appid = 'wx2a5538052969956e';
//
//
//   var str = 'body=测试支付&mch_create_ip=127.0.0.1&mch_id=755437000006&nonce_str=1409196838&notify_url=http://227.0.0.1:9001/tender/driver/test_notifiy_url&out_trade_no=141903606228&service=unified.trade.query';
//   str += '&key=7daa4babae15ae17eee90c9e';
//   var sign = crypto.createHash('md5').update(str).digest('hex').toUpperCase();
//   console.log(sign);
//
//
//   var json = {
//     "xml": {
//       "service": "unified.trade.query",
//       "body": "测试支付",
//       "notify_url": 'http://227.0.0.1:9001/tender/driver/test_notifiy_url',
//       "mch_id": "755437000006",
//       "nonce_str": "1409196838",
//       "out_trade_no": "141903606228",
//       "mch_create_ip": "127.0.0.1",
//       "sign": sign
//     }
//   };
//
//
//   console.log('json -> xml');
//   var builder = new xml2js.Builder();
//   var xml = builder.buildObject(json);
//
//   console.log(xml);
//
//   agent.post('https://pay.swiftpass.cn/pay/gateway')
//     .set('Content-Type', 'application/xml')
//     .send(xml)
//     .end(function (err, res) {
//       console.log('res.err =================================================================>');
//       console.log(err);
//       console.log('res.body =================================================================>');
//       console.log(res.text);
//     });
//
//
//   // // var json = parser.toJson(xml);
//   // console.log("to json -> %s", json);
// };
