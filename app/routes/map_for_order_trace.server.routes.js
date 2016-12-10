/**
 * Created by louisha on 15/6/2.
 */
'use strict';

/**
 * Module dependencies.
 */

var userFilter = require('../filters/user'),
    map = require('../controllers/map_for_order_trace');

module.exports = function (app) {
    app.route('/map/alldriverorders').get(userFilter.requireUser, map.getDriverOrders);
};