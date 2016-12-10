/**
 * Created by Wayne on 15/8/18.
 */
'use strict';
var driverError = require('../errors/driver'),
  appDb = require('../../libraries/mongoose').appDb,
  CustomizeEvent = appDb.model('CustomizeEvent'),
  AssignDriverEvent = appDb.model('AssignDriverEvent');

exports.recordAssginDriverEvent = function (orderId, driverId, callback) {
  if (!orderId || !driverId) {
    return callback(driverError.params_null);
  }

  CustomizeEvent.findOne(
    {
      'content.event_type': 'assign_driver',
      'content.driver': driverId,
      'content.order': orderId
    }, function (err, findEvent) {
      if (err) {
        return callback(driverError.internal_system_error);
      }
      else {
        if (!findEvent) {
          var assignDriverEvent = new AssignDriverEvent();
          assignDriverEvent.driver = driverId;
          assignDriverEvent.order = orderId;

          var customizeEvent = new CustomizeEvent();
          customizeEvent.content = assignDriverEvent;
          customizeEvent.save(function (err, saveEvent) {
            if (err || !saveEvent) {
              return callback(driverError.internal_system_error);
            }
            else {
              return callback(null, saveEvent);
            }
          });
        }
        else {
          return callback(null, findEvent);
        }
      }
    });
};