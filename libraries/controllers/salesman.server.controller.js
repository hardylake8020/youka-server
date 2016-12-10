'use strict';

var path = require('path'),
  async = require('async'),
  salesmanCompanyService = require('../services/salesman');


exports.getCompanySalesmanOnly = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  salesmanCompanyService.getCompanySalesmanOnly(company._id, function (err, salesmans) {
    if (err) {
      return res.send(err);
    }
    return res.send(salesmans);
  });
};
