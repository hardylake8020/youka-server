/**
 * Created by elinaguo on 15/4/13.
 */
'use strict';

var path = require('path'),
  async = require('async'),
  transportEventError = require('../errors/transport_event'),
  appDb = require('../../libraries/mongoose').appDb,
  ActualGoodsRecord = appDb.model('ActualGoodsRecord'),
  TransportEvent = appDb.model('TransportEvent');
var orderService = require('../services/order');
var mongoose = require('mongoose');

function getEventByOrder(orderIds, startTime, endTime, callback) {
  var start = startTime || new Date();
  var end = endTime || new Date();

  TransportEvent
    .where('order').in(orderIds)
    .populate('driver order')
    .exec(function (err, transportEvents) {
      if (err) {
        return callback({err: transportEventError.internal_system_error}, null);
      }

      return callback(err, transportEvents);
    });

}
exports.getEventByOrder = function (orderIds, startTime, endTime, callback) {
  getEventByOrder(orderIds, startTime, endTime, callback);
};

exports.pickupEventCount = function (driverOrderIds, callback) {
  TransportEvent.count({order: {$in: driverOrderIds}, type: 'pickup'}).exec(function (err, count) {
    return callback(count);
  });
};

//获取所有司机订单指定事件类型的事件数量
exports.getOrdersSpecialEventCount = function (driverOrderIds, eventType, callback) {
  if (!driverOrderIds || driverOrderIds.length <= 0 || !eventType) {
    return callback(transportEventError.params_null);
  }

  TransportEvent.count({order: {$in: driverOrderIds}, type: eventType}).exec(function (err, count) {
    if (err) {
      return callback(transportEventError.internal_system_error);
    }
    return callback(null, count);
  });
};

exports.getEventsByCompanyOrderId = function (orderId, callback) {
  orderService.getOrderById(orderId, function (err, order) {
    if (err) {
      return callback(err);
    }

    orderService.getDriverChildrenOrderIds(orderId, function (err, driverOrderIds) {
      if (err) {
        return callback(err);
      }

      var startTime = order.create_time;
      var endTime = order.delivery_time || new Date().toISOString();

      getEventByOrder(driverOrderIds, startTime, endTime, function (err, transportEvents) {
        if (err) {
          return callback(err);
        }

        return callback(null, {
          allOrderInfos: order,
          order: {
            createUserNickname: order.create_user.nickname,
            createUserPhone: order.create_user.phone,
            createUsername: order.create_user.username,
            create_time: order.create_time,
            pickup_time: order.pickup_time,
            delivery_time: order.delivery_time
          }, events: transportEvents
        });
      });
    });
  });
};

function getActualGoodsRecord(order, uploadTransportEvent, callback) {
  var actualGoodsRecord;
  var actualMoreGoodsRecord;

  if (uploadTransportEvent.type !== 'pickup' && uploadTransportEvent.type !== 'delivery') {
    return callback(null, {actual_goods_record: actualGoodsRecord, actual_more_goods_record: actualMoreGoodsRecord});
  }
  if (uploadTransportEvent.goods && uploadTransportEvent.goods.length > 0) {
    actualMoreGoodsRecord = [];
    async.each(uploadTransportEvent.goods, function (goodItem, asyncCallback) {
      if (!goodItem._id) {
        try {
          goodItem = JSON.parse(goodItem);
        }
        catch (e) {
          //错误的格式，没有_id
          goodItem = {
            name: '',
            count: null,
            unit: null
          };
        }
      }
      actualMoreGoodsRecord.push(goodItem);
      return asyncCallback();
    }, function (err) {
      return callback(null, {actual_goods_record: actualGoodsRecord, actual_more_goods_record: actualMoreGoodsRecord});
    });
  }
  else {
    actualGoodsRecord = new ActualGoodsRecord({
      count_unit: (uploadTransportEvent.count_unit || order.order_details.count_unit),
      weight_unit: (uploadTransportEvent.weight_unit || order.order_details.weight_unit),
      volume_unit: (uploadTransportEvent.volume_unit || order.order_details.volume_unit)
    });

    if (uploadTransportEvent.goods_name) {
      actualGoodsRecord.goods_name = uploadTransportEvent.goods_name;
    }
    if (uploadTransportEvent.count) {
      actualGoodsRecord.count = uploadTransportEvent.count;
    }
    if (uploadTransportEvent.weight) {
      actualGoodsRecord.weight = uploadTransportEvent.weight;
    }
    if (uploadTransportEvent.volume) {
      actualGoodsRecord.volume = uploadTransportEvent.volume;
    }
    return callback(null, {actual_goods_record: actualGoodsRecord, actual_more_goods_record: actualMoreGoodsRecord});
  }
}
exports.create = function (order, driver, transportEvent, callback) {

  // getActualGoodsRecord(order, transportEvent, function (err, actualGoods) {
  //
  // });

  var newTransportEvent = new TransportEvent({
    order: order,
    driver: driver,
    driver_name: driver.nickname,
    driver_phone: driver.username,
    driver_plate_numbers: driver.plate_numbers,
    type: transportEvent.type,
    location: [],
    address: transportEvent.address,
    damaged: transportEvent.damaged,
    description: transportEvent.remark,
    goods_photos: transportEvent.goods_photos,
    credential_photos: transportEvent.credential_photos,
    halfway_photos: transportEvent.halfway_photos,
    voice_file: transportEvent.voice_file || '',
    order_codes: transportEvent.order_codes,
    time: transportEvent.time,
    delivery_by_qrcode: transportEvent.delivery_by_qrcode || false,
    // actual_goods_record: actualGoods.actual_goods_record,
    // actual_more_goods_record: actualGoods.actual_more_goods_record,
    is_wechat: transportEvent.is_wechat || false,
    recognize_plates: transportEvent.recognize_plates,
    driver_plate_difference: transportEvent.driver_plate_difference || false,
    transport_plate_difference: transportEvent.transport_plate_difference || false
  });

  if (transportEvent.event_id) {
    newTransportEvent.event_id = transportEvent.event_id;
  }
  else {
    newTransportEvent.event_id = new mongoose.Types.ObjectId();
  }
  if (transportEvent.longitude)
    newTransportEvent.location.push(parseFloat(transportEvent.longitude));
  if (transportEvent.latitude)
    newTransportEvent.location.push(parseFloat(transportEvent.latitude));

  if (transportEvent.address_difference_distance) {
    newTransportEvent.address_difference_distance = transportEvent.address_difference_distance;
  }
  if (transportEvent.address_difference) {
    newTransportEvent.address_difference = transportEvent.address_difference;
  }

  if (transportEvent.photos && transportEvent.photos.length > 0) {
    var photoArray = [];
    transportEvent.photos.forEach(function (photoItem) {
      if (!photoItem.url) {
        try {
          photoItem = JSON.parse(photoItem);
        }
        catch (e) {
        }
      }
      if (photoItem.url) {
        photoArray.push({
          name: photoItem.name,
          url: photoItem.url
        });
      }
    });
    newTransportEvent.photos = photoArray;
  }

  newTransportEvent.save(function (err, transportEvent) {
    if (err || !transportEvent) {
      return callback({err: transportEventError.internal_system_error}, null);
    }

    return callback(null, transportEvent);
  });
};

function calculateMissingPackages(order, transportEventEntity) {
  if (transportEventEntity.actual_more_goods_record && transportEventEntity.actual_more_goods_record.length > 0) {
    if (order.order_details.goods && order.order_details.goods.length > 0) {
      var isMiss = false;
      var original, actual;

      for (var i = 0; i < order.order_details.goods.length; i++) {
        original = order.order_details.goods[i];
        for (var j = 0; j < transportEventEntity.actual_more_goods_record.length; j++) {
          actual = transportEventEntity.actual_more_goods_record[j];

          //actual._id不一定存在，所以不能toString()
          if (original._id.toString() === actual._id) {
            if ((original.count && !actual.count) || (original.count && original.count.toString() !== actual.count.toString())) {
              isMiss = true;
              break;
            }
            break;
          }
        }
        if (isMiss) {
          break;
        }
      }
      return isMiss;
    }
    else {
      return false; //如果创建时没有货物信息，则不算缺件
    }
  }
  else if (transportEventEntity.actual_goods_record) {
    if (order.order_details.count && (transportEventEntity.actual_goods_record.count || transportEventEntity.actual_goods_record.count === 0)) {
      if (order.order_details.count !== transportEventEntity.actual_goods_record.count) {
        return true;
      }
    }
    if (order.order_details.weight && (transportEventEntity.actual_goods_record.weight || transportEventEntity.actual_goods_record.weight === 0)) {
      if (order.order_details.weight !== transportEventEntity.actual_goods_record.weight) {
        return true;
      }
    }
    if (order.order_details.volume && (transportEventEntity.actual_goods_record.volume || transportEventEntity.actual_goods_record.volume === 0)) {
      if (order.order_details.volume !== transportEventEntity.actual_goods_record.volume) {
        return true;
      }
    }

    return false;
  }
  else {
    return false;
  }
}
exports.calculateMissingPackages = function (order, transportEventEntity) {
  return calculateMissingPackages(order, transportEventEntity);
};