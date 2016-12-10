'use strict';

var path = require('path'),
  async = require('async'),
  traceService = require('../services/trace'),
  transportEventService = require('../services/transport_event'),
  orderService = require('../services/order');

function getOrderTraces(orderId, callback) {
  orderService.getDriverChildrenOrders(orderId, function (err, driverOrders) {
    if (err) {
      return callback(err);
    }
    traceService.getTracesByOrders(driverOrders)
      .then(function (result) {
        return callback(null, result);
      }, function (err) {
        return callback(err);
      });
  });

}

exports.getOrderDriverTraces = function (req, res, next) {
  var curentOrder = req.currentOrder;
  getOrderTraces(curentOrder._id, function (err, driverTraces) {
    if (err) {
      return res.send(err);
    }
    return res.send(driverTraces);
  });
};

exports.getSingleOrderInfo = function (req, res, next) {
  var order = req.currentOrder;
  orderService.getOrderAssignedInfoByOrderId(order, function (err, companyOrders) {
    if (err) {
      return res.send(err);
    }
    return res.send({currentOrder: order, assignedCompanyOrders: companyOrders});
  });
};

exports.getSingleOrderEvent = function (req, res, next) {
  var order = req.currentOrder;

  orderService.getDriverChildrenOrderIds(order._id, function (err, driverOrderIds) {
    if (err) {
      return res.send(err);
    }

    transportEventService.getEventByOrder(driverOrderIds, function (err, transportEvents) {
      if (err) {
        return res.send(err);
      }

      return res.send({
        order: {
          createUserNickname: order.create_user.nickname,
          createUserPhone: order.create_user.phone,
          createUsername: order.create_user.username,
          create_time: order.created,
          pickup_time: order.pickup_time,
          delivery_time: order.delivery_time
        }, events: transportEvents
      });
    });
  });
};
exports.getSingleOrderTrace = function (req, res, next) {
  var order = req.currentOrder;

  orderService.getDriverChildrenOrders(order._id, function (err, driverOrders) {
    if (err) {
      return res.send(err);
    }
    traceService.getTracesByOrders(driverOrders)
      .then(function (result) {
        return res.send(result);
      }, function (err) {
        return res.send(err);
      });
  });
};