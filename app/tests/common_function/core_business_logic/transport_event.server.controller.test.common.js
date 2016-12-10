/**
 * Created by Wayne on 15/7/24.
 */

'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

exports.uploadEvent = function (access_token, orderId, eventType, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'transport_event/upload')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      type: eventType,
      address: '浦东',
      longitude: '34.5',
      latitude: '120.5'
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.success.should.equal(true);
      }

      callback(err, res.body);
    });
};

//司机批量提交事件
exports.multiUploadEvent = function(access_token, orderIds, eventType, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'transport_event/multiUpload')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_ids: orderIds,
      type: eventType,
      address: '浦东',
      longitude: '34.5',
      latitude: '120.5'
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        should.not.exist(res.body.err);
        res.body.success.length.should.equal(orderIds.length);
      }

      callback(err, res.body);
    });
};

exports.temporaryUploadEvent = function (customerEventId, orderId, eventType, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'transport_event/temporary/upload')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      customize_event_id: customerEventId,
      transport_event: {
        order_id: orderId,
        type: eventType,
        address: '浦东',
        longitude: '34.5',
        latitude: '120.5'
      }
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.success.should.equal(true);
      }

      callback(err, res.body);
    });
};

//根据指定的订单Id获取司机上传的事件
exports.getDriverUploadEvent = function(access_token, orderId, callback) {
  agent.get(config.serverAddress + 'transport_event')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

