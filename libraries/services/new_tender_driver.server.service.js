/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all'),
  dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment'),
  Promise = require('promise'),
  Excel = require('exceljs');

var appDb = require('../mongoose').appDb,
  Tender = appDb.model('Tender'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;


exports.grab = function (currentDriver, tenderId, callback) {
  Tender.update({
    _id: tenderId,
    status: 'unStarted'
  }, {$set: {driver_winner: currentDriver._id, status: 'unAssigned'}}, function (err, count) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Tender.findOne({_id: tenderId}, function (err, tender) {
      if (err || !tender) {
        console.log(err);
        return callback({err: error.system.db_error});
      }
      console.log('driver grab :' + currentDriver.username + ' tender :' + tender.order_number);
      if (tender.driver_winner.toString() != currentDriver._id.toString()) {
        console.log('failed');
        return callback({err: error.business.tender_grab_failed})
      }
      console.log('success');
      return callback(null, {success: true});
    });
  });
};
