var _ = require('lodash'),
  qiniu = require('qiniu');

qiniu.conf.ACCESS_KEY = process.env.qiniu_a_key;
qiniu.conf.SECRET_KEY = process.env.qiniu_s_key;
exports = _.extend(exports, qiniu);