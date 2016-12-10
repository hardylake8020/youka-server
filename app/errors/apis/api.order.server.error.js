'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  invalid_order_number: {type: 'invalid_order_number', message: 'invalid order number'},
  invalid_driver_id: {type: 'invalid_driver_id', message: 'invalid driver id'},
  invalid_assign_infos: {type: 'invalid_assign_infos', message: 'invalid assign infos'},
  empty_assign_info: {type: 'empty_assign_info', message: 'empty assign info'},
  unassigned_order: {type: 'unassigned_order', message: 'order must be assigned'},
  empty_order_number: {type: 'empty_order_number', message: 'empty order number'},
  empty_order_id: {type: 'empty_order_id', message: 'empty order id'},
  empty_company_id: {type: 'empty_company_id', message: 'empty company id'},
  empty_driver_id: {type: 'empty_driver_id', message: 'empty driver id'},
  empty_assign_info_id: {type: 'empty_assign_info_id', message: 'empty assign info id'},
  internal_system_error: {type: 'internal_system_error', message: '未知错误，请与管理员联系'},
  assign_info_can_not_delete: {type: 'assign_info_can_not_delete', message: 'assign info can not delete'},
  assign_info_not_exist: {type: 'assign_info_not_exist', message: 'assign info not exist'},
  assign_info_can_not_modify: {type: 'assign_info_can_not_modify', message: 'assign info can not modify'},
  assign_type_wrong: {type: 'assign_type_wrong', message: 'assign type is wrong'},
  assign_same_driver: {type: 'assign_same_driver', message: 'assign same driver'},
  order_can_not_delete: {type: 'order_can_not_delete', message: 'order can not delete'}
});
