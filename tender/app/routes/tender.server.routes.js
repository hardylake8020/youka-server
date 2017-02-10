/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  tenderDriver = require('../controllers/tender_driver'),
  tenderPayment = require('../controllers/tender_payment'),
  userFilter = require('../../../libraries/filters/user'),
  tenderFileter = require('../../../libraries/filters/tender'),
  cardFileter = require('../../../libraries/filters/card'),
  truckFileter = require('../../../libraries/filters/truck'),

  driverFilter = require('../../../libraries/filters/driver');


module.exports = function (app) {
  app.route('/tender/create').post(userFilter.requireUser, tender.create);
  app.route('/tender/driver/getUnStartedListByDriver').post(driverFilter.requireDriver, tenderDriver.getUnStartedListByDriver);
  app.route('/tender/driver/grab').post(driverFilter.requireDriver, tenderFileter.requireById, tenderDriver.grab);
  app.route('/tender/driver/getStartedListByDriver').post(driverFilter.requireDriver, tenderDriver.getStartedListByDriver);
  app.route('/tender/driver/assginDriver').post(driverFilter.requireDriver, cardFileter.requireById, truckFileter.requireById, tenderFileter.requireById, tenderDriver.assginDriver);
  app.route('/tender/driver/transportevent').post(driverFilter.requireDriver, tenderFileter.requireById, tenderDriver.getEventByTender);
  app.route('/tender/driver/dashboard').post(driverFilter.requireDriver, tenderDriver.getDashboardData);
  app.route('/tender/driver/compare').post(driverFilter.requireDriver, tenderFileter.requireById, tenderDriver.compare);

  app.route('/tender/user/payment').post(userFilter.requireUser, tenderFileter.requireById, tenderPayment.payment);
  app.route('/tender/user/examine').post(userFilter.requireUser, tenderFileter.requireById, tenderPayment.examine);


  app.route('/tender/user/get/list').post(userFilter.requireUser, tender.getListByUser);
  app.route('/tender/user/get/one').get(userFilter.requireUser, tender.getOneByUser);
  app.route('/tender/user/delete').get(userFilter.requireUser, tender.deleteByUser);

  app.route('/tender/record/quote/top').get(userFilter.requireUser, tender.getTopQuotedRecord);
  app.route('/tender/record/list').get(userFilter.requireUser, tender.getAllBidRecord);
  app.route('/tender/record/winner').get(userFilter.requireUser, tender.getWinnerRecord);
  app.route('/tender/apply/bidder').post(userFilter.requireUser, tender.applyBidder);
  app.route('/tender/export_tenders').get(userFilter.requireUser, tender.exportTenders);

};
