'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  name_null:{type: 'name_null', message: 'name is null'},
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  invalid_company_id: {type: 'invalid_company_id', message: 'invalid company id'},
  group_not_exist: {type: 'group_not_exist', message: 'this group is not exist'},
  group_id_null: {type: 'group_id_null', message: 'group id is null', param: 'groupId'},
  group_exist: {type: 'group_exist', message: 'this group is exist'},
  user_not_exist:{type:'user_not_exist',message:'user not exist'},
  not_in_company:{type:'not_in_company',message:'user not in company'},
  invalid_email: {type: 'invalid_email', message: 'invalid email', param: 'username'},
  user_in_other_company:{type:'user_in_other_company',message:'user in other company'},
  user_exist_in_group:{type:'user_exist_in_group',message:'user is already in group'},
  user_not_exist_in_group:{type:'user_not_exist_in_group',message:'user is not in group'},
  post_data_empty: {type: 'post_data_empty', message: 'some post data is empty'},
  params_null: {type: 'params_null', message: 'params in function is empty'},
  forbid_delete_default_group: {type: 'forbid_delete_default_group', message: 'can not delete default group or default group member'}
});
