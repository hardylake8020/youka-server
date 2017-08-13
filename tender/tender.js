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
console.log('Tender application started on address 443');
    	
    });
}
else{
app.listen(config.port,function () {
    	console.log('Tender application started on address ', config.port);
});
}

