/**
 * Created by wd on 16/05/24.
 */
'use strict';

var reportConfig = require('../../app/controllers/online_report_config'),
  userFilter = require('../filters/user');

module.exports = function (app) {
  app.route('/report/config/updateExportFields').post(userFilter.requireUser, reportConfig.updateExportFields);
  app.route('/report/config/getOrderExportReportConfig').post(userFilter.requireUser, reportConfig.getOrderExportReportConfig);
  app.route('/report/config/update').post(userFilter.requireUser, reportConfig.saveOrUpdate);
  app.route('/report/config/getReportConfig').post(userFilter.requireUser, reportConfig.getReportConfig);
};