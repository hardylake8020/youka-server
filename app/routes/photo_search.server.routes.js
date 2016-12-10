/**
 * Created by louisha on 15/5/12.
 */
'use strict';

var userFilter = require('../filters/user'),
  photoSearch = require('../controllers/photo_search'),
  mongoose = require('mongoose');

module.exports = function (app) {
  app.route('/photoSearch').get(userFilter.requireUser, photoSearch.searchPhotos);
};