'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  get_file_error: {type: 'get_file_error', message: 'get file from wechat error'},
  invalid_token: {type: 'invalid_token', message: 'token in request is invalid'}
});
