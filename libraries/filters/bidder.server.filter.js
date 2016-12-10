'use strict';

var cryptoLib = require('../crypto'),
  bidderService = require('../services/bidder'),
  error = require('../../errors/all');


exports.requireByWeiChat = function (req, res, next) {
  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: error.business.openid_empty});
  }

  bidderService.getByOpenid(openid, function (err, bidder) {
    if (err) {
      return res.send(err);
    }

    if (!bidder) {
      return res.send({err: error.business.openid_invalid});
    }

    req.bidder = bidder;
    next();
  });
};

exports.requireById = function (req, res, next) {
  var bidderId = req.query.bidder_id || req.body.bidder_id || '';

  if (!bidderId) {
    return res.send({err: error.params.empty});
  }

  bidderService.getById(bidderId, function (err, bidder) {
    if (err) {
      return res.send(err);
    }

    if (!bidder) {
      return res.send({err: error.business.bidder_not_exist});
    }

    req.bidder = bidder;
    next();
  });
};

exports.canSaveDeposit = function (req, res, next) {
  var bidder = req.bidder;
  if (bidder && bidder._id) {
    if (bidder.deposit_status === 'paid') {
      return res.send({err: error.business.bidder_deposit_paid});
    }
    if (bidder.deposit_status === 'freeze') {
      return res.send({err: error.business.bidder_deposit_freeze});
    }

    next();
  }
  else {
    return res.send({err: error.business.bidder_not_exist});
  }
};

exports.requireNormalDeposit = function (req, res, next) {
  var bidder = req.bidder;
  if (bidder && bidder._id) {
    var errorStatus = {
      unpaid: error.business.bidder_deposit_unpaid,
      freeze: error.business.bidder_deposit_freeze,
      deducted: error.business.bidder_deposit_deducted
    };

    if (bidder.deposit_status !== 'paid') {
      return res.send({err: errorStatus[bidder.deposit_status]});
    }

    next();
  }
  else {
    return res.send({err: error.business.bidder_not_exist});
  }
};