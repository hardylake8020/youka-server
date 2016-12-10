/**
 * Created by zenghong on 15/10/22.
 */
'use strict';

var wkhtmltopdf = require('wkhtmltopdf');
var exec = require('child_process').exec;
var config = require('../../config/config');


exports.htmlToPdf = function (url, name, callback) {
  var cmd = 'wkhtmltopdf ' + url + ' ' + name;
  exec(cmd,{}, function (err, stdout, stderr) {
    console.log('err : ', err);
    console.log('stdout : ', stdout);
    console.log('stderr : ', stderr);
    return callback();
  });
};

