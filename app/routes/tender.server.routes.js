/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';

/**
 * Module dependencies.
 */
var tender = require('../../app/controllers/tender'),
  filter = require('../../app/filters/user');

module.exports = function (app) {
  app.route('/tender/entrance_page').get(filter.requireUser, tender.getTenderPage);
};
