'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  invalid_email: {type: 'invalid_email', message: 'invalid email format'},
  invalid_phone: {type: 'invalid_phone', message: 'invalid phone'},
  invalid_password: {type: 'invalid_password', message: 'input password is invalid'},
  invalid_third_account: {type: 'invalid_third_account', message: 'you do not have the access token from the provider'},
  account_has_binded: {type: 'account_has_binded', message: 'the account has been binded the system internal driver'},
  access_token_invalid: {type: 'access_token_invalid', message: 'the third access_token invalid'},
  third_account_unexist: {type: 'third_account_unexist', message: 'the third account info has not upload yet'},
  account_has_not_bind: {type: 'account_has_not_bind', message: 'the third account has not bind any driver or user'}

});
