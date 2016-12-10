/**
 * Created by elinaguo on 15/4/9.
 */
'use strict';
var traceError = require('../errors/trace'),
  orderError = require('../errors/order'),
  orderShareError = require('../errors/order_share'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  async = require('async'),
  q = require('q'),
  Order = appDb.model('Order'),
  OrderShare = appDb.model('OrderShare');

var orderService = require('../services/order'),
  driverService = require('../services/driver'),
  traceService = require('../services/trace');

exports.multiUpload = function (req, res, next) {
  var currentDriver = req.driver || {};
  var traceInfoArray = req.body.trace_infos || [];

  var traces = [];
  async.each(traceInfoArray, function (traceInfo, callback) {
    //如果是字符串就尝试解析
    if (!traceInfo.longitude) {
      try {
        traceInfo = JSON.parse(traceInfo);
      }
      catch (e) {
        return callback();
      }
    }

    traceService.upload(currentDriver, traceInfo.address || '', traceInfo.longitude, traceInfo.latitude, traceInfo.time, traceInfo.type, function (err, trace) {
      if (err) {
        return callback(err);
      }

      traces.push(trace);
      return callback();
    });
  }, function (err) {
    if (err)
      return res.send(err);

    if (traces.length > 0) {
      driverService.updateDriverCurTrace(traces[traces.length - 1].location[0], traces[traces.length - 1].location[1], currentDriver._id, function () {
        return res.send({success: true, success_count: traces.length});
      });
    }
    else {
      return res.send({success: true, success_count: traces.length});
    }
  });
};

//获取运输途中运单的所有位置点，
exports.getTrace = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.query.order_id || '';
  var viewer = req.body.viewer || req.query.viewer || '';

  var otherCondition = {};
  if (viewer) {
    if (viewer === 'sender') {
      otherCondition.sender = true;
    }
    if (viewer === 'receiver') {
      otherCondition.receiver = true;
    }
  }

  //获取订单
  Order.findOne({_id: orderId}).populate('execute_group create_group').exec(function (err, order) {
    if (err) {
      return res.send({err: traceError.internal_system_error});
    }

    if (!order) {
      return res.send({err: orderError.order_not_exist});
    }

    orderService.isOrderAllowSeeing(order, currentUser, otherCondition, function (err, canSeeing) {
      if (err) {
        return res.send(err);
      }
      if (!canSeeing) {
        return res.send({err: orderError.order_not_visible});
      }
      orderService.getDriverChildrenOrders(orderId, function (err, driverOrders) {
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
    });
  });
};

exports.getSharedOrderTrace = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.query.order_id || '';

  OrderShare.findOne({username: currentUser.username, order: orderId}).exec(function (err, orderShare) {
    if (err) {
      req.err = {err: orderShareError.internal_system_error};
      return next();
    }

    if (!orderShare) {
      res.err = {err: orderError.order_not_visible};
      return next();
    }

    //获取订单
    Order.findOne({_id: orderId}, function (err, order) {
      if (err) {
        return res.send({err: traceError.internal_system_error});
      }

      if (!order) {
        return res.send({err: orderError.order_not_exist});
      }

      orderService.getDriverChildrenOrders(orderId, function (err, driverOrders) {
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

    });
  });

};
