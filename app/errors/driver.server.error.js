'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  account_not_exist: {type: 'account_not_exist', message: 'driver is not existed', param: 'username'},
  account_exist: {type: 'account_exist', message: 'account has existed', param: 'username'},
  account_not_match: {type: 'account_not_match', message: 'account is not match'},
  account_disconnected: {type: 'account_disconnected', message: 'account is disconnected because of sign in by another device'},
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  invalid_phone: {type: 'invalid_phone', message: 'invalid phone', param: 'username'},
  invalid_password: {type: 'invalid_password', message: 'invalid password', param: 'password'},
  email_failed: {type: 'email_failed', message: 'send email failed', param: 'username'},
  invite_user_not_exist: {
    type: 'invite_user_not_exist',
    message: 'invite user is not exist',
    param: 'invite_driver_id'
  },
  invalid_verify_code: {type: 'invalid_verify_code', message: 'invalid verify code'},
  invalid_verify_id: {type: 'invalid_verify_id', message: 'invalid verify id'},
  sms_send_error: {type: 'sms_send_error', message: 'verify sms send failed'},
  sms_send_limit_error: {type: 'sms_send_limit_error', message: 'sms sends limited today'},
  partner_not_exist: {type: 'partner_not_exist', message: 'partner not exist'},
  inviting_company_not_exist: {type: 'inviting_company_not_exist', message: 'inviting company not exist'},
  has_been_invited: {type: 'has_been_invited', message: 'this driver has been invited'},
  has_been_partner: {type: 'has_been_partner', message: 'this driver has been invited'},
  invite_sms_error: {type: 'invite_sms_error', message: 'invite sms error'},
  device_id_invalid: {type: 'device_id_invalid', message: 'device id is empty or invalid', param: 'device_id'},
  params_null: {type: 'params_null', message: 'params to function are empty'},
  driver_id_or_name_null: {type: 'driver_id_or_name_null', message: 'driver id or name is empty'}
});
