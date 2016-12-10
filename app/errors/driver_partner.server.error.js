'use strict';

var _ = require('lodash');

module.exports = _.extend(exports, {
  internal_system_error: {type: 'internal_system_error', message: 'internal system error'},
  driver_has_accepted_partner: {type: 'driver_has_accepted_partner', message: 'the driver has been accepted the company'},
  driver_has_confused_partner: {type: 'driver_has_confused_partner', message: 'the driver has been confused the company'},
  uninvited_partner: {type: 'uninvited_partner', message: 'the company has not invited the driver'},
  has_been_done: {type: 'has_been_done', message: 'the partner has been accepted or confused'}
});
