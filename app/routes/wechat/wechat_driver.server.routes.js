'use strict';

var wechatDriver = require('../../controllers/wechat/wechat_driver'),
 orderFilter = require('../../filters/order'),
 driverFilter = require('../../filters/driver');

module.exports = function (app) {
  app.route('/wechat_driver_bind').post(wechatDriver.bindDriver);
  app.route('/wechat_driver_unbind').get(driverFilter.requireDriverWithId, wechatDriver.unbindDriver);

  app.route('/wechat_driver_order_single_page').get(driverFilter.requireDriverWithId, orderFilter.requireOrder, wechatDriver.singleOrderPage);
  //app.route('/wechat_driver_order_single_page').get(wechatDriver.singleOrderPage);
  app.route('/wechat_driver_index_page').get(wechatDriver.indexPage);

  app.route('/wechat_driver/order/get').post(driverFilter.requireDriverWithId, wechatDriver.getOrders);

};
