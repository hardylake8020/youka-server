/**
 * Created by elinaguo on 15/6/2.
 */
'use strict';
var driverError = require('../errors/driver'),
  appDb = require('../../libraries/mongoose').appDb,
  ipLimitError = require('../errors/ip_limit'),
  IpLimit = appDb.model('IpLimit');

exports.checkIpFrequency = function (req, res, next) {
  req.connection = req.connection ? req.connection : {};
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var ip_path = ip + req.path;

  var newLimit = new IpLimit({
    ip_path: ip_path
  });

  newLimit.save(function (err, limit) {
    if (err || !limit) {
      return res.send({err: ipLimitError.internal_system_error});
    }

    IpLimit.count({ip_path: ip + req.path}, function (err, count) {
      if (err || !count) {
        return res.send({err: ipLimitError.internal_system_error});
      }

      if (count >= 100) {
        console.log('limit ',ip_path);
        return res.send({err: ipLimitError.too_frequency_error});
      }

      next();
    });
  });
};