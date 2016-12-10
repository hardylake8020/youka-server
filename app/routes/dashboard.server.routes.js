/**
 * Created by louisha on 15/5/22.
 */
'use strict';

var userFilter = require('../filters/user'),
    dashboard = require('../controllers/dashboard'),
    mongoose = require('mongoose');

module.exports = function (app) {
    // app.route('/dashboard/orderbycustom').get(userFilter.requireUser, dashboard.statisticOrderByCustom);
    // app.route('/dashboard/orderbycompany').get(userFilter.requireUser, dashboard.statisticOrderByCompany);
    // app.route('/dashboard/orderontimebycompany').get(userFilter.requireUser, dashboard.statisticOnTimeByCompany);
    // app.route('/dashboard/orderontimebycustom').get(userFilter.requireUser, dashboard.statisticOnTimeByCustom);
    // app.route('/dashboard/orderdamagebycompany').get(userFilter.requireUser, dashboard.statisticDamageByCompany);
    // app.route('/dashboard/orderdamagebycustom').get(userFilter.requireUser, dashboard.statisticDamageByCustom);
    // app.route('/dashboard/customs').get(userFilter.requireUser, dashboard.getCustoms);
    // app.route('/dashboard/orderdamagebycustomname').get(userFilter.requireUser, dashboard.statisticDamageByCustomName);
    // app.route('/dashboard/orderdamagebycompanyid').get(userFilter.requireUser, dashboard.statisticDamageByCompanyId);
    // app.route('/dashboard/orderontimebycompanyid').get(userFilter.requireUser, dashboard.statisticOnTimeByCompanyId);
    // app.route('/dashboard/orderontimebycustomname').get(userFilter.requireUser, dashboard.statisticOnTimeByCustomName);

    app.route('/dashboard/sortbyordercount').get(userFilter.requireUser, dashboard.sortByOrderCount);
    app.route('/dashboard/perfectratebycompany').get(userFilter.requireUser, dashboard.getOrderRate);
};