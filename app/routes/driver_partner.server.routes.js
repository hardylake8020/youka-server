'use strict';

/**
 * Module dependencies.
 */
var drivers = require('../../app/controllers/driver_partner'),
  driverFilter = require('../filters/driver'),
  companyFilter = require('../filters/company');

module.exports = function (app) {
  app.route('/driver/partner').get(driverFilter.requireDriver, drivers.getInviteDrivers);
  app.route('/driver/partner/accept').post(driverFilter.requireDriver, companyFilter.requireCompany,drivers.acceptPartner);
  app.route('/driver/partner/confuse').post(driverFilter.requireDriver, companyFilter.requireCompany, drivers.confusePartner);
};

