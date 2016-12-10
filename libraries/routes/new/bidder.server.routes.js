'use strict';

var bidder = require('../../controllers/bidder'),
  bidderFilter = require('../../filters/bidder'),
  userFilter = require('../../filters/user');

module.exports = function (app) {
  app.route('/bidder/list/all/detail').get(userFilter.requireUser, bidder.getCompanyBidderDetail);
  app.route('/bidder/invite').post(userFilter.requireUser, bidder.createCompanyBidder);


  app.route('/bidder/manage/count').get(userFilter.requireAdmin, bidder.getPlatformBidderCount);
  app.route('/bidder/manage/list').get(userFilter.requireAdmin, bidder.getPlatformBidderList);
  app.route('/bidder/manage/deposit_log').get(userFilter.requireAdmin, bidderFilter.requireById, bidder.getDepositLog);
  app.route('/bidder/manage/remove_breach').get(userFilter.requireAdmin, bidderFilter.requireById, bidder.removeBreach);
  app.route('/bidder/manage/deduct_breach').get(userFilter.requireAdmin, bidderFilter.requireById, bidder.deductBreach);

  app.route('/bidder/export-company-bidder').get(userFilter.requireUser, bidder.exportCompanyBidder);
  app.route('/bidder/remove-company-bidder').post(userFilter.requireUser, bidder.removeCompanyBidder);

};
