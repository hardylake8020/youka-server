'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  account_not_exist: {type: 'account_not_exist', message: 'account is not existed', param: 'username'},
  account_exist: {type: 'account_exist', message: 'account has existed', param: 'username'},
  account_not_match: {type: 'account_not_match', message: 'account is not match'},
  account_not_activate: {type: 'account_not_activate', message: 'account is not activate'},
  account_has_activated: {type: 'account_has_activated', message: 'account has been activated'},
  not_in_any_group: {type: 'not_in_any_group', message: 'account is not in any group'},
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  invalid_email: {type: 'invalid_email', message: 'invalid email', param: 'email'},
  invalid_password:{type: 'invalid_password', message: 'invalid password', param: 'password'},
  invalid_access_token:{type: 'invalid_access_token', message: 'invalid access_token', param: 'access_token'},
  email_failed:{type:'email_failed',message:'send email failed',param:'username'},
  invite_user_not_exist:{type:'invite_user_not_exist',message:'invite user is not exist',param:'invite_user_id'},
  user_not_exist:{type:'user_not_exist',message:'user is not exist'},
  external_company_user:{type:'external_company_user', message: 'user is not the internal company user'},
  internal_group_user:{type: 'internal_group_user',message: 'user has been in the group'},
  admin_authentication_failed: {type: 'admin_authentication_failed', message: 'current user does not has admin role'},
  undefined_access_token: {type: 'undefined_access_token', message: 'a access_token to be need', param: 'access_token'},
  invalid_user_id: {type: 'invalid_user_id', message: 'user id is invalid'}
});
