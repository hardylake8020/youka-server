/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

/**
 * Module dependencies.
 */
var companies = require('../../app/controllers/company'),
  filter = require('../../app/filters/user');

module.exports = function (app) {
  app.route('/company').post(filter.requireUser, companies.create);
  app.route('/company/invitebycompanyname').post(filter.requireUser, companies.inviteByCompanyName);
  app.route('/company/invitebyusername').post(filter.requireUser, companies.inviteByUsername);
  app.route('/company/invite/batch').post(filter.requireUser, companies.batchInviteCompany);

  app.route('/company').get(companies.getAll);
  app.route('/company/partners').get(filter.requireUser, companies.getPartners);
  app.route('/company/company').get(filter.requireUser, companies.getPartnerCompanys);
  app.route('/company/driver').get(filter.requireUser, companies.getPartnerDrivers);
  app.route('/company/partnercompanystaff').get(filter.requireUser, companies.getPartnerCompanyStaff);
  app.route('/company/matchname').post(filter.requireUser, companies.getMatchCompanies);
  app.route('/company/matchname_by_salesman').post(companies.getMatchCompanies);
  app.route('/company/contact/keyword').get(filter.requireUser, companies.getContactsByKeyword);
  app.route('/company/company_signup_page').get(companies.signUpInviteCompanyPage);
  app.route('/company/company_signup').post(companies.inviteCompanySignup);

  app.route('/company/update').post(filter.requireUser,companies.updateCompanyInfo);

  app.route('/company/invite_driver/delete').post(filter.requireUser,companies.deleteInviteDriver);
  app.route('/company/corporate_driver/delete').post(filter.requireUser,companies.deleteCorporateDriver);
  app.route('/company/invite_company/delete').post(filter.requireUser,companies.deleteInviteCompany);
  app.route('/company/invite_company/delete/id').post(filter.requireUser,companies.deleteInviteCompanyById);
  app.route('/company/corporate_company/delete').post(filter.requireUser,companies.deleteCorporateCompany);

  app.route('/company/address/create/single').post(filter.requireUser, companies.singleCreateAddress);
  app.route('/company/address/create/batch').post(filter.requireUser,companies.batchCreateAddress);
  app.route('/company/address/remove/id').get(filter.requireUser, companies.removeAddressById);
  app.route('/company/address/update').post(filter.requireUser, companies.updateAddress);
  app.route('/company/address/capture').post(filter.requireUser, companies.captureAddress);
  app.route('/company/address/list').get(filter.requireUser, companies.getAddressList);

  app.route('/company/vehicle/create/single').post(filter.requireUser, companies.singleCreateVehicle);
  app.route('/company/vehicle/create/batch').post(filter.requireUser,companies.batchCreateVehicle);
  app.route('/company/vehicle/remove/id').get(filter.requireUser, companies.removeVehicleById);
  app.route('/company/vehicle/update').post(filter.requireUser, companies.updateVehicle);
  app.route('/company/vehicle/list').get(filter.requireUser, companies.getVehicleList);

  app.route('/company/configuration/read').get(filter.requireUser, companies.getConfiguration);
  app.route('/company/configuration/order/update').post(filter.requireUser, companies.updateOrderConfiguration);
  app.route('/company/configuration/push/update').post(filter.requireUser, companies.updatePushConfiguration);

  app.route('/company/export').get(filter.requireUser, companies.exportPartnerCompanys);
  app.route('/company/address/export').get(filter.requireUser, companies.exportAddressList);
  app.route('/company/export-company-driver').get(filter.requireUser, companies.exportCompanyDriver);
  app.route('/company/find-driver-evaluations').get(filter.requireUser, companies.findDriverEvaluations);

};
