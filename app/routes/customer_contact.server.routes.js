/**
 * Created by elinaguo on 15/3/26.
 */
'use strict';

var customerContact = require('../../app/controllers/customer_contact'),
  userFilter = require('../filters/user'),
  companyFilter = require('../filters/company');

module.exports = function (app) {
  app.route('/customer_contact').post(userFilter.requireUser, companyFilter.requireCompany, customerContact.create);
  app.route('/customer_contact').get(userFilter.requireUser,companyFilter.requireCompany, customerContact.getByCompanyId);
  app.route('/customer_contact/user').get(userFilter.requireUser, customerContact.getCustomers);
  app.route('/customer_contact/filter').get(userFilter.requireUser, customerContact.getCustomersByFilter);
};
