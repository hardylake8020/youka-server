var _ = require('lodash'),
  config = require('../../config/config'),
  qiniu = require('qiniu');

qiniu.conf.ACCESS_KEY = config.qiniu_a_key;
qiniu.conf.SECRET_KEY = config.qiniu_s_key;
exports = _.extend(exports, qiniu);