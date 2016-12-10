/**
 * Created by louisha on 15/6/7.
 */
'use strict';

var path = require('path'),
  config = require('../../../config/config'),
  mongoose = require('mongoose'),
  async = require('async'),
  appDb = require('../../../libraries/mongoose').appDb,
  superagent = require('superagent').agent(),
  User = appDb.model('User'),
  Order = appDb.model('Order'),
  TempWechatShare = appDb.model('TempWechatShare');

exports.wechatBind = function (req, res, next) {
  var openid = req.body.openid || '';
  var username = req.body.username || '';
  var password = req.body.password || '';
  if (openid === '') {
    return res.send({err: {type: 'invalid_openid'}});
  }
  User.findOne({username: username}, function (err, user) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }
    if (!user) {
      return res.send({err: {type: 'invalid_username'}});
    }
    if (user.password !== user.hashPassword(password)) {
      return res.send({err: {type: 'invalid_password'}});
    }
    async.auto({
      findBindedUser: function (callback) {
        User.find({weichat_openid: openid}, function (err, users) {
          if (err || !users) {
            return callback({err: {type: 'internal_system_error'}});
          }
          if (users.length > 0) {
            return callback(null, users);

          }
          return callback(null, null);
        });
      },
      unBindUser: ['findBindedUser', function (callback, result) {
        var users = result.findBindedUser;
        if (!users) {
          return callback();
        }

        async.each(users, function (eachUser, eachCallback) {
          eachUser.weichat_openid = null;
          eachUser.save(function (err) {
            if (err) {
              return eachCallback({err: {type: 'internal_system_error'}});
            }
            return eachCallback();
          });
        }, function (err) {
          if (err) {
            return callback(err);
          }
        });
      }],
      bindUser: ['unBindUser', function (callback, result) {
        user.weichat_openid = openid;
        user.save(function (err, result) {
          if (err || !result) {
            return callback({err: {type: 'internal_system_error'}});
          }
          return callback(null, {openid: openid});
        });
      }]
    }, function (err, results) {
      if (err) {
        return res.send(err);
      }
      return res.send(results.bindUser);
    });
  });
};

exports.wechatBindPage = function (req, res, next) {
  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.wx_appid + '&secret=' + config.wx_secret + '&code=' + req.query.code + '&grant_type=authorization_code';
  console.log(url);
  superagent.get(url)
    .end(function (err, result) {
      result = JSON.parse(result.text);
      console.log(result);
      return res.render(path.join(__dirname, '../../../web/wechat/views/wechat_bind.client.view.html'), {openid: result.openid});
    });
};

function getGoodsDetail(orderDetail) {
  var goodsDetail = '';

  goodsDetail += (orderDetail.count ? orderDetail.count : '/') + orderDetail.count_unit + ' | ';
  goodsDetail += (orderDetail.weight ? orderDetail.weight : '/') + orderDetail.weight_unit + ' | ';
  goodsDetail += (orderDetail.volume ? orderDetail.volume : '/') + orderDetail.volume_unit;

  return goodsDetail;
}

function getOrderStatusString(status) {
  var statusString = '';

  switch (status) {
    case 'unAssigned':
      statusString = '未分配';
      break;
    case 'assigning':
      statusString = '分配中';
      break;
    case 'unPickupSigned':
    case 'unPickuped':
      statusString = '未提货';
      break;
    case 'unDeliverySigned':
    case 'unDeliveried':
      statusString = '运输中';
      break;
    case 'completed':
      statusString = '已完成';
      break;
    default:
      break;
  }
  return statusString;
}

function getEventPhoto(events) {
  var photoUrl = '';

  if (!events || events.length <= 0) {
    return photoUrl;
  }

  for (var index = 0; index < events.length; index++) {
    if (events[index].goods_photos && events[index].goods_photos.length > 0) {
      photoUrl = events[index].goods_photos[0];
      break;
    }
    if (events[index].credential_photos && events[index].credential_photos.length > 0) {
      photoUrl = events[index].credential_photos[0];
      break;
    }
    if (events[index].halfway_photos && events[index].halfway_photos.length > 0) {
      photoUrl = events[index].halfway_photos[0];
      break;
    }
  }
  if (photoUrl)
    photoUrl = config.qiniu_server_address + photoUrl;

  return photoUrl;
}

exports.orderSearchByNumberPage = function (req, res, next) {
  //var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.wx_appid + '&secret=' + config.wx_secret + '&code=' + req.query.code + '&grant_type=authorization_code';
  //superagent.get(url)
  //  .end(function (err, result) {
  //    result = JSON.parse(result.text) || '{}';
  //return res.render(path.join(__dirname, '../../../web/wechat/views/wechat_search.client.view.html'), {openid: result.openid});
//    });
  return res.render(path.join(__dirname, '../../../web/wechat/views/wechat_search.client.view.html'), {openid: ''});
};

exports.orderSearchByNumber = function (req, res, next) {
  var order_number = req.query.order_number || '';
  //var openid = req.query.openid || '';

  Order.findOne({order_numbers_for_search: order_number}, function (err, order) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }

    if (!order) {
      return res.send({err: {type: 'invalid_order_number'}});
    }

    var renderOrders = [{
      _id: order._id,
      orderNumber: order.order_details.order_number,
      goods_detail: getGoodsDetail(order.order_details),
      goods_name: order.order_details.goods_name ? order.order_details.goods_name : '未填写',
      status: getOrderStatusString(order.status),
      photo: order.events ? getEventPhoto(order.events) : ''
    }];
    return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_content.client.view.html'), {renderOrders: renderOrders});
  });
};

//exports.orderSearchByNumber = function (req, res, next) {
//  var order_number = req.query.order_number || '';
//  var openid = req.query.openid || '';
//
//  User.findOne({weichat_openid: openid}, function (err, user) {
//    if (err) {
//      return res.send({err: {type: 'internal_system_error'}});
//    }
//    if (!user) {
//      return res.send({err: {type: 'invalid_openid'}});
//    }
//
//
//    Order.findOne({'order_details.order_number': order_number}, function (err, order) {
//      if (err) {
//        return res.send({err: {type: 'internal_system_error'}});
//      }
//      if (!order) {
//        return res.send({err: {type: 'invalid_order_number'}});
//      }
//
//      var renderOrders = [{
//        _id: order._id,
//        orderNumber: order.order_details.order_number,
//        goods_detail: getGoodsDetail(order.order_details),
//        goods_name: order.order_details.goods_name ? order.order_details.goods_name : '未填写',
//        status: getOrderStatusString(order.status),
//        photo: order.events ? getEventPhoto(order.events) : ''
//      }];
//
//      return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_content.client.view.html'), {renderOrders: renderOrders});
//    });
//  });
//};
