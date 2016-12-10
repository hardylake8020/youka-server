/**
 * Created by Wayne on 16/3/11.
 */
var path = require('path');
var cookieLibrary = require('../../../libraries/cookie');
var config = require('../../config/config');

exports.index = function (req, res, next) {
  return res.redirect('/site/index');
};
exports.indexSite = function (req, res, next) {
  var cookies = cookieLibrary.getCookie(req);
  var accessToken = cookies.access_token;

  return res.render(path.join(__dirname, '../../web/site/index.html'), {test: accessToken});
};

exports.externalLink = function (req, res, next) {
  var state = req.query.state;
  var accessToken = req.query.token;

  cookieLibrary.setCookie(res, 'access_token', accessToken);

  return res.redirect('/site/index#/' + state);
};

exports.backHomePage = function (req, res, next) {
  return res.redirect(config.zzqsAddress+'zzqs2/index');
};
