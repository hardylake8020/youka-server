/**
 * Created by Wayne on 15/10/8.
 */

'use strict';

//glup test 用于单元测试
//glup web 用于前端编译和合并

process.env.NODE_ENV = 'test';

var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var jsconcat = require('gulp-concat');
var jshint = require('gulp-jshint');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

gulp.task('site-less', function () {
  gulp.src('./web/site/lesses/all.client.style.less')
    .pipe(less())
    .pipe(rename(function (path) {
      path.basename = 'tender';
    }))
    .pipe(gulp.dest('web/site/dist/css'));

  return;
});

gulp.task('other-less', function () {
  gulp.src('./web/global/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('./web/global/css'));


  gulp.src('./web/wechat2/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('./web/wechat2/dist/css'));

  gulp.src('./web/wechat/bidder/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('./web/wechat/bidder/css'));


  gulp.src([
      'web/wechat/bidder/lesses/alert.client.style.less',
      'web/wechat/bidder/lesses/loading.client.style.less'
    ])
    .pipe(jsconcat('support.less'))
    .pipe(less())
    .pipe(gulp.dest('./web/wechat/bidder/dist'));

  gulp.src([
      'web/wechat/bidder/lesses/header.client.style.less',
      'web/wechat/bidder/lesses/order_detail.client.style.less',
      'web/wechat/bidder/lesses/order_list.client.style.less',
      'web/wechat/bidder/lesses/order_map.client.style.less',
      'web/wechat/bidder/lesses/tabs.client.style.less',
      'web/wechat/bidder/lesses/tender_detail.client.style.less',
      'web/wechat/bidder/lesses/tender_list.client.style.less',
      'web/wechat/bidder/lesses/timeline.client.style.less',
      'web/wechat/bidder/lesses/deposit_detail.client.style.less',
      'web/wechat/bidder/lesses/deposit_log_list.client.style.less'
    ])
    .pipe(jsconcat('business.less'))
    .pipe(less())
    .pipe(gulp.dest('./web/wechat/bidder/dist'));

  return;
});

gulp.task('site-js', function () {
  gulp.src([
      'web/site/app.js',
      'web/site/config.js',
      'web/site/interceptors/**/*.js',
      'web/site/services/**/*.js',
      'web/site/errors/**/*.js',
      'web/site/event/**/*.js',
      'web/site/controllers/**/*.js',
      'web/site/directive/**/*.js'
    ])
    .pipe(jsconcat('tender.js'))
    .pipe(gulp.dest('web/site/dist/js'));

  return;

});
gulp.task('bidder-js', function () {
  gulp.src([
      'web/wechat/bidder/js/alert.client.controller.js',
      'web/wechat/bidder/js/common.client.controller.js',
      'web/wechat/bidder/js/loading.client.controller.js'
    ])
    .pipe(jsconcat('support.js'))
    .pipe(gulp.dest('./web/wechat/bidder/dist'));

  gulp.src([
      'web/wechat/bidder/js/order_detail.client.controller.js',
      'web/wechat/bidder/js/order_list.client.controller.js',
      'web/wechat/bidder/js/order_map.client.controller.js',
      'web/wechat/bidder/js/tabs.client.controller.js',
      'web/wechat/bidder/js/tender_detail.client.controller.js',
      'web/wechat/bidder/js/tender_list.client.controller.js',
      'web/wechat/bidder/js/timeline.client.controller.js',
      'web/wechat/bidder/js/deposit_detail.client.controller.js',
      'web/wechat/bidder/js/deposit_log_list.client.controller.js'
    ])
    .pipe(jsconcat('business.js'))
    .pipe(gulp.dest('./web/wechat/bidder/dist'));

  return;

});

gulp.task('web', ['other-less', 'site-less', 'site-js', 'bidder-js']);