/**
 * Created by elinaguo on 15/3/26.
 */
'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  contact_exist: {type: 'contact_exist', message: 'this contact has existed'}
});
