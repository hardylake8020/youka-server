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
  Truck = appDb.model('Truck'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;

exports.create = function (curDriver, truckInfo, callback) {
  Truck.findOne({truck_number: truckInfo.truck_number, driver: curDriver._id}, function (err, truck) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (truck) {
      return callback({err: {type: 'truck_number_exist'}});
    }

    truck = new Truck({
      truck_number: truckInfo.truck_number,
      truck_type: truckInfo.truck_type,
      driver: curDriver._id
    });

    truck.save(function (err, newTruck) {
      if (err || !newTruck) {
        return callback({err: error.system.db_error});
      }
      return callback(err, newTruck);
    });
  });
};


exports.getListByDriver = function (curDriver, callback) {
  Truck.find({driver: curDriver._id}, function (err, trucks) {
    if (err || !trucks) {
      return callback({err: error.system.db_error});
    }
    return callback(err, trucks);
  });
};

exports.getbyId = function (id, callback) {
  Truck.findOne({_id: id}, function (err, truck) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!truck) {
      return callback({err: {type: 'truck_not_exist'}});
    }
    return callback(err, truck);
  });
};


