/**
 * Created by louisha on 15/6/5.
 */
'use strict';

var path = require('path'),
  config = require('../../../config/config'),
  https = require('https'),
  jsSHA = require('jssha'),
  wechatService = require('../../services/wechat/wechat');


exports.checkSignature = function (req, res, next) {

  console.log('来自微信的get请求：' + JSON.stringify(req.query));
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var echoStr = req.query.echostr;
  var _token = config.wx_token;
  var tmp = [_token, timestamp, nonce];
  tmp = tmp.sort();
  var _str = '';
  for (var i = 0; i < tmp.length; i++) {
    _str += tmp[i];
  }
  var shaObj = new jsSHA(_str, 'TEXT');
  var my_signature = shaObj.getHash('SHA-1', 'HEX');
  console.log('sign:' + my_signature + ' wx:' + signature);
  if (my_signature === signature) {
    req.data = echoStr;
    return next();
  }
  else {
    req.err = {err: '验证失败，非法请求'};
    return next();
  }
};

exports.refreshToken = function () {
  /*
   var token_url = config.wx_url + 'token?grant_type=client_credential&appid=' + config.wx_appid + '&secret=' + config.wx_secret;
   https.get(token_url, function (_res) {
   _res.on('data', function (obj) {
   var _da = JSON.parse(obj);
   _token = _da.access_token;
   console.log('new token:' + _token);
   timeout_num = _da.expires_in;
   var _url = config.url + 'ticket/getticket?access_token=' + _token + '&type=jsapi';
   https.get(_url, function (_res) {
   _res.on('data', function (obj) {
   var _da = JSON.parse(obj);
   _ticket = _da.ticket;
   timeout_num = _da.expires_in;
   console.log('new Ticket:' + _ticket);
   req.data = 'success';
   return next();
   });
   })
   });
   })*/
};

/**
 * 签名算法
 * 签名生成规则如下：
 *参与签名的字段包括noncestr（随机字符串）,
 *有效的jsapi_ticket, timestamp（时间戳）,
 *url（当前网页的URL，不包含#及其后面部分） 。
 *对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，
 *使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。
 *这里需要注意的是所有参数名均为小写字符。对string1作sha1加密，字段名和字段值都采用原始值，不进行URL 转义。
 */
exports.createSign = function (req, res, next) {
  var wx_url = req.body.url;
  console.log('target url:' + wx_url);
  wechatService.getWechatTokenAndTicket(function (err, result) {
    var ret = {
      jsapi_ticket: result.ticket,
      nonceStr: wechatService.createNonceStr(),
      timestamp: wechatService.createTimestamp(),
      url: wx_url
    };
    var string = wechatService.raw(ret);
    var shaObj = new jsSHA(string, 'TEXT');
    ret.signature = shaObj.getHash('SHA-1', 'HEX');

    req.data = {
      timestamp: ret.timestamp,
      nonceStr: ret.nonceStr,
      signature: ret.signature,
      appid: config.wx_appid,
      token: result.token
    };
    return next();
  });
};