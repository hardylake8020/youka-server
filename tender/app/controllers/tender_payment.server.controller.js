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

var crypto = require('crypto');
var xml2js = require('xml2js');



exports.testPreWechatPay = function (req, res, next) {

  var body = '测试预付款';
  var mch_create_ip = '123.58.128.254';
  var mch_id = '755437000006';
  var nonce_str = '1494863433292';
  var notify_url = 'http://' + mch_create_ip + ':3006/tender/driver/test_notifiy_url';
  var out_trade_no = '123456789';
  var total_fee = 10;
  var service = 'unified.trade.pay';
  var sk = '7daa4babae15ae17eee90c9e';

  var str = 'body=' + body +
    '&mch_create_ip=' + mch_create_ip +
    '&mch_id=' + mch_id +
    '&nonce_str=' + nonce_str +
    '&notify_url=' + notify_url +
    '&out_trade_no=' + out_trade_no +
    '&service=' + service +
    '&total_fee=' +total_fee+
    '&key=' + sk;
  console.log('str', str);
  var sign = crypto.createHash('md5').update(str).digest('hex').toUpperCase();
  console.log(sign);
  var json = {
    "xml": {
      "service": service,
      "body": body,
      "notify_url": notify_url,
      "mch_id": mch_id,
      "nonce_str": nonce_str,
      "total_fee":total_fee,
      "out_trade_no": out_trade_no,
      "mch_create_ip": mch_create_ip,
      "sign": sign
    }
  };


  var builder = new xml2js.Builder();
  var xml = builder.buildObject(json);

  agent.post('https://pay.swiftpass.cn/pay/gateway')
    .set('Content-Type', 'application/xml')
    .send(xml)
    .end(function (err, result) {
      if (err) {
        console.log('testPreWechatPay res.err =================================================================>');
        console.log(err);
        return res.send(err);
      }
      console.log('testPreWechatPay res.body =================================================================>');
      console.log(result.text);
      return res.send(result.text);
    });
};


exports.test_notifiy_url = function (req, res, next) {
  console.log(req.body || {});
  console.log(req.query || {});
  return res.send('test_notifiy_url success');
};

// exports.payTest = function (req, res, next) {
//
//
//   console.log('test  pay tEST ===============>');
//   console.log('body');
//   console.log(req.body || {});
//   console.log('query');
//   console.log(req.query || {});
//   return res.send('success');
// };

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
//
// exports.payTest();