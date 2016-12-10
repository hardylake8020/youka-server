/**
 * Created by zenghong on 15/12/13.
 */
'use strict';

var access_token = '',
  crypto = require('../crypto'),
  moment = require('moment'),
  superagent = require('superagent').agent(),
  salesmanService = require('./salesman');

function getAccessToken(callback) {
  var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + process.env.wx_appid + '&secret=' + process.env.wx_secret;
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
  var first = '你好,你有一票运单出现异常事件';
  var keyword2 = orderNumber;
  var keyword3 = abnormalType;
  var keyword4 = moment().format('YY/MM/DD HH:mm');
  var keyword5 = '1234565';
  var remark = '点击查看详情';
  var url = process.env.serverAddress + 'salesman_order_detail?order_id=' + orderid;

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
function pushReceiveGoodsMessageToWechat(openId, orderId, plateNumber, driverName, senderName) {
  var json = {
    touser: openId,
    template_id: 'DST783DmXwpgLfufTHY6fqOXi8AaTP368x6qmowqzio',
    url: process.env.serverAddress + 'salesman_order_delivery_confirm?order_id=' + orderId,
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

  var serverAddress = process.env.serverAddress;
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
};

//bidRecord: {tender:{}, bidder: {}}
function pushTenderMessageToWechat(openid, bidRecord, title) {

  var redirectUri = process.env.serverAddress + 'wechat/single_tender_page?bidder_id=' + bidRecord.bidder._id.toString() + '&bidRecord_id=' + bidRecord._id.toString()+"&u="+crypto.encryptString(openid, 'to_tender');
  //redirectUri = encodeURIComponent(redirectUri);
  //var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+config.wx_appid+"&redirect_uri=" + redirectUri+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect";
  var json = {
    touser: openid,
    template_id: 'PGRFGe_YbggPNuGBwr4ixeBgGfo_BlKPxmLQs3lPPcs',
    url: redirectUri,//url,
    topcolor: '#FF0000',
    data: {
      first: {
        value: title,
        color: '#173177'
      },
      keyword1: {
        value: bidRecord.tender.order_number,
        color: '#173177'
      },
      keyword2: {
        value: bidRecord.tender.pickup_start_time_format || '未知',
        color: '#173177'
      },
      keyword3: {
        value: bidRecord.tender.pickup_address || '未知',
        color: '#173177'
      },
      keyword4: {
        value: bidRecord.tender.delivery_start_time_format || '未知',
        color: '#173177'
      },
      keyword5: {
        value: bidRecord.tender.delivery_address || '未知',
        color: '#173177'
      },
      remark: {
        value: '点击查看详情',
        color: '#173177'
      }
    }
  };

  sendMessage(json);
};

function hideTelphone(phone) {
  if (!phone || phone.length !== 11) {
    return '';
  }
  return phone.substr(0,3) + '****' + phone.substr(7,4);
}


function pushTenderResultMessageToWechat(openid, bidRecord, title, winnerRecord) {

  var redirectUri = process.env.serverAddress + 'wechat/single_tender_page?bidder_id=' + bidRecord.bidder._id.toString() + '&bidRecord_id=' + bidRecord._id.toString()+"&u="+crypto.encryptString(openid, 'to_tender');
  //redirectUri = encodeURIComponent(redirectUri);
  //var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+config.wx_appid+"&redirect_uri=" + redirectUri+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect";

  var json = {
    touser: openid,
    template_id: 'CpMzUkeB_MH-i5NlqoSeXElipBO6351CDbKPAcAfpUg',
    url: redirectUri,//url,//process.env.serverAddress + 'wechat/single_tender_page?bidder_id=' + bidRecord.bidder._id.toString() + '&bidRecord_id=' + bidRecord._id.toString(),
    topcolor: '#FF0000',
    data: {
      first: {
        value: title,
        color: '#173177'
      },
      keyword1: {
        value: bidRecord.tender.order_number,
        color: '#173177'
      },
      keyword2: {
        value: (winnerRecord && winnerRecord.current_price) || '未知',
        color: '#173177'
      },
      keyword3: {
        value: (winnerRecord && hideTelphone(winnerRecord.bidder.username)) || '未知',
        color: '#173177'
      },
      remark: {
        value: '点击查看详情',
        color: '#173177'
      }
    }
  };

  sendMessage(json);
};




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

//新标书
exports.pushNewTenderMessageToWechat = function (openid, bidRecord) {
  return pushTenderMessageToWechat(openid, bidRecord, '您有新的标书，请注意查看');
};

//中标
exports.pushSuccessTenderMessageToWechat = function (openid, bidRecord) {
  return pushTenderMessageToWechat(openid, bidRecord, '恭喜您中标了，请注意查看');
};

//未中标
exports.pushFailedTenderMessageToWechat = function (openid, bidRecord, winnerRecord) {
  return pushTenderResultMessageToWechat(openid, bidRecord, '很遗憾，您未中标，请注意查看', winnerRecord);
};


