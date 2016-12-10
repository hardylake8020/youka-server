'use strict';

var mongoose = require('mongoose'),
  companyError = require('../errors/company'),
  appDb = require('../../libraries/mongoose').appDb,
  Company = appDb.model('Company');

exports.requireCompany = function (req, res, next) {
  var companyId;

  if (req.body.company_id) {
    companyId = req.body.company_id;
  } else {
    companyId = req.query.company_id;
  }

  if (!companyId) {
    return res.send({err: companyError.company_not_exist});
  }

  Company.findOne({_id: companyId}, function (err, company) {
    if (err) {
      return res.send({err: companyError.internal_system_error});
    }

    if (!company) {
      return res.send({err: companyError.company_not_exist});
    }

    req.company = company;
    next();
  });
};

exports.requireUserCompanyAuthed = function (req, res, next) {
  var currentUser = req.user || {};

  if (!currentUser.company || !currentUser.company._id) {
    return res.send({err: companyError.user_has_no_company});
  }

  if (currentUser.company.auth_status !== 'authed') {
    return res.send({err: companyError.company_not_authed});
  }

  next();
};
