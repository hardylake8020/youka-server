'use strict';

/**
 * Module dependencies.
 */
var thirdAccounts = require('../../app/controllers/third_account'),
  driverFilter = require('../filters/driver'),
  userFilter = require('../filters/user'),
  companyFilter = require('../filters/company');

module.exports = function (app) {
  app.route('/driver/thirdaccount/accountbinding').post(thirdAccounts.accountBinding);
  app.route('/driver/thirdaccount/signin').post(thirdAccounts.driverSignin);
};
