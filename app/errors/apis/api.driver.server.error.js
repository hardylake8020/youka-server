'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  empty_driver_id:{type:'empty_driver_id',message:'empty driver id'},
  empty_driver_number:{type:'empty_driver_number',message:'empty driver number'},
  driver_not_existed:{type:'driver_not_existed',message:'driver is not existed'},
  internal_system_error: {type: 'internal_system_error', message: '未知错误，请与管理员联系'}
});
