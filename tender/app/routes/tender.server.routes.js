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
  app.route('/tender/create').post(userFilter.requireUser, tender.create);
  app.route('/tender/driver/list').post(driverFilter.requireDriver, tender.getListByDriver);
  app.route('/tender/driver/grab').post(driverFilter.requireDriver,tenderFileter.requireById, tenderDriver.grab);

  app.route('/tender/user/get/list').post(userFilter.requireUser, tender.getListByUser);
  app.route('/tender/user/get/one').get(userFilter.requireUser, tender.getOneByUser);
  app.route('/tender/user/delete').get(userFilter.requireUser, tender.deleteByUser);

  app.route('/tender/record/quote/top').get(userFilter.requireUser, tender.getTopQuotedRecord);
  app.route('/tender/record/list').get(userFilter.requireUser, tender.getAllBidRecord);
  app.route('/tender/record/winner').get(userFilter.requireUser, tender.getWinnerRecord);
  app.route('/tender/apply/bidder').post(userFilter.requireUser, tender.applyBidder);
  app.route('/tender/export_tenders').get(userFilter.requireUser, tender.exportTenders);

};
