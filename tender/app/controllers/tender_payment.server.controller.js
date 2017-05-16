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
  console.log(req);
  console.log('test_notifiy_url success');

  newTenderService.test_notifiy_url(req.body || req.query, function (err, result) {
    return res.send('success');
  });
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