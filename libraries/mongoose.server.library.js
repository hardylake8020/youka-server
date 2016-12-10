'use strict';

var mongoose = require('mongoose');

var appDb = mongoose.createConnection(process.env.appDb,{server:{poolSize:20}}, function (err) {
  if (err) {
    console.log('create app db connection failed : ' + err.toString());
  } else {
    console.log('create app db connection success');
  }
});

var logDb = mongoose.createConnection(process.env.logDb, {server: { poolSize: 20}}, function (err) {
  if (err) {
    console.log('create log db connection failed : ' + err.toString());
  } else {
    console.log('create log db connection success');
  }
});

exports.appDb = appDb;
exports.logDb = logDb;
