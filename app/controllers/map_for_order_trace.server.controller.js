/**
 * Created by louisha on 15/6/02.
 */

'use strict';

var async = require('async'),
  config = require('../../config/config'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  User = appDb.model('User'),
  UserGroup = appDb.model('UserGroup'),
  orderError = require('../errors/order'),
  userError = require('../errors/user'),
  userService = require('../services/user'),
  Trace = appDb.model('Trace'),
  traceError = require('../errors/trace'),
  TransportEvent = appDb.model('TransportEvent'),
  TransportEventError = require('../errors/transport_event'),
  Order = appDb.model('Order'),
  Driver = appDb.model('Driver'),
  driverError = require('../errors/driver'),
  path = require('path');

/**
 * 先找出所有当前用户下所有在途运输的订单（订单详情归集，因为订单详情唯一确定到货主一张运单），接着再找出所有在途运输这些订单的司机。并根据司机进行分组。
 *  同一张单子可能同事有多个司机在运，所以确定司机是否是自己公司通过分配下去进行承运，确定司机后，根据司机id查出每一个司机当前的位置信息。再根据司机的订单查出一张订单里司机上传的提货事件，得到提货事件里的提货照片和提货单据。
 *  最后返回给客户端的 返回给客户端,具体数据结构
 *  {
 *      driver:司机对象,
 *      address:位置字符串，
 *      driver_id:司机id
 *      events：事件
 *      location：经纬度
 *      maxtime：时间最近上传
 *      orders：司机正在运输的订单列表
 *  }
 *
 *
 */

function checkDriverInEvents(driverId, events, callback) {
  if (!driverId || !events || events.length <= 0) {
    return callback(false);
  }

  async.each(events, function (event, eventCallback) {
    if (!event.driver){
      return eventCallback();
    }

    if (event.driver.toString() === driverId.toString()) {
      return eventCallback(orderError.has_found_driver);
    }
    else {
      return eventCallback();
    }
  }, function (err) {
    if (err && err.type === orderError.has_found_driver.type.toString()) {
      return callback(true);
    }
    else {
      return callback(false);
    }
  });

}

/*
 * 对于每一张运单，找出下级在运的司机.
 * 司机已提货，但未交货.
 * */
function findOnWayDriver(orderItem, callback) {
  var driverItem = null;

  if (orderItem.execute_drivers.length > 0) {
    async.each(orderItem.execute_drivers, function (eachDriver, driverCallback) {
      var driverId = eachDriver._id;
      checkDriverInEvents(driverId, orderItem.pickup_events, function (isPickupExist) {
        if (isPickupExist) {
          checkDriverInEvents(driverId, orderItem.delivery_events, function (isDeliveryExist) {
            if (isDeliveryExist) {
              return driverCallback();
            }
            else {
              driverItem = eachDriver;
              return driverCallback(orderError.has_found_driver);
            }
          });
        }
        else {
          return driverCallback();
        }
      });

    }, function (err) {
      if (err && err.type === orderError.has_found_driver.type) {
        return callback(null, driverItem);
      }
      else {
        return callback(null, null);
      }
    });
  }
  else {
    return callback(null, null);
  }
}

/*
 * 目标: 找到当前用户能看到在运订单的司机位置
 * 实现方法: 找到未交货的运单，找到运单下在运的司机（关键逻辑），以司机分组运单，查找司机，得到司机位置信息.
 * 返回数据：以司机分组的运单和司机信息。
 * */
exports.getDriverOrders = function (req, res, next) {
  var user = req.user || {};
  var showDriverNumber = parseInt(req.body.showNumber || req.query.showNumber);

  userService.getGroupIdsByUser(user, function (err, groupIds) {
    if (err) {
      req.err = {err: orderError.internal_system_error};
      return next();
    }
    if (!groupIds || groupIds.length === 0) {
      req.err = {err: userError.not_in_any_group};
      return next();
    }

    Order.find({execute_group: {$in: groupIds}, status: {$in: ['unDeliverySigned', 'unDeliveried']} }, function (err, allOrders) {
      if (err) {
        console.log(err);
        req.err = {err: orderError.internal_system_error};
        return next();
      }

      var allDriverIds = [];
      var allDriverOrders = {};


      var queue = async.queue(function (eachOrder, eachOrderCallback) {
        if (showDriverNumber > 0 && allDriverIds.length >= showDriverNumber) {
          return eachOrderCallback(orderError.more_than_max_drivers);
        }
        if (eachOrder.execute_drivers.length > 0){
          findOnWayDriver(eachOrder, function (err, eachDriver) {
            if (err) {
              return eachOrderCallback(err);
            }

            if (!eachDriver) {
              return eachOrderCallback();
            }
            else {
              var driverId = eachDriver._id.toString();

              if (allDriverIds.indexOf(driverId) < 0) {
                allDriverIds.push(driverId);
                allDriverOrders[driverId] = [];
              }

              allDriverOrders[driverId].push(eachOrder);

              return eachOrderCallback();
            }
          });
        }
        else {
          return eachOrderCallback();
        }
      }, 10);

      queue.push(allOrders, function (err) {
        if (err) {
          queue.kill();
          if (err.type !== orderError.more_than_max_drivers.type) {
            console.log(err);
            res.send({err: err});
          }
          else {
            if (allDriverIds.length > 0) {
              Driver.find({_id: {$in: allDriverIds}}, function (err, driverEntities) {
                if (err) {
                  console.log(err);
                  req.err = {err: orderError.internal_system_error};
                  return next();
                }

                req.data = {drivers: driverEntities, allDriverOrders: allDriverOrders};
                return next();
              });
            }
            else {
              req.data = {drivers: [], allDriverOrders: {}};
              return next();
            }
          }
        }

      });

      queue.drain = function() {
        if (allDriverIds.length > 0) {
          Driver.find({_id: {$in: allDriverIds}}, function (err, driverEntities) {
            if (err) {
              console.log(err);
              req.err = {err: orderError.internal_system_error};
              return next();
            }

            req.data = {drivers: driverEntities, allDriverOrders: allDriverOrders};
            return next();
          });
        }
        else {
          req.data = {drivers: [], allDriverOrders: {}};
          return next();
        }
      };

    });
  });

};