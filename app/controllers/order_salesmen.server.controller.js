/**
 * Created by ZhangXuedong on 2016/10/18.
 */
var orderError = require('../errors/order'),
  OrderSalesmenService = require('../../libraries/services/order_salesmen'),
  userService = require('../services/user'),
  Promise = require('promise'),
  fs = require('fs');

function createFilter(search, currentUser){
  if(!search){
    return Promise.resolve({filter : {}});
  }
  return new Promise(function(fulfill, reject){
    var ands = [];
    var create_time_start = search.create_time_start;
    if (create_time_start) {
      ands.push({
        created: {
          $gte: create_time_start
        }
      });
    }
    var create_time_end = search.create_time_end;
    if (create_time_end) {
      ands.push({
        created: {
          $lt: new Date(new Date(create_time_end).getTime() + 86400000) // 时间最小单位是天，所以小于（结束时间+1天）
        }
      });
    }
    var sender_name = search.sender_name;
    if(sender_name){
      ands.push({
        sender_name : new RegExp(sender_name)
      });
    }
    var filter = {};
    if (ands.length > 0) {
      filter.$and = ands;
    }

    userService.getGroups(currentUser._id, function (err, userGroupEntities) {
      if (err) {
        return res.send(err);
      }
      else if (!userGroupEntities || userGroupEntities.length <= 0) {
        return res.send({err: orderError.group_id_null});
      }
      else {
        var groupIds = [];
        userGroupEntities.forEach(function (userGroupEntity) {
          groupIds.push(userGroupEntity.group._id);
        });
        ands.push({execute_group: {$in: groupIds}});
        console.log(JSON.stringify(filter));
        return fulfill({filter : filter});
      }
    });
  });
}

exports.chart4Download = function (req, res, next) {

  createFilter(req.query, req.user).then(function(result){
    OrderSalesmenService.downloadSalesmen(result.filter, result.companies).then(function (result) {
        var options = {
          root: result.root
        };
        var mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        var filePath = result.filePath;
        var filename = result.filename;
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);
        res.sendFile(filePath, options, function (err) {
          fs.unlink(filePath);
          if (err) {
            next(err);
          }
        });
      },
      function (err) {
        console.log(err);
        return next(err);
      });
  }, function(err){
    console.log(err);
    res.send({
      status : 'fail',
      fail : {
        message : err
      }
    });
  });
};

exports.chart4Data = function (req, res, next) {
  createFilter(req.body.search, req.user).then(function(result){
    var pagination;
    if (req.body) {
      pagination = req.body.pagination;
    }
    if (!pagination) {
      pagination = {
        'currentPage': 1,
        'limit': 10
      };
    }
    if(!pagination.currentPage){
      pagination.currentPage = 1;
    }
    if(!pagination.limit){
      pagination.limit = 10;
    }

    OrderSalesmenService.getTableData(result.filter, pagination, result.companies).then(function (result) {
        res.send({
          'status': 'success',
          'data': result.data,
          'pagination': result.pagination
        });
      },
      function (err) {
        console.log(err);
        return next(err);
      });
  },function(err){
    console.log(err);
    res.send({
      status : 'fail',
      fail : {
        message : err
      }
    });
  });
};