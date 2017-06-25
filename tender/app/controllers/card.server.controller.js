/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var cardService = require('../../../libraries/services/card');


exports.create = function (req, res, next) {
  var currentDriver = req.driver;

  cardService.create(currentDriver, req.body.card_info, function (err, result) {
    return res.send(err || result);
  })
};

exports.getListByDriver = function (req, res, next) {
  var currentDriver = req.driver;

  cardService.getListByDriver(currentDriver, function (err, result) {
    return res.send(err || result);
  })
};

exports.getById = function (req, res, next) {
  return res.send(req.card);
};


exports.bindTruck = function (req, res, next) {
  var currentCard = req.card;
  var truck = req.truck;

  cardService.bindTruck(currentCard, truck, function (err, result) {
    return res.send(err || result);
  })
};

exports.getAllCardsBySupplier = function (req, res, next) {
  cardService.getAllCardsBySupplier(req.driverById, function (err, result) {
    return res.send(err || result);
  });
//
};
