/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  truckContr = require('../controllers/truck'),
  cardFilter = require('../../../libraries/filters/card'),
  truckFileter = require('../../../libraries/filters/truck'),
  driverFilter = require('../../../libraries/filters/driver');


module.exports = function (app) {
  app.route('/tender/driver/truck/create').post(driverFilter.requireDriver, truckContr.create);
  app.route('/tender/driver/truck/getListByDriver').post(driverFilter.requireDriver, truckContr.getListByDriver);
  app.route('/tender/driver/truck/getById').post(driverFilter.requireDriver,truckFileter.requireById, truckContr.getById);
};
