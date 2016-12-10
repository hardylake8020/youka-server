/**
 * Created by elinaguo on 15/6/4.
 */
'use strict';
var path = require('path'),
  async = require('async'),
  config = require('../../../config/config'),
  orderShareError = require('../../errors/wechat/order_share'),
  appDb = require('../../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  TransportEvent = appDb.model('TransportEvent'),
  TempWechatShare = appDb.model('TempWechatShare'),

  transportEventService = require('../../services/transport_event'),
  orderService = require('../../services/order');

exports.orderShareCode = function (req, res, next) {
  var orderArray = [];
  try{
    orderArray = JSON.parse(decodeURIComponent(req.query.order_array));
  }
  catch(e){
    return res.send({err: 'param_parse_error'});
  }

  var orderIds = [];
  orderArray.forEach(function(order){
    orderIds.push(order._id);
  });

  var tempWechatShare = new TempWechatShare({
    order_ids: orderIds,
    orders: orderArray
  });

  tempWechatShare.save(function(err, tempWechatShareEntity){
    if(err || !tempWechatShareEntity){
      return res.send({err: orderShareError.internal_system_error});
    }

    res.cookie('temp_wechat_share', tempWechatShareEntity._id.toString());
    return res.redirect('/wechat_share_qrcodepage');
  });
};
exports.orderShareCodePage = function (req, res, next) {
  var Cookies = {};
  var cookieString = req.headers.cookie;
  if (cookieString) {
    cookieString.split(';').forEach(function (Cookie) {
      var parts = Cookie.split('=');
      Cookies[parts[0].trim()] = ( parts[1] || '' ).trim();
    });
  }

  var tempWechatShareId = Cookies.temp_wechat_share;
  res.clearCookie('temp_wechat_share');

  TempWechatShare.findOne({_id: tempWechatShareId}).exec(function (err, tempWechatShareEntity) {
    if (err) {
      return res.send({err: orderShareError.internal_system_error});
    }

    if (!tempWechatShareEntity) {
      return res.send({err: orderShareError.no_temp_wechat_share_record});
    }

    var orderCount = tempWechatShareEntity.order_ids.length;
    var tempWechatShareIdUrl = config.serverAddress + 'wechat_share_content?orderShareId=' + tempWechatShareId;
    return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_qrcode.client.view.html'),
      {
        orderArray: tempWechatShareEntity.orders,
        orderIds: tempWechatShareEntity.order_ids,
        orderCount: orderCount,
        tempWechatShareIdUrl: tempWechatShareIdUrl
      });
  });
};

////ejs渲染模版
//function ejsRender(templateFileName, renderData, callback) {
//  fs.readFile(templateFileName, 'utf8', function (err, str) {
//    if (err) {
//      console.log('fs.readFile(' + templateFileName + ') failed');
//      return callback(orderShareError.internal_system_error);
//    }
//
//    var html = ejs.render(str, renderData);
//    return callback(null, html);
//  });
//}

function getEventPhoto(events) {
  var photoUrl = '';

  if (!events || events.length <= 0) {
    return photoUrl;
  }

  for(var index = 0; index < events.length; index++) {
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
function getEventStatusString(status) {
  var statusString = '';

  switch (status) {
    case 'pickupSign':
      statusString = '提货签到';
      break;
    case 'pickup':
      statusString = '提货';
      break;
    case 'deliverySign':
      statusString = '交货签到';
      break;
    case 'delivery':
      statusString = '交货';
      break;
    case 'halfway':
      statusString = '中途事件';
      break;
    default:
      break;
  }

  return statusString;
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
function getGoodsDetail(orderDetail) {
  var goodsDetail = '';

  goodsDetail += (orderDetail.count ? orderDetail.count : '/') + orderDetail.count_unit + ' | ';
  goodsDetail += (orderDetail.weight ? orderDetail.weight : '/') + orderDetail.weight_unit + ' | ';
  goodsDetail += (orderDetail.volume ? orderDetail.volume : '/') + orderDetail.volume_unit;

  return goodsDetail;
}
function findOrderDetailWithEvents(orderId, callback) {
  Order.findOne({_id: orderId}).populate('order_detail').exec(function (err, orderEntity) {
    if (err) {
      return callback(orderShareError.internal_system_error);
    }
    if (!orderEntity) {
      return callback(orderShareError.order_not_found);
    }

    if (orderEntity.status !== 'unAssigned' || orderEntity.status !== 'assigning' || orderEntity.status !== 'unPickupSigned') {

      //去找相关的司机运单
      Order.find({order_detail: orderEntity.order_details._id, execute_driver: {$ne: null}}, function (err, driverOrderEntities) {
        if (err) {
          return callback(orderShareError.internal_system_error);
        }
        if (!driverOrderEntities) {
          return callback(null, orderEntity);
        }
        else {
          //去找司机运单的事件
          var driverOrderIds = [];
          driverOrderEntities.forEach(function (driverOrder) {
            driverOrderIds.push(driverOrder._id);
          });

          var startTime = orderEntity.create_time;
          var endTime = orderEntity.delivery_time || new Date().toISOString();
          transportEventService.getEventByOrder(driverOrderIds, startTime, endTime, function (err, events) {
            if (err) {
              return callback(orderShareError.internal_system_error);
            }
            if (events) {
              orderEntity.events = events;
            }
            return callback(null, orderEntity);
          });
        }
      });
    }
    else {
      return callback(null, orderEntity);
    }
  });
}

function addQiNiuAddress(photoArray) {
  if (!photoArray || photoArray.length <= 0) {
    return '';
  }
  for (var i = 0; i < photoArray.length; i++) {
    photoArray[i] = config.qiniu_server_address + photoArray[i];
  }

  return photoArray;
}

exports.orderShareContent = function (req, res, next) {
  var orderShareId = req.body.orderShareId || req.query.orderShareId || '';
  if (!orderShareId) {
    req.err = {err: orderShareError.upload_wechat_share_null};
    return next();
  }
  TempWechatShare.findOne({_id: orderShareId}).exec(function (err, tempWechatShareEntity) {
    if (err) {
      req.err = {err: orderShareError.internal_system_error};
      return next();
    }

    if (!tempWechatShareEntity) {
      req.err = {err: orderShareError.no_temp_wechat_share_record};
      return next();
    }

    var orderIds = tempWechatShareEntity.order_ids;
    if (!orderIds || orderIds.length <= 0) {
      req.err = {err: orderShareError.upload_orders_null};
      return next();
    }
    var allOrders = [];

    async.each(orderIds, function (eachOrderId, eachCallback) {
      if (!eachOrderId) {
        return eachCallback();
      }
      findOrderDetailWithEvents(eachOrderId, function (err, orderEntity) {
        if (err) {
          return eachCallback(err);
        }
        else {
          allOrders.push(orderEntity);
          return eachCallback();
        }
      });
    }, function (err) {
      if (err) {
        req.err = {err: err};
        return next();
      }

      var renderOrders = [];
      allOrders.forEach(function (orderItem) {
        renderOrders.push({
          _id: orderItem._id.toString(),
          orderNumber: orderItem.order_details.order_number,
          goods_name: orderItem.order_details.goods_name ? orderItem.order_details.goods_name : '未填写货物名称',
          goods_detail: getGoodsDetail(orderItem.order_details),
          status: getOrderStatusString(orderItem.status),
          photo: orderItem.events ? getEventPhoto(orderItem.events) : ''
        });
      });

      //渲染模版
      return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_content.client.view.html'), {renderOrders: renderOrders});
    });
  });
};
exports.orderShareDetail = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';

  if (!orderId) {
    req.err = {err: orderShareError.upload_orders_null};
    return next();
  }

  findOrderDetailWithEvents(orderId, function (err, orderEntity) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    var orderDetail = {
      order_number: orderEntity.order_details.order_number,
      order_ref_number: orderEntity.order_details.refer_order_number ? orderEntity.order_details.refer_order_number : '无',
      customer: orderEntity.customer_name ? orderEntity.customer_name : '未填写',
      goods_name: orderEntity.order_details.goods_name ? orderEntity.order_details.goods_name : '未填写',
      goods_detail: getGoodsDetail(orderEntity.order_details),
      remark: orderEntity.description ? orderEntity.description : '无',
      createTime: orderEntity.create_time.format('yyyy-MM-dd hh:mm')
    };

    if (orderEntity.events && orderEntity.events.length > 0) {
      var events = [];
      async.each(orderEntity.events, function (eventItem, itemCallback) {
        var newItem = {
          type: eventItem.type,
          action: getEventStatusString(eventItem.type),
          user: eventItem.driver.nickname ? eventItem.driver.nickname : eventItem.driver.username,
          create_time: eventItem.time.format('yyyy-MM-dd hh:mm'),
          address: eventItem.address ? eventItem.address : '未知'
        };
        if (eventItem.goods_photos && eventItem.goods_photos.length > 0) {
          newItem.goods_photos = addQiNiuAddress(eventItem.goods_photos);
        }
        else {
          newItem.goods_photos = '';
        }

        if (eventItem.credential_photos && eventItem.credential_photos.length > 0) {
          newItem.credential_photos = addQiNiuAddress(eventItem.credential_photos);
        }
        else {
          newItem.credential_photos = '';
        }

        if (eventItem.halfway_photos && eventItem.halfway_photos.length > 0) {
          newItem.halfway_photos = addQiNiuAddress(eventItem.halfway_photos);
        }
        else {
          newItem.halfway_photos = '';
        }

        events.push(newItem);

        return itemCallback();
      }, function (err) {
        if (err) {
          console.log(err);
        }
        orderDetail.events = events;
        return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_detail.client.view.html'), {orderDetail : orderDetail});
      });
    }
    else {
      return res.render(path.join(__dirname, '../../../web/wechat/views/order_share_detail.client.view.html'), {orderDetail : orderDetail});
    }

  });
};


