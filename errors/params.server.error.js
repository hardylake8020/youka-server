/**
 * Created by Wayne on 15/10/9.
 */

module.exports = {
  empty: {type: 'params_empty', message: 'one or more params empty', zh_message: '字段为空值'},
  error_type: {type: 'params_error_type', message: 'one or more params type error', zh_message: '字段类型错误'},
  invalid_value: {type: 'params_invalid_value', message: 'one ore more params value invalid', zh_message: '字段值不符合要求'},
  invalid_range: {type: 'params_invalid_range', message: 'one ore more params value out of range', zh_message: '字段值越界'},
  illegal_character: {type: 'params_illegal_character', message: 'one or more params include illegal characters', zh_message: '字段值包含非法字符'},
  invalid_length: {type: 'params_invalid_length', message: 'one or more params\' length invalid', zh_message: '字段值长度不正确'}
};