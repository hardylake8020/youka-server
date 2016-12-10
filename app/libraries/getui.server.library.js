'use strict';

var GeTui = require('../libraries/getuiLibs/GT.push');
var Target = require('../libraries/getuiLibs/getui/Target');
var TransmissionTemplate = require('../libraries/getuiLibs/getui/template/TransmissionTemplate');
var SingleMessage = require('../libraries/getuiLibs/getui/message/SingleMessage');
var HOST = 'http://sdk.open.api.igexin.com/apiex.htm';

//Android用户测试
var APPID = 'MCml1MhrQu9j1vaoi5Hyr2';
var APPKEY = 'blxNCGhyIP6JDtckzOFVi8';
var MASTERSECRET = 'ztue4oOkFc6lNFgRC0d4X3';
var gt = new GeTui(HOST, APPKEY, MASTERSECRET);

function transmissionTemplateDemo(content) {
  content.messageInfo = content.messageInfo || {};

  var template = new TransmissionTemplate({
    appId: APPID,
    appKey: APPKEY,
    transmissionType: 2,
    transmissionContent: JSON.stringify(content)
  });
  //iOS推送需要设置的pushInfo字段
  template.setPushInfo({
    actionLocKey: '',
    badge: 1,
    message: content.messageInfo.message || '',
    sound: content.messageInfo.sound || '',
    payload: '',
    locKey: '',
    locArgs: '',
    launchImage: ''
  });
  return template;
}

function pushMessageToSingle(content, deviceId, callback) {
  console.log('appid: ' + APPID);
  console.log('appkey: ' + APPKEY);
  console.log('MASTERSECRET:' + MASTERSECRET);

  console.log('GT._host: ' + gt._host);
  console.log('GT._appkey: ' + gt._appkey);
  console.log('GT._mastersecret:' + gt._masterSecret);

  var template = transmissionTemplateDemo(content);

  //个推信息体
  var message = new SingleMessage({
    isOffline: true,                        //是否离线
    offlineExpireTime: 3600 * 12 * 1000,    //离线时间
    data: template                          //设置推送消息类型
  });

  //接收方
  var target = new Target({
    appId: APPID,
    clientId: deviceId
  });

  gt.pushMessageToSingle(message, target, function (err, res) {
    if (callback) {
      return callback(err, res);
    }
  });
}

gt.connect(function () {
  pushMessageToSingle({
    type: 'new_order',
    message: 'new order'
  }, 'b835a81cd392a2bcd9618ef462965442', function (err, res) {
    console.log(err);
    console.log(res);
  });
});

exports.transmissionIosInfoPush = function (content, messageInfo, deviceId, callback) {
  content.messageInfo = messageInfo;
  pushMessageToSingle(content, deviceId, callback);
};

exports.transmissionInfoPush = function (content, deviceId, callback) {
  pushMessageToSingle(content, deviceId, callback);
};

setInterval(function () {
  gt = new GeTui(HOST, APPKEY, MASTERSECRET);
  gt.connect(function () {
    pushMessageToSingle({
      type: 'new_order',
      message: 'new order'
    }, 'b835a81cd392a2bcd9618ef462965442', function (err, res) {
      console.log(err);
      console.log(res);
    });
  });
}, 1000 * 60 * 60 * 2); //两小时重新链接个推
