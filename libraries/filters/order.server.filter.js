/**
 * Created by zenghong on 15/11/16.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all'),

  orderService = require('../services/order');

exports.requireOrder = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';
  if (!orderId) {
    return res.send({err: error.params.empty});
  }

  /*create_company execute_company execute_group create_group execute_driver pickup_contact delivery_contact*/
  orderService.getOrderByIdWithoutDeleted(orderId, function (err, order) {
    if (err) {
      return res.send(err);
    }

    req.currentOrder = order;

    next();
  });
};

exports.requireUnAssignedOrder = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';

  if (!orderId) {
    return res.send({err: error.params.empty});
  }

  orderService.getOrderByIdWithoutDeleted(orderId, function (err, order) {
    if (err) {
      return res.send(err);
    }

    if (order.status !== 'unAssigned') {
      return res.send({err: error.business.order_has_assigned});
    }

    req.currentOrder = order;

    next();
  });
};

exports.isAllowSeeing = function (req, res, next) {
  var user = req.user;
  var order = req.currentOrder;
  var orderRole = req.query.order_role || req.body.order_role || '';

  if (!user || !user._id || !order || !order._id) {
    return res.send({err: error.params.empty});
  }
  next();

  // orderService.isAllowSeeing(user, order.sender_company, order.receiver_company, order.create_group._id, order.execute_group._id, orderRole, function (err, isAllow) {
  //   if (!isAllow) {
  //     return res.send({err: error.business.order_not_visible});
  //   }
  //
  // });

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
      return res.send({err: error.business.order_not_visible});
    }

    next();
  });

};

