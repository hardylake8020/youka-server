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

var fs = require('fs');
var https = require('https');
var key = fs.readFileSync('./certification/server.key');
var cert = fs.readFileSync('./certification/server.crt');


var httpsOptions = {
  key: key,
  cert: cert
};


if (process.env.NODE_ENV !== 'development') {
    var server = https.createServer(httpsOptions, app).listen(443,function(){
    	console.log('listen 443 :');
    });
}
app.listen(config.port,function () {
    	console.log('listen  :',config.port);
});


// Start the app by listening on <port>

exports = module.exports = app;
console.log('MEAN.JS application started on address ' + config.serverAddress);
console.log('MEAN.JS application started on port ' + config.port);





