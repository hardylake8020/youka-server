'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  too_frequency_error:{type:'too_frequency_error',message:'too frequency error'}
});
