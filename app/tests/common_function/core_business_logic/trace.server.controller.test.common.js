/**
 * Created by Wayne on 15/7/24.
 */
'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

exports.multiUpload = function (driverToken, trace_infos, callback) {
  if (trace_infos && trace_infos.forEach) {
    trace_infos.forEach(function (trace) {
      if (trace.time)
        trace.time = new Date();
    });
  }

  agent.post(config.serverAddress + 'trace/multiupload')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      trace_infos: trace_infos,
      access_token: driverToken
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

exports.getTraces = function (access_token, order_id, callback) {
  agent.get(config.serverAddress + 'trace')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .query({
      order_id: order_id,
      access_token: access_token
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};
