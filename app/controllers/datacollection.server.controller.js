/**
 * Created by Wayne on 15/4/30.
 */
'use strict';

var async = require('async'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  logDb = require('../../libraries/mongoose').logDb,
  User = appDb.model('User'),
  UserError = require('../errors/user'),
  Company = appDb.model('Company'),
  CompanyError = require('../errors/company'),
  Driver = appDb.model('Driver'),
  OrderDetail = appDb.model('OrderDetail'),
  Order = appDb.model('Order'),
  Log = logDb.model('Log');

var getTodayStartTime = function (date) {
  var todayStart = date ? date : new Date();
  todayStart.setHours(0);
  todayStart.setMinutes(0);
  todayStart.setSeconds(0);

  return todayStart;
};

exports.Registers = function (req, res, next) {
  var timeRange = req.query || {},
    startDate = new Date(timeRange.startDate || new Date()),
    endDate = new Date(timeRange.endDate || new Date());
  endDate = new Date(endDate.setDate(endDate.getDate() + 1));
  startDate = getTodayStartTime(startDate);
  endDate = getTodayStartTime(endDate);
  async.auto({
      users: function (callback) {
        User.find({
          create_time: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).select('username nickname create_time company phone').populate({path: 'company', select: 'name'})
          .sort({create_time: 'asc'}).exec(function (err, users) {
            if (err) {
              console.log(err);
              return callback(err);
            }
            return callback(null, users);
          });
      },
      allUserCount: function (callback) {
        User.count({}).exec(function (err, count) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          return callback(null, count);
        });
      },
      drivers: function (callback) {
        Driver.find({
          create_time: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).select('username nickname create_time')
          .sort({create_time: 'asc'}).exec(function (err, drivers) {
            if (err) {
              console.log(err);
              return callback(err);
            }
            return callback(null, drivers);
          });
      },
      allDriverCount: function (callback) {
        Driver.count({}).exec(function (err, count) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          return callback(null, count);
        });
      },
      companys: function (callback) {
        Company.find({
          create_time: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).sort({create_time: 'asc'}).exec(function (err, companys) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          async.each(companys, function (company, eachCallback) {
            if (!company) {
              return eachCallback('company is null');
            }
            //查找公司的订单数量
            Order.count({create_company: company}, function (err, count) {
              if (err) {
                return eachCallback(err);
              }
              company._doc.count = count;

              //根据公司的创建者去找联系方式
              if (company.creator) {
                User.findOne({_id: company.creator}, function (err, creatorEntity) {
                  if (err) {
                    return eachCallback(UserError.internal_system_error);
                  }
                  if (!creatorEntity) {
                    company._doc.phone = '';
                  }
                  else {
                    company._doc.phone = creatorEntity.phone;
                  }

                  return eachCallback();
                });
              }
              else { //根据公司的创建时间最早的员工去找联系方式
                User.findOne({company: company._id}).sort({create_time: 'asc'}).exec(function (err, firstUserEntity) {
                  if (err) {
                    return eachCallback(UserError.internal_system_error);
                  }
                  if (!firstUserEntity) {
                    company._doc.phone = '';
                  }
                  else {
                    company._doc.phone = firstUserEntity.phone;
                  }

                  return eachCallback();
                });
              }
            });
          }, function (err) {
            if (err) {
              return callback(err);
            }
            return callback(null, companys);
          });
        });
      },
      allCompanyCount: function (callback) {
        Company.count({}).exec(function (err, count) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          return callback(null, count);
        });
      }
    },
    function (err, result) {
      var rel = {
        allUserCount: result.allUserCount,
        searchUsers: result.users,
        allDriverCount: result.allDriverCount,
        searchDrivers: result.drivers,
        allCompanyCount: result.allCompanyCount,
        searchCompanys: result.companys
      };
      res.send(rel);
    });
};

exports.companyOrdersCount = function (req, res, next) {
  var timeRange = req.query || {},
    startDate = new Date(timeRange.startDate || new Date()),
    endDate = new Date(timeRange.endDate || new Date());
  endDate = new Date(endDate.setDate(endDate.getDate() + 1));
  startDate = getTodayStartTime(startDate);
  endDate = getTodayStartTime(endDate);

  var queryCount = 0;
  var allCount = 0;
  async.auto({
    allCompanys: function (callback) {
      Company.find({}, function (err, companys) {
        if (err || !companys) {
          return callback('find compnay error');
        }
        return callback(null, companys);
      });
    },
    queryCount: ['allCompanys', function (callback, result) {
      var companys = result.allCompanys;
      async.each(companys, function (company, eachCallback) {
        Order.find(
          {
            $and: [{create_company: company},
              {execute_company: {$exists: true}}, {execute_company: company}, {
              create_time: {
                $gte: startDate,
                $lte: endDate
              }
            }]
          }, function (err, findCompanyOrders) {
            if (err) {
              return eachCallback();
            }
            if (!findCompanyOrders) {
              company._doc.count = 0;
              company._doc.finishOrderCount = 0;
              return eachCallback();
            }

            queryCount += findCompanyOrders.length;
            company._doc.count = findCompanyOrders.length;

            var eachCompanyFinishOrderCount = 0;
            async.each(findCompanyOrders, function (eachOrderItem, asyncCallback) {
              if (eachOrderItem.status === 'completed') {
                eachCompanyFinishOrderCount += 1;
              }

              return asyncCallback();
            }, function (err) {
              if (err) {
                console.log(err);
              }

              company._doc.finishOrderCount = eachCompanyFinishOrderCount;
              return eachCallback();
            });

          });
      }, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, companys);
      });
    }],
    allCount: function (callback) {
      OrderDetail.count({}, function (err, count) {
        if (err) {
          return callback(count);
        }
        allCount = count;
        return callback();
      });
    }
  }, function (err, result) {
    res.send({
      allCount: allCount,
      searchCount: queryCount,
      companys: result.queryCount
    });
  });
};

exports.companyOrders = function (req, res, next) {
  var companyName = req.query.companyName || '';
  var timeRange = JSON.parse(req.query.timeRange || '{}'),
    startDate = new Date(timeRange.startDate || new Date()),
    endDate = new Date(timeRange.endDate || new Date());
  endDate = new Date(endDate.setDate(endDate.getDate() + 1));
  startDate = getTodayStartTime(startDate);
  endDate = getTodayStartTime(endDate);

  async.auto({
    findCompany: function (callback) {
      Company.findOne({name: companyName}, function (err, company) {
        if (err) {
          return callback([]);
        }
        if (!company) {
          return callback([]);
        }
        return callback(null, company);
      });
    },
    findOrders: ['findCompany', function (callback, result) {
      var company = result.findCompany;
      Order.find({
        $and: [{create_company: company},
          {execute_company: {$exists: true}}, {execute_company: company}, {
            create_time: {
              $gte: startDate,
              $lte: endDate
            }
          }]
      }).populate('order_detail')
        .exec(function (err, orders) {
          if (err || !orders) {
            return callback([]);
          }
          return callback(null, orders);
        });
    }]
  }, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result.findOrders);
  });
};

exports.Visits = function (req, res, next) {
  var username = req.body.username || '';
  var pageIndex = req.body.pageIndex || 1;
  var itemsPerPage = req.body.itemsPerPage || 20;
  var timeRange = req.body.timeRange || {startDate: '', endDate: ''};

  if (!timeRange.endDate)
    timeRange.endDate = new Date();
  else
    timeRange.endDate = new Date(timeRange.endDate);

  if (!timeRange.startDate) {
    var preDate = new Date();
    preDate.setHours(0);
    preDate.setMinutes(0);
    preDate.setSeconds(0);
    timeRange.startDate = preDate;
  }
  else
    timeRange.startDate = new Date(timeRange.startDate);

  pageIndex = parseInt(pageIndex);
  itemsPerPage = parseInt(itemsPerPage);

  if (!username) {
    res.send({
      err: 'username required'
    });
  }

  async.auto({
      userLogs: function (callback) {
        var startDate = timeRange.startDate;
        var endDate = timeRange.endDate;
        Log.find({
          'username': {$regex: username, $options: '$i'},
          'time': {$gte: timeRange.startDate, $lte: timeRange.endDate}
        }) //, 'meta.time': {$gte: timeRange.startDate, $lte: timeRange.endDate}
          .sort({time: -1}).skip((pageIndex - 1) * itemsPerPage).limit(itemsPerPage)
          .exec(function (err, docs) {
            if (err) {
              console.log(err);
              return callback(err);
            }
            return callback(null, docs);
          });
      },
      allCount: function (callback) {
        Log.find({
          'username': {$regex: username, $options: '$i'},
          'time': {$gte: timeRange.startDate, $lte: timeRange.endDate}
        })
          .count({}).exec(function (err, count) {
            if (err) {
              console.log(err);
              return callback(err);
            }
            return callback(null, count);
          });
      }
    }, function (err, result) {
      if (err) {
        console.log(err);
        res.send({err: err});
      }

      res.send({
        logs: result.userLogs,
        count: result.allCount
      });
    }
  );
};