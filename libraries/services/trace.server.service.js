/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  q = require('q'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  Trace = appDb.model('Trace'),
  TransportEvent = appDb.model('TransportEvent');

var self = exports;

function getDriverTrace(driver_id, startTime, endTime, callback) {
  Trace.find({driver: driver_id, time: {$gte: new Date(new Date(startTime).getTime()-1000), $lte: endTime}})
    .sort({time: -1})
    .exec(function (err, traces) {
      if (err) {
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, traces);
    });
}

function getDriverFirstEventTime(orderId, driverId, callback) {

  //选择第一个司机事件作为获取司机定位信息查询的开始
  TransportEvent.find({order: orderId, driver: driverId})
    .sort('created')
    .exec(function (err, transportEvents) {
      if (err) {
        return callback({err: error.system.db_error});
      }

      if (!transportEvents || transportEvents.length <= 0)
        return callback();

      return callback(null, transportEvents[0].created);
    });
}

function getOrdersTraces(driverOrders) {
  var defered = q.defer();
  var driverTraces = [];
  async.each(driverOrders, function (driverOrder, itemCallback) {
    getDriverFirstEventTime(driverOrder._id, driverOrder.execute_driver, function (err, startTime) {
      if (err) {
        return itemCallback(err);
      }
      
      if (!startTime) {
        driverTraces.push({
          driver: driverOrder.execute_driver,
          traces: []
        });
        return itemCallback();
      }
      var endTime = driverOrder.delivery_time ? driverOrder.delivery_time : new Date();
      getDriverTrace(driverOrder.execute_driver, startTime, endTime, function (err, result) {
        if (err) {
          itemCallback(err);
        }

        driverTraces.push({
          driver: driverOrder.execute_driver,
          traces: result
        });
        return itemCallback();
      });
    });
  }, function (err) {
    if (err) {
      return defered.reject(err);
    }
    defered.resolve(driverTraces);
  });
  return defered.promise;
}

//根据运单，查找所有trace
exports.getTracesByOrders = function (driverOrders) {
  return getOrdersTraces(driverOrders);
};