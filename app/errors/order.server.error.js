/**
 * Created by elinaguo on 15/3/24.
 */

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  order_deleted: {type: 'order_deleted', message: 'order has been deleted'},
  order_not_exist: {type: 'order_not_exist', message: 'this order is not exist'},
  order_status_mustbe_unassigned:{type:'order_status_mustbe_unassigned',message:'order status must be unassigned'},
  order_transporting: {type: 'order_transporting', message: 'the order has been transporting!'},
  order_id_not_exist: {type: 'order_id_not_exist', message: 'order_id is not exist'},
  order_number_null_error: {type: 'order_number_null_error', message: 'The order number is null!'},
  order_number_unique_error: {type: 'order_number_unique_error', message: 'The order number is not unique!'},
  incomplete_pickup_contact_info: {type: 'incomplete_pickup_contact_info', message: 'The pickup contact is not completed!'},
  incomplete_delivery_contact_info: {type: 'incomplete_delivery_contact_info', message: 'The order delivery contact is not completed!'},
  group_id_null: {type: 'group_id_null', message: 'group_id is null.', param: 'group_id'},
  driver_not_exist: {type: 'driver_not_exist', message: 'the driver which is assigned to is not exist.', param: 'group_id', zh_message:'司机不存在'},
  company_not_exist: {type: 'company_not_exist', message: 'the company which is assigned to is not exist', param: 'company_id'},
  order_has_assigned: {type: 'order_has_assigned', message: 'this order has been assigned'},
  order_not_assigning: {type: 'order_not_assigning', message: 'this order has not been assigning, so can not continue to assign'},
  order_completed: {type: 'order_completed', message: 'this order has been completed'},
  order_not_visible: {type: 'order_not_visible', message: 'this order is not visible'},
  assign_infos_null: {type: 'assign_infos_null', message: 'assign infos should not be empty'},
  order_info_null: {type: 'order_info_null', message: 'order info is not exist!'},
  orders_to_share_null: {type: 'orders_to_share_null', message: 'orders to share must not be empty!'},
  recipients_to_share_null: {type: 'recipients_to_share_null', message: 'recipients to share must not be empty!'},
  recipients_to_share_invalid: {type: 'recipients_to_share_invalid', message: 'recipients to share must be valid!'},
  must_self_company_order:{type:'must_self_company_order',message:'must self company order!'},
  params_null: {type: 'params_null', message: 'params in function is empty'},
  params_invalid: {type: 'params_invalid', message: 'params is invalid'},
  post_data_empty: {type: 'post_data_empty', message: 'some post data is empty'},
  assign_info_can_not_modify: {type: 'assign_info_can_not_modify', message: 'assign info can not be modified'},
  more_than_max_drivers: {type: 'more_than_max_drivers', message: 'more than max display drivers'},
  has_found_driver: {type: 'has_found_driver', message: 'driver has found'},
  order_can_not_delete: {type: 'order_can_not_delete', message: 'order can not delete'},
  driver_openid_empty: {type: 'driver_openid_empty', message: 'driver openid is empty'}
});
