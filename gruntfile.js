'use strict';

module.exports = function (grunt) {
  // Unified Watch Object
  var watchFiles = {
    serverJS: ['gruntfile.js', 'server.js','models/**/*.js', 'config/**/*.js', 'app/**/*.js'],
    mochaTests: ['app/tests/**/**/**/*.js']
    //mochaTests: ['app/tests/controllers/version_2.0/apis/api.order_assign.server.controller.test.js']
  };

  // Project Configuration
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      jshint: {
        all: {
          src: watchFiles.serverJS,
          options: {
            jshintrc: true
          }
        }
      },
      nodemon: {
        dev: {
          script: 'server.js',
          options: {
            nodeArgs: ['--debug'],
            ext: 'js,html'
          }
        }
      },
      'node-inspector': {
        custom: {
          options: {
            'web-port': 1337,
            'web-host': 'localhost',
            'debug-port': 5858,
            'save-live-edit': true,
            'no-preload': true,
            'stack-trace-limit': 50,
            'hidden': []
          }
        }
      },
      concurrent: {
        default: ['nodemon'],
        debug: ['nodemon', 'node-inspector'],
        options: {
          logConcurrentOutput: true
        }
      },
      env: {
        test: {
          NODE_ENV: 'test'
        }
      },
      mochaTest: {
        src: watchFiles.mochaTests,
        options: {
          reporter: 'spec',
          require: 'server.js'
        }
      },
      less: {
        development: {
          options: {
            compress: false,
            yuicompress: false
          },
          files: {
            'web/platform/static/css/views/index.client.style.css': 'web/platform/static/less/views/index.client.style.less',
            'web/platform/static/css/views/index_lte_ie8.client.style.css': 'web/platform/static/less/views/index_lte_ie8.client.style.less',
            'web/platform/static/css/views/login.client.style.css': 'web/platform/static/less/views/login.client.style.less',
            'web/platform/static/css/views/register.client.style.css': 'web/platform/static/less/views/register.client.style.less',
            'web/platform/static/css/views/invite_register.client.style.css': 'web/platform/static/less/views/invite_register.client.style.less',
            'web/platform/static/css/views/browser_upgrade.client.style.css': 'web/platform/static/less/views/browser_upgrade.client.style.less',
            'web/platform/static/css/views/about_us.client.style.css': 'web/platform/static/less/views/about_us.client.style.less',
            'web/wechat/css/order_share_qrcode.client.style.css': 'web/wechat/less/order_share_qrcode.client.style.less',
            'web/wechat/css/order_share_content.client.style.css': 'web/wechat/less/order_share_content.client.style.less',
            'web/wechat/css/order_share_detail.client.style.css': 'web/wechat/less/order_share_detail.client.style.less',
            'web/zzqs2/dist/css/zhuzhuqs.css':'web/zzqs2/lesses/index.client.style.less',

            'web/wechat/zz_receiver_sender/css/order_list.client.style.css': 'web/wechat/zz_receiver_sender/less/order_list.client.style.less',
            'web/wechat/zz_receiver_sender/css/order_list_sender.client.style.css': 'web/wechat/zz_receiver_sender/less/order_list_sender.client.style.less',
            'web/wechat/zz_receiver_sender/css/order_submit.client.style.css': 'web/wechat/zz_receiver_sender/less/order_submit.client.style.less',
            'web/wechat/zz_receiver_sender/css/order_onway.client.style.css': 'web/wechat/zz_receiver_sender/less/order_onway.client.style.less',
            'web/wechat/zz_receiver_sender/css/loading.client.style.css': 'web/wechat/zz_receiver_sender/less/loading.client.style.less',


            'web/sms/driver_upload_event/css/driver_pickup.client.style.css': 'web/sms/driver_upload_event/less/driver_pickup.client.style.less',
            'web/sms/driver_upload_event/css/driver_delivery.client.style.css': 'web/sms/driver_upload_event/less/driver_delivery.client.style.less',
            'web/sms/driver_upload_event/css/loading.client.style.css': 'web/sms/driver_upload_event/less/loading.client.style.less',

            'web/api/css/api.order_detail.client.style.css':'web/api/lesses/api.order_detail.client.style.less'
          }
        }
      },
      concat: {
        basic: {
          src:[
            'web/zzqs2/app.js',
            'web/zzqs2/config.js',
            'web/zzqs2/global.js',
            'web/zzqs2/interceptors/**.js',
            'web/zzqs2/services/**.js',
            'web/zzqs2/errors/**.js',
            'web/zzqs2/event/**.js',
            'web/zzqs2/filter/**/*.js',
            'web/zzqs2/controllers/**/*.js',
            'web/zzqs2/directive/**/*.js'
          ],
          dest:'web/zzqs2/dist/js/zhuzhuqs.js'
        }
      }
    }
  );

// Load NPM tasks
  require('load-grunt-tasks')(grunt);

// Making grunt default to force in order not to break the project.
  grunt.option('force', true);

// A Task for loading the configuration object
  grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function () {
    var init = require('./config/init')();
    var config = require('./config/config');
  });

// Default task(s).
  grunt.registerTask('default', ['jshint', 'concurrent:default']);

  grunt.registerTask('test', ['env:test', 'mochaTest', 'jshint']);

  grunt.registerTask('web', ['less', 'concat']);
};
