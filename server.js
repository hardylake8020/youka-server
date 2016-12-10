/**
 * Module dependencies.
 */

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

'use strict';

var init = require('./config/init')(),
  config = require('./config/config'),
  setup = require('./config/setup')(),
  app = require('./config/express')();

if (process.env.NODE_ENV === 'development'|| process.env.NODE_ENV ==='production-test' || process.env.NODE_ENV ==='production-api') {
  require('./config/auto')();
}

// Start the app by listening on <port>
app.listen(config.port);

exports = module.exports = app;
console.log('MEAN.JS application started on address ' + config.serverAddress);
console.log('MEAN.JS application started on port ' + config.port);
