/**
 * Created by wd on 16/05/24.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  params_null: {type: 'params_null', message: 'some params in null or empty'},
  report_config_null: {type: 'params_null', message: 'report config in null or empty'},
  email_format_error: {type: 'email_format_error', message: 'email format error'}
});