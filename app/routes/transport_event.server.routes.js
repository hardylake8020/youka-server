/**
 * Created by elinaguo on 15/4/6.
 */
'use strict';

var transportEvents = require('../controllers/transport_event'),
  driverFilter = require('../filters/driver'),
  orderFilter = require('../filters/order'),
  userFilter = require('../filters/user');

module.exports = function (app) {
  app.route('/transport_event/upload').post(driverFilter.requireDriver, transportEvents.upload);
  app.route('/transport_event/multiUpload').post(driverFilter.requireDriver, transportEvents.uploadMultiOrders);
  app.route('/transport_event').get(userFilter.requireUser, transportEvents.getEventByOrderId);
  app.route('/transport_event/sharedorderevent').get(userFilter.requireUser, transportEvents.getEventByOrderIdWithNoLimit);

  app.route('/transport_event/temporary/upload').post(driverFilter.requireTemporaryDriver, transportEvents.temporaryUploadEvent);
  //实收货物确认信息
  app.route('/transport_event/actual_goods/detail').post(driverFilter.requireDriver, orderFilter.requireOrder, transportEvents.uploadActualGoodsDetail);

  app.route('/transport_event/wechat_driver/upload').post(driverFilter.requireDriverWithId, transportEvents.wechatUploadEvent);
};
