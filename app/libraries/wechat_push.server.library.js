/**
 * Created by zenghong on 15/12/13.
 */
'use strict';

var access_token = '',
  allEnum = require('../../enums/all'),
  config = require('../../config/config'),
  moment = require('moment'),
  superagent = require('superagent').agent(),
  salesmanService = require('../services/wechat/salesman');

function getAccessToken(callback) {
  var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.wx_appid + '&secret=' + config.wx_secret;
  superagent.get(url)
    .end(function (err, result) {
      result = JSON.parse(result.text);
      access_token = result.access_token;
      console.log('get access_token : -------------->');
      console.log(result);
      return callback(err, result);
    });
}
function sendMessage(message) {
  superagent.post('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + access_token)
    .send(message)
    .end(function (err, result) {
      result = JSON.parse(result.text);

      console.log('result 1 event -------------');
      console.log(result);

      if (result.errcode === 40001 || result.errcode === 41001 || result.errcode === 42001) {

        getAccessToken(function (err, tokenInfo) {
          superagent.post('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + tokenInfo.access_token)
            .send(message)
            .end(function (err2, result2) {
              console.log('result 2 event -----------');
              console.log(JSON.parse(result2.text));
            });
        });
      }
    });
}

function pushAbnormalInfoToWechat(openid, orderid, orderNumber, abnormalType) {
  var templateId = '09ysPtZgL8xP0NOZDorTrsULuC3bRXnkb24mxwYvXiA';
  var first = '您好,您有一票运单出现异常事件';
  var keyword2 = orderNumber;
  var keyword3 = abnormalType;
  var keyword4 = moment().format('YY/MM/DD HH:mm');
  var keyword5 = '1234565';
  var remark = '点击查看详情';
  var url = config.serverAddress + 'salesman_order_detail?order_id=' + orderid;

  var json = {
    "touser": openid,
    "template_id": templateId,
    "url": url,
    "topcolor": "#FF0000",
    "data": {
      "first": {
        "value": first,
        "color": "#173177"
      },
      "keyword2": {
        "value": keyword2,
        "color": "#173177"
      },
      "keyword3": {
        "value": keyword3,
        "color": "#173177"
      },
      "keyword4": {
        "value": keyword4,
        "color": "#173177"
      },
      "keyword5": {
        "value": keyword5,
        "color": "#173177"
      },
      "remark": {
        "value": remark,
        "color": "#173177"
      }
    }
  };

  sendMessage(json);
}

function pushDeliveryEarlyInfoToWechat(openid, orderid, orderNumber, deliveryStartTime) {
  var templateId = 'fHhleqbYtFDBm7YrbTtR8wzBl6Un6R-HnnlHsS_GCMc';
  var first = '您好,您有一票运单即将到货';
  var keyword1 = orderNumber;
  var keyword2 = deliveryStartTime ? moment(deliveryStartTime).format('YY/MM/DD HH:mm') : '';
  var remark = '点击查看详情';
  var url = config.serverAddress + 'salesman_order_detail?order_id=' + orderid;

  var json = {
    "touser": openid,
    "template_id": templateId,
    "url": url,
    "topcolor": "#FF0000",
    "data": {
      "first": {
        "value": first,
        "color": "#173177"
      },
      "keyword1": {
        "value": keyword1,
        "color": "#173177"
      },
      "keyword2": {
        "value": keyword2,
        "color": "#173177"
      },
      "remark": {
        "value": remark,
        "color": "#173177"
      }
    }
  };

  sendMessage(json);
}

function pushPickupInfoToWechat(openid, orderid, orderNumber, pickupTime, pickupAddress) {
  var templateId = 'fmOd8sH3qRya8weGmzXrcANPTDB101TBUu5Ki92T1zM';
  var first = '您好,您有一票运单已经发货';
  var keyword1 = orderNumber;
  var keyword2 = pickupTime ? moment(pickupTime).format('YY/MM/DD HH:mm') : '';
  var keyword3 = pickupAddress;
  var remark = '点击查看详情';
  var url = config.serverAddress + 'salesman_order_detail?order_id=' + orderid;

  var json = {
    "touser": openid,
    "template_id": templateId,
    "url": url,
    "topcolor": "#FF0000",
    "data": {
      "first": {
        "value": first,
        "color": "#173177"
      },
      "keyword1": {
        "value": keyword1,
        "color": "#173177"
      },
      "keyword2": {
        "value": keyword2,
        "color": "#173177"
      },
      "keyword3": {
        "value": keyword3,
        "color": "#173177"
      },
      "remark": {
        "value": remark,
        "color": "#173177"
      }
    }
  };

  sendMessage(json);
}

function pushPickupDeferredInfoToWechat(openid, orderid, orderNumber, pickupEndTime, pickupAddress) {
  var templateId = 'fmOd8sH3qRya8weGmzXrcANPTDB101TBUu5Ki92T1zM';
  var first = '您好,您有一票运单发货被延迟';
  var keyword1 = orderNumber;
  var keyword2 = pickupEndTime ? moment(pickupEndTime).format('YY/MM/DD HH:mm') : '';
  var keyword3 = pickupAddress;
  var remark = '点击查看详情';
  var url = config.serverAddress + 'salesman_order_detail?order_id=' + orderid;

  var json = {
    "touser": openid,
    "template_id": templateId,
    "url": url,
    "topcolor": "#FF0000",
    "data": {
      "first": {
        "value": first,
        "color": "#173177"
      },
      "keyword1": {
        "value": keyword1,
        "color": "#173177"
      },
      "keyword2": {
        "value": keyword2,
        "color": "#173177"
      },
      "keyword3": {
        "value": keyword3,
        "color": "#173177"
      },
      "remark": {
        "value": remark,
        "color": "#173177"
      }
    }
  };

  sendMessage(json);
}

function pushReceiveGoodsMessageToWechat(openId, orderId, plateNumber, driverName, senderName) {
  var json = {
    touser: openId,
    template_id: 'DST783DmXwpgLfufTHY6fqOXi8AaTP368x6qmowqzio',
    url: config.serverAddress + 'salesman_order_delivery_confirm?order_id=' + orderId,
    topcolor: '#FF0000',
    data: {
      first: {
        value: '您的货物已到达目的地，请确认收货',
        color: '#173177'
      },
      keyword1: {
        value: plateNumber,
        color: '#173177'
      },
      keyword2: {
        value: driverName,
        color: '#173177'
      },
      keyword3: {
        value: senderName,
        color: '#173177'
      },
      remark: {
        value: '点击查看详情',
        color: '#173177'
      }
    }
  };

  sendMessage(json);
}
function pushNewOrderMessageToWechat(openId, driverId, order) {

  var serverAddress = config.serverAddress;
  if (serverAddress.indexOf('zhuzhu56.com') > -1) {
    serverAddress = 'http://api.zhuzhu56.com/';
  }
  var json = {
    touser: openId,
    template_id: 'p-GCp3dL7ub7Xu1yf02Q_7UlEsEV5NCoJDCbblidobM',
    url: serverAddress + 'wechat_driver_order_single_page?order_id=' + order._id.toString() + '&driver_id=' + driverId.toString(),
    topcolor: '#FF0000',
    data: {
      first: {
        value: '您有新的运单，请注意查收',
        color: '#173177'
      },
      keyword1: {
        value: order.order_details.order_number,
        color: '#173177'
      },
      keyword2: {
        value: order.pickup_start_time_format || '未知',
        color: '#173177'
      },
      keyword3: {
        value: order.pickup_contacts.address || '未知',
        color: '#173177'
      },
      keyword4: {
        value: order.delivery_start_time_format || '未知',
        color: '#173177'
      },
      keyword5: {
        value: order.delivery_contacts.address || '未知',
        color: '#173177'
      },
      remark: {
        value: '点击查看详情',
        color: '#173177'
      }
    }
  };

  sendMessage(json);
}


exports.pushAbnormalInfoToWechat = function (phone, orderId, orderNumber, abnormalType) {
  if (!phone || !phone.testPhone()) {
    return;
  }

  salesmanService.findSalesmanByUsername(phone, function (err, salesman) {
    if (salesman && salesman.wechat_openid) {
      pushAbnormalInfoToWechat(salesman.wechat_openid, orderId, orderNumber, abnormalType);
    }
  });
};

//即将到货通知
exports.pushDeliveryEarlyInfoToWechat = function (phone, orderId, orderNumber, deliveryStartTime) {
  if (!phone || !phone.testPhone()) {
    return;
  }

  salesmanService.findSalesmanByUsername(phone, function (err, salesman) {
    if (salesman && salesman.wechat_openid) {
      pushDeliveryEarlyInfoToWechat(salesman.wechat_openid, orderId, orderNumber, deliveryStartTime);
    }
  });
};

//提货通知
exports.pushPickupInfoToWechat = function (phone, orderId, orderNumber, pickupTime, pickupAddress) {
  if (!phone || !phone.testPhone()) {
    return;
  }

  salesmanService.findSalesmanByUsername(phone, function (err, salesman) {
    if (salesman && salesman.wechat_openid) {
      pushPickupInfoToWechat(salesman.wechat_openid, orderId, orderNumber, pickupTime, pickupAddress);
    }
  });
};

//提货被延迟通知
exports.pushPickupDeferredInfoToWechat = function (phone, orderId, orderNumber, pickupEndTime, pickupAddress) {
  if (!phone || !phone.testPhone()) {
    return;
  }

  salesmanService.findSalesmanByUsername(phone, function (err, salesman) {
    if (salesman && salesman.wechat_openid) {
      pushPickupDeferredInfoToWechat(salesman.wechat_openid, orderId, orderNumber, pickupEndTime, pickupAddress);
    }
  });
};

exports.pushReceiveGoodsMessageToWechat = function (phone, orderId, plateNumber, driverName, senderName) {
  if (!phone || !phone.testPhone()) {
    return;
  }

  salesmanService.findSalesmanByUsername(phone, function (err, salesman) {
    if (salesman && salesman.wechat_openid) {
      pushReceiveGoodsMessageToWechat(salesman.wechat_openid, orderId, plateNumber, driverName, senderName);
    }
  });
};

exports.pushNewOrderMessageToWechat = function (openid, driverId, order) {
  return pushNewOrderMessageToWechat(openid, driverId, order);
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

function getOrderMessageContent(messageType, order, driverText) {
  var text = '';
  switch (messageType) {
    case allEnum.company_order_message_push_type.create:
      text = '【柱柱签收】' + (order.sender_name || '') + '委托' + order.create_company.name + '于' + getTimeString(order.created) + '创建了运单（' + order.order_details.order_number + '）。';
      break;
    case allEnum.company_order_message_push_type.ltl_pickup:
      text = '【柱柱签收】' + order.create_company.name + '的运单（' + order.order_details.order_number + '）于' + getTimeString(order.pickup_time) + '已发出，承运司机手机号码' + driverText + '。';
      break;
    case allEnum.company_order_message_push_type.tlt_pickup:
      text = '【柱柱签收】' + order.create_company.name + '的运单（' + order.order_details.order_number + '）于' + getTimeString(order.pickup_time) + '已发出，承运司机手机号码' + driverText + '。';
      break;
    case allEnum.company_order_message_push_type.ltl_delivery_sign:
      text = '【柱柱签收】' + order.create_company.name + '的运单（' + order.order_details.order_number + '）于' + getTimeString(order.delivery_sign_time) + '已发出，配送司机手机号码' + driverText + '。';
      break;
    case allEnum.company_order_message_push_type.delivery:
      text = '【柱柱签收】您委托' + order.create_company.name + '承运的运单（' + order.order_details.order_number + '）于' + getTimeString(order.delivery_time) + '已完美送达。';
      break;
    default:
      break;
  }

  return text;
}

function pushOrderMessage(openid, firstText, orderNumber, pickupTime, deliveryTime, orderId) {
  var templateId = 'i3cMUgqEPfm1jZ_7NzUxQ3jw5aeODM1WA9GyUwP7sUQ';

  var url = config.serverAddress + 'salesman_order_detail?order_id=' + orderId;
  var json = {
    "touser": openid,
    "template_id": templateId,
    "url": url,
    "topcolor": "#FF0000",
    "data": {
      "first": {
        "value": firstText,
        "color": "#173177"
      },
      "keyword1": {
        "value": orderNumber,
        "color": "#173177"
      },
      "keyword2": {
        "value": pickupTime || '--',
        "color": "#173177"
      },
      "keyword3": {
        "value": deliveryTime || '--',
        "color": "#173177"
      },
      "remark": {
        "value": '点击查看详情',
        "color": "#173177"
      }
    }
  };

  sendMessage(json);
}

exports.wechatPushOrderMessage = function (messageType, salesmanList, order, driverText) {
  if (!salesmanList || !Array.isArray(salesmanList) || salesmanList.length === 0) {
    return;
  }
  console.log('wechatLib send order message ----------------------------->>>');


  var firstText = getOrderMessageContent(messageType, order, driverText);
  var pickupTime = order.pickup_time || order.pickup_end_time || order.pickup_start_time || '';
  var deliveryTime= order.delivery_time || order.delivery_start_time || order.delivery_end_time || '';
  var orderId = order._id.toString();

  if (pickupTime) {
    pickupTime = getTimeString(pickupTime);
  }
  if (deliveryTime) {
    deliveryTime = getTimeString(deliveryTime);
  }

  salesmanList.forEach(function (salesman) {
    pushOrderMessage(salesman.wechat_openid, firstText, order.order_details.order_number, pickupTime, deliveryTime, orderId);
  });
};