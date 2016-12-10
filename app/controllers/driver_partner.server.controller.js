/**
 * Created by elinaguo on 15/3/26.
 */
'use strict';

var driverPartnerError = require('../errors/driver_partner'),
  async = require('async'),
  appDb = require('../../libraries/mongoose').appDb;

//用户模型
var Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  InviteDriver = appDb.model('InviteDriver'),
  DriverCompany = appDb.model('DriverCompany');

exports.getInviteDrivers = function (req, res, next) {
  var driver = req.driver || {};

  InviteDriver.find({
    username: driver.username
  }).populate('company').exec(function (err, inviteDrivers) {
    if (err) {
      return res.send({err: driverPartnerError.internal_system_error});
    }
    else {
      return res.send(inviteDrivers);
    }
  });
};
exports.acceptPartner = function (req, res, next) {
  var driver = req.driver || {};
  var companyId = req.body.company_id || '';

  InviteDriver.findOne({username: driver.username, company: companyId}, function (err, inviteDriver) {
    if (err) {
      return res.send({err: driverPartnerError.internal_system_error});
    }
    else if (!inviteDriver) {
      return res.send({err: driverPartnerError.uninvited_partner});
    }
    else {
      DriverCompany.findOne({driver: driver._id, company: companyId}, function (err, driverCompany) {
        if (err) {
          return res.send({err: driverPartnerError.internal_system_error});
        }
        else if (driverCompany) {
          async.auto({
            updateInviteDriverStatus: function (callback) {
              if (inviteDriver.status !== 'accepted') {
                inviteDriver.status = 'accepted';
                inviteDriver.save(function (err, inviteDriverSave) {
                  if (err) {
                    return callback({err: driverPartnerError.internal_system_error});
                  }
                  return callback();
                });
              }
              else {
                return callback();
              }
            }
          }, function (err, result) {
            if (err) {
              return res.send(err);
            }
            else {
              return res.send({err: driverPartnerError.driver_has_accepted_partner});
            }
          });
        }
        else {
          var newDriverCompany = new DriverCompany({
            driver: driver._id,
            company: companyId
          });
          newDriverCompany.save(function (err, driverCompanyEntity) {
            if (err || !driverCompanyEntity) {
              return res.send({err: driverPartnerError.internal_system_error});
            }
            else {
              inviteDriver.status = 'accepted';
              inviteDriver.save(function (err, result) {
                if (err || !result) {
                  return res.send({err: driverPartnerError.internal_system_error});
                }
                else {
                  return res.send({success: true});
                }
              });
            }
          });
        }
      });
    }
  });
};
exports.confusePartner = function (req, res, next) {
  var driver = req.driver || {};
  var companyId = req.body.company_id || '';

  InviteDriver.findOne({
    username: driver.username,
    company: companyId
  }, function (err, inviteDriver) {
    if (err) {
      return res.send({err: driverPartnerError.internal_system_error});
    }
    if (!inviteDriver) {
      return res.send({err: driverPartnerError.uninvited_partner});
    }
    DriverCompany.findOne({driver: driver._id, company: companyId}, function (err, driverCompany) {
      if (err) {
        return res.send({err: driverPartnerError.internal_system_error});
      }
      if (driverCompany) {
        driverCompany.remove(function () {
          inviteDriver.status = 'confused';
          inviteDriver.save(function (err, result) {
            if (err) {
              return res.send({err: driverPartnerError.internal_system_error});
            }

            return res.send({success: true});
          });
        });
      }
      else {
        async.auto({
          updateTheInviteDriverStauts: function (callback) {
            if (inviteDriver.status !== 'confused') {
              inviteDriver.status = 'confused';
              inviteDriver.save(function (err, result) {
                if (err) {
                  return callback({err: driverPartnerError.internal_system_error});
                }
                return callback();
              });
            }
            else {
              return callback({err: driverPartnerError.driver_has_confused_partner});
            }
          }
        }, function (err, result) {
          if (err)
            return res.send(err);

          return res.send({success: true});
        });
      }
    });
  });
};
