/**
 * Created by elinaguo on 15/3/24.
 */
'use strict';

var orderError = require('../errors/order'),
  groupError = require('../errors/group'),
  orderShareError = require('../errors/order_share'),
  config = require('../../config/config'),
  async = require('async'),
  q = require('q'),
  path = require('path'),
  fs = require('fs'),
  ejs = require('ejs'),
  fs = require('fs');

//用户模型
var appDb = require('../../libraries/mongoose').appDb,
  Detail = appDb.model('Detail'),
  pushLib = require('../libraries/getui'),
  pdfLib = require('../libraries/pdf'),
  emailLib = require('../libraries/email'),
  OrderDetail = appDb.model('OrderDetail'),
  Order = appDb.model('Order'),
  Contact = appDb.model('Contact'),
  Group = appDb.model('Group'),
  UserGroup = appDb.model('UserGroup'),
  CustomerContact = appDb.model('CustomerContact'),
  Driver = appDb.model('Driver'),
  User = appDb.model('User'),
  Company = appDb.model('Company'),
  AssignInfo = appDb.model('AssignInfo'),
  OrderShare = appDb.model('OrderShare'),
  SalesmanCompany = appDb.model('SalesmanCompany');

var userService = require('../services/user'),
  orderService = require('../services/order'),
  driverService = require('../services/driver'),
  traceService = require('../services/trace'),
  transportEventService = require('../services/transport_event'),
  companyService = require('../services/company'),
  groupService = require('../services/group');


var OrderLogic = require('../logics/order');
var mongoose = require('mongoose');

exports.verifyOrder = function (req, res, next) {
  var order = req.order;
  var type = req.body.type || req.query.type;
  var price = req.body.price || req.query.price;
  var reason = req.body.raise || req.query.raise;
  var raise = req.body.raise || req.query.raise;
  
  orderService.verifyOrder(order, type, price, raise,reason,function (err, results) {
    if (err) {
      req.err = err;
      return next();
    }
    req.data = results;
    return next();
  })
};

exports.updateAssignedOrder = function (req, res, next) {
  var currentUser = req.user;
  var orderInfo = req.body.order || {};
  var groupId = req.body.group_id || '';

  if (!orderInfo.order_id) {
    req.err = {err: orderError.order_id_not_exist};
    return next();
  }

  groupService.getGroupById(groupId, function (err, group) {
    if (err) {
      req.err = err;
      return next();
    }

    orderService.checkReceiver(orderInfo, function (err) {
      if (err) {
        req.err = {err: err};
        return next();
      }
      else {
        var orderLogic = new OrderLogic();
        orderLogic.updateAssignedOrder(currentUser._id, currentUser.company._id,
          orderInfo, groupId, currentUser.company.name, function (err, newOrder) {
            if (err) {
              req.err = err;
              return next();
            }

            orderLogic.getAllDriverOrders(orderInfo.order_id, function (err, driverOrders) {
              if (err) {
                req.err = err;
                return next();
              }

              async.each(driverOrders, function (driverOrder, asyncCallback) {
                var driver = driverOrder.execute_driver;
                delete driverOrder._doc.execute_driver;

                orderService.pushUpdateInfoToDriver(driver, driverOrder.toJSON());
                return asyncCallback();
              }, function (err) {
                if (err) {
                  req.err = err;
                  return next();
                }

                req.data = newOrder;
                return next();
              });
            });

          });
      }
    });
  });
};

exports.deleteAssignedOrder = function (req, res, next) {
  var currentUser = req.user;
  var order_id = req.body.order_id || '';

  var orderLogic = new OrderLogic();
  orderLogic.deleteAssignedOrder(currentUser.company._id, order_id, function (err) {
    if (err) {
      req.err = err;
      return next();
    }

    orderLogic.getAllDriverOrders(order_id, function (err, driverOrders) {
      if (err) {
        req.err = err;
        return next();
      }

      async.each(driverOrders, function (driverOrder, asyncCallback) {
        orderService.pushDeleteInfoToDriver(driverOrder.execute_driver, driverOrder._id);
        return asyncCallback();
      }, function (err) {
        if (err) {
          req.err = err;
          return next();
        }

        req.data = {success: true};
        return next();
      });
    });


  });
};

exports.batchDelete = function (req, res, next) {
  var currentUser = req.user;
  var order_ids = req.body.order_ids || req.query.order_ids || '';

  if (!order_ids) {
    req.err = {err: orderError.order_not_exist};
    return next();
  }

  var failedOrders = [];

  async.each(order_ids, function (order_id, asyncCallback) {
    orderService.deleteOrder(currentUser.company._id, order_id, function (err) {
      if (err) {
        //有错误暂不停止
        failedOrders.push(order_id);
      }

      return asyncCallback();
    });
  }, function (err) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    else {
      req.data = {failedOrders: failedOrders};
      return next();
    }

  });

};

//<editor-fold desc="create_order_relation">

exports.delete = function (req, res, next) {
  var order_id = req.body.order_id || '';

  Order.findOne({_id: order_id}, function (err, order) {
    if (err) {
      return res.send({err: orderError.internal_system_error});
    }
    if (!order) {
      return res.send({err: orderError.order_not_exist});
    }

    if (order.execute_company.toString() !== order.create_company.toString()) {
      return res.send({err: orderError.must_self_company_order});
    }

    if (order.status !== 'unAssigned') {
      return res.send({err: orderError.order_status_mustbe_unassigned});
    }
    order.delete_status = true;
    order.save(function (err, removedOrder) {
      if (err || !removedOrder) {
        return res.send({err: orderError.internal_system_error});
      }

      return res.send({success: true});
    });
  });
};

exports.update = function (req, res, next) {
  var currentUser = req.user || {};
  var orderInfo = req.body.order || {};
  var groupId = req.body.group_id || '';

  groupService.getGroupById(groupId, function (err, group) {
    if (err) {
      return res.send(err);
    }
    //只有创建订单的组员才能修改，所以订单来源就是创建订单的公司的名称
    orderService.update(currentUser._id, currentUser.company._id, currentUser.company.name, group._id, orderInfo, function (err, newOrder) {
      if (err) {
        return res.send(err);
      }

      return res.send(newOrder);
    });
  });
};

exports.create = function (req, res, next) {
  var currentUser = req.user || {};
  var orderInfo = req.body.order || {};
  var groupId = req.body.group_id || '';

  groupService.isUserInGroup(currentUser._id, groupId, function (err, isInGroup) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    if (!isInGroup) {
      req.err = {err: groupError.user_not_exist_in_group};
      return next();
    }

    groupService.getGroupById(groupId, function (err, group) {
      if (err) {
        return res.send(err);
      }

      orderService.create(currentUser._id, currentUser.company._id, currentUser.company.name, group._id, orderInfo, function (err, newOrder) {
        if (err) {
          return res.send(err);
        }
        return res.send(newOrder);
      });
    });

  });

};

//多段分配
function multiAssignOrder(user, order, orderDetail, assignInfos, isBatch) {

  var defered = q.defer();
  var assignedOrderList = [];
  async.eachSeries(assignInfos, function (assignInfo, callback) {
    if (assignInfo.is_assigned === true || assignInfo.is_assigned === 'true') {
      return callback();
    }

    companyService.getLocationInfosByAddresses(user.company._id, [assignInfo.pickup_contact_address, assignInfo.delivery_contact_address], function (err, locationInfo) {
      if (locationInfo[0]) {
        assignInfo.pickup_contact_location = locationInfo[0].location || [];
        assignInfo.pickup_contact_brief = locationInfo[0].brief || '';
      }
      else {
        assignInfo.pickup_contact_location = [];
        assignInfo.pickup_contact_brief = '';
      }

      if (locationInfo[1]) {
        assignInfo.delivery_contact_location = locationInfo[1].location || [];
        assignInfo.delivery_contact_brief = locationInfo[1].brief || '';
      }
      else {
        assignInfo.delivery_contact_location = [];
        assignInfo.delivery_contact_brief = '';
      }

      if (assignInfo.type === 'driver') {
        orderService.assignOrderToDriver(user, order, orderDetail, assignInfo, isBatch, function (err, driverOrder) {
          if (!err) {
            assignedOrderList.push(driverOrder);
            assignInfo.is_assigned = true;
            assignInfo.order_id = driverOrder._id.toString();
          }

          return callback();
        });
      }
      else if (assignInfo.type === 'warehouse') {
        orderService.assignOrderToWarehouse(user, order, orderDetail, assignInfo, isBatch, function (err, driverOrder) {
          if (!err) {
            assignedOrderList.push(driverOrder);
            assignInfo.is_assigned = true;
            assignInfo.order_id = driverOrder._id.toString();
          }

          return callback();
        });
      }
      else if (assignInfo.type === 'company') {
        orderService.assignOrderToCompany(user, order, orderDetail, assignInfo, function (err, companyOrder) {
          if (!err) {
            assignedOrderList.push(companyOrder);
            assignInfo.is_assigned = true;
            assignInfo.order_id = companyOrder._id.toString();
          }
          return callback();
        });
      }
      else {
        return callback();
      }
    });

  }, function (err) {
    if (!err)
      defered.resolve({assignedOrderList: assignedOrderList, assignedInfos: assignInfos});
  });
  return defered.promise;
}

//批量创建并分配
//目前只分配给存在的司机 createUserId, createCompanyId, orderSource,
function multiCreateAndAssign(infos, createUser, groupId) {
  var defered = q.defer();
  var errCreateOrderArray = [];
  var invalidReceiverCount = 0;
  var invalidSenderCount = 0;
  var successAssignCount = 0;

  async.eachSeries(infos, function (orderInfo, eachCallback) {
    async.auto({
      createOrder: function (createCallback) {
        orderService.create(createUser._id, createUser.company._id, createUser.company.name, groupId, orderInfo.createInfo, function (err, newOrder) {
          if (err || !newOrder) {
            errCreateOrderArray.push(err || {err: {type: 'create_order_failed'}});
            return createCallback(err);
          }

          if (newOrder && newOrder.receiver_company) {
            if (!newOrder.receiver_company.company_id) {
              invalidReceiverCount++;
            }
          }
          if (newOrder && newOrder.sender_company) {
            if (!newOrder.sender_company.company_id) {
              invalidSenderCount++;
            }
          }
          return createCallback(null, newOrder);
        });
      },
      assignOrders: ['createOrder', function (assignCallback, result) {
        if (!orderInfo.assignInfos || orderInfo.assignInfos.length <= 0) {
          return assignCallback();
        }
        var formatAssignInfos = [];
        async.each(orderInfo.assignInfos, function (assignInfo, asyncEachCallback) {
          assignInfo.driver_username = assignInfo.driver_username || '';
          driverService.getDriverByPhone(assignInfo.driver_username, function (err, assignDriver) {
            assignDriver = assignDriver || {};
            //获取分配信息
            formatAssignInfos.push({
              type: assignDriver.username ? 'driver' : '',
              partner_name: ((assignDriver.nickname || '') + '/' + (assignDriver.username || '')),
              road_order_name: '',
              road_order_id: '',
              company_id: '',
              driver_id: assignDriver._id || '',
              driver_username: assignDriver.username,
              order_id: '',

              pickup_contact_name: assignInfo.pickup_contact_name || '',
              pickup_contact_phone: assignInfo.pickup_contact_phone || '',
              pickup_contact_mobile_phone: assignInfo.pickup_contact_mobile_phone || '',
              pickup_contact_email: assignInfo.pickup_contact_email || '',
              pickup_contact_address: assignInfo.pickup_contact_address || '',

              delivery_contact_name: assignInfo.delivery_contact_name || '',
              delivery_contact_phone: assignInfo.delivery_contact_phone || '',
              delivery_contact_mobile_phone: assignInfo.delivery_contact_mobile_phone || '',
              delivery_contact_email: assignInfo.delivery_contact_email || '',
              delivery_contact_address: assignInfo.delivery_contact_address || '',

              pickup_start_time: assignInfo.pickup_start_time,
              pickup_end_time: assignInfo.pickup_end_time,
              delivery_start_time: assignInfo.delivery_start_time,
              delivery_end_time: assignInfo.delivery_end_time
            });

            return asyncEachCallback();
          });
        }, function (err) {

          result.createOrder.total_assign_count = formatAssignInfos.length;
          result.createOrder.status = 'assigning';
          result.createOrder.assign_status = 'assigning';

          result.createOrder.save(function (err, saveCreateOrder) {
            if (err || !saveCreateOrder) {
              errCreateOrderArray.push(err || {err: {type: 'create_order_failed'}});
              return assignCallback();
            }
            multiAssignOrder(createUser, saveCreateOrder, saveCreateOrder.order_details, formatAssignInfos, false)
              .then(function (result) {
                successAssignCount += result.assignedOrderList.length;

                Order.findOne({_id: saveCreateOrder._id}, function (err, findOrderEntity) {
                  if (err) {
                    return assignCallback();
                  }

                  findOrderEntity.assigned_count += result.assignedOrderList.length;
                  findOrderEntity.assigned_infos = result.assignedInfos;

                  if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
                    findOrderEntity.status = 'unPickupSigned';
                    findOrderEntity.assign_status = 'completed';
                  }

                  findOrderEntity.assign_time = new Date();  //添加分配时间

                  findOrderEntity.save(function (err, orderResult) {
                    if (err) {
                      return assignCallback();
                    }
                    return assignCallback();
                  });
                });
              }, function (err) {
                return assignCallback();
              });
          });
        });
      }]
    }, function (err, results) {
      return eachCallback();
    });

  }, function (err) {
    if (err) {
      return defered.reject(err);
    }
    return defered.resolve({
      err_array: errCreateOrderArray,
      invalid_receiver_count: invalidReceiverCount,
      invalid_sender_count: invalidSenderCount,
      success_assign_count: successAssignCount
    });
  });
  return defered.promise;
}

exports.batchCreate = function (req, res, next) {
  var currentUser = req.user || {};
  var infos = req.body.infos;
  var groupId = req.body.group_id;

  if (!infos || !Array.isArray(infos) || infos.length <= 0) {
    return res.send({err: orderError.order_info_null});
  }

  multiCreateAndAssign(infos, currentUser, groupId).then(function (result) {
    return res.send({
      success: result.err_array.length === 0,
      //总单数
      totalCount: infos.length,
      //成功创建单数
      successCount: infos.length - result.err_array.length,
      errorArray: result.err_array,
      invalidReceiverCount: result.invalid_receiver_count,
      invalidSenderCount: result.invalid_sender_count,
      //成功分配的段数
      successAssignCount: result.success_assign_count
    });

  }, function (err) {
    return res.send(err);
  });
};

//</editor-fold>

//<editor-fold desc="export_order_relation">
function getOrdersOfGroupByFilter(group, filter, callback) {
  var conditions = {
    execute_group: group._id,
    create_time: {
      $gte: filter.startDate,
      $lte: filter.endDate
    }
  };
  if (filter.damaged && filter.damaged !== '') {
    conditions.damaged = filter.damaged === 'true' ? true : false;
  }
  if (filter.customer_name && filter.customer_name !== '') {
    conditions.customer_name = filter.customer_name;
  }
  if (filter.isOnTime && filter.isOnTime !== '') {
    conditions.pickup_end_time = {$exists: true};
    conditions.delivery_end_time = {$exists: true};
    conditions.pickup_time = {$exists: true};
    conditions.delivery_time = {$exists: true};
    if (filter.isOnTime === 'true') {
      conditions.$where = function () {
        return this.pickup_time <= this.pickup_end_time && this.delivery_time <= this.delivery_end_time;
      };
    }
    else {
      conditions.$where = function () {
        return this.pickup_time > this.pickup_end_time || this.delivery_time > this.delivery_end_time;
      };
    }
  }
  Order.find(conditions)
    .populate('order_detail pickup_contact delivery_contact execute_company execute_driver execute_group')
    .exec(function (err, orders) {
      if (err || !orders) {
        return callback(null);
      }
      if (filter.partner_id) {
        var partnerOrders = [];
        async.each(orders, function (order, eachCallback) {
          Order.findOne({
            parent_order: order._id,
            execute_company: filter.partner_id
          }, function (err, childOrder) {
            if (childOrder) {
              partnerOrders.push(order);
            }
            return eachCallback();
          });
        }, function () {
          return callback(partnerOrders);
        });
      }
      else {
        return callback(orders);
      }
    });
}

function getOrdersByFilter(userGroupEntities, filter) {
  var defered = q.defer();
  var orderArray = [];

  async.each(userGroupEntities, function (userGroupEntity, callback) {

    getOrdersOfGroupByFilter(userGroupEntity, filter, function (result) {
      if (result) {
        for (var index = 0; index < result.length; index++) {
          orderArray.push(result[index]);
        }
      }
      callback();
    });
  }, function (err) {
    if (!err)
      defered.resolve({orders: orderArray});
  });
  return defered.promise;
}

//导出订单
exports.exportOrders = function (req, res, next) {
  var currentUser = req.user;
  var filter = {
    startDate: new Date(req.query.startDate || new Date().toISOString()),
    endDate: new Date(req.query.endDate || new Date().toISOString()),
    damaged: req.query.damaged,
    isOnTime: req.query.isOnTime,
    partner_id: req.query.partner_id || '',
    customer_name: req.query.customer_name || '',
    order_transport_type: req.query.order_transport_type || ''
  };

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

      var allColumns = [
        {header: '公司', key: '公司', width: 20},
        {header: '发货方', key: '发货方', width: 20},
        {header: '收货方', key: '收货方', width: 20},
        {header: '运单号', key: '运单号', width: 20},
        {header: '创建时间', key: '创建时间', width: 10},
        {header: '分配时间', key: '分配时间', width: 10},
        {header: '提货进场时间', key: '提货进场时间', width: 15},
        {header: '交货进场时间', key: '交货进场时间', width: 15},
        {header: '中途事件', key: '中途事件', width: 40},
        {header: '参考单号', key: '参考单号', width: 20},
        {header: '品名', key: '品名', width: 30},
        {header: '运费', key: '运费', width: 10},
        {header: '状态', key: '状态', width: 10},
        {header: '司机姓名', key: '司机姓名', width: 10},
        {header: '司机手机', key: '司机手机', width: 20},
        {header: '司机车牌', key: '司机车牌', width: 20},
        {header: '承运商', key: '承运商', width: 20},
        {header: '件数', key: '件数', width: 10},
        {header: '件数单位', key: '件数单位', width: 10},
        {header: '重量', key: '重量', width: 10},
        {header: '重量单位', key: '重量单位', width: 10},
        {header: '体积', key: '体积', width: 10},
        {header: '体积单位', key: '体积单位', width: 10},
        {header: '实际提货时间', key: '实际提货时间', width: 15},
        {header: '实际交货时间', key: '实际交货时间', width: 15},
        {header: '计划提货时间', key: '计划提货时间', width: 15},
        {header: '计划交货时间', key: '计划交货时间', width: 15},
        {header: '提货联系人', key: '提货联系人', width: 10},
        {header: '提货联系手机', key: '提货联系手机', width: 15},
        {header: '提货联系固话', key: '提货联系固话', width: 15},
        {header: '提货地址', key: '提货地址', width: 20},
        {header: '交货联系人', key: '交货联系人', width: 10},
        {header: '交货联系手机', key: '交货联系手机', width: 15},
        {header: '交货联系固话', key: '交货联系固话', width: 15},
        {header: '交货地址', key: '交货地址', width: 20},
        {header: '关注人', key: '关注人', width: 50},
        {header: '备注', key: '备注', width: 30},
        {header: '提货进场拍照', key: '提货进场拍照', width: 10},
        {header: '提货拍照', key: '提货拍照', width: 10},
        {header: '交货进场拍照', key: '交货进场拍照', width: 10},
        {header: '交货拍照', key: '交货拍照', width: 10},
        {header: '中途事件拍照', key: '中途事件拍照', width: 10},
        {header: '实收货物', key: '实收货物', width: 10},
        {header: '实收数量', key: '实收数量', width: 10},
        {header: '货缺', key: '货缺', width: 30},
        {header: '货损', key: '货损', width: 30},
        {header: '类型', key: '类型', width: 10}, // order_transport_type
        {header: '问题运单推送', key: '问题运单推送', width: 10}, // abnormal_push
        {header: '创建运单通知', key: '创建运单通知', width: 10}, // create_push
        {header: '发货通知', key: '发货通知', width: 10}, // pickup_push
        {header: '到货通知', key: '到货通知', width: 10}, // delivery_sign_push
        {header: '送达通知', key: '送达通知', width: 10} // delivery_push
      ];

      var columns;
      var fields = req.query.fields;
      if (fields) {
        columns = [];
        fields.split(',').forEach(function (f) {
          for (var i = 0, len = allColumns.length; i < len; i++) {
            var c = allColumns[i];
            if (c.key == f) {
              columns.push(c);
              break;
            }
          }
        });
      } else {
        columns = allColumns;
      }

      orderService.exportCompanyOrder(groupIds, filter, columns)
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
              console.log(new Date().toISOString(), 'exportOrders', err);
              res.status(err.status).end();
            }
            else {
              console.log('Sent:', filename);
            }
          });
        }, function (reason) {
          console.log('export failed', reason);
          return next(reason);
        });
    }
  });

};
//</editor-fold>

//<editor-fold desc="order_query_relation">

////获取当前用户的订单列表
exports.getUserOrders = function (req, res, next) {
  var currentUser = req.user || {};
  var currentPage = req.query.currentPage || req.body.currentPage || 1;
  var limit = req.query.limit || req.body.limit;
  var sort = {
    name: req.query.sortName || req.body.sortName || '',
    value: req.query.sortValue || req.body.sortValue || ''
  };
  var search = {
    name: req.query.searchName || '',
    value: req.query.searchValue || ''
  };

  if (!res.logs)res.logs = [];
  userService.getGroupIdsByUser(currentUser, function (err, groupIds) {
    if (err) {
      req.err = err;
      //res.logs.push({});
      return next();
    }

    if (!groupIds || groupIds.length <= 0) {
      req.err = {err: orderError.group_id_null};
      return next();
    }

    orderService.getOrdersByGroupIdsWithStatusArray(currentUser, null, currentPage, limit, sort, search, function (err, result) {
      if (err) {
        req.err = err;
        return next();
      }
      req.data = result;
      return next();
    });
  });
};

exports.getOperationCount = function (req, res, next) {
  var currentUser = req.user || {};

  async.auto({
    assignCount: [function (autoCallback, result) {
      orderService.getAssignOrderCount(currentUser, function (err, count) {
        return autoCallback(err, count);
      });
    }],
    onwayCount: [function (autoCallback, result) {
      orderService.getOnwayOrderCount(currentUser, function (err, count) {
        return autoCallback(err, count);
      });
    }]
  }, function (err, result) {

    if (err) {
      return res.send(err);
    }

    return res.send({assignCount: result.assignCount, onwayCount: result.onwayCount});

  });

};

//获取当前用户的未分配的订单列表
exports.getUnassignedOrders = function (req, res, next) {
  var currentUser = req.user || {};
  var currentPage = req.query.currentPage || req.body.currentPage || 1;
  var limit = req.query.limit || req.body.limit || 0;
  var sort = {
    name: req.query.sortName || req.body.sortName || '',
    value: req.query.sortValue || req.body.sortValue || ''
  };

  var searchArray = req.body.searchArray || req.query.searchArray || [];

  if (!res.logs)res.logs = [];

  searchArray.push({key: 'isDeleted', value: 'false'});
  searchArray.push({key: 'assign_status', value: ['unAssigned', 'assigning']});


  orderService.getOrdersByGroupIdsWithStatusArray(currentUser, null, currentPage, limit, sort, searchArray, function (err, result) {
    if (err) {
      req.err = err;
      return next();
    }

    req.data = result;
    return next();
  });
  // userService.getGroupIdsByUser(currentUser, function (err, groupIds) {
  //   if (err) {
  //     req.err = err;
  //     return next();
  //   }
  //
  //   if (!groupIds || groupIds.length <= 0) {
  //     req.err = {err: orderError.group_id_null};
  //     return next();
  //   }
  //
  // 
  // });
};

exports.getUserAllOrders = function (req, res, next) {
  var currentUser = req.user || {};
  var currentPage = req.query.currentPage || req.body.currentPage || 1;
  var limit = req.query.limit || req.body.limit || 0;
  var sort = {
    name: req.query.sortName || req.body.sortName || '',
    value: req.query.sortValue || req.body.sortValue || ''
  };
  var searchArray = req.body.searchArray || req.query.searchArray || [];

  if (!res.logs)res.logs = [];

  orderService.getUserAllOrders(currentUser, currentPage, limit, sort, searchArray, function (err, result) {
    if (err) {
      req.err = err;
      return next();
    }
    req.data = result;
    return next();
  });

  // userService.getGroupIdsByUser(currentUser, function (err, groupIds) {
  //   if (err) {
  //     req.err = err;
  //     //res.logs.push({});
  //     return next();
  //   }
  //
  //   if (!groupIds || groupIds.length <= 0) {
  //     req.err = {err: orderError.group_id_null};
  //     return next();
  //   }
  //
  //  
  // });
};

//获取异常运单(实际提交货时间大于预计提交货时间，有货损，有中途事件，缺件，不包括删除)
exports.getAbnormalOrders = function (req, res, next) {
  var currentUser = req.user || {};
  var currentPage = req.query.currentPage || req.body.currentPage || 1;
  var limit = req.query.limit || req.body.limit;
  var sort = {
    name: req.query.sortName || req.body.sortName || '',
    value: req.query.sortValue || req.body.sortValue || ''
  };
  var searchArray = req.body.searchArray || req.query.searchArray || [];

  userService.getGroupIdsByUser(currentUser, function (err, groupIds) {
    if (err) {
      console.log(err);
      req.err = err;
      return next();
    }

    if (!groupIds || groupIds.length <= 0) {
      req.err = {err: orderError.group_id_null};
      return next();
    }

    orderService.getAbnormalOrders(currentUser, groupIds, currentPage, limit, sort, searchArray, function (err, result) {
      if (err) {
        req.err = err;
        return next();
      }
      req.data = result;
      return next();
    });

  });
};

exports.getAbnormalOrdersCount = function (req, res, next) {
  var currentUser = req.user || {};

  userService.getGroupIdsByUser(currentUser, function (err, groupIds) {
    if (err) {
      console.log(err);
      req.err = err;
      return next();
    }

    if (!groupIds || groupIds.length <= 0) {
      req.err = {err: orderError.group_id_null};
      return next();
    }

    orderService.getAbnormalOrdersCount(currentUser, groupIds, function (err, totalCount) {
      if (err) {
        return res.send(err);
      }
      return res.send({count: totalCount});
    });

  });
};

exports.handleAbnormalOrder = function (req, res, next) {
  var orderId = req.query.order_id || '';
  var currentUser = req.user || {};

  if (!orderId) {
    return res.send({err: orderError.params_null});
  }
  orderService.handleAbnormalOrder(orderId, currentUser, function (err) {
    if (err) {
      return res.send(err);
    }

    return res.send({success: true});
  });
};

exports.getOrderById = function (req, res, next) {

  var currentUser = req.user || {};
  var order_id = req.body.order_id || '';

  Order.findOne({_id: order_id}).populate('order_detail pickup_contact delivery_contact').exec(function (err, orderEntity) {
    if (err) {
      return res.send({err: orderError.internal_system_error});
    }

    if (!orderEntity) {
      return res.send({err: orderError.order_not_exist});
    }

    UserGroup.find({user: currentUser._id}, function (err, userGroups) {
      if (err) {
        return res.send({err: orderError.internal_system_error});
      }

      var canSeeTheOrder = false;
      userGroups.forEach(function (userGroup) {
        if (userGroup.group.toString() === orderEntity.create_group.toString() || userGroup.group.toString() === orderEntity.execute_group.toString()) {
          canSeeTheOrder = true;
          return;
        }
      });

      if (!canSeeTheOrder) {
        return res.send({err: orderError.order_not_visible});
      }

      return res.send(orderEntity);
    });
  });
};
//</editor-fold>

//<editor-fold desc="order_assign_relation">

//批量分配
exports.asssignBatch = function (req, res, next) {
  var user = req.user || {};
  var assignInfo = req.body.assignInfo || [{type: ''}];
  var assignType = assignInfo.type;
  var driver_id;
  if (assignType === 'driver' || assignType === 'warehouse') {
    driver_id = assignInfo.driver_id;
  }
  if (assignInfo.road_order_name) {
    assignInfo.road_order_id = new mongoose.Types.ObjectId();
  }

  async.auto({
    findDriver: function (callback) {
      if (!driver_id) {
        return callback(null, {driver: null});
      }

      Driver.findOne({_id: driver_id}, function (err, driver) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }

        if (!driver) {
          return callback(null, {driver: null});
        }
        return callback(null, {driver: driver});
      });
    },
    batchAssign: ['findDriver', function (callback, result) {
      async.each(assignInfo.order_ids, function (orderId, eachCallback) {
        var order_id = orderId || '';

        Order.findOne({_id: order_id}, function (err, order) {
          if (err) {
            return eachCallback({err: orderError.internal_system_error});
          }
          if (!order) {
            return eachCallback({err: orderError.order_not_exist});
          }
          if (order.status !== 'unAssigned') {
            return eachCallback({err: orderError.order_has_assigned});
          }

          var assignInfoItem = {
            type: assignInfo.type,
            partner_name: assignInfo.partner_name,
            road_order_name: assignInfo.road_order_name,
            road_order_id: assignInfo.road_order_id,
            company_id: assignInfo.company_id,
            driver_id: assignInfo.driver_id,
            order_id: orderId,
            //is_wechat: assignInfo.is_wechat === true || assignInfo.is_wechat === 'true',

            pickup_contact_name: order.pickup_contacts.name || '',
            pickup_contact_phone: order.pickup_contacts.phone || '',
            pickup_contact_mobile_phone: order.pickup_contacts.mobile_phone || '',
            pickup_contact_email: order.pickup_contacts.email || '',
            pickup_contact_address: order.pickup_contacts.address || '',

            delivery_contact_name: order.delivery_contacts.name || '',
            delivery_contact_phone: order.delivery_contacts.phone || '',
            delivery_contact_mobile_phone: order.delivery_contacts.mobile_phone || '',
            delivery_contact_email: order.delivery_contacts.email || '',
            delivery_contact_address: order.delivery_contacts.address || '',

            pickup_start_time: order.pickup_start_time,
            pickup_end_time: order.pickup_end_time,
            delivery_start_time: order.delivery_start_time,
            delivery_end_time: order.delivery_end_time
          };

          order.total_assign_count = 1;
          order.status = 'assigning';
          order.assign_status = 'assigning';
          order.save(function (err, orderResult) {
            if (err || !orderResult)
              return eachCallback({err: orderError.internal_system_error});
            multiAssignOrder(user, order, order.order_details, [assignInfoItem], true).then(function (result) {

              //因为order文档已经发生改变，所以需要重新获取
              Order.findOne({_id: order._id}, function (err, findOrderEntity) {
                if (err) {
                  return eachCallback({err: orderError.internal_system_error});
                }

                findOrderEntity.assigned_count += result.assignedOrderList.length;
                findOrderEntity.assigned_infos = result.assignedInfos;
                if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
                  findOrderEntity.status = 'unPickupSigned';
                  findOrderEntity.assign_status = 'completed';
                }

                findOrderEntity.assign_time = new Date();  //添加分配时间

                //设置路单
                if (assignInfoItem.road_order_name) {
                  findOrderEntity.road_order = {
                    name: assignInfo.road_order_name,
                    _id: assignInfo.road_order_id
                  };
                }

                findOrderEntity.save(function (err) {
                  if (err) {
                    return eachCallback({err: orderError.internal_system_error});
                  }
                  return eachCallback();
                });
              });
            }, function (err) {
              return eachCallback(err);
            });
          });

        });
      }, function (err) {
        if (err) {
          return callback(err);
        }
        return callback();
      });
    }]
  }, function (err, result) {
    if (err) {
      return res.send(err);
    }
    var driver = result.findDriver.driver;
    if (driver) {
      orderService.pushBatchAssignToDriver(driver, assignType);
    }
    return res.send({success: true});
  });
};


function changeOrderNumber(order, newOrderNumber) {
  if (!newOrderNumber) {
    return;
  }
  if (!order.parent_order) {
    return;
  }

  order.order_details.order_number = newOrderNumber;
  order.markModified('order_details');
}

//多段分配指定订单
exports.multiAssign = function (req, res, next) {
  var user = req.user || {};
  var orderId = req.body.order_id || '';
  var newOrderNumber = req.body.new_order_number || '';
  var assignInfos = req.body.assign_infos || [];

  if (assignInfos.length === 0) {
    return res.send({err: orderError.assign_infos_null});
  }

  var newAssignInfos = [];

  async.each(assignInfos, function (assignItem, callback) {
    var assignInfo = new AssignInfo({
      type: assignItem.type,
      driver_username: assignItem.driver_username || '',
      driver_id: assignItem.driver_id || '',
      company_id: assignItem.company_id || '',
      order_id: assignItem.order_id || '',
      is_wechat: assignItem.is_wechat === true || assignItem.is_wechat === 'true',

      pickup_contact_name: assignItem.pickup_contact_name || '',
      pickup_contact_phone: assignItem.pickup_contact_phone || '',
      pickup_contact_mobile_phone: assignItem.pickup_contact_mobile_phone || '',
      pickup_contact_email: assignItem.pickup_contact_email || '',
      pickup_contact_address: assignItem.pickup_contact_address || '',

      delivery_contact_name: assignItem.delivery_contact_name || '',
      delivery_contact_phone: assignItem.delivery_contact_phone || '',
      delivery_contact_mobile_phone: assignItem.delivery_contact_mobile_phone || '',
      delivery_contact_address: assignItem.delivery_contact_address || '',
      delivery_contact_email: assignItem.delivery_contact_email || '',

      pickup_start_time: assignItem.pickup_start_time,
      pickup_end_time: assignItem.pickup_end_time,
      delivery_start_time: assignItem.delivery_start_time,
      delivery_end_time: assignItem.delivery_end_time,
      road_order_name: assignItem.road_order_name || '',
      partner_name: assignItem.partner_name || ''
    });

    newAssignInfos.push(assignInfo);
    return callback();
  }, function (err) {
    if (err) {
      return res.send({err: orderError.internal_system_error});
    }

    Order.findOne({_id: orderId}, function (err, order) {
      if (err) {
        return res.send({err: orderError.internal_system_error});
      }

      if (!order) {
        return res.send({err: orderError.order_not_exist});
      }

      if (order.status !== 'unAssigned') {
        return res.send({err: orderError.order_has_assigned});
      }

      order.total_assign_count = newAssignInfos.length;
      order.status = 'assigning';
      order.assign_status = 'assigning';
      changeOrderNumber(order, newOrderNumber);
      order.assigned_infos = newAssignInfos;
      order.save(function (err, orderEntity) {
        if (err || !orderEntity) {
          return res.send({err: orderError.internal_system_error});
        }

        multiAssignOrder(user, orderEntity, orderEntity.order_details, newAssignInfos, false)
          .then(function (result) {

            Order.findOne({_id: orderEntity._id}, function (err, findOrderEntity) {
              if (err) {
                return res.send({err: orderError.internal_system_error});
              }

              findOrderEntity.assigned_count += result.assignedOrderList.length;
              findOrderEntity.assigned_infos = result.assignedInfos;

              if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
                findOrderEntity.status = 'unPickupSigned';
                findOrderEntity.assign_status = 'completed';
              }

              findOrderEntity.assign_time = new Date();  //添加分配时间

              findOrderEntity.save(function (err, orderResult) {
                if (err) {
                  return res.send({err: orderError.internal_system_error});
                }

                return res.send(result);
              });

            });

          }, function (err) {
            return res.send(err);
          });
      });
    });
  });
};

function updateOrderStatusAfterContinueAssign(orderId, callback) {
  if (!orderId) {
    return callback();
  }
  Order.findOne({_id: orderId}, function (err, order) {
    if (err || !order) {
      return callback();
    }

    Order.find({
      parent_order: order,
      $or: [{delete_status: {$exists: false}}, {delete_status: false}]
    }, function (err, childOrders) {
      var isComplete = true;
      for (var i = 0; i < childOrders.length; i++) {
        if (childOrders[i].status !== 'completed') {
          isComplete = false;
          break;
        }
      }

      if (isComplete) {
        order.status = 'completed';
        order.save(function (err, savedOrder) {
          if (err || !savedOrder) {
            return callback();
          }
          return updateOrderStatusAfterContinueAssign(savedOrder.parent_order, callback);
        });
      }
      else {
        return callback();
      }
    });
  });
}

//继续分配，不考虑分段数目改变
exports.continueAssign = function (req, res, next) {
  var user = req.user || {};
  var orderId = req.body.order_id || '';
  var assignInfos = req.body.assign_infos || [];

  if (assignInfos.length === 0) {
    return res.send({err: orderError.assign_infos_null});
  }


  var unAssignInfos = [];
  var toBeUpdatedAssignInfos = {};
  async.each(assignInfos, function (assignItem, callback) {
    if (assignItem.is_assigned === true || assignItem.is_assigned === 'true') {
      return callback();
    }
    var assignInfo = new AssignInfo({
      _id: assignItem._id,
      type: assignItem.type,
      driver_username: assignItem.driver_username || '',
      driver_id: assignItem.driver_id || '',
      company_id: assignItem.company_id || '',
      order_id: assignItem.order_id || '',
      is_assigned: assignItem.is_assigned === true || assignItem.is_assigned === 'true',
      is_wechat: assignItem.is_wechat === true || assignItem.is_wechat === 'true',

      pickup_contact_name: assignItem.pickup_contact_name || '',
      pickup_contact_phone: assignItem.pickup_contact_phone || '',
      pickup_contact_mobile_phone: assignItem.pickup_contact_mobile_phone || '',
      pickup_contact_email: assignItem.pickup_contact_email || '',
      pickup_contact_address: assignItem.pickup_contact_address || '',

      delivery_contact_name: assignItem.delivery_contact_name || '',
      delivery_contact_phone: assignItem.delivery_contact_phone || '',
      delivery_contact_mobile_phone: assignItem.delivery_contact_mobile_phone || '',
      delivery_contact_address: assignItem.delivery_contact_address || '',
      delivery_contact_email: assignItem.delivery_contact_email || '',

      pickup_start_time: assignItem.pickup_start_time,
      pickup_end_time: assignItem.pickup_end_time,
      delivery_start_time: assignItem.delivery_start_time,
      delivery_end_time: assignItem.delivery_end_time,
      road_order_name: assignItem.road_order_name || '',
      partner_name: assignItem.partner_name || ''
    });
    if (assignItem._id) {
      toBeUpdatedAssignInfos[assignItem._id] = assignInfo;
    }

    unAssignInfos.push(assignInfo);
    return callback();
  }, function (err) {
    if (err) {
      return res.send({err: orderError.internal_system_error});
    }
    Order.findOne({_id: orderId}, function (err, order) {
      if (err) {
        return res.send({err: orderError.internal_system_error});
      }

      if (!order) {
        return res.send({err: orderError.order_not_exist});
      }

      if (order.assign_status !== 'assigning') {
        return res.send({err: orderError.order_not_assigning});
      }

      //获取order已分配过的assigninfo
      var assigned_infos = [];
      for (var i = 0; i < order.assigned_infos.length; i++) {
        var __assignInfo = order.assigned_infos[i];
        if (__assignInfo.is_assigned === true || __assignInfo.is_assigned === 'true') {
          if (toBeUpdatedAssignInfos[__assignInfo._id]) {
            __assignInfo = toBeUpdatedAssignInfos[__assignInfo._id];
          }
          assigned_infos.push(__assignInfo);
        }
      }
      multiAssignOrder(user, order, order.order_details, unAssignInfos, false)
        .then(function (result) {

          Order.findOne({_id: order._id}, function (err, findOrderEntity) {
            if (err) {
              return res.send({err: orderError.internal_system_error});
            }

            assigned_infos = assigned_infos.concat(result.assignedInfos);

            findOrderEntity.total_assign_count = assigned_infos.length;
            findOrderEntity.assigned_count += result.assignedOrderList.length;
            findOrderEntity.assigned_infos = assigned_infos;

            console.log("continue findOrderEntity.assigned_infos " + JSON.stringify(findOrderEntity.assigned_infos));

            if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
              if (findOrderEntity.status === 'unAssigned' || findOrderEntity.status === 'assigning') {
                findOrderEntity.status = 'unPickupSigned';
              }
              findOrderEntity.assign_status = 'completed';


              findOrderEntity.save(function (err, orderResult) {
                if (err) {
                  return res.send({err: orderError.internal_system_error});
                }
                updateOrderStatusAfterContinueAssign(orderResult._id, function () {
                  return res.send(result);
                });
              });

            }
            else {
              findOrderEntity.save(function (err, orderResult) {
                if (err) {
                  return res.send({err: orderError.internal_system_error});
                }
                return res.send(result);
              });
            }
          });
        }, function (err) {
          return res.send(err);
        });
    });
  });
};


exports.updateAssign = function (req, res, next) {
  var orderId = req.body.order_id || req.query.order_id || '';
  var newAssignInfos = req.body.assign_infos || req.query.assign_infos || '';
  var currentUser = req.user || '';
  if (!orderId || !newAssignInfos || newAssignInfos.length === 0 || !currentUser) {
    req.err = {err: orderError.post_data_empty};
    return next();
  }

  async.auto({
    formatAssignInfos: function (callback) {
      var assignInfos = [];
      async.each(newAssignInfos, function (assignItem, eachCallback) {
        var assignInfo = new AssignInfo({
          type: assignItem.type,
          driver_username: assignItem.driver_username || '',
          driver_id: assignItem.driver_id || '',
          company_id: assignItem.company_id || '',
          order_id: assignItem.order_id || '',
          is_wechat: assignItem.is_wechat === true || assignItem.is_wechat === 'true',

          pickup_contact_name: assignItem.pickup_contact_name || '',
          pickup_contact_phone: assignItem.pickup_contact_phone || '',
          pickup_contact_mobile_phone: assignItem.pickup_contact_mobile_phone || '',
          pickup_contact_email: assignItem.pickup_contact_email || '',
          pickup_contact_address: assignItem.pickup_contact_address || '',

          delivery_contact_name: assignItem.delivery_contact_name || '',
          delivery_contact_phone: assignItem.delivery_contact_phone || '',
          delivery_contact_mobile_phone: assignItem.delivery_contact_mobile_phone || '',
          delivery_contact_address: assignItem.delivery_contact_address || '',
          delivery_contact_email: assignItem.delivery_contact_email || '',

          pickup_start_time: assignItem.pickup_start_time,
          pickup_end_time: assignItem.pickup_end_time,
          delivery_start_time: assignItem.delivery_start_time,
          delivery_end_time: assignItem.delivery_end_time,
          road_order_name: assignItem.road_order_name || '',
          partner_name: assignItem.partner_name || ''
        });

        assignInfos.push(assignInfo);
        return eachCallback();
      }, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, assignInfos);
      });
    },
    findOrder: function (callback) {
      Order.findOne({_id: orderId, status: {$in: ['unPickupSigned', 'assigning']}}, function (err, order) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }
        if (!order) {
          return callback({err: orderError.invalid_order_id});
        }

        return callback(null, order);
      });
    },
    removeAssignedOrders: ['findOrder', 'formatAssignInfos', function (callback, result) {
      var order = result.findOrder;
      order.status = 'unAssigned';
      order.assign_status = 'unAssigned';
      order.assigned_infos = [];
      order.execute_companies = [];
      order.execute_drivers = [];
      order.total_assign_count = 0;
      order.assigned_count = 0;
      order.save(function (err, saveOrder) {
        removeChildOrders(saveOrder, function (err, result) {
          if (err) {
            return callback(err);
          }
          return callback();
        });
      });

      function removeChildOrders(order, callback) {
        if (!order) {
          return callback();
        }

        Order.find({parent_order: order, delete_status: false}).populate('execute_driver').exec(function (err, orders) {
          if (err || !orders) {
            return callback({err: orderError.internal_system_error});
          }

          if (orders.length === 0) {
            return callback();
          }

          async.each(orders, function (childOrder, eachCallback) {
            childOrder.delete_status = true;
            childOrder.save(function (err, saveChildOrder) {
              if (saveChildOrder.type === 'company') {
                return removeChildOrders(saveChildOrder, eachCallback);
              }
              else {
                return pushRemoveInfoToDriver(saveChildOrder.execute_driver, childOrder._id, eachCallback);
              }
            });
          }, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        });
      }

      function pushRemoveInfoToDriver(driver, orderId, callback) {
        orderService.pushDeleteInfoToDriver(driver, orderId);
        return callback();
      }
    }],
    addNewAssignOrders: ['findOrder', 'removeAssignedOrders', function (callback, result) {
      var assign_infos = result.formatAssignInfos;
      var order = result.findOrder;

      multiAssignOrder(currentUser, order, order.order_details, assign_infos, false)
        .then(function (result) {
          Order.findOne({_id: order._id}, function (err, findOrderEntity) {
            if (err) {
              return res.send({err: orderError.internal_system_error});
            }

            findOrderEntity.assigned_count += result.assignedOrderList.length;
            findOrderEntity.assigned_infos = result.assignedInfos;
            findOrderEntity.total_assign_count = assign_infos.length;
            if (findOrderEntity.assigned_count > 0) {
              findOrderEntity.status = 'assigning';
              findOrderEntity.assign_status = 'assigning';
            }

            if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
              findOrderEntity.status = 'unPickupSigned';
              findOrderEntity.assign_status = 'completed';
            }

            findOrderEntity.assign_time = new Date();  //添加分配时间

            findOrderEntity.save(function (err, orderResult) {
              if (err) {
                return callback({err: orderError.internal_system_error});
              }
              return callback(null, result);
            });
          });
        }, function (err) {
          return callback(err);
        });
    }],

    updateParentExecuters: ['addNewAssignOrders', 'findOrder', function (callback, result) {
      orderService.updateParentExecuters(result.findOrder.parent_order, function (err) {
        return callback(err);
      });
    }]
  }, function (err, results) {
    if (err) {
      req.err = err;
      return next();
    }

    req.data = {success: true};
    return next();
  });
};

//</editor-fold>


//获取订单详细信息
exports.getOrderDetailById = function (req, res, next) {

  var currentUser = req.user || {};
  var orderId = req.body.order_id || req.query.order_id || '';

  Order.findOne({_id: orderId})
    .populate('order_detail pickup_contact delivery_contact create_company execute_company execute_group create_group execute_driver')
    .exec(function (err, order) {
      if (err) {
        return res.send({err: orderError.internal_system_error});
      }

      if (!order) {
        return res.send({err: orderError.order_not_exist});
      }

      userService.getGroups(currentUser._id, function (err, userGroups) {
        if (err) {
          return res.send(err);
        }

        var canSeeTheOrder = false;
        userGroups.forEach(function (userGroup) {
          if (userGroup.group._id.toString() === order.create_group._id.toString() || userGroup.group._id.toString() === order.execute_group._id.toString()) {
            canSeeTheOrder = true;
            return;
          }
        });

        if (!canSeeTheOrder) {
          return res.send({err: orderError.order_not_visible});
        }

        return res.send(order);
      });
    });
};

//运单查询页面重运单详情信息获取
exports.getOrderAssignedDetailById = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.body.order_id || req.query.order_id || '';
  var viewer = req.body.viewer || req.query.viewer || '';

  var otherCondition = {};
  if (viewer) {
    if (viewer === 'sender') {
      otherCondition.sender = true;
    }
    if (viewer === 'receiver') {
      otherCondition.receiver = true;
    }
  }

  Order.findOne({_id: orderId})
    .populate('order_detail create_company execute_company execute_group create_group execute_driver pickup_contact delivery_contact tender')
    .exec(function (err, order) {
      if (err) {
        return res.send({err: orderError.internal_system_error});
      }

      if (!order) {
        return res.send({err: orderError.order_not_exist});
      }

      var result = {
        orderDetail: {
          order_id: order._id,
          number: order.order_number,
          customer_name: order.customer_name,
          refer_numbers: order.refer_order_number,
          original_order_number: order.original_order_number,
          goods_name: order.goods_name,
          count: order.count ? order.count + order.count_unit : '',
          weight: order.weight ? order.weight + order.weight_unit : '',
          volume: order.volume ? order.volume + order.volume_unit : '',
          count_unit: order.count_unit,
          weight_unit: order.weight_unit,
          volume_unit: order.volume_unit,
          goods: order.goods,
          description: order.description,
          freight_charge: order.freight_charge,
          status: order.status,
          source: order.source,
          sender_name: order.sender_name,
          receiver_name: order.receiver_name,
          damaged: order.damaged,
          pickup_start_time: order.pickup_start_time,
          pickup_end_time: order.pickup_end_time,
          pickup_contacts: order.pickup_contacts,
          delivery_start_time: order.delivery_start_time,
          delivery_end_time: order.delivery_end_time,
          delivery_contacts: order.delivery_contacts,
          delivery_by_qrcode: order.delivery_by_qrcode ? true : false,
          assigned_infos: order.assigned_infos,
          parent_order: order.parent_order,
          salesmen: order.salesmen,
          confirm_status: order.confirm_status,
          tender: order.tender
        },
        //assignedCompanyOrders: assignedOrders
      };
      if (order.salesmen && order.salesmen.length > 0) {
        if (order.salesmen[0] && order.salesmen[0]._id) {
          return res.send(result);
        } else {
          var usernames = [];
          order.salesmen.forEach(function (s) {
            if (s && s.username) {
              usernames.push(s.username);
            }
          });
          SalesmanCompany.find({username: usernames}).lean().exec(function (salesmen, err) {
            if (err) {
              console.log(err);
              res.send(result);
            } else {
              result.orderDetail.salesmen = salesmen;
              res.send(result);
            }
          });
        }
      } else {
        return res.send(result);
      }

      // orderService.getOrderAssignedInfoByOrderId(order, function (err, assignedOrders) {
      //   if (err) {
      //     return res.send(err);
      //   }
      //
      //
      // });


      // orderService.isOrderAllowSeeing(order, currentUser, otherCondition, function (err, canSeeing) {
      //   if (err) {
      //     return res.send(err);
      //   }
      //   // if (!canSeeing) {
      //   //   return res.send({err: orderError.order_not_visible});
      //   // }
      //
      // });

    });
};

//根据订单Id获取所有子订单
exports.getChildrenOrdersById = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.body.order_id || req.query.order_id || '';

  orderService.getChildrenOrders(orderId, function (err, order) {
    if (err)
      return res.send({err: err});
    else
      return res.send(order);
  });
};

//<editor-fold desc="分享运单">

//转换订单的单位
function getOrderUnitString(order_detail) {
  var unitString = '';
  if (order_detail.count)
    unitString += order_detail.count.toString() + order_detail.count_unit;
  if (order_detail.weight) {
    if (order_detail.count)
      unitString += ' | ';

    unitString += order_detail.weight.toString() + order_detail.weight_unit;
  }
  if (order_detail.volume) {
    if (order_detail.weight)
      unitString += ' | ';

    unitString += order_detail.volume.toString() + order_detail.volume_unit;
  }

  if (!unitString)
    unitString = '未填写';

  return unitString;
}

//转换订单的状态
function getOrderStatusString(order_status) {
  var statusString = '';

  switch (order_status) {
    case 'unAssigned':
      statusString = '未分配';
      break;
    case 'assigning':
      statusString = '分配中';
      break;
    case 'unPickupSigned':
    case 'unPickuped':
      statusString = '未提货';
      break;
    case 'unDeliverySigned':
    case 'unDeliveried':
      statusString = '未交货';
      break;
    case 'completed':
      statusString = '已完成';
      break;
    default:
      statusString = '未知';
      break;
  }
  return statusString;
}

//发送订单分享
function shareOrdersWithEmail(order_ids, emailAddress, isNewEmail, companyName, callback) {
  //得到运单详情
  Order.find({_id: {$in: order_ids}}).populate('order_detail')
    .sort({'create_time': -1})
    .exec(function (err, orders) {
      if (err) {
        callback({err: orderError.internal_system_error});
      }
      if (!orders) {
        callback({err: orderError.order_not_exist});
      }
      var orderArray = [];
      for (var index = 0; index < orders.length; index++) {
        var orderItem = {
          serialNo: index + 1,
          order_number: orders[index].order_details.order_number,
          goods: orders[index].order_details.goods_name,
          weight: getOrderUnitString(orders[index].order_details),
          status: getOrderStatusString(orders[index].status)
        };
        orderArray.push(orderItem);
      }

      var templateFileName = path.join(__dirname, '../../web/zzqs2/templates/email_sent/order_share_email.client.view.html');

      fs.readFile(templateFileName, 'utf8', function (err, str) {
        if (err) {
          callback({err: err});
        }

        var html = ejs.render(str, {
            companyName: companyName, orders: orderArray, isNewEmail: isNewEmail,
            logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
            orderMapUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_map.png',
            websiteUrl: config.serverAddress,
            signUpUrl: config.serverAddress + 'signup',
            orderFollowUrl: config.serverAddress + 'zzqs2/index#/order_follow'
          }
        );

        emailLib.sendEmail(emailAddress, '柱柱签收网邮箱注册', html,
          function (err, result) {
            if (err) {
              callback({err: err});
            }

            callback(err, result);
          });
      });
    });
}

function buildOrderShare(reception, orderIds, callback) {
  async.eachSeries(orderIds, function (orderId, itemCallback) {

    OrderShare.findOne({username: reception, order: orderId}).exec(function (err, orderShareEntity) {
      if (err) {
        return callback({err: orderShareError.internal_system_error});
      }

      if (!orderShareEntity) {
        var newOrderShare = new OrderShare({
          order: orderId,
          username: reception
        });

        newOrderShare.save(function (err, orderShareEntity) {
          if (err || !orderShareEntity) {
            return itemCallback({err: orderShareError.internal_system_error});
          }

          return itemCallback();
        });
      } else {
        return itemCallback();
      }
    });

  }, function (err) {
    if (err) {
      return callback(err);
    }

    return callback(null);
  });
}

function buildOrderShareRelation(orderIds, receptions, callback) {
  var failedReceptions = [];
  var successReceptions = [];
  var successReceptionsString = '';
  async.eachSeries(receptions, function (reception, itemCallback) {
    buildOrderShare(reception, orderIds, function (err) {
      if (err) {
        failedReceptions.push(reception);
      }

      successReceptionsString += (reception + ',');
      successReceptions.push(reception);

      return itemCallback();
    });
  }, function (err) {
    if (err) {
      return callback(err);
    }

    return callback(null, {
      failedReceptions: failedReceptions,
      successReceptions: successReceptions,
      successReceptionsString: successReceptionsString.substr(0, successReceptionsString.length - 1)
    });
  });
}


//分享订单
exports.shareOrders = function (req, res, next) {
  var user = req.user || {};
  var order_ids = req.body.order_ids || [];
  var recipients = req.body.recipients || [];
  var isInputEmail = req.body.isInputEmail || '';

  if (order_ids.length <= 0) {
    req.err = orderError.orders_to_share_null;
    return next();
  }
  if (recipients.length <= 0) {
    req.err = orderError.recipients_to_share_null;
    return next();
  }

  if (isInputEmail && (isInputEmail === true || isInputEmail === 'true' || isInputEmail === 'True'))
    isInputEmail = true;
  else
    isInputEmail = false;

  //正则表达式验证邮箱
  var toEmailAddress = '';
  var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  recipients.forEach(function (emailAddress) {
    if (emailReg.test(emailAddress)) {
      toEmailAddress += emailAddress + ',';
    }
  });

  if (!toEmailAddress) {
    req.err = orderError.orders_to_share_null;
    return next();
  }
  toEmailAddress = toEmailAddress.substr(0, toEmailAddress.length - 1);

  var theCorrectEmailAddresses = toEmailAddress.split(',');
  var invalidEmailAddressCount = recipients.length - theCorrectEmailAddresses.length;

  buildOrderShareRelation(order_ids, theCorrectEmailAddresses, function (err, orderShareResult) {
    if (err) {
      req.err = err;
      return next();
    }

    if (orderShareResult.failedReceptions.length > 0) {

      if (orderShareResult.successReceptions.length > 0) {
        shareOrdersWithEmail(order_ids, orderShareResult.successReceptionsString, false, user.company.name, function (err, result) {
          if (err) {
            req.err = err;
            return next();
          }
          req.data = {
            totalReceptionsCount: recipients.length,
            invalidEmailReceptionsCount: invalidEmailAddressCount,
            failedReceptions: orderShareResult.failedReceptions,
            successReceptions: orderShareResult.successReceptions,
            successReceptionsString: orderShareResult.successReceptionsString
          };
          return next();
        });

      } else {
        req.data = {
          totalReceptionsCount: recipients.length,
          invalidEmailReceptionsCount: invalidEmailAddressCount,
          failedReceptions: orderShareResult.failedReceptions,
          successReceptions: orderShareResult.successReceptions,
          successReceptionsString: orderShareResult.successReceptionsString
        };
        return next();
      }

    }
    else {//分享的关联建立成功
      //分享指定的Email用户
      if (isInputEmail) {
        var isNewEmail = true;
        User.findOne({username: recipients[0].toString()}, function (err, users) {
          if (err) {
            req.err = err;
            return next();
          }
          if (users) {
            isNewEmail = false;
          }
          shareOrdersWithEmail(order_ids, orderShareResult.successReceptionsString, isNewEmail, user.company.name, function (err, result) {
            if (err) {
              req.err = err;
              return next();
            }

            req.data = {
              totalReceptionsCount: recipients.length,
              invalidEmailReceptionsCount: invalidEmailAddressCount,
              failedReceptions: 0,
              successReceptions: orderShareResult.successReceptions,
              successReceptionsString: orderShareResult.successReceptionsString
            };
            return next();
          });
        });
      }
      else {//分享给指定公司或者合作公司的员工
        shareOrdersWithEmail(order_ids, orderShareResult.successReceptionsString, false, user.company.name, function (err, result) {
          if (err) {
            req.err = err;
            return next();
          }

          req.data = {
            totalReceptionsCount: recipients.length,
            invalidEmailReceptionsCount: invalidEmailAddressCount,
            failedReceptions: orderShareResult.failedReceptions,
            successReceptions: orderShareResult.successReceptions,
            successReceptionsString: orderShareResult.successReceptionsString
          };
          return next();
        });
      }
    }

  });

};

//</editor-fold>

var getTodayStartTime = function (date) {
  var todayStart = date ? date : new Date();
  todayStart.setHours(0);
  todayStart.setMinutes(0);
  todayStart.setSeconds(0);

  return todayStart;
};

exports.getRemainOrderCreateCount = function (req, res, next) {
  var currentUser = req.user || {};
  var todayStartTime = getTodayStartTime();

  async.auto({
    hasCreatedCount: function (callback) {
      Order.find({create_company: currentUser.company._id, create_time: {$gte: todayStartTime, $lte: new Date()}})
        .count({}).exec(function (err, todayOrderCount) {
        if (err) {
          return callback(orderError.internal_system_error);
        }
        else {
          return callback(null, todayOrderCount);
        }
      });
    },
    maxOrderCount: function (callback) {
      Company.findOne({_id: currentUser.company._id}, function (err, companyEntity) {
        if (err) {
          return callback(orderError.internal_system_error);
        }
        if (!companyEntity) {
          return callback(orderError.company_not_exist);
        }

        return callback(null, companyEntity.max_order_count_per_day);
      });
    }
  }, function (err, result) {
    if (err) {
      req.err = {err: err};
      return next();
    }

    if (!result.maxOrderCount || result.maxOrderCount <= 0) {
      result.maxOrderCount = 1000;
    }
    var remainOrderCreateCount = result.maxOrderCount - result.hasCreatedCount;
    if (remainOrderCreateCount < 0) {
      remainOrderCreateCount = 0;
    }

    req.data = {remain: remainOrderCreateCount};
    return next();
  });
};


//<editor-fold desc="被分享运单相关">
//被分享运单列表
exports.sharedOrderList = function (req, res, next) {
  var currentUser = req.user;
  var currentPage = req.body.currentPage || req.query.currentPage || 1;
  var limit = req.body.limit || req.query.limit;

  OrderShare.find({username: currentUser.username}).exec(function (err, orderShares) {
    if (err) {
      req.err = {err: orderShareError.internal_system_error};
      return next();
    }

    if (!orderShares) {
      req.data = {totalCount: 0, currentPage: currentPage, limit: limit, orders: []};
      return next();
    }
    var orderIds = [];
    orderShares.forEach(function (orderShare) {
      orderIds.push(orderShare.order.toString());
    });

    orderService.getOrders(orderIds, currentPage, limit, function (err, result) {
      if (err) {
        req.err = err;
        return next();
      }

      req.data = result;
      return next();
    });
  });
};

exports.getOrderAssignedInfo = function (req, res, next) {
  var currentUser = req.user;
  var orderId = req.body.order_id || req.query.order_id;

  OrderShare.findOne({
    order: orderId,
    username: currentUser.username
  }).populate('order').exec(function (err, orderShareEntity) {
    if (err) {
      req.err = {err: orderError.internal_system_error};
      return next();
    }

    if (!orderShareEntity) {
      req.err = {err: orderError.order_not_visible};
      return next();
    }

    if (!orderShareEntity.order) {
      req.err = {err: orderError.order_not_exist};
      return next();
    }

    orderService.getOrderAssignedInfoByOrderId(orderShareEntity.order, function (err, assignedOrders) {
      if (err) {
        req.err = err;
        return next();
      }

      req.data = {
        orderDetail: {
          number: orderShareEntity.order.order_details.order_number,
          customer_name: orderShareEntity.order.customer_name,
          refer_numbers: orderShareEntity.order.order_details.refer_order_number,
          goods_name: orderShareEntity.order.order_details.goods_name,
          count: orderShareEntity.order.order_details.count ? orderShareEntity.order.order_details.count + orderShareEntity.order.order_details.count_unit : '',
          weight: orderShareEntity.order.order_details.weight ? orderShareEntity.order.order_details.weight + orderShareEntity.order.order_details.weight_unit : '',
          volume: orderShareEntity.order.order_details.volume ? orderShareEntity.order.order_details.volume + orderShareEntity.order.order_details.volume_unit : '',
          description: orderShareEntity.order.description,
          freight_charge: orderShareEntity.order.order_details.freight_charge,
          status: orderShareEntity.order.status
        },
        assignedCompanyOrders: assignedOrders
      };
      return next();

    });
  });
};
//</editor-fold>

//<editor-fold desc="临时司机相关">
exports.getTemporaryDriverOrder = function (req, res, next) {
  var order_id = req.order_id || '';
  var driver = req.driver;
  if (!order_id) {
    req.err = {err: orderError.order_id_not_exist};
    return next();
  }

  Order.findOne({_id: order_id}, function (err, driverOrder) {
    if (err) {
      req.err = {err: orderError.internal_system_error};
      return next();
    }
    if (!driverOrder) {
      req.err = {err: orderError.order_not_exist};
      return next();
    }

    switch (driverOrder.status) {
      case 'unAssigned':
      case 'assigning':
        console.log('getTemporaryDriverOrder error, driver order status is not right');
        return res.send({err: {type: 'order_status_wrong'}});
      case 'unPickupSigned':
      case 'unPickuped':
        return res.render(path.join(__dirname, '../../web/sms/driver_upload_event/views/driver_pickup.client.view.html'), {
          order: JSON.stringify(driverOrder),
          driverId: driver._id
        });
      case 'unDeliverySigned':
      case 'unDeliveried':
        return res.render(path.join(__dirname, '../../web/sms/driver_upload_event/views/driver_delivery.client.view.html'), {
          order: JSON.stringify(driverOrder),
          driverId: driver._id
        });
      case 'completed':
        return res.render(path.join(__dirname, '../../web/sms/driver_upload_event/views/completed.client.view.html'), {orderNumber: driverOrder.order_details.order_number});
      default:
        console.log('getTemporaryDriverOrder error, driver order status can not recognize');
        return res.send({err: {type: 'order_status_recognize_failed'}});
    }
  });

};

//</editor-fold>
var exec = require('child_process').exec;
exports.exportOrderToPdf = function (req, res, next) {
  var order_id = req.query.order_id;
  var filename = order_id + '.pdf';
  var header = '--header-html ' + config.serverAddress + 'resources/pdf_templates/page_header ';
  var headerSpace = '--header-spacing 10 ';
  var body = config.serverAddress + 'resources/pdf_templates/page?order_id=' + order_id;
  var footer = ' --footer-html ' + config.serverAddress + 'resources/pdf_templates/page_footer ';
  var footerSpace = '--footer-spacing 10 ';
  var cmd = 'wkhtmltopdf ' + footerSpace + headerSpace + header + footer + body + ' ' + filename;

  exec(cmd, {pageSize: 'letter'}, function (a, b, c) {
    console.log(a);
    console.log(b);
    console.log(c);
    var filename = order_id + '.pdf';
    return res.download(filename, filename);
  });
};

function generateMapTraceUrl(result) {
  var traces = [];
  var realTraces = [];
  var location = '';
  result.forEach(function (driverTraces) {
    traces = traces.concat(driverTraces.traces);
  });

  for (var i = 0; i < traces.length; i++) {
    if (i > 200) {
      break;
    }
    if (i === 0) {
      location += traces[i].location[0] + ',' + traces[i].location[1];
    }
    else {
      location += ';' + traces[i].location[0] + ',' + traces[i].location[1];
    }
    realTraces.push(traces[i]);
  }

  var markers1 = realTraces[realTraces.length - 1].location[0] + ',' + realTraces[realTraces.length - 1].location[1];
  var markers2 = realTraces[0].location[0] + ',' + realTraces[0].location[1];
  var markers = markers1 + '|' + markers2;

  var icon = '-1,' + config.serverAddress + '/zzqs2/images/icon/map/map_pickup_small.png|-1,' + config.serverAddress + 'zzqs2/images/icon/map/map_delivery_small.png';

  return 'http://api.map.baidu.com/staticimage?width=600&height=300&paths= ' + location + '&pathStyles=0xff0000,2,1&markers=' + markers + '&markerStyles=' + icon;
}

exports.exportOrderToPdfPage = function (req, res, next) {
  var orderId = req.query.order_id;

  transportEventService.getEventsByCompanyOrderId(orderId, function (err, orderEvents) {
    if (err) {
      return res.send(err);
    }

    orderService.getDriverChildrenOrders(orderId, function (err, driverOrders) {
      if (err) {
        return res.send(err);
      }

      function getTextByEventType(type) {
        switch (type) {
          case  'pickup':
            return '提货';
          case  'delivery':
            return '交货';
        }
        return '事件';
      }

      function getPhotoByKey(key) {
        return 'http://7xiwrb.com1.z0.glb.clouddn.com/@' + key;
      }

      function getFormatTime(time) {
        var t = new Date(time);
        return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() + ' ' + t.getHours() + ':' + t.getSeconds() + ':' + t.getMinutes();
      }

      function getCountWeightVolume(order) {
        if (order.delivery_events.length > 0) {
          return order.delivery_events[order.delivery_events.length - 1].actual_goods_record ? order.delivery_events[order.delivery_events.length - 1].actual_goods_record.countWeightVolume : '未填';
        }
        else {
          return '未填';
        }
      }

      function getRealAddress(order) {
        if (order.delivery_events.length > 0) {
          return order.delivery_events[order.delivery_events.length - 1].address;
        }
        return '未知';
      }

      function getLastCredential(order) {

        if (order.delivery_events.length > 0) {
          var credential_photos = order.delivery_events[order.delivery_events.length - 1].photos;
          if (credential_photos && credential_photos.length > 0) {
            return getPhotoByKey(credential_photos[credential_photos.length - 1].url);
          }
        }

        return 'images/error.jpg';
      }

      traceService.getTracesByOrders(driverOrders)
        .then(function (result) {
          var temp = path.join(__dirname, '../../web/resources/pdf_templates/order_credential.client.view.html');
          return res.render(temp, {
            url: generateMapTraceUrl(result),
            order: orderEvents.order,
            events: orderEvents.events,
            allOrderInfos: orderEvents.allOrderInfos,
            getTextByEventType: getTextByEventType,
            getPhotoByKey: getPhotoByKey,
            getFormatTime: getFormatTime,
            getCountWeightVolume: getCountWeightVolume,
            getRealAddress: getRealAddress,
            getLastCredential: getLastCredential
          });
        }, function (err) {
          return res.send(err);
        });
    });
  });
};

exports.exportOrderToPdfPageHeader = function (req, res, next) {
  return res.render(path.join(__dirname, '../../web/resources/pdf_templates/order_credential_header.client.view.html'));
};

exports.exportOrderToPdfPageFooter = function (req, res, next) {
  return res.render(path.join(__dirname, '../../web/resources/pdf_templates/order_credential_footer.client.view.html'));
};

exports.getPickupAddressList = function (req, res, next) {
  var senderName = req.query.sender_name || '';
  var pickupAddress = req.query.pickup_address || '';
  var companyId = req.user.company._id || '';

  if (!senderName || !pickupAddress || !companyId) {
    return res.send({err: orderError.params_invalid});
  }

  console.log(senderName)
  console.log(pickupAddress)
  console.log(companyId)

  orderService.getPickupAddressList(senderName, pickupAddress, companyId, function (err, addressList) {
    return res.send(err || addressList);
  });
};