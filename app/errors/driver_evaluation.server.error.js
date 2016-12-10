/**
 * Created by Wayne on 15/11/3.
 */

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  evaluation_not_exist: {type: 'evaluation_not_exist', message: 'evaluation not exist'},
  evaluation_has_exist: {type: 'evaluation_has_exist', message: 'evaluation has exist'}
});
