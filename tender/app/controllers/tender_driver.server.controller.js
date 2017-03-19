/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var newTenderService = require('../../../libraries/services/new_tender_driver'),
  fs = require('fs');


exports.grab = function (req, res, next) {
  var currentDriver = req.driver;
  var tender = req.tender;
  newTenderService.grab(currentDriver, tender._id, function (err, result) {
    return res.send(err || result);
  })
};

exports.getUnStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentCount = parseInt(req.query.current_count || req.body.current_count) || 0;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var pickupAddress = req.body.pickup_address || '';
  var deliveryAddress = req.body.delivery_address || '';
  var tenderType = req.body.tender_type || '';

  var condition = {
    currentCount: currentCount,
    limit: limit,
    sort: {created: -1},
    tenderType: tenderType,
    pickupAddress: pickupAddress,
    deliveryAddress: deliveryAddress
  };

  newTenderService.getUnStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.getStartedListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentCount = parseInt(req.query.current_count || req.body.current_count) || 0;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var status = req.query.status || req.body.status || 'unAssigned';

  var condition = {
    currentCount: currentCount,
    limit: limit,
    sort: {created: -1},
    status: status
  };

  newTenderService.getStartedListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.assginDriver = function (req, res, next) {
  var currentDriver = req.driver;
  var curCard = req.card;
  var curTurck = req.truck;
  var tender = req.tender;

  newTenderService.assignDriver(tender, curCard, curTurck, function (err, result) {
    return res.send(err || result);
  })
};

exports.getEventByTender = function (req, res, next) {
  var curTender = req.tender;
  newTenderService.getEventByTender(curTender, function (err, result) {
    return res.send(err || result);
  });
};

exports.getDashboardData = function (req, res, next) {
  var curDriver = req.driver;
  newTenderService.getDashboardData(curDriver, function (err, result) {
    return res.send(err || result);
  })

};

exports.compare = function (req, res, next) {
  var curDriver = req.driver;
  var curTender = req.tender;
  var price = isNaN(parseInt(req.body.price)) ? 0 : parseInt(req.body.price);

  newTenderService.compare(curDriver, curTender, price, function (err, result) {
    return res.send(err || result);
  });
};


exports.updateDriverProfile = function (req, res, next) {
  var curDriver = req.driver;
  var truck_photo = req.body.truck_photo || '';
  var id_card_photo = req.body.id_card_photo || '';
  var bank_number_photo = req.body.bank_number_photo || '';
  var driving_id_photo = req.body.driving_id_photo || '';
  var travel_id_photo = req.body.travel_id_photo || '';
  var plate_photo = req.body.plate_photo || '';
  var truck_list_photo = req.body.truck_list_photo || '';

  newTenderService.updateDriverProfile(curDriver, {
    truck_photo: truck_photo,
    id_card_photo: id_card_photo,
    bank_number_photo: bank_number_photo,
    driving_id_photo: driving_id_photo,
    travel_id_photo: travel_id_photo,
    plate_photo: plate_photo,
    truck_list_photo: truck_list_photo
  }, function (err, result) {
    return res.send(err || result);
  });
};

exports.getDriverProfile = function (req, res, next) {
  var curDriver = req.driver;
  newTenderService.getDriverProfile(curDriver, function (err, result) {
    return res.send(err || result);
  });
};

exports.getTenderByTenderId = function (req, res, next) {
  var tender = req.tender;
  return res.send(tender);
};


exports.searchDrivers = function (currentDriver, keyword, callback) {
  var curDriver = req.driver;
  var keyword = req.body.keyword || '';

  newTenderService.searchDrivers(curDriver, keyword, function (err, result) {
    return res.send(err || result);
  });
};

exports.addDrivers = function () {

};

