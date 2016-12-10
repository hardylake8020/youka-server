/**
 * Created by elinaguo on 15/4/9.
 */
'use strict';

var driverFilter = require('../filters/driver'),
  userFilter = require('../filters/user'),
  traces = require('../controllers/trace'),
  mongoose = require('mongoose'),
  Trace = mongoose.model('Trace');

module.exports = function(app){
  app.route('/trace/multiupload').post(driverFilter.requireDriver, traces.multiUpload);
  app.route('/trace').get(userFilter.requireUser, traces.getTrace);
  app.route('/weichat/trace').get(userFilter.requireWeiChatUser, traces.getTrace);
  app.route('/trace/sharedOrderTrace').get(userFilter.requireUser, traces.getSharedOrderTrace);
};
