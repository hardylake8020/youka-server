'use strict';

var appDb = require('../../../libraries/mongoose').appDb,
  async = require('async'),
  path = require('path'),
  TempDriverVersion = appDb.model('TempDriverVersion'),
  DriverCompany = appDb.model('DriverCompany'),
  Driver = appDb.model('Driver');

exports.getDriverVersionPage = function (req, res, next) {
  return res.sendfile(path.join(__dirname, '../../../web/dashboard/driver_version_list.html'));
};

exports.getDriverVersion = function (req, res, next) {
  TempDriverVersion.find({}, function (err, driverVersions) {
    if (driverVersions.length === 0) {
      return res.send('no driver version');
    }
    var drivers = [];
    async.eachSeries(driverVersions, function (driverVersion, callback) {
      Driver.findOne({username: driverVersion.username}, function (err, driver) {
        if (err || !driver) {
          return callback(err);
        }
        DriverCompany.findOne({driver: driver._id}).populate('company').exec(function (err, driverCompany) {
          if (err || !driverCompany) {
            return callback(err);
          }
          drivers.push({
            version: driverVersion.version,
            platform: driverVersion.platform,
            username: driverVersion.username,
            company: driverCompany.company.name,
            update:driverVersion.updated
          });
          return callback();
        });
      });
    }, function (err) {
      if (err) {
        return res.send(err);
      }
      return res.send(drivers);
    });
  });
};




