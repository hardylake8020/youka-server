/**
 * Created by Wayne on 15/10/25.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  params_null: {type: 'params_null', message: 'some params in null or empty'},
  article_not_found: {type: 'article_not_found', message: 'article not found'}
});