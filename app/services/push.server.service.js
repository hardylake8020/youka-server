/**
 * Created by zenghong on 15/11/2.
 */

'use strict';
var agent = require('superagent').agent(),
  config = require('../../config/config');

exports.pushOrderToWebByCompanyId = function (companyId, groupId, eventType, message) {
  if (process.env.NODE_ENV === 'test')
    return;

  agent.post(config.pushAddress + 'push/order/event')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      companyId: companyId,
      groupId: groupId,
      eventType: eventType,
      message: message
    })
    .end(function (err, res) {
      if (err) {
        console.log('push err ', err);
      }
      if (res) {
        console.log('push result ', res.body);
      }
    });
};