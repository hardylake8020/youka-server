/**
 * Created by elinaguo on 15/4/9.
 */
'use strict';

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  q = require('q'),
  orderError = require('../errors/order'),
  orderShareError = require('../errors/order_share'),
  traceError = require('../errors/trace'),
  appDb = require('../../libraries/mongoose').appDb,
  Trace = appDb.model('Trace'),
  TransportEvent = appDb.model('TransportEvent'),
  Order = appDb.model('Order'),
  UserGroup = appDb.model('UserGroup'),
  OrderShare = appDb.model('OrderShare');

exports.upload = function (driver, address, longitude, latitude, time,type, callback) {
  var saveTime = time ? new Date(time).toISOString() : new Date().toISOString();
  var newTrace = new Trace({
    driver: driver,
    address: address || '',
    time: saveTime,
    location: [],
    type:type
  });

  if (longitude)
    newTrace.location.push(parseFloat(longitude));
  if (latitude)
    newTrace.location.push(parseFloat(latitude));

  newTrace.save(function (err, trace) {
    if (err || !trace){
      return callback({err: traceError.internal_system_error}, null);
    }

    return callback(null, trace);
  });
};

function getDriverTrace(driver_id, startTime, endTime, callback) {
  Trace.find({driver: driver_id})
    .where('time').gte(new Date(new Date(startTime).getTime()-1000)).lte(endTime)
    .sort({time: -1})
    .exec(function (err, traces) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }
      return callback(null, traces);
    });
}

function getDriverFirstEventTime(orderId, driverId, callback) {

  //选择第一个司机事件作为获取司机定位信息查询的开始
  TransportEvent.find({order: orderId, driver: driverId})
    .sort('created')
    .exec(function (err, transportEvents) {
      if (err) {
        return callback({err: err}, null);
      }

      if (!transportEvents || transportEvents.length <= 0)
        return callback(null, null);

      return callback(null, transportEvents[0].created);
    });
}

function getOrdersTraces(driverOrders) {
  var defered = q.defer();
  var driverTraces = [];
  async.each(driverOrders, function (driverOrder, callback) {
    getDriverFirstEventTime(driverOrder._id, driverOrder.execute_driver, function (err, startTime) {
      if (err)
        return callback(err);
      if (!startTime) {
        driverTraces.push({
          driver: driverOrder.execute_driver,
          traces: []
        });
        return callback();
      }
      var endTime = driverOrder.delivery_time ? driverOrder.delivery_time : new Date();
      getDriverTrace(driverOrder.execute_driver, startTime, endTime, function (err, result) {
        if (err) {
          callback(err);
        }

        driverTraces.push({
          driver: driverOrder.execute_driver,
          traces: result
        });
        return callback();
      });
    });
  }, function (err) {
    if (err) {
      return defered.reject({err: traceError.internal_system_error});
    }
    defered.resolve(driverTraces);
  });
  return defered.promise;
}

//根据运单，查找所有trace
exports.getTracesByOrders = function(driverOrders) {
  return getOrdersTraces(driverOrders);
};