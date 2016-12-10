/**
 * Created by Wayne on 15/10/9.
 */

'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config'),
  async = require('async'),
  logDb = require('../../../libraries/mongoose').logDb,
  Log = logDb.model('Log');

//日志输出的级别定义
//  info:  输出除debug信息之外的所有信息。用于之后统计数据需要，如:每天注册的人数，每天登录的人数
//  debug: 输出所有的info，warn，error信息。用于开发过程中调试用。
//  warn:  输出warn，error信息。用于警告业务逻辑出错。
//  error: 仅输出error信息。用于记录系统出错。


// meta定义:
// 必填字段有: username, time, access_url
exports.error = function(message, meta, callback){
  var data = meta || {};
  var newLog = new Log({
    username: data.username || 'system',
    role: data.role || 'other',
    time: data.time || new Date().toISOString(),
    access_url: data.path || '',
    level: 'error',
    message: message,
    meta: data
  });

  newLog.save(function(err, logEntity){
    if(err || !logEntity)
      return callback(err);

    logConsole('error', logEntity);

    return callback();
  });
};

// meta定义:
// 必填字段有: username, time, access_url
exports.info = function(message, meta, callback){
  var data = meta || {};
  var newLog = new Log({
    username: data.username || 'system',
    role: data.role || 'other',
    time: data.time || new Date().toISOString(),
    access_url: data.path || '',
    level: 'info',
    message: message,
    meta: data
  });

  newLog.save(function(err, logEntity){
    if(err || !logEntity)
      return callback(err);

    logConsole('info', logEntity);

    return callback();
  });
};

// meta定义:
// 必填字段有: username, time, access_url
exports.warn = function(message, meta, callback){
  var data = meta || {};
  var newLog = new Log({
    username: data.username || 'system',
    role: data.role || 'other',
    time: data.time || new Date().toISOString(),
    access_url: data.path || '',
    level: 'warn',
    message: message,
    meta: data
  });

  newLog.save(function(err, logEntity){
    if(err || !logEntity)
      return callback(err);

    logConsole('warn', logEntity);

    return callback();
  });
};

// meta定义:
// 必填字段有: username, time, access_url
exports.debug = function(message, meta, callback){
  var data = meta || {};
  var newLog = new Log({
    username: data.username || 'system',
    role: data.role || 'other',
    time: data.time || new Date().toISOString(),
    access_url: data.path || '',
    level: 'debug',
    message: message,
    meta: data
  });

  newLog.save(function(err, logEntity){
    if(err || !logEntity)
      return callback(err);

    logConsole('debug', logEntity);

    return callback();
  });
};

exports.log = function(level, message, meta, callback){
  var data = meta || {};
  var newLog = new Log({
    username: data.username || 'system',
    time: data.time || new Date().toISOString(),
    access_url: data.path || '',
    level: level,
    message: message,
    meta: data
  });

  newLog.save(function(err, logEntity){
    if(err || !logEntity)
      return callback(err);

    logConsole(level, logEntity);

    return callback();
  });
};

function logConsole(level, logEntity){
  switch(config.loggerLevel)
  {
    case 'debug':
      console.log(level, logEntity.time, logEntity.message, logEntity);
      return;
    case 'error':
      if(level === 'error'){
        console.log(level, logEntity.time, logEntity.message, logEntity);
      }
      return;
    case 'warn':
      if(level === 'error' || level === 'warn'){
        console.log(level, logEntity.time, logEntity.message, logEntity);
      }
      return;
    case 'info':
    default:
      if(level !== 'debug'){
        console.log(level, logEntity.time, logEntity.message, logEntity);
      }
      return;
  }
};
