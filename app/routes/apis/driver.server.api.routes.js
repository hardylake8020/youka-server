'use strict';

var driverApi = require('../../controllers/apis/api.driver');
var signFilter = require('../../filters/apis/api.signature');

module.exports = function (app) {
  app.route('/api/driver/exist/number').post(signFilter.validSignature, driverApi.checkDriverExistedByNumber);
  app.route('/api/driver/list').get(signFilter.validSignature, driverApi.getCorporateDrivers);
};