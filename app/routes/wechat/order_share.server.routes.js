/**
 * Created by elinaguo on 15/6/4.
 */
'use strict';

var orderShare = require('../../controllers/wechat/order_share');

module.exports = function (app) {
  app.route('/wechat_share_qrcode').get(orderShare.orderShareCode);
  app.route('/wechat_share_qrcodepage').get(orderShare.orderShareCodePage);
  app.route('/wechat_share_content').get(orderShare.orderShareContent);
  app.route('/wechat_share_detail').get(orderShare.orderShareDetail);
};
