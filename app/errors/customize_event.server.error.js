/**
 * Created by Wayne on 15/8/19.
 */

'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  customize_event_id_empty: {type: 'customize_event_id_empty', message: 'customize event id is empty'},
  customize_event_id_invalid: {type: 'customize_event_id_invalid', message: 'customize event id is invalid'},
  event_type_invalid: {type: 'event_type_invalid', message: 'invalid event type'},
  //分配司机信息不存在
  assign_driver_content_empty: {type: 'assign_driver_content_empty', message: 'assign driver content is empty'}
});