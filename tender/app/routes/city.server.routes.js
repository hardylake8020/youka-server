/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var city = require('../controllers/city'),
  userFilter = require('../../../libraries/filters/user');


module.exports = function (app) {
  app.route('/city/get').get(userFilter.requireUser, city.getCities);
  app.route('/city/set').get(userFilter.requireUser, city.setCities);
  app.route('/city/updateLocation').get(city.updateLocation);
};
