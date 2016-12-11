/**
 * Created by Wayne on 15/10/9.
 */

module.exports = {

//<editor-fold desc="user relative">
  user_account_not_exist: {type: 'user_account_not_exist', message: 'user account not exist', zh_message: '用户账户不存在'},
  user_account_not_activate: {type: 'user_account_not_activate', message: 'user account not activate', zh_message: '用户账户未激活'},
  user_account_password_error: {type: 'user_account_password_error', message: 'user account password error', zh_message: '密码错误'},
  user_token_empty: {type: 'user_token_empty', message: 'user token empty', zh_message: '用户凭证为空'},
  user_token_invalid: {type: 'user_token_invalid', message: 'user token invalid', zh_message: '用户凭证无效'},
  user_admin_authentication_failed: {type: 'user_admin_authentication_failed', message: 'user admin authentication failed', zh_message: '需要管理员权限'},
  user_is_in_group: {type: 'user_is_in_group', message: 'user is in group', zh_message: '用户已经加入该组'},
//<editor-fold>
  driver_account_disconnected: {type: 'account_disconnected', message: 'account is disconnected because of sign in by another device'},
  driver_not_signup: {type: 'driver_not_signup', message: 'driver not signup', zh_message: '司机手机未注册'},
  driver_not_exist: {type: 'driver_not_exist', message: 'driver not exist', zh_message: '司机账号不存在'},
  driver_id_empty: {type: 'driver_id_empty', message: 'driver id empty', zh_message: '司机ID为空'},
  driver_openid_empty: {type: 'driver_openid_empty', message: 'driver openid empty', zh_message: '司机微信openid为空'},
  driver_phone_invalid: {type: 'driver_phone_invalid', message: 'driver phone invalid', zh_message: '司机手机号格式不正确'},
  driver_password_invalid: {type: 'driver_password_invalid', message: 'driver password invalid', zh_message: '司机密码不符合规范'},

  article_not_found: {type: 'article_not_found', message: 'article not found', zh_message: '文章未找到'},
  phone_invalid: {type: 'phone_invalid', message: 'phone invalid', zh_message: '手机号格式不正确'},
  sms_code_invalid: {type: 'sms_code_invalid', message: 'sms code invalid', zh_message: '验证码不正确'},

  openid_empty: {type: 'openid_empty', message: 'openid empty', zh_message: 'openid为空'},
  openid_invalid: {type: 'openid_invalid', message: 'openid invalid', zh_message: 'openid不正确'},
  openid_get_failed: {type: 'openid_get_failed', message: 'get openid failed', zh_message: 'openid获取失败'},

//<editor-fold desc="company relative">
  company_not_existed: {type: 'company_not_existed', message: 'company not existed', zh_message: '该公司不存在'},
  company_name_existed: {type: 'company_name_existed', message: 'company name existed', zh_message: '该公司名称已存在'},

//<editor-fold>
  group_not_exist: {type: 'group_not_exist', message: 'group not exist', zh_message: '公司组不存在'},

  order_not_visible: {type: 'order_not_visible', message: 'order not visible', zh_message: '运单不可见'},
  order_has_assigned: {type: 'order_has_assigned', message: 'order has assigned', zh_message: '运单已分配'},
  order_not_exist: {type: 'order_not_exist', message: 'order not exist', zh_message: '运单不存在'},
  order_number_empty: {type: 'order_number_empty', message: 'order number empty', zh_message: '运单号为空'},
  order_create_failed: {type: 'order_create_failed', message: 'order create failed', zh_message: '运单创建失败'},
  order_assign_info_empty: {type: 'order_assign_info_empty', message: 'order assign info empty', zh_message: '运单分配信息为空'},

  //order
  tender_info_empty: {type: 'tender_info_empty', message: 'tender info empty', zh_message: '标书信息为空'},
  order_number_empty: {type: 'order_number_empty', message: 'order number empty', zh_message: '运单号为空'},
  tender_start_time_empty: {type: 'tender_start_time_empty', message: 'tender start time empty', zh_message: '未设置标书开始时间'},
  tender_start_time_invalid: {type: 'tender_start_time_invalid', message: 'tender start time invalid', zh_message: '标书开始时间格式不正确'},
  tender_end_time_empty: {type: 'tender_end_time_empty', message: 'tender end time empty', zh_message: '未设置标书截止时间'},
  tender_end_time_invalid: {type: 'tender_end_time_invalid', message: 'tender end time invalid', zh_message: '标书截止时间格式不正确'},
  tender_end_time_less_now: {type: 'tender_end_time_less_now', message: 'tender end time less than now', zh_message: '标书截止时间小于当前时间'},
  tender_end_time_less_start_time: {type: 'tender_end_time_less_start_time', message: 'tender end time less than start time', zh_message: '标书截止时间小于开始时间'},
  tender_salesman_invalid: {type: 'tender_salesman_invalid', message: 'tender salesman invalid', zh_message: '关注人设置不正确'},
  tender_truck_type_empty: {type: 'tender_truck_type_empty', message: 'truck type empty', zh_message: '车辆类型为空'},
  tender_truck_type_invalid: {type: 'tender_truck_type_invalid', message: 'truck type invalid', zh_message: '车辆类型不正确'},
  tender_truck_count_invalid: {type: 'tender_truck_count_invalid', message: 'truck count invalid', zh_message: '车辆数量不正确'},
  tender_auto_close_duration_invalid: {type: 'tender_auto_close_duration_invalid', message: 'auto close duration invalid', zh_message: '自动截标时长不正确'},
  tender_goods_invalid: {type: 'tender_goods_invalid', message: 'tender goods invalid', zh_message: '货物信息设置不正确'},
  tender_pickup_address_invalid: {type: 'tender_pickup_address_invalid', message: 'tender pickup address invalid', zh_message: '提货地址设置不正确'},
  tender_delivery_address_invalid: {type: 'tender_delivery_address_invalid', message: 'tender delivery address invalid', zh_message: '收货地址设置不正确'},
  tender_pickup_mobile_phone_invalid: {type: 'tender_pickup_mobile_phone_invalid', message: 'tender pickup mobile phone invalid', zh_message: '提货联系人手机不正确'},
  tender_delivery_mobile_phone_invalid: {type: 'tender_delivery_mobile_phone_invalid', message: 'tender delivery mobile phone invalid', zh_message: '收货联系人手机不正确'},
  tender_pickup_time_empty: {type: 'tender_pickup_time_empty', message: 'tender pickup time empty', zh_message: '未设置提货时间'},
  tender_pickup_time_less_start_time: {type: 'tender_pickup_time_less_start_time', message: 'tender pickup time less start time', zh_message: '提货时间小于标书开始时间'},
  tender_delivery_time_empty: {type: 'tender_delivery_time_empty', message: 'tender delivery time empty', zh_message: '未设置收货时间'},
  tender_payment_invalid: {type: 'tender_payment_invalid', message: 'tender payment invalid', zh_message: '支付方式设置不正确'},

  tender_not_exist: {type: 'tender_not_exist', message: 'tender not exist', zh_message: '标书不存在'},
  tender_can_not_modify: {type: 'tender_can_not_modify', message: 'tender can not modify', zh_message: '标书不能修改'},
  tender_can_not_delete: {type: 'tender_can_not_delete', message: 'tender can not delete', zh_message: '标书不能删除'},
  tender_has_deleted: {type: 'tender_has_deleted', message: 'tender has deleted', zh_message: '标书已删除'},
  tender_status_wrong: {type: 'tender_status_wrong', message: 'tender status wrong', zh_message: '标书状态不正确'},
  tender_not_end_when_apply_bidder: {type: 'tender_not_end_when_apply_bidder', message: 'tender not end when apply bidder', zh_message: '标书还未结束，不能指定竞标人'},
  tender_apply_driver_failed: {type: 'tender_apply_driver_failed', message: 'tender apply driver failed', zh_message: '指定标书承运司机失败'},

  tender_grab_failed: {type: 'tender_grab_failed', message: 'tender grab failed', zh_message: '抢标失败'},

  bidder_company_exist: {type: 'bidder_company_exist', message: 'bidder has been partner with company', zh_message: '已经是合作关系'},
  bidder_username_invalid: {type: 'bidder_username_invalid', message: 'bidder username invalid', zh_message: '中介手机号码不合法'},
  bidder_not_exist: {type: 'bidder_not_exist', message: 'bidder not exist', zh_message: '竞标人不存在'},
  bidder_not_right: {type: 'bidder_not_right', message: 'bidder not right', zh_message: '竞标人不正确'},
  bidder_real_name_invalid: {type: 'bidder_real_name_invalid', message: 'bidder real_name invalid', zh_message: '中介姓名不合法'},

  bidder_not_bind_wechat: {type: 'bidder_not_bind_wechat', message: 'bidder not bind wechat', zh_message: '竞标人没有绑定微信'},
  bidder_deposit_unpaid: {type: 'bidder_deposit_unpaid', message: 'bidder deposit not paid', zh_message: '保证金未缴纳'},
  bidder_deposit_paid: {type: 'bidder_deposit_paid', message: 'bidder deposit has paid', zh_message: '保证金已缴纳'},
  bidder_deposit_freeze: {type: 'bidder_deposit_freeze', message: 'bidder deposit has freeze', zh_message: '保证金已冻结'},
  bidder_deposit_deducted: {type: 'bidder_deposit_deducted', message: 'bidder deposit has deducted', zh_message: '保证金已扣除'},
  bidder_deposit_status_invalid: {type: 'bidder_deposit_status_invalid', message: 'bidder deposit status invalid', zh_message: '保证金状态不正确'},
  bidder_deposit_amount_invalid: {type: 'bidder_deposit_amount_invalid', message: 'bidder deposit amount invalid', zh_message: '保证金金额异常'},

  bid_record_not_exist: {type: 'bid_record_not_exist', message: 'bid record not exist', zh_message: '竞标纪录不存在'},
  bid_record_status_wrong: {type: 'bid_record_status_wrong', message: 'bid record status wrong', zh_message: '竞标纪录状态不正确'},
  bid_record_price_limit: {type: 'bid_record_price_limit', message: 'bid record price limit', zh_message: '报价受限制'}

};

