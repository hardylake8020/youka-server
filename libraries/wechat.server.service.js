/**
 * Created by louisha on 15/6/4.
 */
'use strict';

var
  cryptoLib = require('./crypto'),
  async = require('async'),
  superagent = require('superagent').agent(),
  smsLib = require('./sms'),
  error = require('../errors/all'),
  appDb = require('./mongoose').appDb,
  SmsVerify = appDb.model('SmsVerify');

var https = require('https');

var _token = '';
var _ticket = '';
var timeout_num = 6000;//超时，微信默认7200秒
var token_refresh_time = new Date('1970-01-01');


function refreshTokenAndTicket(callback) {
  var now = new Date();

  var token_url = process.env.wx_url + 'token?grant_type=client_credential&appid=' + process.env.wx_appid + '&secret=' + process.env.wx_secret;
  https.get(token_url, function (tokenRes) {
    tokenRes.on('data', function (tokenResult) {

      var parseTokenResult = JSON.parse(tokenResult);

      _token = parseTokenResult.access_token;
      console.log('new wechat sdk token:' + _token);
      console.log('new wechat sdk token expires_in:' + parseTokenResult.expires_in);

      if (parseTokenResult.expires_in && parseTokenResult.expires_in < timeout_num) {
        timeout_num = parseTokenResult.expires_in - 500;
      }

      //timeout_num = parseTokenResult.expires_in; //先不设置

      var ticket_url = process.env.wx_url + 'ticket/getticket?access_token=' + _token + '&type=jsapi';
      https.get(ticket_url, function (ticketRes) {
        ticketRes.on('data', function (ticketResult) {

          var parseTicketResult = JSON.parse(ticketResult);
          _ticket = parseTicketResult.ticket;
          console.log('new Ticket expires_in:' + parseTicketResult.expires_in);

          //timeout_num = parseTicketResult.expires_in;

          console.log('new Ticket:' + _ticket);
          token_refresh_time = now;

          return callback(null, {token: _token, ticket: _ticket});
        });
      });
    });
  });
}
function getTokenAndTicket(callback) {
  var now = new Date();
  if ((now.getTime() - token_refresh_time.getTime()) / 1000 > timeout_num) {

    refreshTokenAndTicket(callback);
  }
  else {
    return callback(null, {token: _token, ticket: _ticket});
  }
}

function initTokenAndTicket() {
  if (process.env.NODE_ENV === 'production-api') {
    getTokenAndTicket(function () {
    }); //启动服务器时获取token; 目前只有api服务器可以获取token
  }
}
initTokenAndTicket();

//生成随机字符串
exports.createNonceStr = function () {
  return Math.random().toString(36).substr(2, 15);
};

//生成时间戳
exports.createTimestamp = function () {
  return parseInt(new Date().getTime() / 1000) + '';
};

/**
 * 对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，
 * 使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。
 * @param args
 * @returns {string}
 */
exports.raw = function (args) {
  var keys = Object.keys(args);
  keys = keys.sort();
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

exports.getWechatTokenAndTicket = function (callback) {
  return getTokenAndTicket(callback);
};

exports.getUserInfo = function (accessToken, openid, callback) {
  var url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + accessToken + '&openid=' + openid + '&lang=zh_CN';
  superagent.get(url)
    .end(function (err, result) {
      return callback(err, JSON.parse(result.text));
    });
};
exports.getAccessTokenAndOpenIdByCode = function (code, callback) {
  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + process.env.wx_appid + '&secret=' + process.env.wx_secret + '&code=' + code + '&grant_type=authorization_code';
  superagent.get(url)
    .end(function (err, result) {
      return callback(err, JSON.parse(result.text));
    });
};

exports.createWxBindVerifyCode = function (phone, callback) {
  var code = smsLib.generateVerifyCode();
  new SmsVerify({code: code, type: 'wxBind'}).save(function (err, verify) {
    if (err || !verify) {
      return callback({err: error.system.db_error});
    }
    console.log('code : ', verify.code);
    console.log('phone : ', phone);

    smsLib.ypSendSmsVerifyCode(phone, verify.code, function () {
    });

    return callback(null, verify);
  });
};
exports.getWxBindVerifyCode = function (verifyCodeId, code, callback) {
  SmsVerify.findOne({_id: verifyCodeId, code: code, type: 'wxBind'}, function (err, verify) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (!verify) {
      return callback({err: error.business.sms_code_invalid});
    }

    return callback(null, verify);
  });
};


function isBadToken(res) {
  if (!res || !res.text) {
    return false;
  }
  console.log('+++++ res.text ' + res.text + '++++');
  if (res.text && !res.text.errcode) {
    try {
      res.text = JSON.parse(res.text);
    }
    catch (e) {

    }
  }
  if (res.text.errcode) {
    console.log('+++++ res.text.errcode ' + res.text.errcode + '++++');

    return true;
  }

  return false;
}

function getPhotoItemFromWechat(photoItem, wechatToken, callback) {

  var fileUrl = 'http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + wechatToken + '&media_id=' + photoItem.serverId;
  console.log('fileUrl ' + fileUrl);

  var qiniuUrlPath = cryptoLib.toBase64(fileUrl).replace(/\+/g, '-').replace(/\//g, '_') + '/to/' + cryptoLib.toBase64('zhuzhuqs:@' + photoItem.filename).replace(/\+/g, '-').replace(/\//g, '_');
  var sigingStr = '/fetch/' + qiniuUrlPath + '\n';
  var signBinary = cryptoLib.createHmacBinary(sigingStr, process.env.qiniu_s_key);
  var base64Str = signBinary.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  var accessToken = process.env.qiniu_a_key + ':' + base64Str;

  console.log('accessToken: ' + accessToken);

  var url = 'http://iovip.qbox.me/fetch/' + qiniuUrlPath;

  superagent.post(url)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('Authorization', 'QBox ' + accessToken)
    .send()
    .end(function (err, res) {
      callback(err, res.body);
    });
}


//photos: [{serverId, filename}]
exports.sendWechatPhotoToQiniu = function (photos, callback) {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    console.log('photos is empty');
    return;
  }

  getTokenAndTicket(function (err, tokenResult) {
    async.auto({
      checkToken: function (autoCallback) {
        var fileUrl = 'http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + tokenResult.token + '&media_id=' + photos[0].serverId;
        console.log('fileUrl ' + fileUrl);
        superagent.get(fileUrl)
          .end(function (err, res) {
            if (isBadToken(res)) {
              console.log('=============refresh token==========');
              refreshTokenAndTicket(function (err, result) {
                return autoCallback(null, {token: result.token});
              });
            }
            else {
              return autoCallback(null, {token: tokenResult.token});
            }
          });
      },
      uploadPhotos: ['checkToken', function (autoCallback, result) {
        async.eachSeries(photos, function (photoItem, eachCallback) {
          if (!photoItem.serverId || !photoItem.filename) {
            console.log('photoItem is empty');
            return eachCallback();
          }
          getPhotoItemFromWechat(photoItem, result.checkToken.token, function (err, uploadResult) {
            //uploadResult内容
            //{
            //  fsize: 194681,
            //  hash: 'FucL5QSEQuP9EqmjBUNTyl7L30pm',
            //  key: '@68TZCqR7mfabH4sWyLsAZB2L5mH0HvR4x_8LwAdeS4oYGzpyQ0sKVVZUMw-pY5Ih20160201233342',
            //  mimeType: 'image/jpeg'
            //}
            console.log('getPhotoItemFromWechat err  =====================>');
            console.log(err);
            console.log('uploadResult =====================>');
            console.log(uploadResult);
            return eachCallback();
          });
        }, function (err) {
          return autoCallback();
        });
      }]
    }, function (err, result) {
      console.log('send wechat photos to qiniu over');
    });

  });
};

//测试专用
//exports.getwechatphotos = function () {
//  var photoItem = {
//    serverId: 'FmmTsvn8WPeP_xu5qSNJAHbHpk3_EAx-0JmCoZ1gtIEVTh-_GgZBEsUdmGQoZrlz',
//    filename: 'FmmTsvn8WPeP_xu5qSNJAHbHpk3_EAx-0JmCoZ1gtIEVTh-_GgZBEsUdmGQoZrlz20160201000901'
//  };
//  var wechatToken = 'XxzZC3aK72EMplA9dwMVZOQG9xj63GJo5nv-up6uYk0rVBjqeYGJM2Oe3nLZiEYga3xOQWhQ8wnW3AvPDQ1LfoHdT6Ub9HRxsZayis6dkEs-bIGj6hLsgJaOtlivgoVFIIYjAHAVVL';
//
//  getPhotoItemFromWechat(photoItem, wechatToken, function (err, result) {
//    console.log('err  =====================>');
//    console.log(err);
//    console.log('result =====================>');
//    console.log(result);
//  });
//};
