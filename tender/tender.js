/**
 * Created by Wayne on 15/10/8.
 */

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

'use strict';

var init = require('./config/init')(),
  config = require('./config/config'),
  setup = require('./config/setup')(),
  auto = require('./config/auto')(),
  app = require('./config/express')();



// Start the app by listening on <port>
app.listen(config.port);

console.log('Tender application started on address ' + config.serverAddress);
console.log('Tender application started on port ' + config.port);
