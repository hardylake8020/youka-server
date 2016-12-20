/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all'),
  moment = require('moment');

var appDb = require('../mongoose').appDb,
  Tender = appDb.model('Tender'),
  Driver = appDb.model('Driver'),
  Card = appDb.model('Card');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;
exports.getOneById = function (id, callback) {
  Card.findOne({_id: id}, function (err, card) {
    if (err || !card) {
      return callback({err: {type: 'invalid_card_id'}});
    }
    return callback(err, card);
  });
};

exports.create = function (driver, cardInfo, callback) {
  cardInfo = cardInfo || {};
  if (!cardInfo.number) {
    return callback({err: {type: 'empty_number'}});
  }

  Card.findOne({number: cardInfo.number, driver: driver._id}, function (err, card) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (card) {
      return callback({err: {type: 'card_existed'}});
    }

    card = new Card({
      number: cardInfo.number,
      driver: driver._id,
      type: cardInfo.type || 'unEtc'
    });

    card.save(function (err, newCard) {
      if (err || !newCard) {
        return callback({err: error.system.db_error});
      }
      return callback(err, newCard);
    });
  })
};

exports.getListByDriver = function (curDriver, callback) {
  Card.find({driver: curDriver._id}, function (err, cards) {
    if (err || !cards) {
      return callback({err: error.system.db_error});
    }
    return callback(err, cards);
  });
};

exports.bindTruck = function (curCard, truck, callback) {
  curCard.truck = truck._id;
  curCard.truck_number = truck.truck_number;
  curCard.save(function (err, card) {
    if (err || !card) {
      return callback({err: error.system.db_error});
    }
    truck.card = curCard._id;
    truck.card_number = curCard.number;
    truck.save(function (err, newTruck) {
      if (err || !card) {
        return callback({err: error.system.db_error});
      }
      return callback(err, card);
    });
  });
};


