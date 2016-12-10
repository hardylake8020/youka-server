'use strict';

var agent = require('superagent').agent();
var ypSmsUrl = 'http://yunpian.com/v1/sms/send.json';
var ypApikey = '3ffb93004c47dcd38eb73626ac4f0213';
var config = require('../../config/config');


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
      if (err || resp.code != 0) {
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
      if (err || resp.code != 0) {
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
      if (err || resp.code != 0) {
        console.log('ypSendPickupInforms', phone, name, order, search_number, driver, err, res.text);
      }
      return callback(err, res.text);
    });
};


//提货推送
exports.ypSendPickupInfoForSalesman = function (phone, orderNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】尊敬的' + phone + '用户，您的单号为' + orderNumber + '的运单已发货。欲知详情，请关注微信公众号“柱柱签收网”。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupInfoForSalesman', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};


function getTimeString(time) {
  if (!time) {
    return '';
  }
  if (time.getTime) {
    return time.format('yyyy-MM-dd hh:mm');
  }
  return time;
}

//创建运单的推送
exports.ypSendCreateOrderInfoForAllOrderType = function (phone, orderNumber, senderName, createCompanyName, createTime, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + senderName + '委托' + createCompanyName + '于' + getTimeString(createTime) + '创建了运单（' + orderNumber + '）。欲知详情，请关注柱柱签收网公众号。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendCreateOrderInfoForAllOrderType', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};

//零担运输的提货推送
exports.ypSendPickupOrderInfoForLtlType = function (phone, orderNumber, createCompanyName, pickupTime, driverNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + createCompanyName + '的运单（' + orderNumber + '）于' + getTimeString(pickupTime) + '已发出，承运司机手机号码' + driverNumber + '。欲知详情，请关注柱柱签收网公众号。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupOrderInfoForLtlType', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};

//整车运输的提货推送
exports.ypSendPickupOrderInfoForTlType = function (phone, orderNumber, createCompanyName, pickupTime, driverNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + createCompanyName + '的运单（' + orderNumber + '）于' + getTimeString(pickupTime) + '已发出，承运司机手机号码' + driverNumber + '。欲知详情，请关注柱柱签收网公众号。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupOrderInfoForTlType', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};

//零担运输的到货（delivery_sign）推送
exports.ypSendDeliverySignOrderInfoForLtlType = function (phone, orderNumber, createCompanyName, deliverySignTime, driverNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】' + createCompanyName + '的运单（' + orderNumber + '）于' + getTimeString(deliverySignTime) + '已发出，配送司机手机号码' + driverNumber + '。欲知详情，请关注柱柱签收网公众号。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupOrderInfoForTlType', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};

//整车零担运输的送达（delivery）推送
exports.ypSendDeliveryOrderInfoForAllOrderType = function (phone, orderNumber, createCompanyName, deliveryTime, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】您委托' + createCompanyName + '承运的运单（' + orderNumber + '）于' + getTimeString(deliveryTime) + '已完美送达，欲知详情，请关注柱柱签收网公众号。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupOrderInfoForTlType', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};


//发货被延迟推送
exports.ypSendPickupDeferredInfoForSalesman = function (phone, orderNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】尊敬的' + phone + '用户，您的单号为' + orderNumber + '的运单发货被延迟。欲知详情，请关注微信公众号“柱柱签收网”。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendPickupDeferredInfoForSalesman', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};
//交货提前推送
exports.ypSendDeliveryEarlyInfoForSalesman = function (phone, orderNumber, callback) {
  if (process.env.NODE_ENV === 'test') {
    return callback();
  }

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】尊敬的' + phone + '用户，您的单号为' + orderNumber + '的运单即将到货。欲知详情，请关注微信公众号“柱柱签收网”。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('ypSendDeliveryEarlyInfoForSalesman', phone, orderNumber, err, res.text);
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
      text: '【柱柱签收】' + companyName + '公司派给您新的运输任务，请搜索微信公众号“柱柱签收网”,点击右侧菜单下载，或在各大应用商店直接搜索‘柱柱签收’下载应用。网址： ' + config.app_download_page_url
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
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
      if (err || resp.code != 0) {
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

exports.goConfirmOrder = function (phone, orderNumber, callback) {
  //if (process.env.NODE_ENV !== 'production') {
  //  return callback();
  //}

  console.log('goConfirmOrder send sms', phone, orderNumber);

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】您一小时前有新的运单（' + orderNumber + '），尚未进行确认。请立即登录柱柱APP确认。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('goConfirmOrder', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};

//两小时未确认运单，自动撤销司机运单，发送短信通知。
exports.repealDriverOrder = function (phone, orderNumber, callback) {
  //if (process.env.NODE_ENV !== 'production') {
  //  return callback();
  //}

  agent.post(ypSmsUrl)
    .set('Accept', 'text/plain;charset=utf-8')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
    .send({
      apikey: ypApikey,
      mobile: phone,
      text: '【柱柱签收】注意：由于长时间未确认，您的运单（' + orderNumber + '）已经被撤销。'
    })
    .end(function (err, res) {
      var resp = JSON.parse(res.text);
      if (err || resp.code != 0) {
        console.log('repealDriverOrder', phone, orderNumber, err, res.text);
      }
      return callback(err, res.text);
    });
};