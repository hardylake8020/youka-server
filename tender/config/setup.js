/**
 * Created by Wayne on 15/10/10.
 */

//配置环境

'use strict';

var typeExtend = require('../../libraries/type_extend'),
  config = require('./config');

module.exports = function () {

  if (!process.env) {
    process.env = {};
  }

  process.env.appDb = config.appDb;
  process.env.logDb = config.logDb;
  process.env.qiniu_a_key = config.qiniu_a_key;
  process.env.qiniu_s_key = config.qiniu_s_key;

  process.env.wx_url = config.wx_url;
  process.env.wx_appid = config.wx_appid;
  process.env.wx_secret = config.wx_secret;
  process.env.wx_token = config.wx_token;

  process.env.serverAddress = config.serverAddress;
  process.env.depositAmount = config.depositAmount;

  var mongo = require('../../libraries/mongoose');
  require('../../models/all')(mongo.appDb, mongo.logDb);

};