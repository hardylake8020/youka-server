/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  tenderPayment = require('../controllers/tender_payment');
module.exports = function (app) {
  app.route('/tender/driver/testPreWechatPay').post(tenderPayment.testPreWechatPay);
  app.route('/tender/driver/test_notifiy_url').get(tenderPayment.test_notifiy_url);
};
