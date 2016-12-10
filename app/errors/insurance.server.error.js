/**
 * Created by Wayne on 15/10/26.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  params_null: {type: 'params_null', message: 'some params in null or empty'},
  email_sent_failed: {type: 'email_sent_failed', message: 'send email failed'},
  empty_sender_name: {type: 'empty_sender_name'},
  empty_goods_name: {type: 'empty_goods_name'},
  empty_count: {type: 'empty_count'},
  empty_count_unit: {type: 'empty_count_unit'},
  empty_weight: {type: 'empty_weight'},
  empty_weight_unit: {type: 'empty_weight_unit'},
  empty_volume: {type: 'empty_volume'},
  empty_volume_unit: {type: 'empty_volume_unit'},
  empty_delivery_address: {type: 'empty_delivery_address'},
  empty_pickup_address: {type: 'empty_pickup_address'},
  empty_buy_count: {type: 'empty_buy_count'},
  can_not_pay: {type: 'can_not_pay'},
  invalid_buy_count: {type: 'invalid_buy_count'}
});
