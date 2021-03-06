/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  driverFilter = require('../../../libraries/filters/driver'),
  tenderPayment = require('../controllers/tender_payment');


module.exports = function (app) {
  app.route('/tender/driver/getWechatPayToken').post(driverFilter.requireDriver, tenderPayment.getWechatPayToken);
  app.route('/tender/driver/test_notifiy_url').get(tenderPayment.test_notifiy_url);
  app.route('/tender/driver/test_notifiy_url').post(tenderPayment.test_notifiy_url);
  app.route('/tender/driver/wechatPayResult').post(driverFilter.requireDriver, tenderPayment.wechatPayResult);
  app.route('/tender/driver/driverPayList').post(driverFilter.requireDriver, tenderPayment.driverPayList);
};
