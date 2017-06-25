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
  Truck = appDb.model('Truck'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;

exports.create = function (owner, truckInfo, callback) {
  if (!truckInfo) {
    return callback({err: {type: 'truck_info_empty'}});
  }

  if (!truckInfo.driver_number) {
    return callback({err: {type: 'driver_number_empty'}});
  }

  if (!truckInfo.truck_number) {
    return callback({err: {type: 'truck_number_empty'}});
  }

  if (!truckInfo.truck_type) {
    return callback({err: {type: 'truck_type_empty'}});
  }

  Driver.findOne({username: truckInfo.driver_number}, function (err, driver) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!driver) {
      return callback({err: {type: 'truck_driver_not_exist'}});
    }

    Truck.findOne({truck_number: truckInfo.truck_number, owner: owner._id}, function (err, truck) {
      if (err) {
        return callback({err: error.system.db_error});
      }

      if (truck) {
        return callback({err: {type: 'truck_number_exist'}});
      }

      truck = new Truck({
        truck_number: truckInfo.truck_number,
        truck_type: truckInfo.truck_type,
        owner: owner._id,
        driver: driver._id,
        driver_number: driver.username,
        driver_name: driver.nickname
      });

      truck.save(function (err, newTruck) {
        if (err || !newTruck) {
          return callback({err: error.system.db_error});
        }
        return callback(err, newTruck);
      });
    });
  });
};


exports.getListByDriver = function (curDriver, callback) {
  Truck.find({owner: curDriver._id}).sort({created: -1}).populate('card driver').exec(function (err, trucks) {
    if (err || !trucks) {
      return callback({err: error.system.db_error});
    }
    return callback(err, {trucks: trucks});
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

exports.getAllSuppliers = function (keyword, callback) {
  Driver.find({
  }).sort({nickname: -1}).exec(function (err, results) {
    if (err || !results) {
      return callback({err: error.system.db_error});
    }
    return callback(null, results);
  });
//
};

//params :driver供应商
exports.getAllDriversBySupplier = function (driver, keyword, callback) {
  Truck.find({
    owner: driver
  }).exec(function (err, results) {
    if (err || !results) {
      return callback({err: error.system.db_error});
    }
    return callback(null, results)
  });
};