var appDb = require('../mongoose').appDb,
  Order = appDb.model('Order'),
  SalesmanCompany = appDb.model('SalesmanCompany'),
  Company = appDb.model('Company'),
  dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment'),
  Promise = require('promise'),
  Excel = require('exceljs'),
  OrderStatusMap = {
    'unAssigned' : '未分配',
    'assigning' : '分配中',
    'unPickupSigned' : '未签到提货',
    'unPickuped' : '未提货',
    'unDeliverySigned' : '未交货签到',
    'unDeliveried' : '未交货',
    'completed' : '已完成'
  };

exports.getCompaniesByName = function(company_name){
  return new Promise(function(fulfill, reject) {
    Company.find({name: new RegExp(company_name)}).select({name: 1}).sort({_id : 1}).lean().exec(function (err, companies) {
      if (err) {
        return reject(err);
      } else {
        return fulfill(companies);
      }
    });
  });
};

exports.downloadSalesmen = function (filter, create_companies) {
  return new Promise(function (fulfill, reject) {
    Promise.all([new Promise(function (fulfill, reject) {
      Order.find(filter)
      .select({
        'created' : 1,
        'order_details.order_number': 1,
        'pickup_contacts': 1,
        'delivery_contacts': 1,
        'create_push': 1,
        'pickup_push': 1,
        'delivery_sign_push': 1,
        'delivery_push': 1,
        'salesmen': 1,
        'abnormal_push' : 1,
        'pickup_deferred_duration' : 1,
        'delivery_early_duration' : 1,
        'sender_name' : 1,
        'create_company' : 1,
        'status' : 1
      }).sort({'_id' : -1}).lean()
      .exec(function (err, orders) {
        if (err) {
          return reject(err);
        } else {
          return fulfill(orders);
        }
      });
    }), new Promise(function (fulfill, reject) {
      SalesmanCompany.find({}).select({username: 1, nickname: 1}).sort({username: 1}).lean().exec(function (err, salesmen) {
        if (err) {
          return reject(err);
        } else {
          return fulfill(salesmen);
        }
      });
    }), new Promise(function(fulfill, reject){
      if(create_companies){
        return fulfill(create_companies);
      }else{
        Company.find().select({name : 1}).sort({_id : 1}).lean().exec(function(err, docs){
          if(err){
            return reject(err);
          }else {
            return fulfill(docs);
          }
        });
      }
    })]).then(function (results) {
      var orders = results[0], salesmen = results[1], companies = results[2];
      var filePath = new Date().getTime() + '.xlsx';
      var workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: filePath
      });
      workbook.creator = '柱柱签收';
      workbook.lastModifiedBy = '柱柱签收';
      var now = new Date();
      workbook.created = now;
      workbook.modified = now;
      var worksheet = workbook.addWorksheet('sheet');
      worksheet.columns = [
        {header: '运单号', key: '运单号', width: 20},
        {header: '创建时间', key: '创建时间', width: 15},
        {header: '创建公司', key: '创建公司', width: 20},
        {header: '发货公司', key: '发货公司', width: 20},
        {header: '发货地址', key: '发货地址', width: 35},
        {header: '收货地址', key: '收货地址', width: 35},
        {header: '运单状态', key: '运单状态', width: 10},
        {header: '运单通知', key: '运单通知', width: 10},
        {header: '发货通知', key: '发货通知', width: 10},
        {header: '到货通知', key: '到货通知', width: 10},
        {header: '送达通知', key: '送达通知', width: 10},
        {header: '问题运单推送', key: '问题运单推送', width: 10},
        {header: '提货滞留时间', key: '提货滞留时间', width: 10},
        {header: '到货提前时间', key: '到货提前时间', width: 10},
        {header: '发货人', key: '发货人', width: 25},
        {header: '收货人', key: '收货人', width: 25},
        {header: '关注人', key: '关注人', width: 50}
      ];
      var compare = function (a, b) {
        var as = a.username,
          bs = b.username;
        if (as === bs) {
          return 0;
        } else if (as > bs) {
          return 1;
        } else {
          return -1;
        }
      };
      var compare2 = function(a, b){
        var aid = a._id.toString(), bid = b._id.toString();
        if(aid == bid){
          return 0;
        }else if(aid > bid){
          return 1;
        }else {
          return -1;
        }
      };
      orders.forEach(function (order) {
        var rowData = {
          '运单号': order.order_details ? order.order_details.order_number : null,
          '创建时间' : order.created ? moment(order.created).add(timezone, 'h').toDate() : null,
          '发货公司' : order.sender_name,
          '运单通知': order.create_push ? '是' : '否',
          '发货通知': order.pickup_push ? '是' : '否',
          '到货通知': order.delivery_sign_push ? '是' : '否',
          '送达通知': order.delivery_push ? '是' : '否',
          '问题运单推送' : order.abnormal_push ? '是' : '否',
          '提货滞留时间' : order.pickup_deferred_duration,
          '到货提前时间' : order.delivery_early_duration,
          '运单状态' : OrderStatusMap[order.status]
        };

        var observers = null;
        if (order.salesmen && order.salesmen.length > 0) {
          observers = '';
          for (var i = 0, len = order.salesmen.length; i < len; i++) {
            var salesman = order.salesmen[i];
            var idx = binarySearch(salesmen, salesman, compare);
            if (idx >= 0) {
              salesman = salesmen[idx];
            }
            if (salesman.nickname && salesman.nickname != salesman.username) {
              observers += ',' + salesman.nickname + '(' + salesman.username + ')';
            } else {
              observers += ',' + salesman.username;
            }
          }
          observers = observers.substr(1);
        }
        rowData['关注人'] = observers;

        if(order.pickup_contacts){
          if(order.pickup_contacts.name && order.pickup_contacts.mobile_phone){
            rowData['发货人'] = order.pickup_contacts.name + '(' + order.pickup_contacts.mobile_phone + ')';
          }else if(order.pickup_contacts.name){
            rowData['发货人'] = order.pickup_contacts.name;
          }else if(order.pickup_contacts.mobile_phone){
            rowData['发货人'] = order.pickup_contacts.mobile_phone;
          }

          rowData['发货地址'] = order.pickup_contacts.address;
        }

        if(order.delivery_contacts){
          if(order.delivery_contacts.name && order.delivery_contacts.mobile_phone){
            rowData['收货人'] = order.delivery_contacts.name + '(' + order.delivery_contacts.mobile_phone + ')';
          }else if(order.delivery_contacts.name){
            rowData['收货人'] = order.delivery_contacts.name;
          }else if(order.delivery_contacts.mobile_phone){
            rowData['收货人'] = order.delivery_contacts.mobile_phone;
          }

          rowData['收货地址'] = order.delivery_contacts.address;
        }

        if(order.create_company){
          var idx = binarySearch(companies, {_id : order.create_company}, compare2);
          if(idx >= 0){
            var company = companies[idx];
            rowData['创建公司'] = company.name;
          }
        }

        worksheet.addRow(rowData);
      });

      console.log('b');
      worksheet.commit();
      workbook.commit().then(function () {
        return fulfill({root: '.', filePath: filePath, filename: filePath});
      });

    }, function (err) {
      return reject(err);
    });

  });
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

exports.getTableData = function (filter, pagination, create_companies) {
  return new Promise(function (fulfill, reject) {

    Promise.all([
      new Promise(function (fulfill, reject) {
        Order.find(filter)
        .select({
          'created' : 1,
          'order_details.order_number': 1,
          'pickup_contacts': 1,
          'delivery_contacts': 1,
          'create_push': 1,
          'pickup_push': 1,
          'delivery_sign_push': 1,
          'delivery_push': 1,
          'salesmen': 1,
          'abnormal_push' : 1,
          'pickup_deferred_duration' : 1,
          'delivery_early_duration' : 1,
          'sender_name' : 1,
          'create_company' : 1,
          'status' : 1
        })
        .skip((pagination.currentPage - 1) * pagination.limit).limit(pagination.limit).sort({'_id' : -1})
        .exec(function (err, orders) {
          if (err) {
            return reject(err);
          } else {
            return fulfill(orders);
          }
        });
      }),
      new Promise(function (fulfill, reject) {
        Order.find(filter).count(function (err, count) {
          if (err) {
            return reject(err);
          } else {
            return fulfill(count);
          }
        });
      })
    ]).then(function (results) {
      var orders = results[0],
        total = results[1];

      Promise.all([
        new Promise(function(fulfill, reject){
          var userNames = [];
          orders.forEach(function (order) {
            if (order.salesmen && order.salesmen.length > 0) {
              order.salesmen.forEach(function (salesman) {
                if (salesman && salesman.username) {
                  userNames.push(salesman.username);
                }
              });
            }
          });

          SalesmanCompany.find({username: {$in: userNames}}).select({username: 1, nickname: 1}).sort({username: 1})
          .exec(function (err, salesmen) {
            if(err){
              return reject(err);
            }else{
              return fulfill(salesmen);
            }
          });
        }),
        new Promise(function(fulfill, reject){
          if(create_companies){
            return fulfill(create_companies);
          }else{
            var ids = [];
            orders.forEach(function(order){
              if(order.create_company){
                ids.push(order.create_company);
              }
            });

            Company.find({_id : {$in : ids}}).select({name : 1}).sort({_id : 1}).lean().exec(function(err, companies){
              if(err){
                return reject(err);
              }else{
                return fulfill(companies);
              }
            });
          }
        })
      ]).then(function(results){
        var salesmen = results[0], companies = results[1];
        var rows = [];
        var compare = function (a, b) {
          var as = a.username,
            bs = b.username;
          if (as === bs) {
            return 0;
          } else if (as > bs) {
            return 1;
          } else {
            return -1;
          }
        };
        var compare2 = function(a, b){
          var aid = a._id.toString(), bid = b._id.toString();
          if(aid == bid){
            return 0;
          }else if(aid > bid){
            return 1;
          }else {
            return -1;
          }
        };
        orders.forEach(function (order) {
          var rowData = {
            '运单号': order.order_details ? order.order_details.order_number : null,
            '创建时间' : order.created,
            '发货公司' : order.sender_name,
            '运单通知': order.create_push ? '是' : '否',
            '发货通知': order.pickup_push ? '是' : '否',
            '到货通知': order.delivery_sign_push ? '是' : '否',
            '送达通知': order.delivery_push ? '是' : '否',
            '问题运单推送' : order.abnormal_push ? '是' : '否',
            '提货滞留时间' : order.pickup_deferred_duration,
            '到货提前时间' : order.delivery_early_duration,
            '运单状态' : OrderStatusMap[order.status]
          };

          var observers = null;
          if (order.salesmen && order.salesmen.length > 0) {
            observers = '';
            for (var i = 0, len = order.salesmen.length; i < len; i++) {
              var salesman = order.salesmen[i];
              var idx = binarySearch(salesmen, salesman, compare);
              if (idx >= 0) {
                salesman = salesmen[idx];
              }
              if (salesman.nickname && salesman.nickname != salesman.username) {
                observers += ',' + salesman.nickname + '(' + salesman.username + ')';
              } else {
                observers += ',' + salesman.username;
              }
            }
            observers = observers.substr(1);
          }
          rowData['关注人'] = observers;

          if(order.pickup_contacts){
            if(order.pickup_contacts.name && order.pickup_contacts.mobile_phone){
              rowData['发货人'] = order.pickup_contacts.name + ' (' + order.pickup_contacts.mobile_phone + ')';
            }else if(order.pickup_contacts.name){
              rowData['发货人'] = order.pickup_contacts.name;
            }else if(order.pickup_contacts.mobile_phone){
              rowData['发货人'] = order.pickup_contacts.mobile_phone;
            }

            rowData['发货地址'] = order.pickup_contacts.address;
          }

          if(order.delivery_contacts){
            if(order.delivery_contacts.name && order.delivery_contacts.mobile_phone){
              rowData['收货人'] = order.delivery_contacts.name + ' (' + order.delivery_contacts.mobile_phone + ')';
            }else if(order.delivery_contacts.name){
              rowData['收货人'] = order.delivery_contacts.name;
            }else if(order.delivery_contacts.mobile_phone){
              rowData['收货人'] = order.delivery_contacts.mobile_phone;
            }

            rowData['收货地址'] = order.delivery_contacts.address;
          }

          if(order.create_company){
            var idx = binarySearch(companies, {_id : order.create_company}, compare2);
            if(idx >= 0){
              var company = companies[idx];
              rowData['创建公司'] = company.name;
            }
          }

          rows.push(rowData);
        });
        fulfill({
          'data' : rows,
          'pagination' : {
            'currentPage' :pagination.currentPage ,
            'limit' : pagination.limit,
            'total' : total
          }
        });
      }, function(err){
        return reject(err);
      });

      var userNames = [];
      orders.forEach(function (order) {
        if (order.salesmen && order.salesmen.length > 0) {
          order.salesmen.forEach(function (salesman) {
            if (salesman && salesman.username) {
              userNames.push(salesman.username);
            }
          });
        }
      });

      SalesmanCompany.find({username: {$in: userNames}}).select({username: 1, nickname: 1}).sort({username: 1})
      .exec(function (err, salesmen) {
        if (err) {
          return reject(err);
        }


      });
    }, function (err) {
      reject(err);
    });

  });
};