'use strict';

var agent = require('superagent').agent();
var ypSmsUrl = 'http://yunpian.com/v1/sms/send.json';
var ypApikey = '3ffb93004c47dcd38eb73626ac4f0213';

exports.ypSendSmsVerifyCode = function (phone, code, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】您的验证码' + code + '，请在10分钟内使用。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if(err || resp.code != 0){
        console.log('ypSendSmsVerifyCode', phone, code, err, res.text);
      }
      return callback(err, res.text);
    });
};

exports.ypSendKuaiChuangSmsVerifyCode = function (phone, code, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【船讯网快船】您的验证码是' + code + '，请在10分钟内使用。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if(err || resp.code != 0){
        console.log('ypSendKuaiChuangSmsVerifyCode', phone, code, err, res.text);
      }
      return callback(err, res.text);
    });
};


exports.ypSendPickupInforms = function (phone, name, order, search_number, driver, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】尊敬的' + name + '用户，您的运单' + order + '已经提货,查询单号为' + search_number + '。您的承运司机是' + driver + '。如需帮助，请与承运商或者司机联系！'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if(err || resp.code != 0){
        console.log('ypSendPickupInforms', phone, name, order, search_number, driver, err, res.text);
      }
      return callback(err, res.text);
    });
};

exports.sendDriverInviteSms = function (phone, companyName, callback) {
  if (process.env.NODE_ENV !== 'production') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + companyName + '公司派给您新的运输任务，请搜索微信公众号“柱柱签收网”,点击右侧菜单下载，或在各大应用商店直接搜索‘柱柱签收’下载应用。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if(err || resp.code != 0){
        console.log('sendDriverInviteSms', phone, companyName, err, res.text);
      }
      return callback(err, res.text);
    });
};

exports.ypSendAssginDriverSms = function (phone, accessUrl, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + '您有一条新运单，请在浏览器中查看，网址： ' + accessUrl
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if(err || resp.code != 0){
        console.log('ypSendAssginDriverSms', phone, accessUrl, err, res.text);
      }
      return callback(err, res.text);
    });
};

//不唯一
exports.generateVerifyCode = function () {
  var date = new Date();
  return '' + date.getHours() + date.getMinutes() + date.getSeconds();
};

// 添加合作中介，提示关注微信号
exports.sendBidderForWechat = function(phone){
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  agent.post(ypSmsUrl)
  .set('Accept', 'text/plain;charset=utf-8')
  .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
  .send({
    apikey: ypApikey,
    mobile: phone,
    text: '【柱柱签收】您有一条新标书，欲知详情，请关注微信公众号“柱柱签收网”'
  })
  .end(function (err, res) {
    var resp = JSON.parse(res.text);
    if(err || resp.code != 0){
      console.log('sendBidderForWechat', phone, text,  err, res.text);
    }
    return;
  });
};