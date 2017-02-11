/**
 * Created by zenghong on 15/11/16.
 */
'use strict';

var async = require('async'),
  orderError = require('../errors/order'),

  appDb = require('../../libraries/mongoose').appDb,
  Order = appDb.model('Order');


function getOrderById(orderId, callback) {
  Order.findOne({_id: orderId, $or: [{delete_status: false}, {delete_status: {$exists: false}}]}, function (err, order) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }

    if (!order) {
      return callback({err: orderError.order_not_exist});
    }

    return callback(null, order);
  });
}

exports.requireOrder = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';
  if (!orderId) {
    return res.send({err: orderError.order_id_not_exist});
  }

  getOrderById(orderId, function (err, order) {
    if (err) {
      return res.send(err);
    }

    req.currentOrder = order;
    req.order = order;

    next();
  });
};

exports.requireUnAssignedOrder = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';
  if (!orderId) {
    return res.send({err: orderError.order_id_not_exist});
  }

  getOrderById(orderId, function (err, order) {
    if (err) {
      return res.send(err);
    }

    if (order.status !== 'unAssigned') {
      return res.send({err: orderError.order_has_assigned});
    }

    req.currentOrder = order;

    next();
  });
};

exports.requireUserCanViewOrder = function (req, res, next) {
  var groupIds = req.groupIds || [];
  var currentOrder = req.currentOrder;

  if (!currentOrder.execute_group) {
    return res.send({err: {type: 'order_execute_group_empty'}});
  }

  if (groupIds.length <= 0) {
    return res.send({err: {type: 'user_not_in_any_group'}});
  }

  var isInGroup = false;
  var executeGroupString = currentOrder.execute_group.toString();
  async.each(groupIds, function (item, asyncCallback) {
    if (item.toString() === executeGroupString) {
      isInGroup = true;
      return asyncCallback({err: {type: 'user_can_view_order'}});
    }
    return asyncCallback();
  }, function (err) {
    if (!isInGroup) {
      return res.send({err: orderError.order_not_visible});
    }

    next();
  });

};

