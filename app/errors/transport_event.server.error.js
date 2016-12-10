/**
 * Created by elinaguo on 15/3/24.
 */

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  order_not_exist: {type: 'order_not_exist', message: 'this order is not exist'},
  order_is_deleted: {type: 'order_is_deleted', message: 'this order is deleted'},
  original_order: {type: 'original_order', message: 'this order is original order'},
  original_order_not_exist: {type: 'original_order_not_exist', message: 'the original order of this order is not exist'},
  order_driver_not_match: {type: 'order_driver_not_match', message: 'this order can not be executed by this driver'},
  can_not_execute_confirm: {type: 'can_not_execute_confirm', message: 'you must have been confrimed before you give the confirm'},
  can_not_execute_pickupSign: {type: 'can_not_execute_pickupSign', message: 'you must have been assigned before you give the pickup sign'},
  can_not_execute_pickup: {type: 'can_not_execute_pickup', message: 'your order must been assigned or pickup sign before you picking up'},
  can_not_execute_deliverySign: {type: 'can_not_execute_deliverySign', message: 'you must have been picked up before you give the delivery sign'},
  can_not_execute_delivery: {type: 'can_not_execute_delivery', message: 'you must have given the delivery sign before you delivery'},
  order_has_been_complete: {type: 'order_has_been_complete', message: 'the order has been completed'},
  parent_order_not_exist: {type: 'parent_order_not_exist', message: 'the parent order is not exist'},
  uncompleted: {type: 'uncompleted', message: 'the order is not completed'},
  should_upload_orderId: {type: 'should_upload_orderId', message: 'orderId should be include when upload transport event'},
  event_exist: {type: 'event_exist', message: 'upload event also has exist'},
  params_null: {type: 'params_null', message: 'params to function are null'},
  params_invalid: {type: 'params_invalid', message: 'params are invalid'},
  order_status_invalid: {type: 'order_status_invalid', message: 'order status is invalid'}

});
