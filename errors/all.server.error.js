/**
 * Created by Wayne on 15/10/9.
 */

var paramsError = require('./params'),
  systemError = require('./system'),
  businessError = require('./business'),
  thirdError = require('./third');

exports.params = paramsError;
exports.system = systemError;
exports.third = thirdError;
exports.business = businessError;