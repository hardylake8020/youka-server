/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  tenderDriver = require('../controllers/tender_driver'),
  userFilter = require('../../../libraries/filters/user'),
  tenderFileter = require('../../../libraries/filters/tender'),
  driverFilter = require('../../../libraries/filters/driver');


module.exports = function (app) {
  // app.route('/tender/create').post(userFilter.requireUser, tender.create);
  // app.route('/tender/driver/getUnStartedListByDriver').post(driverFilter.requireDriver, tenderDriver.getUnStartedListByDriver);
};
