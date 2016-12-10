/**
 * Created by Wayne on 15/8/5.
 */
'use strict';

var orderReceive = require('../../../controllers/wechat/zz_receiver_sender/order_receive');
var userFilter = require('../../../filters/user');

module.exports = function (app) {
  app.route('/wechat/receiver/order_list_page').get(orderReceive.getReceiverListPage);
  app.route('/wechat/sender/order_list_page').get(orderReceive.getSenderListPage);

  app.route('/wechat/receiver/order_submit_page').get(userFilter.requireWeiChatUser, orderReceive.getSubmitPage);
  app.route('/wechat/receiver/order_onway_page').get(userFilter.requireWeiChatUser, orderReceive.getOnWayPage);
  app.route('/wechat/receiver/order_completed_page').get(userFilter.requireWeiChatUser, orderReceive.getCompletedPage);

  app.route('/wechat/receiver/order/unpickup').get(userFilter.requireWeiChatUser, orderReceive.getUnPickupOrderForReceiver);
  app.route('/wechat/receiver/order/undelivery').get(userFilter.requireWeiChatUser, orderReceive.getUnDeliveryOrderForReceiver);
  app.route('/wechat/receiver/order/completed').get(userFilter.requireWeiChatUser, orderReceive.getCompletedOrderForReceiver);

  app.route('/wechat/sender/order/unpickup').get(userFilter.requireWeiChatUser, orderReceive.getUnPickupOrderForSender);
  app.route('/wechat/sender/order/undelivery').get(userFilter.requireWeiChatUser, orderReceive.getUnDeliveryOrderForSender);
  app.route('/wechat/sender/order/completed').get(userFilter.requireWeiChatUser, orderReceive.getCompletedOrderForSender);

};