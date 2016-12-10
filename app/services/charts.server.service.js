/**
 * Created by ZhangXuedong on 2016/8/25.
 */
var Promise = require('promise'),
  Excel = require('exceljs'),
  dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment'),
  mongoose = require('mongoose');

var appDb = require('../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  Company = appDb.model('Company'),
  Driver = appDb.model('Driver'),
  DriverEvaluation = appDb.model('DriverEvaluation'),
  UserService = require('../services/user');

exports.exportChart1 = function (filter) {
  return new Promise(function (fulfill, reject) {

    var stream = Order.find(filter).select({
      'order_details.order_number': 1,
      sender_name: 1,
      receiver_name: 1,
      execute_company: 1,
      created: 1,
      assign_time: 1,
      pickup_end_time: 1,
      pickup_sign_time: 1,
      pickup_time: 1,
      pickup_missing_packages: 1,
      delivery_end_time: 1,
      delivery_sign_time: 1,
      delivery_time: 1,
      delivery_missing_packages: 1,
      damaged: 1
    }).sort({_id: -1})
    .batchSize(10000).lean().stream();

    var filePath = new Date().getTime() + '.xlsx';
    var workbook = new Excel.stream.xlsx.WorkbookWriter({
      filename: filePath
    });
    workbook.creator = '柱柱签收';
    workbook.lastModifiedBy = '柱柱签收';
    var now = new Date();
    workbook.created = now;
    workbook.modified = now;

    var worksheet = workbook.addWorksheet('sheet1');

    writeChart1Sheet(stream, worksheet).then(function () {
      worksheet.commit();
      workbook.commit()
      .then(function () {
        fulfill({root: '.', filePath: filePath, filename: filePath});
      });
    }).catch(reject);
  });
};

function duration(from, to) {
  var ms = moment(to).diff(moment(from));
  var d = moment.duration(ms);
  if (d.asHours() < 0) {
    return null;
  } else {
    if (d.asHours() >= 1) {
      return d.asHours().toFixed() + '小时';
    } else {
      var minute = d.asMinutes().toFixed();
      if (minute < 1) {
        minute = 1;
      }
      return minute + '分钟';
    }
  }
}

function writeChart1Sheet(stream, worksheet) {
  return new Promise(function (fulfill, reject) {
    worksheet.columns =  [
      {header: '运单号', key: '运单号', width: 20},
      {header: '发货方', key: '发货方', width: 20},
      {header: '收货方', key: '收货方', width: 20},
      {header: '创建时间', key: '创建时间', width: 20},
      {header: '分配时间', key: '分配时间', width: 15},
      {header: '计划提货时间', key: '计划提货时间', width: 15},
      {header: '提货进场时间', key: '提货进场时间', width: 15},
      {header: '实际提货时间', key: '实际提货时间', width: 15},
      {header: '提货延时', key: '提货延时', width: 15},
      {header: '提货货缺', key: '提货货缺', width: 10},
      {header: '计划收货时间', key: '计划收货时间', width: 15},
      {header: '收货进场时间', key: '收货进场时间', width: 15},
      {header: '实际收货时间', key: '实际收货时间', width: 15},
      {header: '收货延时', key: '收货延时', width: 15},
      {header: '收货货缺', key: '收货货缺', width: 10},
      {header: '货损', key: '货损', width: 10}
    ];

    var orders = [];
    var count = 0;
    var processOrders = function () {
      orders.forEach(function (order) {
        var row = {
          '运单号' : order.order_details.order_number,
          '发货方' : order.sender_name,
          '收货方' : order.receiver_name,
          '创建时间' : order.created ? moment(order.created).add(timezone, 'h').toDate() : null,
          '分配时间' : order.assign_time ? moment(order.assign_time).add(timezone, 'h').toDate() : null,
          '计划提货时间' : order.pickup_end_time ? moment(order.pickup_end_time).add(timezone, 'h').toDate() : null,
          '提货进场时间' : order.pickup_sign_time ? moment(order.pickup_sign_time).add(timezone, 'h').toDate() : null,
          '实际提货时间' : order.pickup_time ? moment(order.pickup_time).add(timezone, 'h').toDate() : null,
          '计划收货时间' : order.delivery_end_time ? moment(order.delivery_end_time).add(timezone, 'h').toDate() : null,
          '收货进场时间' : order.delivery_sign_time ? moment(order.delivery_sign_time).add(timezone, 'h').toDate() : null,
          '实际收货时间' : order.delivery_time ? moment(order.delivery_time).add(timezone, 'h').toDate() : null
        };
        if (order.pickup_time && order.pickup_end_time) {
          if (order.pickup_time.getTime() < order.pickup_end_time.getTime()) {
            row['提货延时'] = '';
          } else {
            row['提货延时'] = duration(order.pickup_end_time, order.pickup_time);
          }
        } else {
          row['提货延时'] = '-';
        }
        if (order.delivery_end_time && order.delivery_time) {
          if (order.delivery_end_time.getTime() < order.delivery_time.getTime()) {
            row['收货延时'] = '';
          } else {
            row['收货延时'] = duration(order.delivery_end_time, order.delivery_time);
          }
        } else {
          row['收货延时'] = '-';
        }

        if (order.hasOwnProperty('pickup_missing_packages')) {
          row['提货货缺'] = order.pickup_missing_packages ? '有' : '无';
        } else {
          row['提货货缺'] = '-';
        }
        if (order.hasOwnProperty('delivery_missing_packages')) {
          row['收货货缺'] = order.delivery_missing_packages ? '有' : '无';
        } else {
          row['收货货缺'] = '-';
        }
        if (order.hasOwnProperty('damaged')) {
          row['货损'] = order.damaged ? '有' : '无';
        } else {
          row['货损'] = '-';
        }

        worksheet.addRow(row).commit();
      });
    };
    stream.on('data', function (order) {
      count++;
      orders.push(order);

      if (count == 10000) {
        stream.pause();
        processOrders();
        count = 0;
        orders = [];
        stream.resume();
      }
    });
    stream.on('close', function () {
      if (orders.length > 0) {
        processOrders();
        fulfill();
      } else {
        fulfill();
      }
    });
  });
}

// Define an extend function that copies the properties of its second and
// subsequent arguments onto its first argument.
// We work around an IE bug here: in many versions of IE, the for/in loop
// won't enumerate an enumerable property of o if the prototype of o has
// a nonenumerable property by the same name. This means that properties
// like toString are not handled correctly unless we explicitly check for them.
var extend = (function () {  // Assign the return value of this function
  // First check for the presence of the bug before patching it.
  for (var p in {toString: null}) {
    // If we get here, then the for/in loop works correctly and we return
    // a simple version of the extend() function
    return function extend(o) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var prop in source) o[prop] = source[prop];
      }
      return o;
    };
  }
  // If we get here, it means that the for/in loop did not enumerate
  // the toString property of the test object. So return a version
  // of the extend() function that explicitly tests for the nonenumerable
  // properties of Object.prototype.
  return function patched_extend(o) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      // Copy all the enumerable properties
      for (var prop in source) o[prop] = source[prop];
      // And now check the special-case properties
      for (var j = 0; j < protoprops.length; j++) {
        prop = protoprops[j];
        if (source.hasOwnProperty(prop)) o[prop] = source[prop];
      }
    }
    return o;
  };
  // This is the list of special-case properties we check for
  var protoprops = ["toString", "valueOf", "constructor", "hasOwnProperty",
    "isPrototypeOf", "propertyIsEnumerable", "toLocaleString"];
}());

exports.getChart1Data = function (groupType, filter) {

  var pickup_filter = {pickup_end_time: {$exists: true}, pickup_time: {$exists: true}};
  extend(pickup_filter, filter);

  var delivery_filter = {delivery_end_time: {$exists: true}, delivery_time: {$exists: true}};
  extend(delivery_filter, filter);

  return new Promise(function (fulfill, reject) {
    var pickupGroupId = {
      year: {$year: "$pickup_time"},
      month: {$month: "$pickup_time"}
    };
    var deliveryGroupId = {
      year: {$year: "$delivery_time"},
      month: {$month: "$delivery_time"}
    };
    if (groupType == 'day') {
      pickupGroupId = {
        year: {$year: "$pickup_time"},
        month: {$month: "$pickup_time"},
        day: {$dayOfMonth: "$pickup_time"}
      };
      deliveryGroupId = {
        year: {$year: "$delivery_time"},
        month: {$month: "$delivery_time"},
        day: {$dayOfMonth: "$delivery_time"}
      };
    }

    var promises = [
      new Promise(function (fulfill, reject) {
        Order.aggregate([
          {
            $match: pickup_filter
          },
          {
            $group: {
              _id: pickupGroupId,
              total: {
                $sum: 1
              },
              count: {
                $sum: {
                  $cond: [{$gt: ["$pickup_time", "$pickup_end_time"]}, 1, 0]
                  // $cond: ["$pickup_deferred", 1, 0]
                }
              }
            }
          },
          {
            $sort: {_id: 1}
          }
        ]).exec(function (err, data) {
          if (err) {
            return reject(err);
          } else {
            fulfill(data);
          }
        });
      }),
      new Promise(function (fulfill, reject) {
        Order.aggregate([
          {
            $match: delivery_filter
          },
          {
            $group: {
              _id: deliveryGroupId,
              total: {
                $sum: 1
              },
              count: {
                $sum: {
                  $cond: [{$gt: ["$delivery_time", "$delivery_end_time"]}, 1, 0]
                  // $cond : [{$not : "$delivery_deferred"}, 1, 0]
                }
              }
            }
          },
          {
            $sort: {_id: 1}
          }
        ]).exec(function (err, data) {
          if (err) {
            return reject(err);
          } else {
            fulfill(data);
          }
        });
      })
    ];
    Promise.all(promises).then(function (data) {
      var pickup = data[0], delivery = data[1];
      var xAxis = [];
      var ms = [];
      var ns = [];
      var getPercent = function (a) {
        if (a.total == 0) {
          return '-';
        } else {
          return (a.count  * 100 / a.total).toFixed(1);
        }
      };

      var f = getFuncByGroupType(groupType);
      var step = f.step, compare = f.compare, getX = f.getX;

      var minMax = getMinMax(compare, pickup, delivery);
      var min = minMax.min, max = minMax.max;

      if(min && max){
        var s = {year : min.year, month : min.month, day : min.day};
        for(var m = 0, mlen = pickup.length, n = 0, nlen = delivery.length; compare(s, max) <= 0; step(s)){
          var mmatch = false, nmatch = false;

          if (m < mlen) {
            if ( compare(pickup[m]._id, s) == 0) {
              mmatch = true;
            }
          }
          if (n < nlen) {
            if ( compare(delivery[n]._id, s) == 0) {
              nmatch = true;
            }
          }

          if (mmatch && nmatch) {
            ms.push(getPercent(pickup[m]));
            m++;

            ns.push(getPercent(delivery[n]));
            n++;

            xAxis.push(getX(s));
          } else if (mmatch) {
            ms.push(getPercent(pickup[m]));
            m++;

            ns.push('-');

            xAxis.push(getX(s));
          } else if (nmatch) {
            ms.push('-');

            ns.push(getPercent(delivery[n]));
            n++;

            xAxis.push(getX(s));
          }
        }
      }

      fulfill({
        xAxis: xAxis,
        series: [ms, ns]
      });
    }).catch(function (err) {
      reject(err)
    });
  });
};

// 日期的比较和遍历以及x轴值的函数
function getFuncByGroupType(groupType){
  var step, compare, getX;
  if (groupType == 'day') {
    step = function (a) {
      a.day = a.day + 1;
      if (a.day > 31) {
        a.month = a.month + 1;
        a.day = 1;
      }
      if (a.month > 12) {
        a.year = a.year + 1;
        a.month = 1;
      }
    };
    compare = function (a, b) {
      if (a.year == b.year) {
        if (a.month == b.month) {
          return a.day - b.day;
        } else {
          return a.month - b.month;
        }
      } else {
        return a.year - b.year;
      }
    };
    getX = function(a){
      return a.month + '/' + a.day;
    };
  } else {
    step = function (a) {
      a.month = a.month + 1;
      if (a.month > 12) {
        a.year = a.year + 1;
        a.month = 1;
      }
    };
    compare = function (a, b) {
      if (a.year == b.year) {
        return a.month - b.month;
      } else {
        return a.year - b.year;
      }
    };
    getX = function(a){
      return a.year%2000 + '/' + a.month;
    };
  }
  return {
    step : step,
    compare : compare,
    getX : getX
  };
}

// 找出两个升序排序的数组中的最大值和最小值
function getMinMax(compare, a, b){
  var min, max;
  if (a.length == 1) {
    min = a[0]._id;
    max = a[0]._id;
  } else if (a.length > 1) {
    min = a[0]._id;
    max = a[a.length - 1]._id;
  }
  if (b.length > 0) {
    if (min) {
      if (compare(b[0]._id, min) < 0) {
        min = b[0]._id;
      }
      if (compare(b[b.length - 1], max) > 0) {
        max = b[b.length - 1];
      }
    } else {
      min = b[0];
      max = b[b.length - 1];
    }
  }
  return {min : min, max : max};
}

exports.exportChart2 = function (filter) {
  return new Promise(function (fulfill, reject) {

    var stream = Order.find(filter).select({
      'order_details.order_number': 1,
      sender_name: 1,
      receiver_name: 1,
      execute_company: 1,
      created: 1,
      assign_time: 1,
      pickup_end_time: 1,
      pickup_sign_time: 1,
      pickup_time: 1,
      pickup_missing_packages: 1,
      delivery_end_time: 1,
      delivery_sign_time: 1,
      delivery_time: 1,
      delivery_missing_packages: 1,
      damaged: 1
    }).sort({_id: -1})
    .batchSize(10000).lean().stream();

    var filePath = new Date().getTime() + '.xlsx';
    var workbook = new Excel.stream.xlsx.WorkbookWriter({
      filename: filePath
    });
    workbook.creator = '柱柱签收';
    workbook.lastModifiedBy = '柱柱签收';
    var now = new Date();
    workbook.created = now;
    workbook.modified = now;

    var worksheet = workbook.addWorksheet('sheet1');

    writeChart2Sheet(stream, worksheet).then(function () {
      worksheet.commit();
      workbook.commit()
      .then(function () {
        fulfill({root: '.', filePath: filePath, filename: filePath});
      });
    }).catch(reject);
  });
};

function writeChart2Sheet(stream, worksheet) {
  return new Promise(function (fulfill, reject) {
    worksheet.columns =  [
      {header: '运单号', key: '运单号', width: 20},
      {header: '发货方', key: '发货方', width: 20},
      {header: '收货方', key: '收货方', width: 20},
      {header: '创建时间', key: '创建时间', width: 20},
      {header: '分配时间', key: '分配时间', width: 15},
      {header: '计划提货时间', key: '计划提货时间', width: 15},
      {header: '提货进场时间', key: '提货进场时间', width: 15},
      {header: '实际提货时间', key: '实际提货时间', width: 15},
      {header: '提货货缺货损', key: '提货货缺货损', width: 10},
      {header: '计划收货时间', key: '计划收货时间', width: 15},
      {header: '收货进场时间', key: '收货进场时间', width: 15},
      {header: '实际收货时间', key: '实际收货时间', width: 15},
      {header: '收货货缺货损', key: '收货货缺货损', width: 10}
    ];

    var orders = [];
    var count = 0;

    var processOrders = function () {
      orders.forEach(function (order) {
        var row = {
          '运单号' : order.order_details.order_number,
          '发货方' : order.sender_name,
          '收货方' : order.receiver_name,
          '创建时间' : order.created ? moment(order.created).add(timezone, 'h').toDate() : null,
          '分配时间' : order.assign_time ? moment(order.assign_time).add(timezone, 'h').toDate() : null,
          '计划提货时间' : order.pickup_end_time ? moment(order.pickup_end_time).add(timezone, 'h').toDate() : null,
          '提货进场时间' : order.pickup_sign_time ? moment(order.pickup_sign_time).add(timezone, 'h').toDate() : null,
          '实际提货时间' : order.pickup_time ? moment(order.pickup_time).add(timezone, 'h').toDate() : null,
          '计划收货时间' : order.delivery_end_time ? moment(order.delivery_end_time).add(timezone, 'h').toDate() : null,
          '收货进场时间' : order.delivery_sign_time ? moment(order.delivery_sign_time).add(timezone, 'h').toDate() : null,
          '实际收货时间' : order.delivery_time ? moment(order.delivery_time).add(timezone, 'h').toDate() : null
        };
        if (order.damaged) {
          row['提货货缺货损'] = '有';
          row['收货货缺货损'] = '有';
        } else {
          if (order.pickup_missing_packages) {
            row['提货货缺货损'] = '有';
          } else {
            row['提货货缺货损'] = '无';
          }

          if (order.delivery_missing_packages) {
            row['收货货缺货损'] = '有';
          } else {
            row['收货货缺货损'] = '无';
          }
        }

        worksheet.addRow(row).commit();
      });
    };
    stream.on('data', function (order) {
      count++;
      orders.push(order);

      if (count == 10000) {
        stream.pause();
        processOrders();
        count = 0;
        orders = [];
        stream.resume();
      }
    });
    stream.on('close', function () {
      if (orders.length > 0) {
        processOrders();
        fulfill();
      } else {
        fulfill();
      }
    });
  });
};

exports.getChart2Data = function(groupType, filter){
  var pickup_filter = {pickup_time: {$exists: true}};
  extend(pickup_filter, filter);

  var delivery_filter = {delivery_time: {$exists: true}};
  extend(delivery_filter, filter);

  return new Promise(function (fulfill, reject) {
    var pickupGroupId = {
      year: {$year: "$pickup_time"},
      month: {$month: "$pickup_time"}
    };
    var deliveryGroupId = {
      year: {$year: "$delivery_time"},
      month: {$month: "$delivery_time"}
    };
    if (groupType == 'day') {
      pickupGroupId = {
        year: {$year: "$pickup_time"},
        month: {$month: "$pickup_time"},
        day: {$dayOfMonth: "$pickup_time"}
      };
      deliveryGroupId = {
        year: {$year: "$delivery_time"},
        month: {$month: "$delivery_time"},
        day: {$dayOfMonth: "$delivery_time"}
      };
    }

    var promises = [
      new Promise(function (fulfill, reject) {
        Order.aggregate([
          {
            $match: pickup_filter
          },
          {
            $group: {
              _id: pickupGroupId,
              total: {
                $sum: 1
              },
              count: {
                $sum: {
                  $cond : [{ $or : [ "$damaged", "$pickup_missing_packages" ] }, 1, 0 ]
                }
              }
            }
          },
          {
            $sort: {_id: 1}
          }
        ]).exec(function (err, data) {
          if (err) {
            return reject(err);
          } else {
            fulfill(data);
          }
        });
      }),
      new Promise(function (fulfill, reject) {
        Order.aggregate([
          {
            $match: delivery_filter
          },
          {
            $group: {
              _id: deliveryGroupId,
              total: {
                $sum: 1
              },
              count: {
                $sum: {
                  $cond : [{ $or : [ "$damaged", "$delivery_missing_packages" ] }, 1, 0 ]
                }
              }
            }
          },
          {
            $sort: {_id: 1}
          }
        ]).exec(function (err, data) {
          if (err) {
            return reject(err);
          } else {
            fulfill(data);
          }
        });
      })
    ];
    Promise.all(promises).then(function (data) {
      var pickup = data[0], delivery = data[1];
      var xAxis = [];
      var ms = [];
      var ns = [];
      var getPercent = function (a) {
        if (a.total == 0) {
          return '-';
        } else {
          return (a.count  * 100 / a.total).toFixed(1);
        }
      };

      var f = getFuncByGroupType(groupType);
      var step = f.step, compare = f.compare, getX = f.getX;

      var minMax = getMinMax(compare, pickup, delivery);
      var min = minMax.min, max = minMax.max;

      if(min && max){
        var s = {year : min.year, month : min.month, day : min.day};
        for(var m = 0, mlen = pickup.length, n = 0, nlen = delivery.length; compare(s, max) <= 0; step(s)){
          var mmatch = false, nmatch = false;

          if (m < mlen) {
            if ( compare(pickup[m]._id, s) == 0) {
              mmatch = true;
            }
          }
          if (n < nlen) {
            if ( compare(delivery[n]._id, s) == 0) {
              nmatch = true;
            }
          }

          if (mmatch && nmatch) {
            ms.push(getPercent(pickup[m]));
            m++;

            ns.push(getPercent(delivery[n]));
            n++;

            xAxis.push(getX(s));
          } else if (mmatch) {
            ms.push(getPercent(pickup[m]));
            m++;

            ns.push('-');

            xAxis.push(getX(s));
          } else if (nmatch) {
            ms.push('-');

            ns.push(getPercent(delivery[n]));
            n++;

            xAxis.push(getX(s));
          }
        }
      }

      fulfill({
        xAxis: xAxis,
        series: [ms, ns]
      });
    }).catch(function (err) {
      reject(err)
    });
  });
};

function downloadDriver(filter, sheetname){
  return new Promise(function(fulfill, reject){
    getChart3DriverEvaluations(filter).then(function(results){
      var docs = results.evaluations, drivers = results.drivers;
      var filePath = new Date().getTime() + '.xlsx';
      var workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: filePath
      });
      workbook.creator = '柱柱签收';
      workbook.lastModifiedBy = '柱柱签收';
      var now = new Date();
      workbook.created = now;
      workbook.modified = now;

      if(!sheetname){
        sheetname = 'sheet1';
      }
      var worksheet = workbook.addWorksheet(sheetname);
      worksheet.columns =  [
        {header: '司机', key: '司机', width: 20},
        {header: '好评合计', key: '好评合计', width: 15},
        {header: '中评合计', key: '中评合计', width: 15},
        {header: '差评合计', key: '差评合计', width: 15},
        {header: '满意度', key: '满意度', width: 15}
      ];

      var compareId = function(a, b){
        var aid = a._id.toString(), bid = b._id.toString();
        if(aid == bid){
          return 0;
        }else if(aid > bid){
          return 1;
        }else {
          return -1;
        }
      };
      docs.forEach(function(doc){
        var row = {
          '好评合计' : doc.good,
          '中评合计' : doc.average,
          '差评合计' : doc.bad,
          '满意度' : ((doc.good + doc.average)*100/doc.total).toFixed(1) + '%'
        };
        var idx = binarySearch(drivers, doc, compareId);
        if(idx>=0){
          row['司机'] = drivers[idx].username;
        }else{
          row['司机'] = doc._id;
        }
        worksheet.addRow(row).commit();
      });
      worksheet.addRow({}).commit();
      worksheet.addRow({'司机' : "备注：满意度比率=(好评次数+中评次数)/总评价次数"}).commit();
      worksheet.commit();
      workbook.commit()
      .then(function () {
        return fulfill({root: '.', filePath: filePath, filename: filePath});
      });
    }, function(err){
      return reject(err);
    });
  });
}

function downloadCompany(filter, sheetname){
  return new Promise(function(fulfill, reject){
    getChart3CompanyEvaluations(filter).then(function(results){
      var filePath = new Date().getTime() + '.xlsx';
      var workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: filePath
      });
      workbook.creator = '柱柱签收';
      workbook.lastModifiedBy = '柱柱签收';
      var now = new Date();
      workbook.created = now;
      workbook.modified = now;

      if(!sheetname){
        sheetname = 'sheet1';
      }
      var worksheet = workbook.addWorksheet(sheetname);
      worksheet.columns =  [
        {header: '承运商', key: '承运商', width: 20},
        {header: '好评合计', key: '好评合计', width: 15},
        {header: '中评合计', key: '中评合计', width: 15},
        {header: '差评合计', key: '差评合计', width: 15},
        {header: '满意度', key: '满意度', width: 15}
      ];
      var compareId = function(a, b){
        var aid = a._id.toString(), bid = b._id.toString();
        if(aid == bid){
          return 0;
        }else if(aid > bid){
          return 1;
        }else {
          return -1;
        }
      };
      var companies = results.companies, evaluations = results.evaluations;
      if(evaluations.length > 0){
        evaluations.forEach(function(doc){
          var row = {
            '好评合计' : doc.good,
            '中评合计' : doc.average,
            '差评合计' : doc.bad,
            '满意度' : ((doc.good + doc.average)*100/doc.total).toFixed(1) + '%'
          };
          var idx = binarySearch(companies, doc, compareId);
          if(idx>=0){
            row['司机'] = companies[idx].name;
          }else{
            row['司机'] = doc._id;
          }
          worksheet.addRow(row).commit();
        });
        worksheet.addRow({'承运商' : "备注：满意度比率=(好评次数+中评次数)/总评价次数"}).commit();
      }else{
        worksheet.addRow({'承运商' : "暂无数据"}).commit();
      }

      worksheet.commit();
      workbook.commit()
      .then(function () {
        return fulfill({root: '.', filePath: filePath, filename: filePath});
      }, function(err){
        return reject(err);
      });
    },function(err){
      return reject(err);
    });
  });
}

exports.exportChart3 = function(groupType, filter, sheetname){
  if(groupType == 'driver'){
    return downloadDriver(filter, sheetname);
  }else if(groupType == 'company'){
    return downloadCompany(filter, sheetname);
  }
};

function getChart3CompanyEvaluations(filter){
  return new Promise(function(fulfill, reject){
    DriverEvaluation.aggregate([
      {$match : filter},
      {$project : {_id : 0, 'order.execute_company' : 1, level : 1}},
      {$group : {
        _id : "$order.execute_company",
        total : {$sum : 1},
        good : {$sum : {
          $cond : [{$eq : ["$level", 1]}, 1, 0]
        }},
        average : {$sum: {
          $cond : [{$eq: ["$level", 2]}, 1, 0]
        }},
        bad: {$sum: {
          $cond : [{$eq: ["$level", 3]}, 1, 0]
        }}
      }}
    ]).exec(function(err, evaluations){
      if(err){
        return reject(err);
      }else{
        var ids = evaluations.map(function(doc){
          return doc._id;
        });
        Company.find({_id : {$in : ids}}, {name : 1}).sort({_id : 1}).exec(function(err, companies){
          if(err){
            return reject(err);
          }else{
            return fulfill({companies : companies, evaluations : evaluations});
          }
        });
      }
    });
  });
}

function getChart3DriverEvaluations(filter){
  return new Promise(function(fulfill, reject){
    DriverEvaluation.aggregate([
      {$match : filter},
      {$project : {_id : 0, driver_id : 1, level : 1}},
      {$group : {
        _id : "$driver_id",
        total : {$sum : 1},
        good : {$sum : {
          $cond : [{$eq : ["$level", 1]}, 1, 0]
        }},
        average : {$sum: {
          $cond : [{$eq: ["$level", 2]}, 1, 0]
        }},
        bad: {$sum: {
          $cond : [{$eq: ["$level", 3]}, 1, 0]
        }}
      }}
    ]).exec(function(err, evaluations){
      if(err){
        return reject(err);
      }else{
        var ids = evaluations.map(function(doc){
          return doc._id;
        });
        Driver.find({_id : {$in : ids}}, {username : 1}).sort({_id : 1}).lean().exec(function(err, drivers){
          if(err){
            return reject(err);
          }else{
            return fulfill({drivers : drivers, evaluations : evaluations});
          }
        });
      }
    });
  });
}

function getChart3DriverData(filter){
  return new Promise(function(fulfill, reject){
    getChart3DriverEvaluations(filter).then(function(results){
      var docs = results.evaluations, drivers = results.drivers;

      var xAxis = [], data = [];

      var compareId = function(a, b){
        var aid = a._id.toString(), bid = b._id.toString();
        if(aid == bid){
          return 0;
        }else if(aid > bid){
          return 1;
        }else {
          return -1;
        }
      };
      docs.forEach(function(doc){
        var idx = binarySearch(drivers, doc, compareId);
        if(idx>=0){
          xAxis.push(drivers[idx].username);
        }else{
          xAxis.push(doc._id);
        }
        if(doc.total == 0){
          data.push('-');
        }else{
          data.push(((doc.good + doc.average)*100/doc.total).toFixed(1));
        }
      });
      return fulfill({
        xAxis: xAxis,
        series: [data]
      });
    },function(err){
      return reject(err);
    });
  });
}

function getChart3CompanyData(filter){
  return new Promise(function(fulfill, reject){
    getChart3CompanyEvaluations(filter).then(function(results){
      var docs = results.evaluations, companies = results.companies;

      var xAxis = [], data = [];

      var compareId = function(a, b){
        var aid = a._id.toString(), bid = b._id.toString();
        if(aid == bid){
          return 0;
        }else if(aid > bid){
          return 1;
        }else {
          return -1;
        }
      };
      docs.forEach(function(doc){
        var idx = binarySearch(companies, doc, compareId);
        if(idx>=0){
          xAxis.push(companies[idx].name);
        }else{
          xAxis.push(doc._id);
        }
        if(doc.total == 0){
          data.push('-');
        }else{
          data.push(((doc.good + doc.average)*100/doc.total).toFixed(1));
        }
      });
      return fulfill({
        xAxis: xAxis,
        series: [data]
      });
    },function(err){
      return reject(err);
    });
  });
}

exports.getChart3Data = function(groupType, filter){
  if(groupType == 'company'){
    return getChart3CompanyData(filter);
  }else if(groupType == 'driver'){
    return getChart3DriverData(filter);
  }
};

function binarySearch(items, value, compare) {

  if (items.length == 0) {
    return -1;
  }

  var startIndex = 0,
    stopIndex = items.length - 1,
    middle = Math.floor((stopIndex + startIndex) / 2);

  while (compare(items[middle], value) != 0 && startIndex < stopIndex) {

    //adjust search area
    if (compare(value, items[middle]) < 0) {
      stopIndex = middle - 1;
    } else if (compare(value, items[middle]) > 0) {
      startIndex = middle + 1;
    }

    //recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  //make sure it's the right value
  return (compare(items[middle], value) != 0) ? -1 : middle;
}

function getChart3MatchA(params, user_id){
  return new Promise(function(fulfill, reject){
    var ands = [{status : 'completed'}, {parent_order : {$exists : true}}, {execute_company : {$exists : true}}];
    if(params.assign_time){
      if (params.assign_time.start && params.assign_time.end) {
        ands.push({
          'assign_time': {
            $gte: params.assign_time.start,
            $lt: params.assign_time.end
          }
        });
      } else if (params.assign_time.start) {
        ands.push({
          'assign_time': {
            $gte: params.assign_time.start
          }
        });
      } else if (params.assign_time.end) {
        ands.push({
          'assign_time': {
            $lt: params.assign_time.end
          }
        });
      }
    }

    UserService.getGroups(user_id, function (err, userGroupEntities) {
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
          create_group: {
            $in: groupIds
          }
        });
        return fulfill({
          match : {
            $and: ands
          }
        });
      }
    });
  });
}

function getChart3DriverMatchB(params, user_id){
  return new Promise(function(fulfill, reject){
    var ands = [];
    if(params.assign_time){
      if (params.assign_time.start && params.assign_time.end) {
        ands.push({
          'order.assign_time': {
            $gte: params.assign_time.start,
            $lt: params.assign_time.end
          }
        });
      } else if (params.assign_time.start) {
        ands.push({
          'order.assign_time': {
            $gte: params.assign_time.start
          }
        });
      } else if (params.assign_time.end) {
        ands.push({
          'order.assign_time': {
            $lt: params.assign_time.end
          }
        });
      }
    }

    UserService.getGroups(user_id, function (err, userGroupEntities) {
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
          'order.create_group': {
            $in: groupIds
          }
        });
        return fulfill({
          match : {
            $and: ands
          }
        });
      }
    });
  });
}

function getChart3CompanyAData(params, user_id){
  return new Promise(function(fulfill, reject){
    getChart3MatchA(params, user_id).then(function(filter){
      Order.aggregate([
        {$match : filter.match},
        {$project: {execute_company : 1, assigned_infos : 1}},
        {$group : {
          _id : '$execute_company',
          assigned_infos : {$push : "$assigned_infos"}
        }}
      ]).exec(function(err, docs){
        if(err){
          return reject(err);
        }
        if(docs.length == 0){
          return fulfill([]);
        }
        var promises = [];
        var company_ids = [];
        docs.forEach(function(doc){
          company_ids.push(doc._id);
          var order_ids = [];
          doc.assigned_infos.forEach(function(assigned_infos){
            assigned_infos.forEach(function(assigned_info){
              if(assigned_info.order_id){
                order_ids.push(mongoose.Types.ObjectId(assigned_info.order_id));
              }
            });
          });
          promises.push(new Promise(function(fulfill, reject){
            DriverEvaluation.aggregate([
              {$match: {order_id : {$in : order_ids} } },
              {$project: {level : 1, _id : 0} },
              {$group: {
                _id : null,
                total : {$sum : 1},
                good : {$sum : {
                  $cond : [{$eq : ["$level", 1]}, 1, 0]
                }},
                average : {$sum: {
                  $cond : [{$eq: ["$level", 2]}, 1, 0]
                }},
                bad: {$sum: {
                  $cond : [{$eq: ["$level", 3]}, 1, 0]
                }}
              }}
            ]).exec(function(err, docs){
              if(err){
                return reject(err);
              }else{
                if(docs.length > 0){
                  return fulfill(docs[0]);
                }else{
                  return fulfill(null);
                }
              }
            });
          }));
        });
        promises.push(new Promise(function(fulfill, reject){
          Company.find({_id : {$in : company_ids} }, {name : 1}).exec(function(err, docs){
            if(err){
              return reject(err);
            }else{
              var companies = [];
              company_ids.forEach(function (id) {
                var found = false;
                for(var i=0, len=docs.length; i<len; i++){
                  if(docs[i]._id.toString() == id.toString()){
                    companies.push(docs[i]);
                    found = true;
                    break;
                  }
                }
                if(!found){
                  companies.push({});
                }
              });
              return fulfill(companies);
            }
          });
        }));

        Promise.all(promises).then(function(a){
          return fulfill(a);
        }, function(err){
          return reject(err);
        });
      });
    }, function(err){
      return reject(err);
    });
  });
}

// 货主角色查看承运商统计
exports.chart3CompanyA = function(params, user_id, dataType){
  return new Promise(function(fulfill, reject){
    getChart3CompanyAData(params, user_id).then(function(a){
      if(dataType == 'download'){
        var filePath = new Date().getTime() + '.xlsx';
        var workbook = new Excel.stream.xlsx.WorkbookWriter({
          filename: filePath
        });
        workbook.creator = '柱柱签收';
        workbook.lastModifiedBy = '柱柱签收';
        var now = new Date();
        workbook.created = now;
        workbook.modified = now;

        var sheetName = '承运商满意度统计';
        var worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns =  [
          {header: '承运商', key: '承运商', width: 20},
          {header: '好评合计', key: '好评合计', width: 15},
          {header: '中评合计', key: '中评合计', width: 15},
          {header: '差评合计', key: '差评合计', width: 15},
          {header: '满意度', key: '满意度', width: 15}
        ];

        if(a.length == 0){
          worksheet.addRow({'承运商' : "暂无数据"}).commit();
        }else{
          var companies = a[a.length-1];
          for(var i=0, len=a.length-1; i<len; i++){
            var doc = a[i];
            var row = {
              '好评合计' : doc.good,
              '中评合计' : doc.average,
              '差评合计' : doc.bad,
              '满意度' : ((doc.good + doc.average)*100/doc.total).toFixed(1) + '%'
            };
            row['承运商'] = companies[i].name;
            worksheet.addRow(row).commit();
          }
          worksheet.addRow({'承运商' : "备注：满意度比率=(好评次数+中评次数)/总评价次数"}).commit();
        }

        worksheet.commit();
        workbook.commit()
        .then(function () {
          return fulfill({root: '.', filePath: filePath, filename: filePath});
        }, function(err){
          return reject(err);
        });
      }else{
        if(a.length == 0){
          return fulfill({
            xAxis: [],
            series: []
          });
        }
        var xAxis = [], data = [], companies = a[a.length-1];
        for(var i=0, len=a.length-1; i<len; i++){
          xAxis.push(companies[i].name);
          var doc = a[i];
          if(doc){
            if(doc.total == 0){
              data.push('-');
            }else{
              data.push(((doc.good + doc.average)*100/doc.total).toFixed(1));
            }
          }else{
            data.push('-');
          }
        }
        return fulfill({
          xAxis: xAxis,
          series: [data]
        });
      }
    }, function(err){
      return reject(err);
    });
  });
};

function getChart3DriverAData(params, user_id){
  return new Promise(function(fulfill, reject){
    getChart3MatchA(params, user_id).then(function(filter){
      Order.aggregate([
        {$match : filter.match},
        {$project: {_id : 0, assigned_infos : 1}},
        {$group : {
          _id : null,
          assigned_infos : {$push : "$assigned_infos"}
        }}
      ]).exec(function(err, docs){
        if(err){
          return reject(err);
        }else{
          if(docs.length == 0){
            return fulfill([]);
          }
          var order_ids  = [];
          docs[0].assigned_infos.forEach(function(assigned_infos){
            assigned_infos.forEach(function(assigned_info){
              if(assigned_info.order_id){
                order_ids.push(mongoose.Types.ObjectId(assigned_info.order_id));
              }
            });
          });
          DriverEvaluation.aggregate([
            {$match: {order_id : {$in : order_ids} } },
            {$project: {level : 1, _id : 0, 'driver.username' : 1, driver_id : 1} },
            {$group: {
              _id : "$driver_id",
              driver: {$first : "$driver.username"},
              total : {$sum : 1},
              good : {$sum : {
                $cond : [{$eq : ["$level", 1]}, 1, 0]
              }},
              average : {$sum: {
                $cond : [{$eq: ["$level", 2]}, 1, 0]
              }},
              bad: {$sum: {
                $cond : [{$eq: ["$level", 3]}, 1, 0]
              }}
            }}
          ]).exec(function(err, docs){
            if(err){
              return reject(err);
            }
            return fulfill(docs);
          });
        }
      });
    },function(err){
      return reject(err);
    });
  });
}

// 货主角色查看司机统计
exports.chart3DriverA = function(params, user_id, dataType){
  return new Promise(function(fulfill, reject){
    getChart3DriverAData(params, user_id).then(function(a){
      if(dataType == 'download'){
        var filePath = new Date().getTime() + '.xlsx';
        var workbook = new Excel.stream.xlsx.WorkbookWriter({
          filename: filePath
        });
        workbook.creator = '柱柱签收';
        workbook.lastModifiedBy = '柱柱签收';
        var now = new Date();
        workbook.created = now;
        workbook.modified = now;

        var sheetName = '司机满意度统计';
        var worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns =  [
          {header: '司机', key: '司机', width: 20},
          {header: '好评合计', key: '好评合计', width: 15},
          {header: '中评合计', key: '中评合计', width: 15},
          {header: '差评合计', key: '差评合计', width: 15},
          {header: '满意度', key: '满意度', width: 15}
        ];

        if(a.length == 0){
          worksheet.addRow({'司机' : "暂无数据"}).commit();
        }else{
          for(var i=0, len=a.length; i<len; i++){
            var doc = a[i];
            var row = {
              '好评合计' : doc.good,
              '中评合计' : doc.average,
              '差评合计' : doc.bad,
              '满意度' : ((doc.good + doc.average)*100/doc.total).toFixed(1) + '%'
            };
            row['司机'] = doc.driver;
            worksheet.addRow(row).commit();
          }
          worksheet.addRow({'司机' : "备注：满意度比率=(好评次数+中评次数)/总评价次数"}).commit();
        }

        worksheet.commit();
        workbook.commit()
        .then(function () {
          return fulfill({root: '.', filePath: filePath, filename: filePath});
        }, function(err){
          return reject(err);
        });
      }else{
        if(a.length == 0){
          return fulfill({
            xAxis: [],
            series: []
          });
        }
        var xAxis = [], data = [];
        for(var i=0, len=a.length; i<len; i++){
          var doc = a[i];
          xAxis.push(doc.driver);
          if(doc.total == 0){
            data.push('-');
          }else{
            data.push(((doc.good + doc.average)*100/doc.total).toFixed(1));
          }
        }
        return fulfill({
          xAxis: xAxis,
          series: [data]
        });
      }
    },function(err){
      return reject(err);
    });
  });
};

function getChart3DriverBData(params, user_id){
  return new Promise(function(fulfill, reject){
    getChart3MatchA(params, user_id).then(function(filter){
      DriverEvaluation.aggregate([
        {$match: filter.match },
        {$project: {level : 1, _id : 0, 'driver.username' : 1, driver_id : 1} },
        {$group: {
          _id : "$driver_id",
          driver: {$first : "$driver.username"},
          total : {$sum : 1},
          good : {$sum : {
            $cond : [{$eq : ["$level", 1]}, 1, 0]
          }},
          average : {$sum: {
            $cond : [{$eq: ["$level", 2]}, 1, 0]
          }},
          bad: {$sum: {
            $cond : [{$eq: ["$level", 3]}, 1, 0]
          }}
        }}
      ]).exec(function(err, docs){
        if(err){
          return reject(err);
        }
        return fulfill(docs);
      });
    },function(err){
      return reject(err);
    });
  });
}

// 承运商角色查看司机统计
exports.chart3DriverB = function(params, user_id, dataType){
  return new Promise(function(fulfill, reject){
    getChart3DriverBData(params, user_id).then(function(a){
      if(dataType == 'download'){
        var filePath = new Date().getTime() + '.xlsx';
        var workbook = new Excel.stream.xlsx.WorkbookWriter({
          filename: filePath
        });
        workbook.creator = '柱柱签收';
        workbook.lastModifiedBy = '柱柱签收';
        var now = new Date();
        workbook.created = now;
        workbook.modified = now;

        var sheetName = '司机满意度统计';
        var worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns =  [
          {header: '司机', key: '司机', width: 20},
          {header: '好评合计', key: '好评合计', width: 15},
          {header: '中评合计', key: '中评合计', width: 15},
          {header: '差评合计', key: '差评合计', width: 15},
          {header: '满意度', key: '满意度', width: 15}
        ];

        if(a.length == 0){
          worksheet.addRow({'司机' : "暂无数据"}).commit();
        }else{
          for(var i=0, len=a.length; i<len; i++){
            var doc = a[i];
            var row = {
              '好评合计' : doc.good,
              '中评合计' : doc.average,
              '差评合计' : doc.bad,
              '满意度' : ((doc.good + doc.average)*100/doc.total).toFixed(1) + '%'
            };
            row['司机'] = doc.driver;
            worksheet.addRow(row).commit();
          }
          worksheet.addRow({'司机' : "备注：满意度比率=(好评次数+中评次数)/总评价次数"}).commit();
        }

        worksheet.commit();
        workbook.commit()
        .then(function () {
          return fulfill({root: '.', filePath: filePath, filename: filePath});
        }, function(err){
          return reject(err);
        });
      }else{
        if(a.length == 0){
          return fulfill({
            xAxis: [],
            series: []
          });
        }
        var xAxis = [], data = [];
        for(var i=0, len=a.length; i<len; i++){
          var doc = a[i];
          xAxis.push(doc.driver);
          if(doc.total == 0){
            data.push('-');
          }else{
            data.push(((doc.good + doc.average)*100/doc.total).toFixed(1));
          }
        }
        return fulfill({
          xAxis: xAxis,
          series: [data]
        });
      }
    },function(err){
      return reject(err);
    });
  });
};