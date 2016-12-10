/**
 * Created by zenghong on 16/3/14.
 */
var path = require('path'),
  async = require('async'),
  crypto = require('../../../../libraries/crypto'),
  cookieLib = require('../../../../libraries/cookie');

var tenderService = require('../../../../libraries/services/tender'),
  bidderService = require('../../../../libraries/services/bidder'),
  bidRecordService = require('../../../../libraries/services/bid_record'),
  orderService = require('../../../../libraries/services/order'),
  depositLogService = require('../../../../libraries/services/deposit_log'),
  wechatService = require('../../../../libraries/wechat');

var error = require('../../../../errors/all');

function bidderBindPage(res, openid, accessToken) {
  return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/bind.client.view.html'), {
    openid: openid,
    access_token: accessToken
  });
}
function bidderHomePage(res, bidder) {
  return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/index.client.view.html'), {bidder: JSON.stringify(bidder)});
}
function bidderErrorPage(res, err) {
  return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/error.client.view.html'), {errType: err.zh_message});
}

exports.bind = function (req, res, next) {
  var phone = req.body.phone || '';
  var openid = req.body.openid || '';
  var accessToken = req.body.access_token || '';
  var codeid = req.body.codeid || '';
  var code = req.body.code || '';

  if (!phone || !phone.testPhone() || !openid || !accessToken || !codeid || !code) {
    return res.send({err: error.params.invalid_value});
  }

  wechatService.getWxBindVerifyCode(codeid, code, function (err, verify) {
    if (err) {
      return res.send(err);
    }

    wechatService.getUserInfo(accessToken, openid, function (err, userInfo) {
      if (err) {
        return res.send(err);
      }

      if (userInfo && !userInfo.openid) {
        console.log('get user info failed:');
        console.log(userInfo);
        return res.send({err: error.business.openid_get_failed});
      }

      bidderService.bindWx(phone, openid, userInfo, function (err, result) {
        if (err) {
          return res.send(err);
        }
        res = cookieLib.setCookie(res, 'bidder_openid', openid);
        return res.send(result);
      });
    });
  });

};

exports.unbind = function (req, res, next) {
  var currentBidder = req.bidder;

  bidderService.unbindWxWithBidder(currentBidder, function (err, result) {
    res = cookieLib.setCookie(res, 'bidder_openid', '');
    return res.send(err || {success: true});
  });
};

//竞标人微信入口
exports.entrance = function (req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    var username = '13918429709';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (ip === '::ffff:192.168.199.189') {
      username = '13472423583';
    }
    //13472423583, 13918429709
    bidderService.getByUsername(username, function (err, bidder) {
      return bidderHomePage(res, bidder);
    });
  }
  else {
    var cookie = cookieLib.getCookie(req);
    var cookieOpenid = cookie.bidder_openid || '';

    if (!cookieOpenid && !req.query.code) {
      return bidderErrorPage(res, error.business.openid_get_failed);
    }
    console.log('cookieOpenid ' + cookieOpenid);
    console.log('req.query.code ' + req.query.code);

    async.auto({
      getOpenid: function (callback) {
        if (cookieOpenid !== 'undefined' && cookieOpenid) {
          return callback(null, {openid: cookieOpenid, access_token: null});
        }
        else {
          wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
            return callback(null, {openid: tokenInfo.openid, access_token: tokenInfo.access_token});
          });
        }
      },
      getBidder: ['getOpenid', function (callback, result) {
        var openid = result.getOpenid.openid;
        if (!openid || openid === 'undefined') {
          return callback({err: error.business.openid_invalid});
        }
        bidderService.getByOpenid(openid, function (err, bidder) {
          return callback(err, bidder);
        });
      }]
    }, function (err, result) {
      if (err) {
        return bidderErrorPage(res, err.err);
      }
      var bidder = result.getBidder;
      var openid = result.getOpenid.openid;
      var accessToken = result.getOpenid.access_token;

      if (!bidder || !bidder.wechat_profile || !bidder.wechat_profile.openid) {
        res = cookieLib.setCookie(res, 'bidder_openid', '');

        if (!accessToken) {
          wechatService.getAccessTokenAndOpenIdByCode(req.query.code, function (err, tokenInfo) {
            return bidderBindPage(res, tokenInfo.openid, tokenInfo.access_token);
          });
        }
        else {
          return bidderBindPage(res, openid, accessToken);
        }
      }
      else {
        res = cookieLib.setCookie(res, 'bidder_openid', openid);
        return bidderHomePage(res, bidder);
      }
    });
  }
};

//报价
exports.quoteTender = function (req, res, next) {
  var bidder = req.bidder || {};
  var tender = req.tender || {};
  var price = parseFloat(req.body.price) || 0;
  price = isFinite(price) ? price : 0;

  tenderService.quoteTender(tender, bidder, price, function (err, data) {
    return res.send(err || {success: true});
  });
};
//确定承运司机
exports.applyDrivers = function (req, res, next) {
  var bidder = req.bidder || {};
  var tender = req.tender || {};
  var drivers = req.body.drivers || [];

  if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
    return res.send({err: error.params.invalid_value});
  }

  tenderService.applyDrivers(tender, bidder, drivers, function (err, data) {
    return res.send(err || {success: true});
  });
};

//记录竞标人已查看过标书
exports.previewTender = function (req, res, next) {
  var bidRecordId = req.query.bid_record_id || '';
  if (!bidRecordId) {
    return res.send({err: error.params.invalid_value});
  }

  bidRecordService.previewTender(bidRecordId, function (err) {
    return res.send(err || {success: true});
  });
};


exports.getTenderList = function (req, res, next) {
  var bidderId = req.body.bidder_id;
  var skip = parseInt(req.body.skip) || 0;
  var limit = parseInt(req.body.limit) || 0;
  var statuses = req.body.statuses || [];

  if (!isFinite(skip) || !isFinite(limit)) {
    return res.send({err: error.params.invalid_value});
  }
  if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
    return res.send({err: error.params.invalid_value});
  }

  bidRecordService.getRecordByStatus(bidderId, skip, limit, statuses, function (err, records) {
    return res.send(err || records);
  });
};

exports.getOrderList = function (req, res, next) {
  var bidder = req.bidder;
  var skip = parseInt(req.body.skip) || 0;
  var limit = parseInt(req.body.limit) || 5;
  var statuses = req.body.statuses || [];

  if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
    return res.send({err: error.params.invalid_value});
  }

  orderService.getBidderOrders(bidder._id, statuses, skip, limit, function (err, orders) {
    return res.send(err || orders);
  });
};

exports.getOrderMapPage = function (req, res, next) {
  var currentOrder = req.currentOrder;
  return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/order_map_page.client.view.html'), {order: JSON.stringify(currentOrder)});
};

exports.getSingleOrderPage = function (req, res, next) {
  var bidder_id = req.query.bidder_id;
  var tender_id = req.query.tender_id;

  if (!bidder_id || !tender_id) {
    return res.send({err: error.params.invalid_value});
  }

  orderService.getSingleBidderOrderWithTenderId(bidder_id, tender_id, function (err, order) {
    if (err) {
      return res.send(err);
    }
    if (!order) {
      return res.send({err: error.business.order_not_exist});
    }

    return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/single_order_page.client.view.html'), {order: JSON.stringify(order)});
  });

};

exports.getSingleTenderPage = function (req, res, next) {
  var bidder = req.bidder;
  var bidRecordId = req.query.bidRecord_id;
  var _u = req.query.u;
  if(!_u){
      bidRecordService.getRecordById(bidRecordId, 'tender', function (err, bidRecord) {
          return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/single_tender_page.client.view.html'), {bidRecord: JSON.stringify(bidRecord)});
      });
  }else{
      var openid;
      try{
          openid = crypto.decryptString(_u, 'to_tender');
      }catch(e){
          return res.send({err: e.message});
      }
      bidRecordService.getRecordById(bidRecordId, 'tender', function (err, bidRecord) {

          var _bidOpenid = bidder.wechat_profile&&bidder.wechat_profile.openid;
          var defMsg;
          if(bidRecord.status != "success" || _bidOpenid != openid){
              defMsg = "中标后可见";
          }
          if(defMsg){
              bidRecord.tender.pickup_name = defMsg;
              bidRecord.tender.pickup_mobile_phone = defMsg;
              bidRecord.tender.pickup_tel_phone = defMsg;
              bidRecord.tender.delivery_name = defMsg;
              bidRecord.tender.delivery_mobile_phone = defMsg;
              bidRecord.tender.delivery_tel_phone = defMsg;
          }
          console.log(bidRecord);

          return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/single_tender_page.client.view.html'), {
              bidRecord: JSON.stringify(bidRecord)
          });
      });
  }

  /**
  var code = req.query.code||req.body.code;
  if(code){
      wechatService.getAccessTokenAndOpenIdByCode(code, function (err, tokenInfo) {
          bidRecordService.getRecordById(bidRecordId, 'tender', function (err, bidRecord) {

              var _bidOpenid = bidder.wechat_profile&&bidder.wechat_profile.openid;
              var defMsg;
              if(bidRecord.status != "success" || _bidOpenid != tokenInfo.openid){
                  defMsg = "中标后可见";
              }
              if(defMsg){
                  bidRecord.tender.pickup_name = defMsg;
                  bidRecord.tender.pickup_mobile_phone = defMsg;
                  bidRecord.tender.pickup_tel_phone = defMsg;
                  bidRecord.tender.delivery_name = defMsg;
                  bidRecord.tender.delivery_mobile_phone = defMsg;
                  bidRecord.tender.delivery_tel_phone = defMsg;
              }
              console.log(bidRecord);

              return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/single_tender_page.client.view.html'), {
                  bidRecord: JSON.stringify(bidRecord)
              });
          });
      });
  }else{
      bidRecordService.getRecordById(bidRecordId, 'tender', function (err, bidRecord) {
          return res.render(path.join(__dirname, '../../../web/wechat/bidder/views/single_tender_page.client.view.html'), {bidRecord: JSON.stringify(bidRecord)});
      });
  }
  */

};

exports.saveDeposit = function (req, res, next) {
  var bidder = req.bidder;

  bidderService.saveDeposit(bidder, function (err) {
    return res.send(err || {success: true});
  });
};

exports.extractDeposit = function (req, res, next) {
  var bidder = req.bidder;

  bidderService.extractDeposit(bidder, function (err) {
    return res.send(err || {success: true});
  });
};

exports.getDepositLogList = function (req, res, next) {
  var bidderId = req.body.bidder_id;
  var skip = parseInt(req.body.skip) || 0;
  var limit = parseInt(req.body.limit) || 0;

  depositLogService.getListByBidderId(bidderId, skip, limit, function (err, list) {
    return res.send(err || list);
  });
};
