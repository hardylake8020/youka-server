/**
 * Created by Wayne on 16/3/16.
 */

'use strict';

var tender = require('../controllers/tender'),
  cardContr = require('../controllers/card'),
  cardFilter = require('../../../libraries/filters/card'),
  truckFileter = require('../../../libraries/filters/truck'),
  driverFilter = require('../../../libraries/filters/driver');


module.exports = function (app) {
  app.route('/tender/driver/card/create').post(driverFilter.requireDriver, cardContr.create);
  app.route('/tender/driver/card/getListByDriver').post(driverFilter.requireDriver, cardContr.getListByDriver);
  app.route('/tender/driver/card/getById').post(driverFilter.requireDriver, cardFilter.requireById, cardContr.getById);

  app.route('/tender/driver/card/getAllCardsBySupplier').post(driverFilter.requireById, cardContr.getAllCardsBySupplier);

//  app.route('/tender/driver/card/bindTruck').post(driverFilter.requireDriver, cardFilter.requireById, truckFileter.requireById, cardContr.bindTruck);
};
