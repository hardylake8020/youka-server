/**
 * Created by Wayne on 15/4/30.
 */
'use strict';

/**
 * Module dependencies.
 */
var datacollections = require('../../app/controllers/datacollection'),
  filter = require('../../app/filters/user');

module.exports = function (app) {
  app.route('/datacollection/register').get(filter.requireAdmin, datacollections.Registers);
  app.route('/datacollection/visit').post(filter.requireAdmin, datacollections.Visits);
  app.route('/datacollection/order').get(filter.requireAdmin, datacollections.companyOrdersCount);
  app.route('/datacollection/company/orders').get(filter.requireAdmin, datacollections.companyOrders);
};