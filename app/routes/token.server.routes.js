'use strict';

var token = require('../controllers/token'),
  driverFilter = require('../filters/driver');

module.exports = function (app) {
  app.route('/token/image/upload').get( token.uploadToken);
  app.route('/token/web/image/upload').get(token.uploaWebToken);
  app.route('/token/amr/upload').get(driverFilter.requireDriver, token.uploadAmrAudioToken);
  app.route('/token/image/temporary/upload').get(driverFilter.requireTemporaryDriver, token.uploadToken);
};