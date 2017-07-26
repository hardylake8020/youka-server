'use strict';

var order = require('../controllers/order'),
  userFilter = require('../filters/user'),
  orderFilter = require('../filters/order');

module.exports = function (app) {
  app.route('/order/driver/traces').get(orderFilter.requireOrder, order.getOrderDriverTraces);
  app.route('/order/single/info').get(userFilter.requireUser, orderFilter.requireOrder, orderFilter.isAllowSeeing, order.getSingleOrderInfo);
  app.route('/order/single/event').get(userFilter.requireUser, orderFilter.requireOrder, orderFilter.isAllowSeeing, order.getSingleOrderEvent);
  app.route('/order/single/trace').get(userFilter.requireUser, orderFilter.requireOrder, orderFilter.isAllowSeeing, order.getSingleOrderTrace);
};
