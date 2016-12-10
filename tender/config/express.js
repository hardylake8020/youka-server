/**
 * Created by Wayne on 15/10/8.
 */

'use strict';

var express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  compress = require('compression'),
  methodOverride = require('method-override'),
  helmet = require('helmet'),
  config = require('./config'),
  path = require('path'),
  ejs = require('ejs'),
  async = require('async'),
  mongoose = require('mongoose');

module.exports = function () {
  // Initialize express app
  var app = express();
  app.engine('.html', ejs.__express);
  app.set('view engine', 'html');

  //// Globbing model files
  //config.getGlobbedFiles('../models/**/*.js').forEach(function (modelPath) {
  //  require(path.resolve(modelPath));
  //});

  //var logService = require('../app/log/system.server.log');
  //var ipLimitService = require('../app/services/ip_limit.server.service');
  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    //do something first
    next();
  });

  // Should be placed before express.static
  app.use(compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  // Showing stack errors
  app.set('showStackError', true);

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Enable logger (morgan)
    app.use(morgan('dev'));

    // Disable views cache
    app.set('view cache', false);
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(methodOverride());

  // Enable jsonp
  app.enable('jsonp callback');

  // Use helmet to secure Express headers
  //app.use(helmet.xframe());
  app.use(helmet.xssFilter());
  app.use(helmet.nosniff());
  app.use(helmet.ienoopen());
  app.disable('x-powered-by');

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Setting the app router and static folder
  app.use(express.static(path.resolve('./web')));

  app.use(function (req, res, next) {

    // Environment dependent middleware
    if (process.env.NODE_ENV !== 'test') {
      req.connection = req.connection ? req.connection : {};
      var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      console.log(new Date().toLocaleString() + ' ' + ip + ' : ' + req.path + JSON.stringify(req.body || {}) + JSON.stringify(req.query || {}));
    }

    if (req.path.slice(-1) === '/' && req.path.length > 1) {
      res.status(404).json({
        error: {
          type: 'invalid_request_error',
          message: 'Unrecognized request URL (' +
          req.method + ': ' + req.originalUrl + ').'
        }
      });
    } else {
      next();
    }
  });

  //if (process.env.NODE_ENV !== 'test')
  //  app.use(ipLimitService.checkIpFrequency);

  // Globbing routing files
  config.getGlobbedFiles('./app/routes/**/**/*.js').forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });
  config.getGlobbedFiles('../libraries/routes/**/*.js').forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });

  app.use(function (err, req, res, next) {
    res.status(500).json({
      error: {
        type: '500_error',
        message: 'An internal error has occurred'
      }
    });
  });

  app.use(function (req, res, next) {
    res.status(400).json({
      error: {
        type: 'invalid_request_error',
        message: 'Unrecognized request URL (' +
        req.method + ': ' + req.originalUrl + ').'
      }
    });
  });

  //// Assume 'not found' in the error msgs is a 500. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
  //app.use(function (err, req, res, next) {
  //  async.auto({
  //    RecordLogs: function (callback) {
  //      if (req.logs && req.logs.length > 0) {
  //        async.forEach(req.logs, function (log, itemCallback) {
  //          logService.log(log.level, log.message, log, function (err) {
  //            if (err) {
  //              return itemCallback(err);
  //            }
  //            else {
  //              return itemCallback();
  //            }
  //          });
  //        }, function (err) {
  //          if (err)
  //            return callback({err: {type: 'log internal error!', message: 'log service internal error!', meta: err}});
  //
  //          return callback();
  //        });
  //      } else {
  //        return callback();
  //      }
  //    },
  //    RecordError: function (callback) {
  //      if (req.err) {
  //        return callback(req.err);
  //      }
  //      else {
  //        return callback();
  //      }
  //    },
  //    GetData: function (callback, results) {
  //      if (req.data) {
  //        return callback(null, req.data);
  //      } else {
  //        return callback();
  //      }
  //    }
  //  }, function (error, results) {
  //    if (error)
  //      return res.send(error);
  //
  //    if (results.GetData)
  //      return res.send(results.GetData);
  //
  //    // If the error object doesn't exists
  //    if (!err) return next();
  //    // Log it
  //    console.error(err.stack);
  //    logService.error('internal error!', {
  //      username: req.user && req.user.username ? req.user.username : 'system',
  //      time: new Date().toISOString(),
  //      access_url: req.path || 'unknown access_url',
  //      message: 'internal error!',
  //      stack: err.stack
  //    }, function (err) {
  //      // Error
  //      res.status(500).json({
  //        error: {
  //          type: 'api_error',
  //          message: 'An internal error has occurred.'
  //        }
  //      });
  //    });
  //  });
  //});
  //
  //// Assume 404 since no middleware responded
  //app.use(function (req, res, next) {
  //  async.auto({
  //    RecordLogs: function (callback) {
  //      if (req.logs && req.logs.length > 0) {
  //        async.forEach(req.logs, function (log, itemCallback) {
  //          logService.log(log.level, log.message, log, function (err) {
  //            if (err) {
  //              return itemCallback(err);
  //            }
  //            else {
  //              return itemCallback();
  //            }
  //          });
  //        }, function (err) {
  //          if (err)
  //            return callback({err: {type: 'log internal error!', message: 'log service internal error!', meta: err}});
  //
  //          return callback();
  //        });
  //      } else {
  //        return callback();
  //      }
  //    },
  //    RecordError: function (callback) {
  //      if (req.err) {
  //        return callback(req.err);
  //      }
  //      else {
  //        return callback();
  //      }
  //    },
  //    GetData: function (callback, results) {
  //      if (req.data) {
  //        return callback(null, req.data);
  //      } else {
  //        return callback();
  //      }
  //    }
  //  }, function (error, results) {
  //    if (error)
  //      return res.send(error);
  //
  //    if (results.GetData)
  //      return res.send(results.GetData);
  //
  //    res.status(404).json({
  //      error: {
  //        type: 'invalid_request_error',
  //        message: 'Unrecognized request URL (' +
  //        req.method + ': ' + req.originalUrl + ').'
  //      }
  //    });
  //
  //  });
  //
  //
  //});

  return app;
};
