/**
 * Created by Wayne on 15/10/10.
 */
'use strict';

module.exports = function (appDb, logDb) {

  require('./apis/company_key')(appDb);
  require('./wechat/temp_wechat_share')(appDb);
  require('./assign_driver_event')(appDb);
  require('./company')(appDb);
  require('./company_partner')(appDb);
  require('./company_address')(appDb);
  require('./company_configuration')(appDb);
  require('./company_vehicle')(appDb);
  require('./Contact')(appDb);
  require('./customer_contact')(appDb);
  require('./customize_event')(appDb);
  require('./driver')(appDb);
  require('./driver_company')(appDb);
  require('./group')(appDb);
  require('./invite_company')(appDb);
  require('./invite_driver')(appDb);
  require('./ip_limit')(appDb);
  require('./log')(logDb);
  require('./order')(appDb);
  require('./order_detail')(appDb);
  require('./order_share')(appDb);
  require('./order_reject')(appDb);
  require('./sms_verify')(appDb);
  require('./temp_driver_version')(appDb);
  require('./third_account')(appDb);
  require('./trace')(appDb);
  require('./transport_event')(appDb);
  require('./user')(appDb);
  require('./user_group')(appDb);
  require('./user_profile')(appDb);
  require('./reset_temp')(appDb);
  require('./news')(appDb);
  require('./driver_evaluation')(appDb);
  require('./inform')(appDb);
  require('./insurance_payment')(appDb);
  require('./salesman')(appDb);
  require('./salesman_company')(appDb);
  require('./online_report_config')(appDb);
  require('./online_order_export_report_config')(appDb);
  require('./report_task')(appDb);
  require('./zz_demo')(appDb);

  require('./city')(appDb);
  require('./city_new')(appDb);
  require('./tender')(appDb);
  require('./bidder')(appDb);
  require('./bid_record')(appDb);

  require('./deposit_log')(appDb);
  require('./payment_log')(appDb);

};