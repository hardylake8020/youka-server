/**
 * Created by Wayne on 15/10/25.
 */

'use strict';


var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

module.exports = function (appDb) {
  var NewsSchema = new Schema({
    object: {
      type: String,
      default: 'news'
    },
    html_title: {
      type: String,
      default: ''
    },
    html_keywords: {
      type: String,
      default: ''
    },
    html_description: {
      type: String,
      default: ''
    },
    article_title: {
      type: String,
      default: ''
    },
    article_keywords: {
      type: String,
      default: ''
    },
    article_brief: {
      type: String,
      default: ''
    },
    type: [{
      type: String,
      enum: ['company_news', 'industry_news', 'media_report']
    }],
    //封面图片
    cover: {
      type: String
    },
    delete_status: {
      type: Boolean,
      default: false
    },
    author: {
      type: String
    },
    creator: {
      type: Schema.Types.Mixed
    },
    //段落: 序号，文字，图片数组
    paragraphs: [{
      type: Schema.Types.Mixed
    }]
  });


  NewsSchema.plugin(timestamps, {
    createdAt: 'created',
    updatedAt: 'updated'
  });

  appDb.model('News', NewsSchema);
};