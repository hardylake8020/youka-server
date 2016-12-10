'use strict';

var orderApi = require('../../controllers/apis/api.order');
var signFilter = require('../../filters/apis/api.signature');

module.exports = function (app) {
  app.route('/api/multiorder').post(signFilter.validSignature,orderApi.createMultiOrders);
  app.route('/api/keys').get(orderApi.generateApiKey);
  app.route('/api/orderpage').get(signFilter.validSignature, orderApi.getOrderDetailPageByOrderNumber);
  app.route('/api/order/detail/number').get(signFilter.validSignature, orderApi.getOrderDetailDataByOrderNumber);
  app.route('/api/order/assign/driver').post(signFilter.validSignature, orderApi.assignOrderToDriver);

  app.route('/api/order/assign/driver/delete').post(signFilter.validSignature, orderApi.deleteOrderAssign);
  app.route('/api/order/assign/driver/modify').post(signFilter.validSignature, orderApi.modifyOrderAssign);
  app.route('/api/order/create-assign').post(signFilter.validSignature, orderApi.createAssign);
};