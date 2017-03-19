'use strict';

var appDb = require('../mongoose').appDb;


var cryptoLib = require('../crypto'),
  errors = require('../../errors/all'),
  Driver = appDb.model('Driver');

exports.requireDriver = function (req, res, next) {
  var token;
  var phone_id = req.body.phone_id || req.query.phone_id || '';

  console.log(req.body);
  if (req.body.access_token) {
    token = req.body.access_token;
  } else {
    token = req.query.access_token;
  }

  req.connection = req.connection ? req.connection : {};
  req.socket = req.socket ? req.socket : {};
  req.connection.socket = req.connection.socket ? req.connection.socket : {};

  if (!token) {
    return res.send({
      err: {
        type: 'undefined_access_token',
        message: 'a access_token to be need',
        param: 'access_token'
      }
    });
  }

  try {
    token = cryptoLib.decrpToken(token, 'secret');
  }
  catch (e) {
    return res.send({
      err: {
        type: 'invalid_access_token',
        message: 'invalid access token',
        param: 'invalid_access_token'
      }
    });
  }

  Driver.findOne({_id: token._id}, function (err, driver) {
    if (err) {
      return res.send({err: errors.system.db_error});
    }

    if (!driver) {
      return res.send({err: errors.business.driver_not_exist});
    }

    req.driver = driver;
    next();

  });
};


exports.requireDriverById = function (req, res, next) {

  var driver_id = req.body.driver_id || req.query.driver_id || '';

  if (!driver_id) {
    return res.send({err: {type: 'driver_id_empty'}});
  }
  req.connection = req.connection ? req.connection : {};
  req.socket = req.socket ? req.socket : {};
  req.connection.socket = req.connection.socket ? req.connection.socket : {};

  Driver.findOne({_id: driver_id}, function (err, driver) {
    if (err) {
      return res.send({err: errors.system.db_error});
    }

    if (!driver) {
      return res.send({err: errors.business.driver_not_exist});
    }

    req.driverById = driver;
    next();

  });
};