'use strict';

var mongoose = require('mongoose'),
  companyError = require('../../errors/company'),
  signError = require('../../errors/apis/api.signature'),
  appDb = require('../../../libraries/mongoose').appDb,
  cryptoLib = require('../../libraries/crypto'),
  User = appDb.model('User'),
  CompanyKey = appDb.model('CompanyKey');

exports.validSignature = function (req, res, next) {
  var signature = req.body.signature || req.query.signature;
  var timestamp = req.body.timestamp || req.query.timestamp;
  var company_id = req.body.company_id || req.query.company_id;

  if (!signature) {
    return res.send({err: signError.empty_signature});
  }

  if (!timestamp) {
    return res.send({err: signError.empty_timestamp});
  }

  if (!company_id) {
    return res.send({err: signError.empty_company_id});
  }

  CompanyKey.findOne({company: company_id}).populate('company').exec(function (err, companyKey) {
    if (err) {
      console.log(err);
      return res.send({err: signError.internal_system_error});
    }

    if (!companyKey) {
      return res.send({err: signError.invalid_company_id});
    }

    var sk = companyKey.secret_key;
    var pk = companyKey.public_key;
    var sign = cryptoLib.toMd5(sk + '&' + pk + '&' + timestamp);

    if (signature !== sign) {
      return res.send({err: signError.invalid_signature});
    }

    var company = companyKey.company;
    var userId = company.creator || new mongoose.Types.ObjectId();

    User.findOne({_id: userId}).populate("company").exec(function (err, user) {
      if (err) {
        return res.send({err: signError.internal_system_error});
      }
      req.user = user;
      req.company = company;
      return next();
    });
  });
};