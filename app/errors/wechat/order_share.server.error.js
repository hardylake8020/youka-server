'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  only_one_company: {type: 'only_one_company', message: 'user can only belong one company'},
  company_name_exists: {type: 'company_name_exists', message: 'company name has been existed'},
  name_null: {type: 'name_null', message: 'name is null'},
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  company_not_exist: {type: 'company_not_exist', message: 'company is not existed', param: 'company_id'},
  company_name_invalid: {type: 'company_name_invalid', message: 'company is not existed', param: 'company_name'},
  has_been_partner: {type: 'has_been_partner', message: 'this company has been invited'},
  invited_user_not_exist: {type: 'invited_user_not_exist', message: 'the invited user has not exist'},
  company_invite_itself: {type: 'company_invite_itself', message: 'you can not invite your company to be your partner'},
  user_has_no_company:{type:'user_has_no_company',message:'user has no company'},
  email_sent_failed: {type: 'email_sent_failed', message: 'send email failed, email address maybe not exist'},
  upload_orders_null: {type: 'upload_orders_null', message: 'upload order ids are empty'},
  order_not_found: {type: 'order_not_found', message: 'order not found in db'},
  upload_wechat_share_null: {type:'upload_wechat_share_null', message: 'upload wechat share id is empty'},
  no_temp_wechat_share_record: {type: 'no_temp_wechat_share_record', message: 'has no order to share because there is no temp wechat share record.'}
});
