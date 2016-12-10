/**
 * Created by zenghong on 15/11/12.
 */
'use strict';


exports.order_status = {
  unAssigned:'unAssigned',
  assigning:'assigning',
  unPickuped:'unPickuped',
  unPickupSigned:'unPickupSigned',
  unDeliveried:'unDeliveried',
  unDeliverySigned:'unDeliverySigned',
  completed:'completed'
};

exports.transport_event_type = {
  pickupSign:'pickupSign',
  pickup:'pickup',
  deliverySign:'deliverySign',
  delivery:'delivery',
  halfway:'halfway',
  confirm:'confirm'
};

exports.web_abnormal_order_type = {
  pickup_deferred: {key: 'pickup_deferred', value: '提货晚到'},
  pickup_damaged: {key: 'pickup_damaged', value: '提货出现货损'},
  delivery_deferred: {key: 'delivery_deferred', value: '交货晚到'},
  delivery_damaged: {key: 'delivery_damaged', value: '交货出现货损'},
  pickup_missing_package: {key: 'pickup_missing_package', value: '提货缺量'},
  delivery_missing_package: {key: 'delivery_missing_package', value: '交货缺量'},
  pickup_address_difference: {key: 'pickup_address_difference', value: '提货地址异常'},
  delivery_address_difference: {key: 'delivery_address_difference', value: '交货地址异常'},
  pickup_driver_plate_difference: {key: 'pickup_driver_plate_difference', value: '提货司机车牌异常'},
  delivery_driver_plate_difference: {key: 'delivery_driver_plate_difference', value: '交货司机车牌异常'},
  transport_plate_difference: {key: 'transport_plate_difference', value: '提货交货车辆不一致'},
  halfway_event: {key: 'halfway_event', value: '中途事件'},
  confirm_order_time_out: {key: 'confirm_order_time_out', value: '司机未确认接单'},
  repeal_driver_order: {key: 'repeal_driver_order', value: '运单分配被撤销'}
};

exports.inform_type = {
  web_socket_connection_success: '/socket/web/connection/success',
  web_abnormal_order_single: '/socket/web/abnormal_order/single',
  web_add_user: '/socket/web/user/add',
  web_abnormal_order_batch: '/socket/web/abnormal_order/batch',
  web_abnormal_order_clear: '/socket/web/abnormal_order/clear'
};


exports.company_order_message_push_type = {
  create: 'create',
  ltl_pickup: 'ltl_pickup',
  tlt_pickup: 'tlt_pickup',
  ltl_delivery_sign: 'ltl_delivery_sign',
  delivery: 'delivery'
};