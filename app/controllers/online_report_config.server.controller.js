/**
 * Created by wd on 16/05/24.
 */
'use strict';

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  fs = require('fs'),
  ejs = require('ejs'),
  config = require('../../config/config'),
  onlineReportConfigError = require('../errors/online_report_config'),
  reportConfigService = require('../services/online_report_config');

exports.getReportConfig = function (req, res, next) {
  var companyId = req.user ? req.user.company ? req.user.company._id : '' : '';
  if(!companyId) {
    return res.send({err: onlineReportConfigError.params_null});
  }
  reportConfigService.getReportConfig(companyId, function(err, config) {
    if (err) {
      return res.send(err);
    }
    return res.send(config);
  });
};

exports.getOrderExportReportConfig = function (req, res, next) {
    var companyId = req.user ? req.user.company ? req.user.company._id : '' : '';
    if(!companyId) {
        return res.send({err: onlineReportConfigError.params_null});
    }
    reportConfigService.getOrderExportReportConfig(companyId, function(err, config) {
        if (err) {
            return res.send(err);
        }
        return res.send(config);
    });
};

exports.saveOrUpdate = function (req, res, next) {
  var config = req.body.config;
  if (!config) {
    return res.send({err: onlineReportConfigError.params_null});
  }

  config.company_id = req.user ? req.user.company ? req.user.company._id : '' : '';
  config.company_name = req.user ? req.user.company ? req.user.company.name : '' : '';

  reportConfigService.saveOrUpdate(config, function (err, config) {
    if (err) {
      return res.send(err);
    }
    return res.send(config);
  });

};
exports.updateExportFields = function (req, res, next) {
    var config = req.body.config;
    if (!config) {
        return res.send({err: onlineReportConfigError.params_null});
    }

    config.company_id = req.user ? req.user.company ? req.user.company._id : '' : '';

    reportConfigService.updateExportFields(config, function (err, config) {
        if (err) {
            return res.send(err);
        }
        return res.send(config);
    });

};