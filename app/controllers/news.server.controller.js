/**
 * Created by Wayne on 15/10/25.
 */
'use strict';

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  fs = require('fs'),
  ejs = require('ejs'),
  config = require('../../config/config'),
  newsError = require('../errors/news'),
  newsService = require('../services/news'),
  appDb = require('../../libraries/mongoose').appDb,
  News = appDb.model('News');


exports.getArticle = function (req, res, next) {
  var currentType = req.query.type || '';
  var articleId = req.query.article_id || '';

  if (!articleId) {
    return res.send({err: newsError.params_null});
  }
  newsService.getArticleById(articleId, function (err, findNews) {
    if (err) {
      return res.send(err);
    }

    return res.send({news: findNews, type: currentType});
  });

};

function generateCurrentType(articleType) {
  var typeObject = {
    name: articleType,
    text: ''
  };

  switch(articleType) {
    case 'company_news':
      typeObject.text = '柱柱动态';
      break;
    case 'industry_news':
      typeObject.text = '行业资讯';
      break;
    case 'media_report':
      typeObject.text = '媒体报道';
      break;
    default:
      typeObject.text = '所有分类';
      break;
  }

  return typeObject;
}

exports.getArticlePage = function (req, res, next) {
  var articleId = req.query.article_id || '';
  var currentType = req.query.current_type || '';

  newsService.getArticleById(articleId, function (err, article) {
    if (err) {
      return res.send(err);
    }

    if (!article) {
      return res.send({err: newsError.article_not_found});
    }

    var typeObject = generateCurrentType(currentType);
    article.currentTab = typeObject.text;
    article.currentTabLink = '/home/news?current_type=' + typeObject.name;
    article.create_time = article.created.format('yy-MM-dd hh:ss');
    article.paragraphs = JSON.stringify(article.paragraphs);

    return res.render(path.join(__dirname, '../../web/home_page/views/article.client.view.html'), {article: article});
  });
};

exports.getList = function (req, res, next) {
  var searchCondition = req.query.search || {};

  if (!searchCondition.currentPage) {
    searchCondition.currentPage = 1;
  }
  searchCondition.currentPage = parseInt(searchCondition.currentPage) || 1;

  if (!searchCondition.limit) {
    searchCondition.limit = 5;
  }
  searchCondition.limit = parseInt(searchCondition.limit) || 5;

  //searchCondition.type, searchCondition.text
  newsService.getList(searchCondition, function (err, result) {
    if (err) {
      return res.send(err);
    }

    return res.send(result);
  });
};

exports.getAllCount = function (req, res, next) {
  newsService.getAllCount(function (err, result) {
    if (err) {
      return res.send(err);
    }

    return res.send(result);
  });
};