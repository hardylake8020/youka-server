/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  TransportEvent = appDb.model('TransportEvent');

var self = exports;

function getEventByOrder(orderIds, callback) {
  if (!orderIds || !Array.isArray(orderIds)) {
    return callback({err: error.params.invalid_value});
  }

  TransportEvent.find({order: {$in: orderIds}})
    .populate('driver order')
    .exec(function (err, transportEvents) {
      if (err) {
        err = {err: error.system.db_error};
      }

      return callback(err, transportEvents);
    });

}

exports.getEventByOrder = function (orderIds, callback) {
  getEventByOrder(orderIds, callback);
};