/**
 * Created by Wayne on 15/10/25.
 */
'use strict';

var news = require('../../app/controllers/news'),
  userFilter = require('../filters/user');

module.exports = function (app) {
  app.route('/news/list/read').get(news.getList);
  app.route('/news/article/read').get(news.getArticle);
  app.route('/news/article/page').get(news.getArticlePage);
  app.route('/news/count/all').get(news.getAllCount);
};