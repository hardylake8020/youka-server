/**
 * Created by Wayne on 15/10/25.
 */

'use strict';


var path = require('path'),
  async = require('async'),
  fs = require('fs'),
  _ = require('lodash'),
  newsError = require('../errors/news'),
  appDb = require('../../libraries/mongoose').appDb,
  News = appDb.model('News');


function generateQueryCondition(searchQuery, searchCondition, callback) {
  if (!searchQuery || !searchCondition || (typeof searchCondition !== 'object')) {
    return callback();
  }
  if (!searchQuery.$and) {
    searchQuery.$and = [];
  }

  for (var column in searchCondition) {
    switch (column) {
      case 'type':
        if (searchCondition[column]) {
          searchQuery.$and.push({type: searchCondition[column]});
        }
        break;
      case 'text':
        if (searchCondition[column]) {
          searchQuery.$and.push({
            $or: [{article_title: {$regex: searchCondition[column], $options: 'i'}},
              {article_keywords: {$regex: searchCondition[column], $options: 'i'}}]
          });
        }
        break;
      default:
        break;
    }
  }

  return callback();
}
exports.getList = function (searchCondition, callback) {
  var searchQuery = {
    $and:[{delete_status: false}]
  };

  generateQueryCondition(searchQuery, searchCondition, function () {
    if (searchQuery.$and && searchQuery.$and.length === 0) {
      delete searchQuery.$and;
    }
    if (searchQuery.$or && searchQuery.$or.length === 0) {
      delete searchQuery.$or;
    }

    async.auto({
      totalCount: function (autoCallback) {
        News.count(searchQuery, function (err, count) {
          if (err) {
            return autoCallback({err: newsError.internal_system_error});
          }
          return autoCallback(null, count);
        });
      },
      findPage: function (autoCallback) {
        News.find(searchQuery)
          .select({paragraphs: 0})
          .sort({created: -1})
          .skip((searchCondition.currentPage -1) * searchCondition.limit)
          .limit(searchCondition.limit)
          .exec(function (err, newsEntity) {
            if (err) {
              return autoCallback({err: newsError.internal_system_error});
            }
            return autoCallback(null, newsEntity);
          });
      }
    }, function (err, result) {

      if (err) {
        return callback(err);
      }

      return callback(null, {
        totalCount: result.totalCount,
        currentPage: searchCondition.currentPage,
        limit: searchCondition.limit,
        list: result.findPage
      });

    });

  });



};

exports.getArticleById = function (articleId, callback) {
  News.findOne({_id: articleId}, function (err, findNews) {
    if (err) {
      return callback({err: newsError.internal_system_error});
    }
    return callback(null, findNews);
  });
};

exports.getAllCount = function (callback) {

  async.auto({
    companyNewsCount: function (autoCallback) {
      News.count({type: 'company_news', delete_status: false}, function (err, count) {
        if (err) {
          return autoCallback({err: newsError.internal_system_error});
        }
        return autoCallback(null, count);
      });
    },
    industryNewsCount: function (autoCallback) {
      News.count({type: 'industry_news', delete_status: false}, function (err, count) {
        if (err) {
          return autoCallback({err: newsError.internal_system_error});
        }
        return autoCallback(null, count);
      });
    },
    mediaReportCount: function (autoCallback) {
      News.count({type: 'media_report', delete_status: false}, function (err, count) {
        if (err) {
          return autoCallback({err: newsError.internal_system_error});
        }
        return autoCallback(null, count);
      });
    }
  }, function (err, result) {
    if (err) {
      return callback(err);
    }

    return callback(result);
  });
};

//function renderHtml(templateFileName, renderData, callback) {
//  fs.readFile(templateFileName, 'utf8', function (err, str) {
//    if (err) {
//      console.log('fs.readFile(' + templateFileName + ') failed');
//      return callback({err: newsError.internal_system_error});
//    }
//    var html = ejs.render(str, renderData);
//
//    return callback(null, html);
//  });
//}