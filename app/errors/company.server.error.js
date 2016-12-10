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
  params_null: {type: 'params_null', message: 'params to function are empty'},
  driver_not_exist: {type: 'driver_not_exist', message: 'driver does not exist'},
  no_invite_record: {type: 'no_invite_record', message: 'no invite record'},
  company_not_authed: {type: 'company_not_authed', message: 'your company is not authed'},
  invalid_params: {type: 'invalid_params', message: 'params are invalid'},
  invite_failed: {type: 'invite_failed', message: 'invite failed'},
  address_exist: {type: 'address_exist', message: 'address is existed'},
  address_not_exist: {type: 'address_not_exist', message: 'address is not existed'},
  vehicle_exist: {type: 'vehicle_exist', message: 'vehicle is existed'},
  vehicle_not_exist: {type: 'vehicle_not_exist', message: 'vehicle is not existed'},
  invalid_location: {type: 'invalid_location', message: 'location is invalid'}
});
