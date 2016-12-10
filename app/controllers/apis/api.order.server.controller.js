'use strict';

var async = require('async'),
  path = require('path'),
  cryptoLib = require('../../libraries/crypto'),
  appDb = require('../../../libraries/mongoose').appDb,
  pushLib = require('../../libraries/getui'),
  companyError = require('../../errors/company'),
  orderApiError = require('../../errors/apis/api.order'),
  orderError = require('../../errors/order'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  UserGroup = appDb.model('UserGroup'),
  AssignInfo = appDb.model('AssignInfo'),
  CompanyKey = appDb.model('CompanyKey'),
  User = appDb.model('User'),
  Order = appDb.model('Order'),
  Driver = appDb.model('Driver'),
  Contact = appDb.model('Contact'),
  Trace = appDb.model('Trace'),
  orderApiService = require('../../services/api/api.order'),
  traceService = require('../../services/trace'),
  orderService = require('../../services/order'),
  SalesmanCompanyService = require('../../services/wechat/salesman_company'),
  Promise = require('promise');

exports.generateApiKey = function (req, res, next) {
  var companyName = req.query.companyName || '';
  if (companyName === '') {
    return res.send({err: {type: 'invalid_company_name'}});
  }

  Company.findOne({name: companyName}, function (err, company) {
    if (err) {
      console.error(err);
      return res.send({err: companyError.internal_system_error});
    }

    if (!company) {
      return res.send({err: companyError.company_not_exist});
    }

    var pk = cryptoLib.encryptString({
      name: company.name,
      time: new Date().getMilliseconds()
    }, 'api_pk');

    var sk = cryptoLib.encryptString({
      name: company.name,
      time: new Date().getMilliseconds()
    }, 'api_sk');

    var md5str = cryptoLib.toMd5(pk + '&' + sk);

    CompanyKey.findOne({company: company._id}, function (err, companyKey) {
      if (err) {
        return res.send({err: companyError.internal_system_error});
      }

      if (!companyKey) {
        companyKey = new CompanyKey({
          company: company._id
        });
      }
      companyKey.public_key = pk;
      companyKey.secret_key = sk;
      companyKey.md5_str = md5str;
      companyKey.save(function (err, result) {
        if (err || !result) {
          return res.send({err: companyError.internal_system_error});
        }
        return res.send(result);
      });
    });
  });
};

exports.createMultiOrders = function (req, res, next) {
  var group_name = req.body.group_name || '';
  var order_infos = req.body.order_infos;
  var company = req.company;

  group_name = group_name === '全体成员' ? 'default_group' : group_name;

  if (!group_name) {
    return res.send({err: {type: 'invalid_group_name'}});
  }

  if (!(order_infos instanceof Array)) {
    try {
      order_infos = JSON.parse(order_infos);
    }
    catch (e) {
      return res.send({err: {type: 'invalid_order_infos'}});
    }
    if (!(order_infos instanceof Array)) {
      return res.send({err: {type: 'invalid_order_infos'}});
    }
  }

  if (order_infos.length > 50) {
    return res.send({err: {type: 'order_length_too_long', message: 'order count must less than 50 per request'}});
  }

  async.auto({
    findCompany: function (callback) {
      var limitCountPerDay = company.max_order_count_per_day || 1000;
      var now = new Date();
      var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      Order.count({
        execute_company: company,
        create_company: company,
        $and: [{create_time: {$gte: startTime}}, {create_time: {$lte: endTime}}]
      }, function (err, count) {
        if (err) {
          return callback({err: companyError.internal_system_error});
        }
        if (limitCountPerDay <= count) {
          return callback({err: {type: 'too_much_order_per_day'}});
        }
        return callback(null, company);
      });
    },
    findGroup: ['findCompany', function (callback, result) {
      Group.findOne({
        name: group_name,
        company: company,
        $or: [{delete_status: {$exists: false}}, {delete_status: false}]
      }, function (err, group) {
        if (err) {
          return callback({err: companyError.internal_system_error});
        }
        if (!group) {
          return callback({err: {type: 'group_not_exist'}});
        }
        return callback(null, group);
      });
    }],
    findUser: ['findGroup', function (callback, result) {
      var group = result.findGroup;
      if (!group) {
        return callback({err: {type: 'group_not_exist'}});
      }
      UserGroup.findOne({group: group}).populate('user').exec(function (err, userGroup) {
        if (err) {
          return res.send({err: companyError.internal_system_error});
        }
        if (!userGroup) {
          return res.send({err: {type: 'group_has_no_employee'}});
        }
        return callback(null, userGroup.user || {});
      });
    }],
    importOrders: ['findGroup', 'findCompany', 'findUser', function (callback, result) {
      var user = result.findUser;
      var company = result.findCompany;
      var group = result.findGroup;
      var errArray = [];

      async.each(order_infos, function (orderInfo, eachCallback) {

        // API的关注人格式是[{username:, nickname:, email:}]，创建运单要求的格式是[username]
        // API的关注人如果不存在需要自动创建，创建运单的必须存在
        if (orderInfo.salesmen && Array.isArray(orderInfo.salesmen) && orderInfo.salesmen.length > 0) {
          createIfNotExistSalesmen(company._id, orderInfo.salesmen).then(function (salesmen) {

            orderInfo.salesmen = salesmen;

            orderService.create(user._id, company._id, company.name, group._id, orderInfo, function (err, newOrder) {
              if (err) {
                err.failed_order = orderInfo;
                errArray.push(err);
              }
              return eachCallback();
            });

          }, function (err) {
            err.failed_order = orderInfo;
            errArray.push(err);
            return eachCallback();
          });
        } else {
          orderService.create(user._id, company._id, company.name, group._id, orderInfo, function (err, newOrder) {
            if (err) {
              err.failed_order = orderInfo;
              errArray.push(err);
            }
            return eachCallback();
          });
        }
      }, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, {err_array: errArray});
      });
    }]
  }, function (err, results) {
    var importResult = results.importOrders;
    if (err) {
      return res.send(err);
    }
    return res.send({
      success: importResult.err_array.length === 0,
      totalCount: order_infos.length,
      successCount: order_infos.length - importResult.err_array.length,
      errorArray: importResult.err_array
    });
  });
};

// [{username:, nickname:, email:}]
// 如果关注人不存在那么就创建关注人
// 返回[username,]
function createIfNotExistSalesmen(companyId, salesmen) {
  return new Promise(function (fulfill, reject) {
    if (!companyId) {
      return reject({err: '#validateSalesmen companyId is necessary'});
    }
    if (!salesmen || !Array.isArray(salesmen)) {
      return reject({err: '#validateSalesmen salesmen is invalid'});
    }

    salesmen.reduce(function (promise, salesman) {
      return promise.then(function () {
        return new Promise(function (fulfill, reject) {
          SalesmanCompanyService.createSingleSalesmanCompany(companyId, salesman, function (err, salesmanCompany) {
            if (err) {
              return reject({err: 'failed to create SalesmanCompany', stack: err, salesman: salesman});
            }
            return fulfill(salesmanCompany);
          });
        });
      }, function (err) {
        return reject(err);
      });
    }, Promise.resolve()).then(function () {
      var usernames = salesmen.map(function (e) {
        return e.username;
      });
      return fulfill(usernames);
    }, function (err) {
      return reject(err);
    });
  });
}

exports.getOrderDetailPageByOrderNumber = function (req, res, next) {
  var order_number = req.body.order_number || req.query.order_number || '';
  var company = req.company;

  async.auto({
    findOrder: function (callback) {
      Order.findOne({
        'order_details.order_number': order_number,
        create_company: company._id,
        execute_company: company._id
      }).sort({created: -1})
      .exec(function (err, order) {
        if (err) {
          return callback({err: orderApiError.internal_system_error});
        }

        if (!order) {
          return callback({err: orderApiError.invalid_order_number});
        }

        if (order.status === 'unAssigned') {
          return callback({err: orderApiError.unassigned_order});
        }

        return callback(null, order);
      });
    },
    findDriver: ['findOrder', function (callback, result) {
      var order = result.findOrder;
      var driver = {};
      if (order.execute_drivers && order.execute_drivers[0]) {
        Driver.findOne({_id: order.execute_drivers[0]._id}, function (err, driver) {
          if (err) {
            return callback({err: orderApiError.internal_system_error});
          }

          if (!driver) {
            driver = {};
          }
          return callback(null, driver);
        });
      }
      else {
        return callback(null, driver);
      }
    }],
    findLocation: ['findDriver', 'findOrder', function (callback, result) {
      if (!result.findDriver) {
        return callback(null, null);
      }
      orderService.getDriverChildrenOrders(result.findOrder._id, function (err, driverOrders) {
        if (err) {
          return callback({err: orderApiError.internal_system_error});
        }
        if (!driverOrders) {
          return callback({err: {type: 'no_driver_orders'}});
        }

        traceService.getTracesByOrders(driverOrders).then(function (driverTraces) {
          return callback(null, driverTraces);
        }, function (err) {
          return callback(err);
        });
      });
    }]
  }, function (err, results) {
    if (err) {
      return res.send(err);
    }

    return res.render(path.join(__dirname, '../../../web/api/views/api.order_detail.client.view.html'), {
      order: JSON.stringify(results.findOrder),
      driver: JSON.stringify(results.findDriver),
      traces: JSON.stringify(results.findLocation)
    });
  });
};

exports.getOrderDetailDataByOrderNumber = function (req, res, next) {
  var order_number = req.body.order_number || req.query.order_number || '';
  var company = req.company;

  async.auto({
    findOrder: function (callback) {
      orderApiService.getOrderByOrderNumber(order_number, company._id, true, function (err, order) {
        if (err) {
          return callback(err);
        }
        return callback(null, order);
      });
    }
  }, function (err, result) {
    if (err) {
      return res.send(err);
    }
    var order = result.findOrder;
    return res.send(result.findOrder);
  });
};

function getPartnerName(driver) {
  var nickname = driver.nickname ? driver.nickname : '未知';
  var plate_numbers = driver.plate_numbers[0] ? driver.plate_numbers[0] : '未知';
  return nickname + '/' + plate_numbers + '/' + driver.username;
}

function assignOrderToDriverByDriverNumber(user, order, assignInfos, callback) {
  var errs = [];
  var executeDrivers = [];
  var assignedInfos = [];

  async.each(assignInfos, function (assignInfo, eachCallback) {
    if (assignInfo.type && assignInfo.type !== 'driver') {
      errs.push({err: {type: 'type_error', message: 'type must be driver'}, info: assignInfo});
      return eachCallback();
    }

    var newAssignInfo = new AssignInfo({
      type: assignInfo.type || 'driver',
      driver_username: assignInfo.driver_username || '',
      driver_id: '',
      company_id: assignInfo.company_id || '',
      order_id: '',
      is_assigned: false,
      pickup_contact_name: assignInfo.pickup_contact_name,
      pickup_contact_phone: assignInfo.pickup_contact_phone,
      pickup_contact_mobile_phone: assignInfo.pickup_contact_mobile_phone,
      pickup_contact_email: assignInfo.pickup_contact_email,
      pickup_contact_address: assignInfo.pickup_contact_address,
      delivery_contact_name: assignInfo.delivery_contact_name,
      delivery_contact_phone: assignInfo.delivery_contact_phone,
      delivery_contact_mobile_phone: assignInfo.delivery_contact_mobile_phone,
      delivery_contact_address: assignInfo.delivery_contact_address,
      delivery_contact_email: assignInfo.delivery_contact_email,
      pickup_start_time: assignInfo.pickup_start_time,
      pickup_end_time: assignInfo.pickup_end_time,
      delivery_start_time: assignInfo.delivery_start_time,
      delivery_end_time: assignInfo.delivery_end_time,
      road_order_name: assignInfo.road_order_name,
      partner_name: ''
    });
    assignedInfos.push(newAssignInfo);

    if (!newAssignInfo.driver_username) {
      return eachCallback();
    }
    Driver.findOne({username: newAssignInfo.driver_username}, function (err, driver) {
      if (err) {
        errs.push({err: orderApiError.internal_system_error, info: newAssignInfo});
        return eachCallback();
      }

      if (!driver) {
        errs.push({err: {type: 'driver_not_existed'}, info: newAssignInfo});
        return eachCallback();
      }

      newAssignInfo.driver_id = driver._id;
      newAssignInfo.partner_name = getPartnerName(driver);

      async.auto({
        pickupContact: function (autoCallback) {
          var newPickupContact = new Contact({
            name: newAssignInfo.pickup_contact_name,
            phone: newAssignInfo.pickup_contact_phone,
            mobile_phone: newAssignInfo.pickup_contact_mobile_phone,
            address: newAssignInfo.pickup_contact_address,
            email: newAssignInfo.pickup_contact_email
          });
          newPickupContact.save(function (err, pickupContact) {
            if (err || !pickupContact) {
              return autoCallback({err: orderApiError.internal_system_error});
            }

            return autoCallback(null, pickupContact);
          });
        },
        deliverContact: ['pickupContact', function (autoCallback, result) {
          var newDeliveryContact = new Contact({
            name: newAssignInfo.delivery_contact_name,
            phone: newAssignInfo.delivery_contact_phone,
            mobile_phone: newAssignInfo.delivery_contact_mobile_phone,
            address: newAssignInfo.delivery_contact_address,
            email: newAssignInfo.delivery_contact_email
          });

          newDeliveryContact.save(function (err, deliveryContact) {
            if (err || !deliveryContact) {
              return autoCallback({err: orderApiError.internal_system_error});
            }
            return autoCallback(null, deliveryContact);
          });
        }],
        order: ['pickupContact', 'deliverContact', function (autoCallback, result) {
          var pickupContact = result.pickupContact;
          var deliveryContact = result.deliverContact;

          delete driver._doc.password;
          delete driver._doc.salt;
          var execute_drivers = [];
          execute_drivers.push(driver);

          var newOrder = new Order({
            order_detail: order.order_details._id,
            order_details: order.order_details,
            parent_order: order._id,
            status: 'unPickupSigned', //分配给司机，则订单变为unPickupSigned
            customer_name: order.customer_name,
            create_user: user._id,
            create_company: user.company,
            create_group: order.execute_group,
            execute_driver: driver._id,
            execute_drivers: execute_drivers,
            pickup_start_time: newAssignInfo.pickup_start_time,
            pickup_end_time: newAssignInfo.pickup_end_time,
            delivery_start_time: newAssignInfo.delivery_start_time,
            delivery_end_time: newAssignInfo.delivery_end_time,
            pickup_contact: pickupContact._id,
            delivery_contact: deliveryContact._id,
            pickup_contacts: pickupContact,
            delivery_contacts: deliveryContact,
            description: order.description,
            type: 'driver',
            sender_name: order.sender_name,
            receiver_name: order.receiver_name,

            pickup_entrance_force: order.pickup_entrance_force,
            pickup_photo_force: order.pickup_photo_force,
            delivery_entrance_force: order.delivery_entrance_force,
            delivery_photo_force: order.delivery_photo_force
          });

          newAssignInfo.order_id = newOrder._id.toString();
          newAssignInfo.is_assigned = true;

          newOrder.save(function (err, driverOrder) {
            if (err || !driverOrder) {
              return autoCallback({err: orderApiError.internal_system_error});
            }

            if (driver.device_id) {
              driverOrder._doc.order_detail = newOrder.order_details;
              driverOrder._doc.pickup_contact = pickupContact;
              driverOrder._doc.delivery_contact = deliveryContact;

              pushLib.transmissionInfoPush({
                type: 'new_order',
                order: newOrder.toJSON(),
                username: driver.username
              }, driver.device_id, function (err, pushRes) {
                console.log('push result :', pushRes);
              });
            }
            return autoCallback(null, driverOrder);
          });
        }]
      }, function (err, results) {
        if (err) {
          err.info = newAssignInfo;
          errs.push(err);
          return eachCallback();
        }
        executeDrivers.push(driver);
        return eachCallback(null, results.order);
      });
    });
  }, function (err) {
    if (errs.length === 0 && assignedInfos.length !== 0) {
      order.assigned_count = executeDrivers.length;
      order.total_assign_count = assignedInfos.length;
      if (order.total_assign_count === 0) {
        order.status = 'unAssigned';
        order.assign_status = 'unAssigned';
      }
      else if (order.assigned_count < order.total_assign_count) {
        order.status = 'assigning';
        order.assign_status = 'assigning';
      }
      else {
        order.status = 'unPickupSigned';
        order.assign_status = 'completed';
      }
      order.execute_drivers = executeDrivers;
      order.assigned_infos = assignedInfos;

      order.save(function (err, saveOrder) {
        if (err || !saveOrder) {
          return callback({err: orderApiError.internal_system_error});
        }
        return callback(null, {success: true});
      });
    }
    else {
      return callback(null, {success: false, err_infos: errs});
    }
  });
}

//目前实现只提供分配一层接口,且不可再次分配
exports.assignOrderToDriver = function (req, res, next) {
  var company = req.company || {};
  var user = req.user || {};
  var orderNumber = req.body.order_number || '';
  var assignInfos = req.body.assign_infos || [];

  if (!orderNumber) {
    return res.send({err: orderApiError.empty_order_number});
  }

  if (assignInfos.length === 0) {
    return res.send({err: orderApiError.invalid_assign_infos});
  }

  if (!(assignInfos instanceof Array)) {
    try {
      assignInfos = JSON.parse(assignInfos);
    }
    catch (e) {
      return res.send({err: orderApiError.invalid_assign_infos});
    }
    if (!(assignInfos instanceof Array)) {
      return res.send({err: orderApiError.invalid_assign_infos});
    }
  }
  orderApiService.getOrderByOrderNumber(orderNumber, company._id, false, function (err, order) {
    if (err) {
      return res.send(err);
    }

    if (!order) {
      return res.send({err: orderApiError.invalid_order_number});
    }

    if (order.status !== 'unAssigned') {
      return res.send({err: {type: 'order_has_assigned'}});
    }

    assignOrderToDriverByDriverNumber(user, order, assignInfos, function (err, result) {
      if (err) {
        return res.send(err);
      }
      return res.send(result);
    });
  });
};

function removeDriverOrder(orderId, callback) {
  orderId = orderId || '';

  if (!orderId) {
    return callback();
  }

  Order.findOne({_id: orderId}, function (err, driverOrder) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }
    if (driverOrder) {
      if (driverOrder.type !== 'driver') {
        return callback({err: orderApiError.assign_type_wrong});
      }
      if (driverOrder.status !== 'unPickupSigned') {
        return callback({err: orderApiError.order_can_not_delete});
      }
      orderService.removeAssignedOrder(driverOrder._id, function (err) {
        if (err) {
          return callback(err);
        }

        return callback();
      });
    }
    else {
      return callback();
    }
  });
}

//目前只删除司机分段
exports.deleteOrderAssign = function (req, res, next) {
  var company = req.company || {};
  var orderNumber = req.body.order_number || '';
  var assignInfoId = req.body.assign_info_id || '';

  if (!orderNumber) {
    return res.send({err: orderApiError.empty_order_number});
  }
  if (!assignInfoId) {
    return res.send({err: orderApiError.empty_assign_info_id});
  }

  orderApiService.getOrderByOrderNumber(orderNumber, company._id, false, function (err, order) {
    if (err) {
      return res.send(err);
    }

    if (!order) {
      return res.send({err: orderApiError.invalid_order_number});
    }

    if (order.status === 'unAssigned' || order.status === 'completed') {
      return res.send({err: orderApiError.assign_info_can_not_delete});
    }

    orderService.getAssignInfoById(order, assignInfoId, function (err, assignInfos) {
      if (err) {
        return res.send(err);
      }
      if (!assignInfos || assignInfos.length === 0) {
        return res.send({err: orderApiError.assign_info_not_exist});
      }
      var currentAssignInfo = assignInfos[0];

      if (currentAssignInfo.type && currentAssignInfo.type !== 'driver') {
        return res.send({err: orderApiError.assign_type_wrong});
      }

      //删除现有分配
      removeDriverOrder(currentAssignInfo.order_id, function (err) {
        if (err) {
          return res.send(err);
        }

        //removeDriverOrder会修改父订单信息，所以需要重新获取父订单
        Order.findOne({_id: order._id}, function (err, findOrder) {
          if (err || !findOrder) {
            return res.send({err: orderApiError.internal_system_error});
          }

          orderService.deleteAssignInfoById(findOrder, assignInfoId, function (err) {
            if (err) {
              return res.send(err);
            }

            orderService.refreshOrderInfo(findOrder, function (err) {
              if (err) {
                return res.send(err);
              }
              findOrder.save(function (err, saveOrder) {
                if (err || !saveOrder) {
                  return res.send({err: orderApiError.internal_system_error});
                }

                return res.send({success: true});
              });
            });
          });
        });
      });
    });
  });

};

function canModifyOrder(currentAssignInfo, callback) {
  //未分配的段
  if (!currentAssignInfo.order_id) {
    return callback();
  }

  Order.findOne({_id: currentAssignInfo.order_id}, function (err, driverOrder) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }

    if (!driverOrder) {
      return callback({err: orderError.order_not_exist});
    }
    if (driverOrder.status !== 'unPickupSigned') {
      return callback({err: orderError.assign_info_can_not_modify});
    }

    return callback();
  });
}

exports.modifyOrderAssign = function (req, res, next) {
  var company = req.company || {};
  var user = req.user || {};
  var orderNumber = req.body.order_number || '';
  var assignInfoId = req.body.assign_info_id || '';
  var assignInfo = req.body.assign_info_new || {};

  if (!orderNumber) {
    return res.send({err: orderApiError.empty_order_number});
  }
  if (!assignInfoId) {
    return res.send({err: orderApiError.empty_assign_info_id});
  }
  if (!assignInfo.driver_username) {
    return res.send({err: orderApiError.empty_assign_info});
  }

  orderApiService.getOrderByOrderNumber(orderNumber, company._id, false, function (err, order) {
    if (err) {
      return res.send(err);
    }

    if (!order) {
      return res.send({err: orderApiError.invalid_order_number});
    }

    //已完成运单不可以在分配
    if (order.status === 'unAssigned' || order.status === 'completed') {
      return res.send({err: orderApiError.assign_info_can_not_modify});
    }

    orderService.getAssignInfoById(order, assignInfoId, function (err, assignInfos) {
      if (err) {
        return res.send(err);
      }
      if (!assignInfos || assignInfos.length === 0) {
        return res.send({err: orderApiError.assign_info_not_exist});
      }
      var currentAssignInfo = assignInfos[0];

      if (currentAssignInfo.type && currentAssignInfo.type !== 'driver') {
        return res.send({err: orderApiError.assign_type_wrong});
      }

      if (currentAssignInfo.driver_username === assignInfo.driver_username) {
        return res.send({err: orderApiError.assign_same_driver});
      }

      canModifyOrder(currentAssignInfo, function (err) {
        if (err) {
          return res.send(err);
        }
        async.auto({
          newAssignInfo: function (autoCallback) {
            var newAssignInfo = new AssignInfo({
              type: assignInfo.type || 'driver',
              driver_username: assignInfo.driver_username,
              driver_id: '',
              company_id: '',
              order_id: '',
              is_assigned: false,
              pickup_contact_name: assignInfo.pickup_contact_name,
              pickup_contact_phone: assignInfo.pickup_contact_phone,
              pickup_contact_mobile_phone: assignInfo.pickup_contact_mobile_phone,
              pickup_contact_email: assignInfo.pickup_contact_email,
              pickup_contact_address: assignInfo.pickup_contact_address,
              delivery_contact_name: assignInfo.delivery_contact_name,
              delivery_contact_phone: assignInfo.delivery_contact_phone,
              delivery_contact_mobile_phone: assignInfo.delivery_contact_mobile_phone,
              delivery_contact_address: assignInfo.delivery_contact_address,
              delivery_contact_email: assignInfo.delivery_contact_email,
              pickup_start_time: assignInfo.pickup_start_time,
              pickup_end_time: assignInfo.pickup_end_time,
              delivery_start_time: assignInfo.delivery_start_time,
              delivery_end_time: assignInfo.delivery_end_time,
              road_order_name: assignInfo.road_order_name,
              partner_name: ''
            });

            return autoCallback(null, newAssignInfo);
          },
          assignDriverOrder: ['newAssignInfo', function (autoCallback, result) {
            var assignInfo = result.newAssignInfo;
            orderApiService.assignDriver(assignInfo, order, user, function (err, driverOrder) {
              if (err) {
                return autoCallback(err);
              }
              assignInfo.order_id = driverOrder._id.toString();
              assignInfo.is_assigned = true;
              assignInfo.partner_name = getPartnerName(driverOrder.execute_drivers[0]);

              order.assigned_infos.push(assignInfo);
              order.execute_drivers.push(driverOrder.execute_drivers[0]);
              order.save(function (err, saveOrder) {
                if (err || !saveOrder) {
                  return autoCallback({err: orderApiError.internal_system_error});
                }
                return autoCallback(null, {success: true});
              });

            });
          }],
          deleteDriverOrder: ['assignDriverOrder', function (autoCallback, result) {
            //if (!result.assignDriverOrder) {
            //  return autoCallback();
            //}
            removeDriverOrder(currentAssignInfo.order_id, function (err) {
              if (err) {
                return autoCallback(err);
              }

              Order.findOne({_id: order._id}, function (err, findOrder) {
                if (err || !findOrder) {
                  return autoCallback({err: orderApiError.internal_system_error});
                }

                orderService.deleteAssignInfoById(findOrder, assignInfoId, function (err) {
                  if (err) {
                    return autoCallback(err);
                  }
                  findOrder.save(function (err, saveOrder) {
                    if (err || !saveOrder) {
                      return autoCallback(orderApiError.internal_system_error);
                    }
                    return autoCallback(null, {success: true});
                  });
                });
              });
            });
          }],
          updateOrderInfo: ['deleteDriverOrder', function (autoCallback, result) {
            //if (!result.deleteDriverOrder) {
            //  return autoCallback();
            //}

            //removeDriverOrder会修改父订单信息，所以需要重新获取父订单
            Order.findOne({_id: order._id}, function (err, findOrder) {
              if (err || !findOrder) {
                return autoCallback({err: orderApiError.internal_system_error});
              }

              orderService.refreshOrderInfo(findOrder, function (err, refreshOrder) {
                if (err) {
                  return autoCallback(err);
                }

                findOrder.save(function (err, saveOrder) {
                  if (err || !saveOrder) {
                    return autoCallback(orderApiError.internal_system_error);
                  }
                  return autoCallback(null, {success: true});
                });

              });
            });
          }]
        }, function (err, results) {
          if (err) {
            return res.send(err);
          }

          return res.send({success: true});
        });
      });

    });

  });
};

function validateOrdersReq(req) {
  return new Promise(function (fulfill, reject) {
    var group_name = req.body.group_name || '';
    var order_infos = req.body.order_infos;
    var company = req.company;

    group_name = group_name === '全体成员' ? 'default_group' : group_name;

    if (!group_name) {
      return reject({err: {type: 'invalid_group_name'}});
    }

    if (!(order_infos instanceof Array)) {
      try {
        order_infos = JSON.parse(order_infos);
      }
      catch (e) {
        return reject({err: {type: 'invalid_order_infos'}});
      }
      if (!(order_infos instanceof Array)) {
        return reject({err: {type: 'invalid_order_infos'}});
      }
    }

    if (order_infos.length > 50) {
      return reject({err: {type: 'order_length_too_long', message: 'order count must less than 50 per request'}});
    }

    return fulfill({
      group_name: group_name,
      order_infos: order_infos,
      company: company
    });
  });
}

function createAssign(req) {
  return new Promise(function (fulfill, reject) {
    validateOrdersReq(req).then(function (a) {
      var group_name = a.group_name;
      var order_infos = a.order_infos;
      var company = a.company;
      Promise.all([
        new Promise(function (fulfill, reject) {
          var limitCountPerDay = company.max_order_count_per_day || 1000;
          var now = new Date();
          var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
          Order.count({
            execute_company: company._id,
            create_company: company._id,
            $and: [{create_time: {$gte: startTime}}, {create_time: {$lte: endTime}}]
          }, function (err, count) {
            if (err) {
              return reject({err: companyError.internal_system_error, stack: err});
            }
            if (limitCountPerDay <= count) {
              return reject({err: {type: 'too_much_order_per_day'}});
            }
            return fulfill(company);
          });
        }),
        new Promise(function (fulfill, reject) {
          Group.findOne({
            name: group_name,
            company: company._id,
            $or: [{delete_status: {$exists: false}}, {delete_status: false}]
          }, function (err, group) {
            if (err) {
              return reject({err: companyError.internal_system_error, stack: err});
            }
            if (!group) {
              return reject({err: {type: 'group_not_exist'}});
            }
            return fulfill(group);
          });
        })
      ]).then(function (b) {
        var group = b[1];

        if (!group) {
          return reject({err: {type: 'group_not_exist'}});
        }

        new Promise(function (fulfill, reject) {
          UserGroup.findOne({group: group._id}).populate('user').exec(function (err, userGroup) {
            if (err) {
              return reject({err: companyError.internal_system_error, stack: err});
            }
            if (!userGroup) {
              return reject({err: {type: 'group_has_no_employee'}});
            }
            return fulfill({user: userGroup.user, group: group});
          });
        }).then(function (c) {
          var user = c.user;
          var group = c.group;
          var errArray = [];

          order_infos.reduce(function (promise, order_info) {
            return promise.then(function () {
              return new Promise(function (fulfill, reject) {

                if (order_info.salesmen && Array.isArray(order_info.salesmen) && order_info.salesmen.length > 0) {
                  createIfNotExistSalesmen(company._id, order_info.salesmen).then(function (salesmen) {

                    order_info.salesmen = salesmen;

                    if (order_info.driver_username) {
                      Driver.findOne({username: order_info.driver_username}, function (err, driver) {
                        if (err) {
                          err.failed_order = order_info;
                          errArray.push(err);
                          return fulfill();
                        }

                        if (!driver) {
                          errArray.push({err: {type: 'driver_not_existed'}, failed_order: order_info});
                          return fulfill();
                        }

                        orderService.create(user._id, company._id, company.name, group._id, order_info, function (err, newOrder) {
                          if (err) {
                            err.failed_order = order_info;
                            errArray.push(err);
                            return fulfill();
                          } else {
                            var assign_info = {
                              type: 'driver',
                              driver_username: order_info.driver_username,
                              company_id: company._id,
                              pickup_contact_name: order_info.pickup_contact_name,
                              pickup_contact_phone: order_info.pickup_contact_phone,
                              pickup_contact_mobile_phone: order_info.pickup_contact_mobile_phone,
                              pickup_contact_email: order_info.pickup_contact_email,
                              pickup_contact_address: order_info.pickup_contact_address,
                              delivery_contact_name: order_info.delivery_contact_name,
                              delivery_contact_phone: order_info.delivery_contact_phone,
                              delivery_contact_mobile_phone: order_info.delivery_contact_mobile_phone,
                              delivery_contact_address: order_info.delivery_contact_address,
                              delivery_contact_email: order_info.delivery_contact_email,
                              pickup_start_time: order_info.pickup_start_time,
                              pickup_end_time: order_info.pickup_end_time,
                              delivery_start_time: order_info.delivery_start_time,
                              delivery_end_time: order_info.delivery_end_time,
                              road_order_name: order_info.road_order_name
                            };
                            assignOrderToDriverByDriverNumber(user, newOrder, [assign_info], function (err, result) {
                              if (err) {
                                var assignErr = err;
                                assignErr.failed_order = order_info;
                                errArray.push(assignErr);
                                orderService.deleteOrder(company._id, newOrder._id, function (err) {
                                  if (err) {
                                    assignErr.autoDeleteErr = err;
                                  }
                                  return fulfill();
                                });
                              } else {
                                return fulfill();
                              }
                            });

                          }
                        });
                      });
                    } else {
                      orderService.create(user._id, company._id, company.name, group._id, order_info, function (err, newOrder) {
                        if (err) {
                          err.failed_order = order_info;
                          errArray.push(err);
                        }
                        return fulfill();
                      });
                    }

                  }, function (err) {
                    err.failed_order = order_info;
                    errArray.push(err);
                    return fulfill();
                  });
                }
              });
            })
              ;
            }, Promise.resolve()).then(function () {
              return fulfill({
                err_array: errArray,
                order_infos: order_infos
              });
            });
          }, function (err) {
            return reject(err);
          });

        }).catch(function (err) {
          return reject(err);
        });
      }).catch(function (err) {
        return reject(err);
      });
    });
  }

  exports.createAssign = function (req, res, next) {
    createAssign(req).then(function (a) {
      var err_array = a.err_array;
      var order_infos = a.order_infos;
      var result = {
        success: err_array.length === 0,
        totalCount: order_infos.length,
        successCount: order_infos.length - err_array.length,
        errorArray: err_array
      };
      return res.send(result);
    }, function (err) {
      return res.send(err);
    });
  };