/**
 * Created by elinaguo on 15/3/24.
 */
'use strict';

/**
 * Module dependencies.
 */
var dashboardIndex = require('../../../app/controllers/dashboard/index');

module.exports = function (app) {
  app.route('/dashboard/driver_v_page').get(dashboardIndex.getDriverVersionPage);
  app.route('/dashboard/driver_v_data').get(dashboardIndex.getDriverVersion);

};
