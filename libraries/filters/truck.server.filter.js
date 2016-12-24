'use strict';

var cryptoLib = require('../crypto'),
  truckService = require('../services/truck'),
  error = require('../../errors/all');


exports.requireById = function (req, res, next) {
  var truckId = req.query.truck_id || req.body.truck_id || '';

  if (!truckId) {
    return res.send({err: {type: 'truck_id_not_exist'}});
  }

  truckService.getbyId(truckId, function (err, truck) {
    if (err) {
      return res.send(err);
    }

    req.truck = truck;
    next();
  });
};
