/**
 * Created by elinaguo on 15/3/17.
 */
'use strict';
var config = require('../../config/config');

exports.getTenderPage = function (req, res, next) {
  var token = req.query.access_token || '';
  var state = req.query.state || '';
  return res.redirect(config.tenderAddress + 'external_link?state=' + state + '&token=' + token);
};