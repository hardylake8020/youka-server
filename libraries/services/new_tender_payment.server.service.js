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
  Driver = appDb.model('Driver'),
  Contact = appDb.model('Contact'),
  Order = appDb.model('Order'),
  TransportEvent = appDb.model('TransportEvent'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;


exports.examine = function (tender, user, callback) {
  if (tender.status != 'completed') {
    return callback({err: {type: 'tender_not_completed'}});
  }

  tender.examined = true;
  tender.examined_username = user.username;
  tender.save(function (err, saveTender) {
    if (err || !saveTender) {
      return callback({err: error.system.db_error});
    }

    return callback(null, saveTender);
  });
};

exports.payment = function (tender, user, type, number, callback) {
  var payType = [
    'real_pay_top_cash',
    'real_pay_top_card',
    'real_pay_last_cash',
    'real_pay_last_card',
    'real_pay_tail_cash',
    'real_pay_tail_card',
    'real_pay_ya_jin',
  ];


  if (payType.indexOf(type) < 0) {
    return callback({err: {type: 'invalid_type'}});
  }
  tender[type] = number;
  tender[type + '_time'] = new Date();
  tender[type + '_username'] = user.username;
  tender.save(function (err, saveTender) {
    if (err || !saveTender) {
      return callback({err: error.system.db_error});
    }
    return callback(null, saveTender);
  });
};
