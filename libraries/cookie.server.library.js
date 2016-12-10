'use strict';

exports.setCookie = function (res, key, value) {
  res.setHeader('Set-Cookie', [key + '=' + value]);
  return res;
};

exports.getCookie = function (req) {
  var cookies = {};

  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(function (cookie) {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = ( parts[1] || '' ).trim();
    });
  }

  return cookies;
};

