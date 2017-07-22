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

var serverJsFiles = ['gruntfile.js','models/**/*.js', 'server.js', 'config/**/*.js', 'app/**/*.js', '!app/libraries/**'];
var mochaJsFiles = ['app/tests/**/**/**/*.js'];

gulp.task('app-less', function () {
  return gulp.src('web/zzqs2/lesses/index.client.style.less')
    .pipe(less())
    .pipe(rename(function (path) {
      path.basename = 'zhuzhuqs';
    }))
    .pipe(gulp.dest('web/zzqs2/dist/css'));
});

gulp.task('platform-less', function () {
  gulp.src('web/platform/static/less/views/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/platform/static/css'));

  gulp.src('web/platform/static/less/views/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/platform/static/css/views'));

  gulp.src('web/wechat/less/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/wechat/css'));

  gulp.src('web/wechat/zz_receiver_sender/less/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/wechat/zz_receiver_sender/css'));

  gulp.src('web/mobile/less/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/mobile/css'));

  gulp.src('web/sms/driver_upload_event/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/sms/driver_upload_event/css'));

  gulp.src('web/api/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/api/css'));

  gulp.src('web/home_page/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/home_page/css'));

  gulp.src('web/wechat/salesman/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/wechat/salesman/css'));

  gulp.src('web/wechat/wechat_driver/lesses/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/wechat/wechat_driver/css'));

  gulp.src('web/popup_page/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/popup_page/css'));

  gulp.src('web/resources/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('web/resources/'));


  return;
});

gulp.task('js-concat', function () {
  return gulp.src([
    'web/zzqs2/app.js',
    'web/zzqs2/config.js',
    'web/zzqs2/global.js',
    'web/zzqs2/interceptors/**/*.js',
    'web/zzqs2/services/**/*.js',
    'web/zzqs2/enums/**/*.js',
    'web/zzqs2/errors/**/*.js',
    'web/zzqs2/event/**/*.js',
    'web/zzqs2/filter/**/*.js',
    'web/zzqs2/controllers/**/*.js',
    'web/zzqs2/directive/**/*.js'
  ])
    .pipe(jsconcat('zhuzhuqs.js'))
    .pipe(gulp.dest('web/zzqs2/dist/js'))
    .on('finish',function(){
      // gulp.src('web/zzqs2/dist/js/zhuzhuqs.js')
      //   .pipe(ngAnnotate())
      //   .pipe(uglify({outSourceMap: false}))
      //   .pipe(gulp.dest('web/zzqs2/dist/js/min'));

      return gulp.src(['web/api/controllers/api.order_detail.client.controller.js', 'web/wechat/zz_receiver_sender/js/order_detail.template.client.controller.js'])
        .pipe(ngAnnotate())
        .pipe(uglify({outSourceMap: false}))
        .pipe(gulp.dest('web/api/controllers/min'));
    });
});

gulp.task('server-jshint', function () {
  return gulp.src(serverJsFiles)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('server-test', function (done) {
  gulp.src(serverJsFiles)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src(mochaJsFiles)
        .pipe(mocha({
          reporter: 'spec',
          require: require('./server')
        }))
        .pipe(istanbul.writeReports({
          reporters: ['lcov']
        }))
        .on('end', function () {
          done();
          process.exit();
        })
    });
});

gulp.task('web', ['app-less', 'platform-less', 'js-concat']);

gulp.task('test', ['server-jshint', 'server-test']);

//测试用
gulp.task('js-concat1', function () {
  return gulp.src([
    'web/zzqs2/app.js',
    'web/zzqs2/config.js',
    'web/zzqs2/global.js',
    'web/zzqs2/interceptors/**/*.js',
    'web/zzqs2/services/**/*.js',
    'web/zzqs2/enums/**/*.js',
    'web/zzqs2/errors/**/*.js',
    'web/zzqs2/event/**/*.js',
    'web/zzqs2/filter/**/*.js',
    'web/zzqs2/controllers/**/*.js',
    'web/zzqs2/directive/**/*.js'
  ])
    .pipe(jsconcat('zhuzhuqs.js'))
    .pipe(gulp.dest('web/zzqs2/dist/js'));
});

gulp.task('web1', ['app-less', 'platform-less', 'js-concat1']);

var mochaJsFiles1 = ['app/tests/controllers/version_2.0/order/map_for_order_trace.server.controller.test.js'];
gulp.task('server-test1', function (done) {
  gulp.src(serverJsFiles)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src(mochaJsFiles1)
        .pipe(mocha({
          reporter: 'spec',
          require: require('./server')
        }))
        .pipe(istanbul.writeReports({
          reporters: ['lcov']
        }))
        .on('end', function () {
          done();
          process.exit();
        })
    })
});
gulp.task('test1', ['server-jshint', 'server-test1']);