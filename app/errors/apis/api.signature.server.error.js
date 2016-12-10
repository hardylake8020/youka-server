'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  invalid_order_number: {type: 'invalid_order_number', message: 'invalid order number'},
  invalid_signature: {type: 'invalid_signature', message: 'invalid signature'},
  invalid_timestamp: {type: 'invalid_timestamp', message: 'invalid timestamp'},
  empty_timestamp: {type: 'empty_timestamp', message: 'empty timestamp'},
  empty_signature: {type: 'empty_signature', message: 'empty signature'},
  empty_company_id: {type: 'empty_company_id', message: 'empty company id'},
  invalid_company_id: {type: 'invalid_company_id', message: 'invalid company id'},
  internal_system_error: {type: 'internal_system_error', message: '未知错误，请与管理员联系'}
});
