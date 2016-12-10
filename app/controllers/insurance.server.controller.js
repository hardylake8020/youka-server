/**
 * Created by Wayne on 15/10/23.
 */
'use strict';
var path = require('path'),
  appDb = require('../../libraries/mongoose').appDb,
  config = require('../../config/config');

var Order = appDb.model('Order');

var insuranceService = require('../services/insurance');

exports.agreement = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../web/popup_page/views/insurance_agreement.client.view.html'));
};

exports.sendReportEmail = function (req, res, next) {
  var currentUser = req.user || {};

  insuranceService.sendReportEmail(currentUser.username, function (err, result) {
    if (err) {
      return res.send(err);
    }

    return res.send({success: true});
  });
};

exports.getInsuranceOrders = function (req, res, next) {
  var groupIds = req.groupIds || [];
  var searchArray = req.body.search_array || [];
  var sort = req.body.sort;
  var pagination = req.body.pagination || {};
  pagination.current_page = parseInt(pagination.current_page) || 1;
  pagination.limit = parseInt(pagination.limit) || 10;


  insuranceService.getInsuranceOrders(groupIds, searchArray, sort, pagination, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};

exports.ensureInsuranceOrder = function (req, res, next) {
  var insuranceInfo = req.body || {};
  var currentOrder = req.currentOrder || {};

  insuranceService.ensureInsuranceOrder(insuranceInfo, currentOrder, function (err, order) {
    if (err) {
      return res.send(err);
    }
    return res.send(order);
  });
};

exports.cancelInsuranceOrder = function (req, res, next) {
  var currentOrder = req.currentOrder || {};

  insuranceService.cancelInsuranceOrder(currentOrder, function (err, order) {
    if (err) {
      return res.send(err);
    }
    return res.send(order);
  });
};

exports.getUnpayInsurancePrice = function (req, res, next) {
  var currentUser = req.user || {};
  var groupIds = req.groupIds || [];
  insuranceService.getUnpayInsurancePrice(groupIds, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};

exports.getUnpayInsuranceOrders = function (req, res, next) {
  var currentUser = req.user || {};
  var groupIds = req.groupIds || [];
  insuranceService.getUnpayInsuranceOrders(groupIds, function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

exports.buyInsuranceFromPayment = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};
  var order_ids = req.body.order_ids;
  var buy_count = parseInt(req.body.buy_count);
  var coverage_total = parseInt(req.body.coverage_total);
  var price_total = parseInt(req.body.price_total);
  insuranceService.buyInsuranceFromPayment(order_ids, buy_count, coverage_total, price_total, company._id, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });
};

exports.getInsurancePaymentHistory = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};
  insuranceService.getInsurancePaymentHistory(company._id, function (err, insurancePayments) {
    if (err) {
      return res.send(err);
    }
    return res.send(insurancePayments);
  });
};

