/**
 * Created by ZhangXuedong on 2016/8/25.
 */

var fs = require('fs'),
  Promise = require('promise'),
  UserService = require('../services/user'),
  ChartsService = require('../services/charts');

function createFilter(req) {
  return new Promise(function (fulfill, reject) {
    var ands = [];
    ands.push({
      $or: [{delete_status: {$exists: false}}, {delete_status: false}]
    });
    var assign_time = {};
    if (req.query.assign_time_start) {
      assign_time.start = new Date(req.query.assign_time_start);
      assign_time.start.setMilliseconds(0);
      assign_time.start.setSeconds(0);
      assign_time.start.setMinutes(0);
      assign_time.start.setHours(0);
    }
    if (req.query.assign_time_end) {
      assign_time.end = new Date(req.query.assign_time_end);
      assign_time.end.setMilliseconds(0);
      assign_time.end.setSeconds(0);
      assign_time.end.setMinutes(0);
      assign_time.end.setHours(0);
      // 小于结束日期所以加1天
      assign_time.end = new Date(assign_time.end.getTime() + 24 * 60 * 60 * 1000);
    }
    if (assign_time.start && assign_time.end) {
      ands.push({
        assign_time: {
          $gte: assign_time.start,
          $lt: assign_time.end
        }
      });
    } else if (assign_time.start) {
      ands.push({
        assign_time: {
          $gte: assign_time.start
        }
      });
    } else if (assign_time.end) {
      ands.push({
        assign_time: {
          $lt: assign_time.end
        }
      });
    }

    var senderORs = [];
    if (req.query.sender_company_id) {
      senderORs.push({
        'sender_company.company_id': req.query.sender_company_id
      });
    }
    if (req.query.sender_name) {
      senderORs.push({
        sender_name: new RegExp('^' + req.query.sender_name)
      });
    }
    if (senderORs.length >= 1) {
      ands.push({
        $or: senderORs
      });
    }

    if (req.query.execute_company_id) {
      ands.push({
        execute_company: req.query.execute_company_id
      });
    }
    if (req.query.execute_driver_id) {
      ands.push({
        execute_driver: req.query.execute_driver_id
      });
    }

    var user = req.user;
    UserService.getGroups(user._id, function (err, userGroupEntities) {
      if (err) {
        return reject(err);
      } else if (!userGroupEntities || userGroupEntities.length <= 0) {
        return reject({err: 'invalid userGroupEntities'});
      } else {
        var groupIds = [];
        userGroupEntities.forEach(function (userGroupEntity) {
          groupIds.push(userGroupEntity.group._id);
        });
        ands.push({
          execute_group: {
            $in: groupIds
          }
        });

        fulfill({
          $and: ands
        });
      }
    });
  });
}

exports.chart1Download = function (req, res, next) {
  createFilter(req).then(function (filter) {
    ChartsService.exportChart1(filter)
    .then(function (xlsx) {
      var options = {
        root: xlsx.root
      };
      var mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      var filePath = xlsx.filePath;
      var filename = xlsx.filename;
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', mimetype);
      res.sendFile(filePath, options, function (err) {
        fs.unlink(filePath);
        if (err) {
          next(err);
        }
      });
    }, function (reason) {
      return next(reason);
    });
  }, function (reason) {
    console.log(reason);
    // 用户输入错误返回给用户
    res.send({
      "status": "error",
      "error": {
        "type": "",
        "message": reason
      }
    });
  });
};

exports.chart1Data = function (req, res, next) {
  createFilter(req).then(function (filter) {
    ChartsService.getChart1Data(req.query.groupType, filter).then(function (data) {
      res.send({
        "status": "success",
        "data": data
      });
    }, function (reason) {
      return next(reason);
    });
  }, function (reason) {
    // 用户输入错误返回给用户
    res.send({
      "status": "fail",
      "error": {
        "type": "",
        "message": reason
      }
    });
  });

};


exports.chart2Download = function (req, res, next) {
  createFilter(req).then(function (filter) {
    ChartsService.exportChart2(filter)
    .then(function (xlsx) {
      var options = {
        root: xlsx.root
      };
      var mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      var filePath = xlsx.filePath;
      var filename = xlsx.filename;
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', mimetype);
      res.sendFile(filePath, options, function (err) {
        fs.unlink(filePath);
        if (err) {
          next(err);
        }
      });
    }, function (reason) {
      return next(reason);
    });
  }, function (reason) {
    console.log(reason);
    // 用户输入错误返回给用户
    res.send({
      "status": "error",
      "error": {
        "type": "",
        "message": reason
      }
    });
  });
};

exports.chart2Data = function (req, res, next) {
  createFilter(req).then(function (filter) {
    ChartsService.getChart2Data(req.query.groupType, filter).then(function (data) {
      res.send({
        "status": "success",
        "data": data
      });
    }, function (reason) {
      return next(reason);
    });
  }, function (reason) {
    // 用户输入错误返回给用户
    res.send({
      "status": "fail",
      "error": {
        "type": "",
        "message": reason
      }
    });
  });

};

function getChart3Params(req){
  var assign_time = {};
  if (req.query.assign_time_start) {
    assign_time.start = new Date(req.query.assign_time_start);
    assign_time.start.setMilliseconds(0);
    assign_time.start.setSeconds(0);
    assign_time.start.setMinutes(0);
    assign_time.start.setHours(0);
  }
  if (req.query.assign_time_end) {
    assign_time.end = new Date(req.query.assign_time_end);
    assign_time.end.setMilliseconds(0);
    assign_time.end.setSeconds(0);
    assign_time.end.setMinutes(0);
    assign_time.end.setHours(0);
    // 小于结束日期所以加1天
    assign_time.end = new Date(assign_time.end.getTime() + 24 * 60 * 60 * 1000);
  }
  var ands = [];
  if (assign_time.start && assign_time.end) {
    ands.push({
      assign_time: {
        $gte: assign_time.start,
        $lt: assign_time.end
      }
    });
  } else if (assign_time.start) {
    ands.push({
      assign_time: {
        $gte: assign_time.start
      }
    });
  } else if (assign_time.end) {
    ands.push({
      assign_time: {
        $lt: assign_time.end
      }
    });
  }
  return {
    $and: ands
  };
}

exports.chart3Download = function(req, res, next){
  var params = getChart3Params(req);
  var sendFile = function (xlsx) {
    var options = {
      root: xlsx.root
    };
    var mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    var filePath = xlsx.filePath;
    var filename = xlsx.filename;
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);
    res.sendFile(filePath, options, function (err) {
      fs.unlink(filePath);
      if (err) {
        next(err);
      }
    });
  };
  var failFunc = function(reason){
    return next(reason);
  };
  if(req.query.groupType == 'company'){
    ChartsService.chart3CompanyA(params, req.user._id, 'download').then(sendFile, failFunc);
  }else if(req.query.groupType == 'driver'){
    ChartsService.chart3DriverA(params, req.user._id, 'download').then(sendFile, failFunc);
  }else{
    ChartsService.chart3DriverB(params, req.user._id, 'download').then(sendFile, failFunc);
  }
};

exports.chart3Data = function(req, res, next){

  var params = getChart3Params(req);
  var successFunc = function (data) {
    res.send({
      "status": "success",
      "data": data
    });
  };
  var failFunc = function(reason){
    return next(reason);
  };
  if(req.query.groupType == 'company'){
    ChartsService.chart3CompanyA(params, req.user._id, 'data').then(successFunc, failFunc);
  }else if(req.query.groupType == 'driver'){
    ChartsService.chart3DriverA(params, req.user._id, 'data').then(successFunc, failFunc);
  }else{
    ChartsService.chart3DriverB(params, req.user._id, 'data').then(successFunc, failFunc);
  }
};