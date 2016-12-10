'use strict';

var GeTui = require('./GT.push');
var Target = require('./getui/Target');

var TransmissionTemplate = require('./getui/template/TransmissionTemplate');

var SingleMessage = require('./getui/message/SingleMessage');

var HOST = 'http://sdk.open.api.igexin.com/apiex.htm';
//Android用户测试
var APPID = 'MCml1MhrQu9j1vaoi5Hyr2';
var APPKEY = 'blxNCGhyIP6JDtckzOFVi8';
var MASTERSECRET = 'ztue4oOkFc6lNFgRC0d4X3';
var CID = 'f109c543c1eee1b4e5af7f170d53f68f';

var gt = new GeTui(HOST, APPKEY, MASTERSECRET);
gt.connect(function () {
    pushMessageToSingle();
});

function pushMessageToSingle() {
    var template = TransmissionTemplateDemo();

    //个推信息体
    var message = new SingleMessage({
        isOffline: false,                        //是否离线
        offlineExpireTime: 3600 * 12 * 1000,    //离线时间
        data: template                          //设置推送消息类型
    });

    //接收方
    var target = new Target({
        appId: APPID,
        clientId: CID
    });

    gt.pushMessageToSingle(message, target, function (err, res) {
        console.log(res);
    });
}

function TransmissionTemplateDemo() {
    var template =  new TransmissionTemplate({
        appId: APPID,
        appKey: APPKEY,
        transmissionType: 1,
        transmissionContent: {
            message:'new order',
            type:'new_order'
        }
    });
    //iOS推送需要设置的pushInfo字段
    template.setPushInfo({actionLocKey: '', badge: 2, message: '', sound: '', payload: '', locKey: '',
        locArgs: '', launchImage: ''});
//    template.setPushInfo({actionLocKey: '按钮名称', badge: 1, message: 'meissage', sound: 'test2.wav'});
    return template;
}