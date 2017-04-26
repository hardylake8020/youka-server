/**
 * Created by Wayne on 15/11/6.
 */

'use strict';

var index = require('../controllers/index');

module.exports = function (app) {
  app.route('/').get(index.index);
  app.route('/site/index').get(index.indexSite);
  app.route('/external_link').get(index.externalLink);
  app.route('/back_home_page').get(index.backHomePage);

  app.route('/wechat2_detial').get(index.wechat2Detail);
};