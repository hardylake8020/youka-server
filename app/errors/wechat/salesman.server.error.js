/**
 * Created by Wayne on 15/12/7.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error', zh_message: '系统错误'},
  salesman_has_existed: {type: 'salesman_has_existed', message: 'salesman has existed'},
  salesman_not_existed: {type: 'salesman_not_existed', message: 'salesman not existed'},
  salesman_existed_in_other_company: {type: 'salesman_existed_other_company', message: 'salesman existed in other company'},
  salesman_username_is_empty: {type: 'salesman_username_is_empty', message: 'salesman username is empty'},
  salesman_id_is_empty: {type: 'salesman_id_is_empty', message: 'salesman id is empty'},
  salesman_company_id_is_empty: {type: 'salesman_company_id_is_empty', message: 'salesman_company id is empty'},
  salesman_different: {type: 'salesman_different', message: 'salesman is different'},
  order_status_invalid: {type: 'order_status_invalid', message: 'order status is invalid', zh_message: '运单状态不正确'},
  actual_delivery_goods_empty: {type: 'actual_delivery_goods_empty', message: 'actual delivery goods empty'},
  order_has_evaluation: {type: 'order_has_evaluation', message: 'order has evaluation', zh_message: '运单已评价'},
  salesman_nickname_is_empty: {type: 'salesman_nickname_is_empty', message: 'nickname is required', zh_message: '司机姓名是必填项'}
});
