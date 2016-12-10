/**
 * Created by wd on 16/05/24.
 */

'use strict';


var path = require('path'),
  async = require('async'),
  moment = require('moment'),
  onlineReportConfigError = require('../errors/online_report_config'),
  appDb = require('../../libraries/mongoose').appDb,
  ReportConfig = appDb.model('OnlineReportConfig'),
  OrderExportReportConfig = appDb.model('OnlineOrderExportReportConfig'),
  ReportTask = appDb.model('ReportTask');

var mongoose = require('mongoose');

function getReportConfig(companyId, callback) {
  if (!companyId) {
    return callback({err: onlineReportConfigError.params_null});
  }

  ReportConfig.findOne({company_id: companyId}, function (err, config) {
    if (err) {
      console.log(err);
      err = {err: onlineReportConfigError.internal_system_error};
    }
    return callback(err, config);
  });
}

function getOrderExportReportConfig(companyId, callback) {
    if (!companyId) {
        return callback({err: onlineReportConfigError.params_null});
    }

    OrderExportReportConfig.findOne({company_id: companyId}, function (err, config) {
        if (err) {
            console.log(err);
            err = {err: onlineReportConfigError.internal_system_error};
        }
        return callback(err, config);
    });
}

exports.getReportConfig = function (companyId, callback) {
  return getReportConfig(companyId, callback);
};

exports.getOrderExportReportConfig = function (companyId, callback) {
    return getOrderExportReportConfig(companyId, callback);
};

exports.saveOrUpdate = function(config, callback) {

  getReportConfig(config.company_id, function (err, resConfig) {
    if (err) {
      return callback(err);
    }
    if (!resConfig) {
      resConfig = new ReportConfig({
        company_id: config.company_id,
        company_name: config.company_name
      });
    }

    resConfig.emails = config.emails;
    config.start_send_time = config.start_send_time.replace(/-/g,"/");
    config.start_send_time = new Date(config.start_send_time);
    resConfig.start_send_time = config.start_send_time;
    resConfig.interval = config.interval;

    createReportTaskInfo(resConfig, function(err, results) {

      resConfig.save(function (err, saveConfig) {
        if (err || !saveConfig) {
          err = {err: onlineReportConfigError.internal_system_error};
        }

        return callback(err, saveConfig);
      });

    });
  });

};

exports.updateExportFields = function(config, callback) {

    getOrderExportReportConfig(config.company_id, function (err, resConfig) {
        if (err) {
            return callback(err);
        }
        if (!resConfig) {
            resConfig = new OrderExportReportConfig({
                company_id: config.company_id
            });
        }
        resConfig.fields = config.fields;
        resConfig.save(function (err, saveConfig) {
            if (err || !saveConfig) {
                err = {err: onlineReportConfigError.internal_system_error};
            }
            return callback(err, saveConfig);
        });
    });

};

function createReportTaskInfo(config, callback) {
  if (!config) {
    return callback({err: onlineReportConfigError.report_config_null});
  }

  ReportTask.remove({
    company_id: config.company_id,
    send_flg: 0
  }, function(removeErr) {
    if(removeErr) {
      return callback({err: onlineReportConfigError.internal_system_error});
    }

    var errArray = [];
    var taskArray = [];
    var indexs = [1, 2, 3, 4];
    //比如7月1日开始发邮件，间隔7天，那么第一天（7.1）发送的数据是从6月23日开始
    var startDate = moment(config.start_send_time).subtract(config.interval + 1, 'days');
    async.each(indexs, function (index, asyncCallback) {

      var beginDate = moment(moment(startDate).add(((index - 1) * config.interval + 1), 'days').format('YYYY-MM-DD'));
      var endDate = moment(moment(startDate).add((index * config.interval), 'days').format('YYYY-MM-DD') + ' 23:59:59');
      var taskDatetime = moment(moment(startDate).add((index * config.interval + 1), 'days').format('YYYY-MM-DD HH'));

      var reportTask = new ReportTask({
        company_id: config.company_id,
        company_name: config.company_name,
        begin_date: beginDate,
        end_date: endDate,
        task_datetime: taskDatetime,
        email_list: config.emails,
        dw_ticket: new mongoose.Types.ObjectId().toString()
      });

      reportTask.save(function (saveErr, newTask) {
        if (saveErr) {
          errArray.push(reportTask);
        }
        else {
          taskArray.push(newTask);
        }

        return asyncCallback();
      });

    }, function (asyncErr) {
      return callback(null, {taskArray: taskArray, errArray: errArray});
    });

  });

}
