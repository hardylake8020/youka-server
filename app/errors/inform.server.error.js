/**
 * Created by Wayne on 15/11/16.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  params_null:{type: 'params_null', message: 'params is null or empty'}
});