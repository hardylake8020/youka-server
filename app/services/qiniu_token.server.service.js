/**
 * Created by elinaguo on 15/6/2.
 */
'use strict';
var cryptoLib = require('../libraries/crypto'),
  qiniu = require('../libraries/qiniu');

exports.getImageToken = function () {
  return new qiniu.rs.PutPolicy('zhuzhuqs').token();
};