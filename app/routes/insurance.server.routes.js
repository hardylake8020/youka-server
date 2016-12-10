/**
 * Created by Wayne on 15/10/23.
 */
'use strict';

var insurance = require('../../app/controllers/insurance'),
  userFilter = require('../filters/user'),
  groupFilter = require('../filters/group'),
  companyFilter = require('../filters/company'),
  orderFilter = require('../filters/order');

module.exports = function (app) {
  app.route('/insurance/agreement').get(insurance.agreement);
  app.route('/insurance').post(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, groupFilter.getUserViewGroupIds, insurance.getInsuranceOrders);
  app.route('/insurance/ensure').post(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, groupFilter.getUserViewGroupIds, orderFilter.requireUnAssignedOrder, orderFilter.requireUserCanViewOrder, insurance.ensureInsuranceOrder);
  app.route('/insurance/cancel').post(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, groupFilter.getUserViewGroupIds, orderFilter.requireUnAssignedOrder, orderFilter.requireUserCanViewOrder, insurance.cancelInsuranceOrder);
  app.route('/insurance/unpay/info').get(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, groupFilter.getUserViewGroupIds, insurance.getUnpayInsurancePrice);
  app.route('/insurance/unpay/orders').get(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, groupFilter.getUserViewGroupIds, insurance.getUnpayInsuranceOrders);
  app.route('/insurance/buy').post(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, insurance.buyInsuranceFromPayment);
  app.route('/insurance/buy/history').get(userFilter.requireUser, companyFilter.requireUserCompanyAuthed, insurance.getInsurancePaymentHistory);
  app.route('/insurance/report_email').get(userFilter.requireUser, insurance.sendReportEmail);
};

