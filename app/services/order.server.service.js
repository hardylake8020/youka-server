/**
 * Created by elinaguo on 15/4/9.
 */
'use strict';

var _ = require('lodash'),
  allEnum = require('../../enums/all'),
  pushLib = require('../libraries/getui'),
  smsLib = require('../libraries/sms'),
  wechatLib = require('../libraries/wechat_push'),
  config = require('../../config/config'),
  orderError = require('../errors/order'),
  appDb = require('../../libraries/mongoose').appDb,
  async = require('async'),
  Order = appDb.model('Order'),
  Tender = appDb.model('Tender'),
  GoodsDetail = appDb.model('GoodsDetail'),
  OrderDetail = appDb.model('OrderDetail'),
  Detail = appDb.model('Detail'),
  Contact = appDb.model('Contact'),
  Group = appDb.model('Group'),
  Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  CustomerContact = appDb.model('CustomerContact'),
  UserProfile = appDb.model('UserProfile'),
  SalesmanCompany = appDb.model('SalesmanCompany'),
  Promise = require('promise'),
  Excel = require('exceljs');

var OrderLogic = require('../logics/order'),
  CustomizeEventService = require('../services/customize_event'),
  UserService = require('../services/user'),
  SalesmanCompanyService = require('../services/wechat/salesman_company'),
  SalesmanService = require('../services/wechat/salesman'),
  UserProfileService = require('../services/user_profile'),
  CompanyService = require('../services/company'),
  DriverService = require('../services/driver'),
  OrderExport = require('../../libraries/services/order_export');


var that = exports;


function checkReceiverCompany(orderInfo, callback) {
  if (!orderInfo) {
    return callback(null);
  }
  if (!orderInfo.receiver_company_id && !orderInfo.receiver_name) {
    return callback(null);
  }

  if (!orderInfo.receiver_company_id && orderInfo.receiver_name) {
    Company.findOne({name: orderInfo.receiver_name}, function (err, companyEntity) {
      if (err) {
        return callback(err);
      }
      if (!companyEntity) {
        return callback(null);
      }
      else {
        orderInfo.receiver_company_id = companyEntity._id.toString();
        return callback(null);
      }
    });
  }
  else {
    return callback(null);
  }
}

function checkSenderCompany(orderInfo, callback) {
  if (!orderInfo) {
    return callback(null);
  }
  if (!orderInfo.sender_company_id && !orderInfo.sender_name) {
    return callback(null);
  }

  if (!orderInfo.sender_company_id && orderInfo.sender_name) {
    Company.findOne({name: orderInfo.sender_name}, function (err, companyEntity) {
      if (err) {
        return callback(err);
      }
      if (!companyEntity) {
        return callback(null);
      }
      else {
        orderInfo.sender_company_id = companyEntity._id.toString();
        return callback(null);
      }
    });
  }
  else {
    return callback(null);
  }
}

function checkGoodsDetail(orderInfo, callback) {
  if (orderInfo.goods && Array.isArray(orderInfo.goods) && orderInfo.goods.length > 0) {
    var goods = [];
    async.each(orderInfo.goods, function (goodItem, goodsCallback) {
      goods.push(new GoodsDetail({
        name: goodItem.name || '',
        count: parseFloat(goodItem.count) || null,
        unit: goodItem.unit || '箱',
        count2: parseFloat(goodItem.count2) || null,
        unit2: goodItem.unit2 || '吨',
        count3: parseFloat(goodItem.count3) || null,
        unit3: goodItem.unit3 || '立方',
        price: goodItem.price || null
      }));
      orderInfo.goods = goods;

      return goodsCallback();
    }, function (err) {

      orderInfo.goods_name = orderInfo.goods[0].name;
      orderInfo.count = orderInfo.goods[0].count;
      orderInfo.count_unit = orderInfo.goods[0].unit;
      return callback();
    });
  } else {
    return callback();
  }
}
function createOrUpdateOrder(createUserId, createCompanyId, orderSource, groupId, orderInfo, callback) {
  //运单号必须有
  if (!orderInfo.order_number) {
    return callback({err: orderError.order_number_null_error}, null);
  }
  else {
    async.auto({
      saveOrderDetail: function (asyncCallback) {
        //如果是多货物
        checkGoodsDetail(orderInfo, function () {
          var newOrderDetail = new OrderDetail({
            order_number: orderInfo.order_number,
            refer_order_number: orderInfo.refer_order_number,
            original_order_number: orderInfo.original_order_number,
            goods_name: orderInfo.goods_name,
            count: orderInfo.count || null,
            weight: orderInfo.weight || null,
            volume: orderInfo.volume || null,
            count_unit: orderInfo.count_unit || '箱',
            weight_unit: orderInfo.weight_unit || '吨',
            volume_unit: orderInfo.volume_unit || '立方',
            freight_charge: orderInfo.freight_charge,
            goods: orderInfo.goods
          });
          newOrderDetail.save(function (err, orderDetailEntity) {
            if (err || !orderDetailEntity) {
              return asyncCallback({err: orderError.internal_system_error, stack: err}, null);
            }
            return asyncCallback(null, orderDetailEntity);
          });

        });
      },
      //findPickupContact: function (asyncCallback) {
      //  Contact.findOne({
      //    address: orderInfo.pickup_contact_address,
      //    company: createCompanyId
      //  }, function (err, contact) {
      //    if (err) {
      //      return asyncCallback({err: orderError.internal_system_error});
      //    }
      //    return asyncCallback(null, contact);
      //  });
      //},
      savePickupContact: function (asyncCallback, result) {
        //var pickupContact = result.findPickupContact;
        //
        //if (!pickupContact) {
        //  pickupContact = new Contact();
        //}

        var pickupContact = new Contact();
        pickupContact.name = orderInfo.pickup_contact_name;
        pickupContact.phone = orderInfo.pickup_contact_phone;
        pickupContact.mobile_phone = orderInfo.pickup_contact_mobile_phone;
        pickupContact.address = orderInfo.pickup_contact_address;
        pickupContact.email = orderInfo.pickup_contact_email;
        pickupContact.company = createCompanyId;

        CompanyService.getLocationInfoByAddress(createCompanyId, pickupContact.address, function (err, locationInfo) {
          if (locationInfo) {
            pickupContact.location = locationInfo.location || [];
            pickupContact.brief = locationInfo.brief;
          }

          pickupContact.save(function (err, updateContact) {
            if (err) {
              return asyncCallback({err: orderError.internal_system_error, stack: err});
            }
            return asyncCallback(null, updateContact);
          });

        });
      },
      //findDeliveryContact: ['savePickupContact', function (asyncCallback) {
      //  Contact.findOne({
      //    address: orderInfo.delivery_contact_address,
      //    company: createCompanyId
      //  }, function (err, contact) {
      //    if (err) {
      //      return asyncCallback({err: orderError.internal_system_error});
      //    }
      //    return asyncCallback(null, contact);
      //  });
      //}],
      saveDeliveryContact: [function (asyncCallback, result) {
        //var deliveryContact = result.findDeliveryContact;
        //if (!deliveryContact) {
        //  deliveryContact = new Contact();
        //}

        var deliveryContact = new Contact();
        deliveryContact.name = orderInfo.delivery_contact_name;
        deliveryContact.phone = orderInfo.delivery_contact_phone;
        deliveryContact.mobile_phone = orderInfo.delivery_contact_mobile_phone;
        deliveryContact.address = orderInfo.delivery_contact_address;
        deliveryContact.email = orderInfo.delivery_contact_email;
        deliveryContact.company = createCompanyId;

        CompanyService.getLocationInfoByAddress(createCompanyId, deliveryContact.address, function (err, locationInfo) {
          if (locationInfo) {
            deliveryContact.location = locationInfo.location || [];
            deliveryContact.brief = locationInfo.brief;
          }

          deliveryContact.save(function (err, updateContact) {
            if (err) {
              return asyncCallback({err: orderError.internal_system_error, stack: err});
            }
            return asyncCallback(null, updateContact);
          });

        });
      }],
      findSalesman: function (asyncCallback) {
        if (!orderInfo.salesmen || !Array.isArray(orderInfo.salesmen) || orderInfo.salesmen.length === 0) {
          return asyncCallback(null, []);
        }
        SalesmanCompanyService.createSalesmanCompany(createCompanyId, orderInfo.salesmen, function (err, salesmanList) {
          return asyncCallback(err, salesmanList);
        });
      },
      findUserProfile: function (asyncCallback) {
        UserProfileService.getUserProfile(createUserId, function (err, profile) {
          if (err) {
            return asyncCallback(err);
          }
          if (profile) {
            orderInfo.pickup_entrance_force = profile.pickup_entrance_force;
            orderInfo.pickup_photo_force = profile.pickup_photo_force;
            orderInfo.delivery_entrance_force = profile.delivery_entrance_force;
            orderInfo.delivery_photo_force = profile.delivery_photo_force;
          }
          return asyncCallback();
        });
      },
      findCompanyConfiguration: function (asyncCallback) {
        CompanyService.getConfiguration(createCompanyId, function (err, configuration) {
          if (err) {
            return asyncCallback(err);
          }
          if (configuration) {
            if (!configuration.pickup_option) {
              configuration.pickup_option = {
                entrance_photos: [],
                take_photos: []
              };
            } else {
              if (!configuration.pickup_option.must_entrance_photo) {
                configuration.pickup_option.entrance_photos = [];
              }
              if (!configuration.pickup_option.must_take_photo) {
                configuration.pickup_option.take_photos = [];
              }
            }

            if (!configuration.delivery_option) {
              configuration.delivery_option = {
                entrance_photos: [],
                take_photos: []
              };
            } else {
              if (!configuration.delivery_option.must_entrance_photo) {
                configuration.delivery_option.entrance_photos = [];
              }
              if (!configuration.delivery_option.must_take_photo) {
                configuration.delivery_option.take_photos = [];
              }
            }
          }

          return asyncCallback(null, configuration);
        });
      }
    }, function (err, results) {
      if (err) {
        return callback(err);
      }

      checkReceiverCompany(orderInfo, function (err) {
        if (err) {
          return callback({err: err});
        }

        checkSenderCompany(orderInfo, function (err) {
          if (err) {
            return callback({err: err});
          }
          else {
            var orderDetailEntity = results.saveOrderDetail;
            var pickupContactEntity = results.savePickupContact || {};
            var deliveryContactEntity = results.saveDeliveryContact || {};
            var oldOrder = orderInfo.oldOrder;
            if (!oldOrder) {
              oldOrder = new Order();
            }

            oldOrder.order_detail = orderDetailEntity._id;
            oldOrder.order_details = orderDetailEntity;
            oldOrder.customer_name = orderInfo.customer_name;
            oldOrder.pickup_start_time = orderInfo.pickup_start_time;
            oldOrder.delivery_start_time = orderInfo.delivery_start_time;
            oldOrder.pickup_end_time = orderInfo.pickup_end_time || orderInfo.pickup_start_time;
            oldOrder.delivery_end_time = orderInfo.delivery_end_time || orderInfo.delivery_start_time;
            oldOrder.description = orderInfo.description;
            oldOrder.create_user = createUserId;
            oldOrder.create_group = groupId;
            oldOrder.create_company = createCompanyId;
            oldOrder.execute_company = createCompanyId;
            oldOrder.execute_group = groupId;     //创建的时候指定该订单的执行组，方便之后用户查询订单的时候，不管是大订单还是自订单，都可以根据此字段来筛选
            oldOrder.pickup_contact = pickupContactEntity._id;
            oldOrder.pickup_contacts = pickupContactEntity;
            oldOrder.delivery_contact = deliveryContactEntity._id;
            oldOrder.delivery_contacts = deliveryContactEntity;
            oldOrder.type = 'company';
            oldOrder.source = orderInfo.customer_name;

            oldOrder.sender_company = {
              company_id: orderInfo.sender_company_id || '',
              company_name: orderInfo.sender_name || ''
            };
            oldOrder.sender_name = orderInfo.sender_name || '';

            oldOrder.receiver_company = {
              company_id: orderInfo.receiver_company_id || '',
              company_name: orderInfo.receiver_name || ''
            };
            oldOrder.receiver_name = orderInfo.receiver_name || '';

            oldOrder.pickup_entrance_force = orderInfo.pickup_entrance_force || false;
            oldOrder.pickup_photo_force = orderInfo.pickup_photo_force || false;
            oldOrder.delivery_entrance_force = orderInfo.delivery_entrance_force || false;
            oldOrder.delivery_photo_force = orderInfo.delivery_photo_force || true;
            oldOrder.salesmen = results.findSalesman;
            oldOrder.company_configuration = results.findCompanyConfiguration || null;

            oldOrder.create_push = orderInfo.create_push === 'true';
            oldOrder.delivery_sign_push = orderInfo.delivery_sign_push === 'true';
            oldOrder.pickup_push = orderInfo.pickup_push === 'true';
            oldOrder.delivery_push = orderInfo.delivery_push === 'true';
            oldOrder.abnormal_push = orderInfo.abnormal_push === 'true';

            oldOrder.order_transport_type = orderInfo.order_transport_type || 'ltl';

            oldOrder.pickup_deferred_duration = parseInt(orderInfo.pickup_deferred_duration) || 0;
            oldOrder.delivery_early_duration = parseInt(orderInfo.delivery_early_duration) || 0;

            oldOrder.save(function (err, orderEntity) {
              if (err || !orderEntity) {
                return callback({err: orderError.internal_system_error, stack: err}, null);
              }

              orderEntity.create_company.name = orderSource;
              if (orderEntity.create_push) {
                that.sendOrderMessage(allEnum.company_order_message_push_type.create, orderEntity);
              }

              orderEntity._doc.pickup_contact = pickupContactEntity;
              orderEntity._doc.delivery_contact = deliveryContactEntity;
              orderEntity._doc.detail = orderDetailEntity;
              return callback(null, orderEntity);
            });
          }
        });

      });

    });
  }
}

exports.checkGoodsDetail = function (orderInfo, callback) {
  return checkGoodsDetail(orderInfo, callback);
};
exports.checkReceiver = function (orderInfo, callback) {
  return checkReceiverCompany(orderInfo, callback);
};

exports.create = function (createUserId, createCompanyId, orderSource, groupId, orderInfo, callback) {
  createOrUpdateOrder(createUserId, createCompanyId, orderSource, groupId, orderInfo, function (err, result) {
    if (err) {
      return callback(err, result);
    }

    return callback(null, result);
  });
};

exports.update = function (createUserId, createCompanyId, orderSourceCompanyName, groupId, orderInfo, callback) {
  if (!orderInfo.order_id) {
    return callback({err: orderError.order_id_not_exist});
  }

  Order.findOne({_id: orderInfo.order_id}, function (err, oldOrder) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }

    if (!oldOrder) {
      return callback({err: orderError.order_not_exist});
    }

    if (oldOrder.execute_company.toString() !== oldOrder.create_company.toString()) {
      return callback({err: orderError.must_self_company_order});
    }

    if (oldOrder.status !== 'unAssigned') {
      return callback({err: orderError.order_status_mustbe_unassigned});
    }

    orderInfo.oldOrder = oldOrder;

    createOrUpdateOrder(createUserId, createCompanyId, orderSourceCompanyName, groupId, orderInfo, function (err, result) {
      return callback(err, result);
    });
  });
};

function pushSingleAssignToDriver(driver, order) {
  var pushData = {
    type: 'new_order',
    username: driver.username
  };
  if (driver.device_id) {
    pushData.order = order.toJSON();
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }
  if (driver.device_id_ios) {
    pushData.order_id = order._id.toString();
    pushLib.transmissionIosInfoPush(pushData, {
      message: '您有新运单',
      sound: 'new_order.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }
}

function pushSingleAssignToWarehouse(driver, order) {
  var pushData = {
    type: 'warehouse_order',
    username: driver.username
  };
  if (driver.device_id) {
    pushData.order = order.toJSON();
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }
  if (driver.device_id_ios) {
    pushData.order_id = order._id.toString();
    pushLib.transmissionIosInfoPush(pushData, {
      message: '您有新仓储运单',
      sound: 'new_order.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result :', pushRes);
    });
  }
}

function pushBatchAssignToDriver(driver, assignType) {
  var pushData = {
    type: 'multi_order',
    order_type: assignType,
    username: driver.username
  };

  if (driver.device_id) {
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }

  if (driver.device_id_ios) {
    pushLib.transmissionIosInfoPush(pushData, {
      message: '批量分配通知',
      sound: 'new_order.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }
}

function pushUpdateInfoToDriver(driver, order) {
  var pushData = {
    type: 'modify_order',
    username: driver.username
  };


  if (driver.device_id) {
    pushData.order = order;
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }

  if (driver.device_id_ios) {
    pushData.order_id = order._id;
    pushLib.transmissionIosInfoPush(pushData, {
      message: '运单修改通知',
      sound: 'modify_order.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }
}

exports.pushUpdateInfoToDriver = function (driver, order) {
  pushUpdateInfoToDriver(driver, order);
};

function pushDeleteInfoToDriver(driver, orderId) {
  driver = driver || {};
  var pushData = {
    type: 'delete_order',
    order_id: orderId,
    username: driver.username
  };

  if (driver.device_id) {
    pushLib.transmissionInfoPush(pushData, driver.device_id, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }

  if (driver.device_id_ios) {
    pushLib.transmissionIosInfoPush(pushData, {
      message: '运单删除通知',
      sound: 'delete_order.wav'
    }, driver.device_id_ios, function (err, pushRes) {
      console.log('push result: ', pushRes);
    });
  }
}

exports.pushBatchAssignToDriver = function (driver, assignType) {
  pushBatchAssignToDriver(driver, assignType);
};

//删除未提货的运单, unAssigned, assigning, unPickupSigned
exports.deleteOrder = function (userCompanyId, order_id, callback) {

  var orderLogic = new OrderLogic();
  orderLogic.deleteAssignedOrder(userCompanyId, order_id, function (err) {
    if (err) {
      return callback(err.err);
    }

    orderLogic.getAllDriverOrders(order_id, function (err, driverOrders) {
      if (err) {
        return callback(err.err);
      }

      async.each(driverOrders, function (driverOrder, asyncCallback) {
        var driver = driverOrder.execute_driver;

        pushDeleteInfoToDriver(driver, driverOrder._id);

        return asyncCallback();
      }, function (err) {
        if (err) {
          return callback(err);
        }

        return callback(null);
      });
    });

  });
};

//根据订单Id获取指定块数大小的订单
exports.getOrders = function (orderIds, currentPage, limit, callback) {
  currentPage = currentPage || 1;

  var skipCount = limit * (currentPage - 1);
  var orderQuery = {
    _id: {$in: orderIds}
  };
  Order.count(orderQuery, function (err, totalCount) {
    if (!limit) {
      limit = totalCount;
    }

    Order.find(orderQuery)
      .sort({create_time: -1})
      .limit(limit)
      .skip(skipCount)
      .populate('order_detail create_company delivery_contact pickup_contact')
      .exec(function (err, orders) {
        if (err)
          return callback({err: orderError.internal_system_error}, null);

        return callback(null, {totalCount: totalCount, currentPage: currentPage, limit: limit, orders: orders});
      });
  });
};

function findChildrenOrders(order, callback) {
  Order.find({parent_order: order._id})
    .populate('pickup_contact delivery_contact create_company execute_company execute_group execute_driver')
    .exec(function (err, childrenOrders) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (childrenOrders.length > 0) {
        async.each(childrenOrders, function (childOrder, itemCallback) {
          if (!childOrder.execute_driver) {
            findChildrenOrders(childOrder, function (err, childrenOrderEntities) {
              if (err)
                return itemCallback({err: orderError.internal_system_error});

              if (childrenOrderEntities && childrenOrderEntities.length > 0) {
                childOrder._doc.children = childrenOrderEntities;
              }
              itemCallback();
            });
          }
          else {
            itemCallback();
          }
        }, function (err) {
          if (err)
            return callback(err, null);

          callback(null, childrenOrders);
        });
      }
      else {
        callback(null, null);
      }
    });
}

exports.getChildrenOrders = function (orderId, callback) {
  Order.findOne({_id: orderId})
    .populate('order_detail pickup_contact delivery_contact create_company execute_company')
    .exec(function (err, order) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (!order) {
        return callback({err: orderError.order_not_exist}, null);
      }

      findChildrenOrders(order, function (err, children) {
        if (err) {
          return callback(err, null);
        }

        if (children && children.length > 0) {
          order._doc.children = children;
        }
        return callback(null, order);
      });
    });
};

function getDriverOrder(orderId, callback) {
  var driverOrders = [];
  Order.find({parent_order: orderId, delete_status: false}).exec(function (err, orders) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }

    async.each(orders, function (order, itemCallback) {
      if (!order.execute_driver) {
        getDriverOrder(order._id,
          function (err, childrenOrders) {
            if (err)
              return itemCallback(err);

            if (childrenOrders.length > 0) {

              childrenOrders.forEach(function (driverOrder) {
                driverOrders.push(driverOrder);
              });
            }

            itemCallback();
          });
      }
      else {
        driverOrders.push(order);
        itemCallback();
      }
    }, function (err) {
      if (err)
        return callback(err, null);

      return callback(null, driverOrders);
    });

  });
}

//获取当前订单下游所有司机订单
exports.getDriverChildrenOrderIds = function (orderId, callback) {

  Order.findOne({_id: orderId})
    .populate('order_detail pickup_contact delivery_contact')
    .exec(function (err, order) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (!order) {
        return callback({err: orderError.order_not_exist}, null);
      }

      getDriverOrder(orderId, function (err, driverOrders) {
        if (err) {
          return callback(err, null);
        }

        var driverOrderIds = [];
        driverOrders.forEach(function (driverOrder) {
          driverOrderIds.push(driverOrder._id);
        });

        return callback(null, driverOrderIds);
      });

    });
};

exports.getDriverChildrenOrders = function (orderId, callback) {

  Order.findOne({_id: orderId})
    .populate('order_detail pickup_contact delivery_contact')
    .exec(function (err, order) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (!order) {
        return callback({err: orderError.order_not_exist}, null);
      }

      getDriverOrder(orderId, function (err, driverOrders) {
        if (err) {
          return callback(err, null);
        }

        return callback(null, driverOrders);
      });

    });
};

//获取大订单下所有司机订单
exports.getAllDriverChildrenOrders = function (orderId, callback) {
  Order.findOne({_id: orderId})
    .populate('order_detail pickup_contact delivery_contact')
    .exec(function (err, order) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (!order) {
        return callback({err: orderError.order_not_exist}, null);
      }

      Order.find({order_detail: order.order_details._id, execute_driver: {'$ne': null}})
        .populate('order_detail pickup_contact delivery_contact execute_driver')
        .exec(function (err, driverOrders) {
          if (err) {
            return callback({err: orderError.internal_system_error}, null);
          }

          return callback(null, driverOrders);
        });
    });
};

exports.getAllDriverOrdersByDriverOrderId = function (driverOrderId, callback) {
  Order.findOne({_id: driverOrderId}).exec(function (err, driverOrder) {
    if (err) {
      return callback({err: orderError.internal_system_error}, null);
    }

    if (!driverOrder) {
      return callback({err: orderError.order_not_exist}, null);
    }

    Order.find({order_detail: driverOrder.order_detail, execute_driver: {'$ne': null}})
      .populate('order_detail pickup_contact delivery_contact execute_driver')
      .exec(function (err, driverOrders) {
        if (err) {
          return callback({err: orderError.internal_system_error}, null);
        }

        return callback(null, driverOrders);
      });
  });

};

function getCompanyOrders(sourceOrder, callback) {
  var companyOrders = [];
  companyOrders.push(sourceOrder);

  Order.find({parent_order: sourceOrder._id, $or: [{delete_status: {$exists: false}}, {delete_status: false}]})
    .populate('order_detail create_company execute_company execute_group create_group execute_driver pickup_contact delivery_contact')
    .sort({'create_time': -1})
    .exec(function (err, orders) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      if (!orders || orders.length === 0)
        return callback(null, companyOrders);

      async.each(orders, function (order, itemCallback) {

        if (order.execute_driver) {
          if (!sourceOrder._doc.drivers)
            sourceOrder._doc.drivers = [];

          sourceOrder._doc.drivers.push(order);
          return itemCallback();
        }
        else {

          getCompanyOrders(order,
            function (err, childrenOrders) {
              if (err)
                return itemCallback(err);

              if (childrenOrders.length > 0) {
                childrenOrders.forEach(function (companyOrder) {
                  companyOrders.push(companyOrder);
                });
              }

              return itemCallback();
            });
        }
      }, function (err) {
        if (err)
          return callback(err, null);

        return callback(null, companyOrders);
      });

    });
}

exports.getOrderById = function (orderId, callback) {
  Order.findOne({
      _id: orderId,
      $or: [{delete_status: {$exists: false}}, {delete_status: false}]
    })
    .populate('execute_group create_group create_user create_company').exec(function (err, order) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }

    if (!order) {
      return callback({err: orderError.order_not_exist});
    }

    return callback(null, order);
  });
};

exports.getChildrenByParentId = function (parentId, callback) {
  Order.find({
    parent_order: parentId,
    $or: [{delete_status: {$exists: false}}, {delete_status: false}]
  }, function (err, orders) {
    if (err || !orders) {
      return callback({err: orderError.internal_system_error});
    }
    return callback(null, orders);
  });
};

exports.getOrderByIdAndPopulate = function (orderId, populateStr, callback) {
  Order.findOne({_id: orderId}).populate(populateStr).exec(function (err, order) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }

    if (!order) {
      return callback({err: orderError.order_not_exist});
    }

    return callback(null, order);
  });
};

exports.getOrderAssignedInfoByOrderId = function (order, callback) {
  if (!order) {
    //TODO message: err not defined
    return callback({err: orderError.internal_system_error}, null);
  }

  getCompanyOrders(order, function (err, companyOrders) {
    if (err) {
      return callback(err, null);
    }

    return callback(null, companyOrders);
  });
};

function getSortConditions(sort) {
  sort = sort || {};
  var result = {'create_time': -1};
  switch (sort.name) {
    case 'order_number':
      result = {'order_details.order_number': sort.value};
      break;
    case 'pickup_start_time':
      result = {'pickup_start_time': sort.value};
      break;
    case 'delivery_start_time':
      result = {'delivery_start_time': sort.value};
      break;
    case 'source':
      result = {'source': sort.value};
      break;
    case 'description':
      result = {'description': sort.value};
      break;
    case 'goods_name':
      result = {'order_details.goods_name': sort.value};
      break;
    case 'damage':
      result = {'damaged': sort.value};
      break;
    case 'delivery_contact_name':
      result = {'delivery_contacts.name': sort.value};
      break;
    case 'assign_time':
      result = {'assign_time': sort.value};
      break;
    case 'entrance_time':
      result = {'pickup_sign_events.time': sort.value};
      break;
    default:
      break;
  }
  return result;
}

function generateQueryCondition(orderQuery, searchArray, user) {
  if (!orderQuery || (!searchArray || searchArray.length <= 0)) {
    // orderQuery.$and.push({execute_group: {$in: groupIds}});
    return;
  }

  var needInGroup = true;
  for (var index = 0; index < searchArray.length; index++) {
    var searchItem = searchArray[index];

    switch (searchItem.key) {
      case 'isDeleted':
        if (searchItem.value === 'false' || searchItem.value === false) {
          orderQuery.$and.push({$or: [{'delete_status': {$exists: false}}, {'delete_status': false}]});
        }
        else {
          orderQuery.$and.push({'delete_status': true});
        }

        break;
      case 'order_status':
        if (searchItem.value) {
          orderQuery.$and.push({'status': {$in: searchItem.value}});
        }
        break;

      case 'createTimeStart':
        if (searchItem.value) {
          orderQuery.$and.push({'create_time': {$exists: true}});
          orderQuery.$and.push({'create_time': {$gte: new Date(searchItem.value)}});
        }
        break;
      case 'createTimeEnd':
        if (searchItem.value) {
          orderQuery.$and.push({'create_time': {$exists: true}});
          orderQuery.$and.push({'create_time': {$lte: new Date(searchItem.value)}});
        }
        break;

      case 'planDeliveryTimeStart':
        if (searchItem.value) {
          orderQuery.$and.push({'delivery_start_time': {$exists: true}});
          orderQuery.$and.push({'delivery_start_time': {$gte: new Date(searchItem.value)}});
        }
        break;
      case 'planDeliveryTimeEnd':
        if (searchItem.value) {
          orderQuery.$and.push({'delivery_end_time': {$exists: true}});
          orderQuery.$and.push({'delivery_end_time': {$lte: new Date(searchItem.value)}});
        }
        break;

      case 'deliveryTimeStart':
        if (searchItem.value) {
          orderQuery.$and.push({'delivery_time': {$exists: true}});
          orderQuery.$and.push({'delivery_time': {$gte: new Date(searchItem.value)}});
        }
        break;
      case 'deliveryTimeEnd':
        if (searchItem.value) {
          orderQuery.$and.push({'delivery_time': {$exists: true}});
          orderQuery.$and.push({'delivery_time': {$lte: new Date(searchItem.value)}});
        }
        break;
      case 'goods_name':
        if (searchItem.value) {
          orderQuery.$and.push({'order_details': {$exists: true}});
          orderQuery.$and.push({'order_details.goods_name': {$regex: searchItem.value, $options: 'i'}});
        }
        break;
      case 'damaged':
        if (searchItem.value) {
          orderQuery.damaged = (searchItem.value === 'true' || searchItem.value === true);
        }
        break;

      case 'planPickupTimeStart':
        if (searchItem.value) {
          orderQuery.$and.push({'pickup_start_time': {$exists: true}});
          orderQuery.$and.push({'pickup_start_time': {$gte: new Date(searchItem.value)}});
        }
        break;
      case 'planPickupTimeEnd':
        if (searchItem.value) {
          orderQuery.$and.push({'pickup_end_time': {$exists: true}});
          orderQuery.$and.push({'pickup_end_time': {$lte: new Date(searchItem.value)}});
        }
        break;

      case 'pickupTimeStart':
        if (searchItem.value) {
          orderQuery.$and.push({'pickup_time': {$exists: true}});
          orderQuery.$and.push({'pickup_time': {$gte: new Date(searchItem.value)}});
        }
        break;
      case 'pickupTimeEnd':
        if (searchItem.value) {
          orderQuery.$and.push({'pickup_time': {$exists: true}});
          orderQuery.$and.push({'pickup_time': {$lte: new Date(searchItem.value)}});
        }
        break;
      case 'sender':
        if (searchItem.value) {
          orderQuery.$and.push({'sender_name': {$regex: searchItem.value, $options: 'i'}});
        }
        break;
      case 'receiver':
        if (searchItem.value) {
          orderQuery.$and.push({'receiver_name': {$regex: searchItem.value, $options: 'i'}});
        }
        break;
      case 'description':
        if (searchItem.value) {
          orderQuery.$and.push({'description': {$regex: searchItem.value, $options: 'i'}});
        }
        break;
      case 'order_number':
        if (searchItem.value) {
          orderQuery.$and.push({
            $or: [{
              'order_details.order_number': {$regex: searchItem.value, $options: 'i'}
            },
              {'order_details.refer_order_number': {$regex: searchItem.value, $options: 'i'}}
            ]
          });
        }
        break;
      case 'executor':
        if (searchItem.value) {
          orderQuery.$and.push({
            $or: [{
              'execute_drivers.username': {$regex: searchItem.value, $options: 'i'}
            }, {
              'execute_drivers.nickname': {$regex: searchItem.value, $options: 'i'}
            }, {
              'execute_drivers.plate_numbers': {$regex: searchItem.value, $options: 'i'}
            }, {
              'execute_companies.name': {$regex: searchItem.value, $options: 'i'}
            }]
          });
        }
        break;
      case 'assign_status':
        if (searchItem.value) {
          orderQuery.$and.push({assign_status: {$in: searchItem.value}});
        }
        break;
      case 'viewer':
        if (searchItem.value) {
          if (searchItem.value === 'sender') {
            orderQuery.$and.push({'sender_company.company_id': user.company._id.toString()});
            needInGroup = false;
          }
          if (searchItem.value === 'receiver') {
            orderQuery.$and.push({'receiver_company.company_id': user.company._id.toString()});
            needInGroup = false;
          }
        }
        break;

      default:
        break;
    }
  }

  if (needInGroup) {
    // orderQuery.$and.push({execute_group: {$in: groupIds}});
  }
}

function generateAbnormalCondition(orderQuery) {
  if (!orderQuery) {
    orderQuery = {};
  }
  if (!orderQuery.$or) {
    orderQuery.$or = [];
  }

  //超过预计时间还未提货
  orderQuery.$or.push({$and: [{status: 'unPickupSigned'}, {pickup_deferred: false}, {pickup_end_time: {$exists: true}}, {pickup_end_time: {$lt: new Date()}}]});
  //超过预计时间还未交货
  orderQuery.$or.push({$and: [{status: 'unDeliverySigned'}, {delivery_deferred: false}, {delivery_end_time: {$exists: true}}, {delivery_end_time: {$lt: new Date()}}]});

  //实际提货时间 > 预计提货时间
  orderQuery.$or.push({pickup_deferred: true});

  //实际交货时间 > 预计交货时间
  orderQuery.$or.push({delivery_deferred: true});

  //有货损
  orderQuery.$or.push({damaged: true});

  //缺失件数
  orderQuery.$or.push({missing_packages: true});
  orderQuery.$or.push({pickup_missing_packages: true});
  orderQuery.$or.push({delivery_missing_packages: true});

  //地址异常
  orderQuery.$or.push({pickup_address_difference: true});
  orderQuery.$or.push({delivery_address_difference: true});

  orderQuery.$or.push({'halfway_events': {$gt: {$size: 0}}});

  //车牌异常
  orderQuery.$or.push({pickup_driver_plate_difference: true});
  orderQuery.$or.push({delivery_driver_plate_difference: true});
  orderQuery.$or.push({transport_plate_difference: true});

  orderQuery.$or.push({un_confirm_first_inform: true});
  orderQuery.$or.push({un_confirm_second_inform: true});
}

//根据组id和订单状态集合获取当前页的订单
exports.getOrdersByGroupIdsWithStatusArray = function (user, statusArray, currentPage, limit, sort, searchArray, callback) {
  if (!limit) {
    limit = 0;
  }
  if (!currentPage) {
    currentPage = 1;
  }
  if (!statusArray || statusArray.length === 0) {
    statusArray = ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped', 'unDeliverySigned', 'unDeliveried', 'completed'];
  }
  var skipCount = limit * (currentPage - 1);
  var orderQuery = {
    $and: [],
    $or: []
  };

  orderQuery.$and.push({status: {$in: statusArray}});

  generateQueryCondition(orderQuery, searchArray, user);

  if (orderQuery.$or.length === 0) {
    delete orderQuery.$or;
  }
  sort = getSortConditions(sort);
  Order.count(orderQuery, function (err, totalCount) {
    if (!limit) {
      limit = totalCount;
    }
    Order.find(orderQuery)
      .limit(limit)
      .skip(skipCount)
      .populate('order_detail create_company delivery_contact pickup_contact')
      .sort(sort)
      .exec(function (err, orders) {
        if (err)
          return callback({err: orderError.internal_system_error}, null);

        return callback(null, {totalCount: totalCount, currentPage: currentPage, limit: limit, orders: orders});
      });
  });
};

exports.getDriverOrdersByDriverIdWithStatuses = function (driverId, statusArray, type, callback) {
  var orderQuery = {
    execute_driver: driverId,
    status: {$in: statusArray},
    type: type
  };
  if (type === 'driver') {
    orderQuery = {
      type: type,
      execute_driver: driverId,
      status: {$in: statusArray},
      $or: [{is_wechat: {$exists: false}}, {is_wechat: false}],
      created: {
        $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
      }
    };
  }
  Order.find(orderQuery)
    .sort({create_time: 1})
    .populate('order_detail pickup_contact delivery_contact')
    .exec(function (err, orders) {
      if (err) {
        return callback({err: orderError.internal_system_error}, null);
      }

      return callback(null, {orders: orders});
    });
};

//获取用户所有的订单（包括已删除的订单）
exports.getUserAllOrders = function (user, currentPage, limit, sort, searchArray, callback) {
  if (!currentPage) {
    currentPage = 1;
  }

  var skipCount = limit * (currentPage - 1);
  var orderQuery = {
    $or: [],
    $and: []
  };

  generateQueryCondition(orderQuery, searchArray, user);

  if (orderQuery.$or.length === 0) {
    delete orderQuery.$or;
  }
  if (orderQuery.$and.length === 0) {
    delete orderQuery.$and;
  }

  sort = getSortConditions(sort);
  Order.count(orderQuery, function (err, totalCount) {
    if (!limit) {
      limit = totalCount;
    }
    Order.find(orderQuery)
      .limit(limit)
      .skip(skipCount)
      .populate('order_detail create_company delivery_contact pickup_contact tender')
      .sort(sort)
      .exec(function (err, orders) {
        if (err)
          return callback({err: orderError.internal_system_error}, null);

        return callback(null, {totalCount: totalCount, currentPage: currentPage, limit: limit, orders: orders});
      });
  });
};

//获取异常运单(实际提交货时间大于预计提交货时间，有货损，有中途事件， 不包括删除)
exports.getAbnormalOrders = function (user, groupIds, currentPage, limit, sort, searchArray, callback) {
  if (!currentPage) {
    currentPage = 1;
  }

  var skipCount = limit * (currentPage - 1);
  var orderQuery = {
    $or: [],
    $and: []
  };

  //不包括删除的运单
  orderQuery.$and.push({$or: [{'delete_status': {$exists: false}}, {'delete_status': false}]});

  //添加搜索条件
  generateQueryCondition(orderQuery, searchArray, user, groupIds);

  var abnormalQuery = {};
  generateAbnormalCondition(abnormalQuery);
  orderQuery.$and.push({$or: abnormalQuery.$or});

  if (orderQuery.$or.length === 0) {
    delete orderQuery.$or;
  }
  sort = getSortConditions(sort);
  Order.count(orderQuery, function (err, totalCount) {
    if (!limit) {
      limit = totalCount;
    }
    Order.find(orderQuery)
      .limit(limit)
      .skip(skipCount)
      .populate('order_detail create_company delivery_contact pickup_contact')
      .sort(sort)
      .exec(function (err, orders) {
        if (err)
          return callback({err: orderError.internal_system_error}, null);

        return callback(null, {totalCount: totalCount, currentPage: currentPage, limit: limit, orders: orders});
      });
  });
};

//目前获取全公司的异常运单数量，没有区分组（原因是因为推送那边只推送与公司相关的信息，没有具体到组到人）
//目前只查询作为创建者或承运者的异常运单，而没有作为发货方或收货方的。
exports.getAbnormalOrdersCount = function (currentUser, groupIds, callback) {
  var orderQuery = {
    $and: []
  };
  orderQuery.$and.push({$or: [{delete_status: {$exists: false}}, {delete_status: false}]});
  orderQuery.$and.push({execute_company: currentUser.company._id});
  orderQuery.$and.push({abnormal_handle_user_ids: {$ne: currentUser._id.toString()}});
  orderQuery.$and.push({execute_group: {$in: groupIds}});

  var abnormalQuery = {};
  generateAbnormalCondition(abnormalQuery);

  orderQuery.$and.push({$or: abnormalQuery.$or});

  Order.count(orderQuery, function (err, totalCount) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }
    return callback(null, totalCount);
  });
};

exports.handleAbnormalOrder = function (orderId, currentUser, callback) {
  Order.update({_id: orderId}, {$addToSet: {abnormal_handle_user_ids: currentUser._id.toString()}}, function (err, raw) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }
    return callback();
  });
};

exports.getAssignOrderCount = function (user, callback) {
  Order.count({
    // execute_group: {$in: groupIds},
    $or: [{'delete_status': {$exists: false}}, {'delete_status': false}],
    assign_status: {$in: ['unAssigned', 'assigning']}
  }).exec(function (err, count) {
    if (err) {
      err = {err: orderError.internal_system_error};
    }
    return callback(err, count);
  });
};

exports.getOnwayOrderCount = function (user, callback) {
  Order.count({
    // execute_group: {$in: groupIds},
    $or: [{'delete_status': {$exists: false}}, {'delete_status': false}],
    status: {$in: ['assigning', 'unPickupSigned', 'unPickuped', 'unDeliverySigned', 'unDeliveried']}
  }).exec(function (err, count) {
    if (err) {
      err = {err: orderError.internal_system_error};
    }
    return callback(err, count);
  });
};


function updatePickupContact(orderEntity, newAssignInfo) {
  orderEntity.pickup_contact.name = newAssignInfo.pickup_contact_name;
  orderEntity.pickup_contact.phone = newAssignInfo.pickup_contact_phone;
  orderEntity.pickup_contact.mobile_phone = newAssignInfo.pickup_contact_mobile_phone;
  orderEntity.pickup_contact.address = newAssignInfo.pickup_contact_address;
  orderEntity.pickup_contact.email = newAssignInfo.pickup_contact_email;
}
function updatePickupTime(orderEntity, newAssignInfo) {
  orderEntity.pickup_start_time = newAssignInfo.pickup_start_time;
  orderEntity.pickup_end_time = newAssignInfo.pickup_end_time;
}

function updateDeliveryContact(orderEntity, newAssignInfo) {
  orderEntity.delivery_contact.name = newAssignInfo.delivery_contact_name;
  orderEntity.delivery_contact.phone = newAssignInfo.delivery_contact_phone;
  orderEntity.delivery_contact.mobile_phone = newAssignInfo.delivery_contact_mobile_phone;
  orderEntity.delivery_contact.address = newAssignInfo.delivery_contact_address;
  orderEntity.delivery_contact.email = newAssignInfo.delivery_contact_email;
}
function updateDeliveryTime(orderEntity, newAssignInfo) {
  orderEntity.delivery_start_time = newAssignInfo.delivery_start_time;
  orderEntity.delivery_end_time = newAssignInfo.delivery_end_time;
}

function findOrdersById(id, callback) {
  Order.findOne({_id: id, delete_status: false}, function (err, order) {
    if (err || !order) {
      return callback({err: orderError.internal_system_error});
    }

    return callback(null, order);
  });
}

function findChildOrdersByParentWithPopulate(parentId, populate, callback) {
  Order.find({parent_order: parentId, delete_status: false}).populate(populate).exec(function (err, childOrders) {
    if (err || !childOrders) {
      return callback({err: orderError.internal_system_error});
    }

    return callback(null, childOrders);
  });
}


function updateParentExecuters(parentOrder, callback) {
  if (!parentOrder) {
    return callback();
  }

  findOrdersById(parentOrder, function (err, findOrder) {
    if (err) {
      return callback(err);
    }

    findChildOrdersByParentWithPopulate(parentOrder, 'execute_company', function (err, childOrders) {
      if (err) {
        return callback(err);
      }

      var executeCompanies = [];
      var executeDrivers = [];

      async.each(childOrders, function (childOrder, eachCallback) {
        if (childOrder.type === 'company') {
          executeCompanies.push(childOrder.execute_company.toJSON());
        }
        executeCompanies = executeCompanies.concat(childOrder.execute_companies);
        executeDrivers = executeDrivers.concat(childOrder.execute_drivers);

        return eachCallback();
      }, function (err) {
        if (err) {
          return callback(err);
        }
        findOrder.execute_companies = executeCompanies;
        findOrder.execute_drivers = executeDrivers;
        findOrder.save(function (err, saveOrder) {
          if (err || !saveOrder) {
            return callback({err: orderError.internal_system_error});
          }
          return updateParentExecuters(findOrder.parent_order, callback);
        });
      });
    });
  });
}

exports.updateParentExecuters = function (parentOrder, callback) {
  updateParentExecuters(parentOrder, callback);
};

function assignDriver(user, order, orderDetail, assignInfo, isBatch, callback) {
  DriverService.getAssignDriver(assignInfo, user.company._id, function (err, driver) {
    if (err) {
      return callback({err: err}, null);
    }
    if (!driver) {
      return callback({err: orderError.driver_not_exist}, null);
    }

    if (assignInfo.is_wechat && (!driver.wechat_profile || !driver.wechat_profile.openid)) {
      return callback({err: orderError.driver_openid_empty});
    }

    assignInfo.driver_id = driver._id;

    //提货收获的联系人必须由外界传进来
    async.auto({
        pickupContact: function (callback) {
          var newPickupContact = new Contact({
            name: assignInfo.pickup_contact_name,
            phone: assignInfo.pickup_contact_phone,
            mobile_phone: assignInfo.pickup_contact_mobile_phone,
            address: assignInfo.pickup_contact_address,
            email: assignInfo.pickup_contact_email,
            location: assignInfo.pickup_contact_location,
            brief: assignInfo.pickup_contact_brief
          });
          newPickupContact.save(function (err, pickupContactEntity) {
            if (err || !pickupContactEntity) {
              return callback({err: orderError.internal_system_error});
            }

            callback(null, pickupContactEntity);
          });
        },
        deliveryContact: function (callback) {
          var deliveryContact = new Contact({
            name: assignInfo.delivery_contact_name,
            phone: assignInfo.delivery_contact_phone,
            mobile_phone: assignInfo.delivery_contact_mobile_phone,
            address: assignInfo.delivery_contact_address,
            email: assignInfo.delivery_contact_email,
            location: assignInfo.delivery_contact_location,
            brief: assignInfo.delivery_contact_brief
          });

          deliveryContact.save(function (err, deliveryContactEntity) {
            if (err || !deliveryContactEntity) {
              return callback(orderError.internal_system_error, null);
            }

            return callback(err, deliveryContactEntity);
          });
        },
        order: ['pickupContact', 'deliveryContact', function (callback, results) {
          var pickupContact = results.pickupContact;
          var deliveryContact = results.deliveryContact;

          delete driver._doc.password;
          delete driver._doc.salt;
          var execute_drivers = [];
          execute_drivers.push(driver.toJSON());

          var newOrder = new Order({
            order_detail: order.order_detail,
            order_details: orderDetail,
            parent_order: order._id,
            status: 'unPickupSigned', //分配给司机，则订单变为unPickupSigned
            customer_name: order.customer_name,
            create_user: user._id,
            create_company: user.company._id,
            create_group: order.execute_group,
            execute_driver: assignInfo.driver_id,
            execute_drivers: execute_drivers,
            pickup_start_time: assignInfo.pickup_start_time,
            pickup_end_time: assignInfo.pickup_end_time,
            delivery_start_time: assignInfo.delivery_start_time,
            delivery_end_time: assignInfo.delivery_end_time,
            pickup_contact: pickupContact._id,
            delivery_contact: deliveryContact._id,
            pickup_contacts: pickupContact,
            delivery_contacts: deliveryContact,
            description: order.description,
            type: 'driver',
            source: user.company.name,
            sender_name: order.sender_name,
            receiver_name: order.receiver_name,

            pickup_entrance_force: order.pickup_entrance_force,
            pickup_photo_force: order.pickup_photo_force,
            delivery_entrance_force: order.delivery_entrance_force,
            delivery_photo_force: order.delivery_photo_force,
            company_configuration: order.company_configuration,
            is_wechat: assignInfo.is_wechat || false  //是否为微信运单
          });

          //设置路单
          if (assignInfo.road_order_name) {
            newOrder.road_order = {
              name: assignInfo.road_order_name,
              _id: assignInfo.road_order_id
            };
          }

          newOrder.assigned_infos = [assignInfo];

          newOrder.save(function (err, driverOrder) {
            if (err || !driverOrder) {
              return callback({err: orderError.internal_system_error}, null);
            }

            updateParentExecuters(driverOrder.parent_order, function (err) {
              if (err) {
                return callback(err);
              }

              if (driverOrder.is_wechat) {
                wechatLib.pushNewOrderMessageToWechat(driver.wechat_profile.openid, driver._id, driverOrder);
              }
              else if (driver.device_id || driver.device_id_ios) {
                if (!isBatch) {
                  driverOrder._doc.order_detail = orderDetail;
                  driverOrder._doc.pickup_contact = pickupContact;
                  driverOrder._doc.delivery_contact = deliveryContact;
                  pushSingleAssignToDriver(driver, driverOrder);
                }
              }
              else if (driver.temporary) {
                if (!isBatch) {
                  //发送短信
                  CustomizeEventService.recordAssginDriverEvent(newOrder._id, driver._id, function (err, customizeEvent) {
                    if (err) {
                      return callback({err: err});
                    }
                    else {
                      var accessUrl = config.serverAddress + 'order/temporarydriver?customize_event_id=' + customizeEvent._id.toString();
                      smsLib.ypSendAssginDriverSms(driver.username, accessUrl, function (err, result) {
                        if (err) {
                          console.log('send assign driver sms error' + err);
                        }
                        console.log('send assign driver sms result' + result);
                      });
                    }
                  });
                }
              }

              return callback(null, driverOrder);
            });
          });
        }]
      },
      function (err, results) {
        if (err)
          return callback(err);

        return callback(err, results.order);
      }
    );

  });
}

function assignWarehouse(user, order, orderDetail, assignInfo, isBatch, callback) {
  DriverService.getAssignDriver(assignInfo, user.company._id, function (err, driver) {
    if (err) {
      return callback({err: err}, null);
    }
    if (!driver) {
      return callback({err: orderError.driver_not_exist}, null);
    }

    if (assignInfo.is_wechat && (!driver.wechat_profile || !driver.wechat_profile.openid)) {
      return callback({err: orderError.driver_openid_empty});
    }

    assignInfo.driver_id = driver._id;

    //提货收获的联系人必须由外界传进来
    async.auto({
      pickupContact: function (callback) {
        var newPickupContact = new Contact({
          name: assignInfo.pickup_contact_name,
          phone: assignInfo.pickup_contact_phone,
          mobile_phone: assignInfo.pickup_contact_mobile_phone,
          address: assignInfo.pickup_contact_address,
          email: assignInfo.pickup_contact_email,
          location: assignInfo.pickup_contact_location,
          brief: assignInfo.pickup_contact_brief
        });
        newPickupContact.save(function (err, pickupContactEntity) {
          if (err || !pickupContactEntity) {
            return callback({err: orderError.internal_system_error});
          }

          callback(null, pickupContactEntity);
        });
      },
      deliveryContact: function (callback) {
        var deliveryContact = new Contact({
          name: assignInfo.delivery_contact_name,
          phone: assignInfo.delivery_contact_phone,
          mobile_phone: assignInfo.delivery_contact_mobile_phone,
          address: assignInfo.delivery_contact_address,
          email: assignInfo.delivery_contact_email,
          location: assignInfo.delivery_contact_location,
          brief: assignInfo.delivery_contact_brief
        });

        deliveryContact.save(function (err, deliveryContactEntity) {
          if (err || !deliveryContactEntity) {
            return callback(orderError.internal_system_error, null);
          }

          return callback(err, deliveryContactEntity);
        });
      },
      order: ['pickupContact', 'deliveryContact', function (callback, results) {
        var pickupContact = results.pickupContact;
        var deliveryContact = results.deliveryContact;

        var newOrder = new Order({
          order_detail: order.order_detail,
          order_details: orderDetail,
          parent_order: order._id,
          status: 'unDeliveried', //分配给仓储管理员，则订单变为unDeliveried
          customer_name: order.customer_name,
          create_user: user._id,
          create_company: user.company._id,
          create_group: order.execute_group,
          execute_driver: assignInfo.driver_id,
          pickup_start_time: assignInfo.pickup_start_time,
          pickup_end_time: assignInfo.pickup_end_time,
          delivery_start_time: assignInfo.delivery_start_time,
          delivery_end_time: assignInfo.delivery_end_time,
          pickup_contact: pickupContact._id,
          delivery_contact: deliveryContact._id,
          pickup_contacts: pickupContact,
          delivery_contacts: deliveryContact,
          description: order.description,
          type: 'warehouse',
          source: user.company.name,
          sender_name: order.sender_name,
          receiver_name: order.receiver_name,

          pickup_entrance_force: order.pickup_entrance_force,
          pickup_photo_force: order.pickup_photo_force,
          delivery_entrance_force: order.delivery_entrance_force,
          delivery_photo_force: order.delivery_photo_force,
          company_configuration: order.company_configuration,
          is_wechat: assignInfo.is_wechat || false
        });

        newOrder.save(function (err, driverOrder) {
          if (err || !driverOrder) {
            return callback({err: orderError.internal_system_error}, null);
          }

          driverOrder._doc.order_detail = orderDetail;
          driverOrder._doc.pickup_contact = pickupContact;
          driverOrder._doc.delivery_contact = deliveryContact;

          if (driverOrder.is_wechat) {
            wechatLib.pushNewOrderMessageToWechat(driver.wechat_profile.openid, driver._id, driverOrder);
          }
          else if (driver.device_id || driver.device_id_ios) {
            if (!isBatch) {
              pushSingleAssignToWarehouse(driver, driverOrder);
            }
          }
          else if (driver.temporary) {
            if (!isBatch) {
              //发送短信
              CustomizeEventService.recordAssginDriverEvent(newOrder._id, driver._id, function (err, customizeEvent) {
                if (err) {
                  return callback({err: err});
                }
                else {
                  var accessUrl = config.serverAddress + 'order/temporarydriver?customize_event_id=' + customizeEvent._id.toString();
                  smsLib.ypSendAssginDriverSms(driver.username, accessUrl, function (err, result) {
                    if (err) {
                      console.log('send assign driver sms error' + err);
                    }
                    console.log('send assign driver sms result' + result);
                  });
                }
              });
            }
          }

          return callback(null, driverOrder);
        });
      }]
    }, function (err, results) {
      if (err)
        return callback(err);

      return callback(err, results.order);
    });
  });
}

function assignCompany(user, order, orderDetail, assignInfo, callback) {
  Company.findOne({_id: assignInfo.company_id}, function (err, company) {
    if (err) {
      return callback({err: orderError.internal_system_error}, null);
    }

    if (!company) {
      return callback({err: orderError.company_not_exist}, null);
    }

    //提货收获的联系人必须由外界传进来
    async.auto({
      pickupContact: function (callback) {
        var newPickupContact = new Contact({
          name: assignInfo.pickup_contact_name,
          phone: assignInfo.pickup_contact_phone,
          mobile_phone: assignInfo.pickup_contact_mobile_phone,
          address: assignInfo.pickup_contact_address,
          email: assignInfo.pickup_contact_email,
          location: assignInfo.pickup_contact_location,
          brief: assignInfo.pickup_contact_brief
        });
        newPickupContact.save(function (err, pickupContactEntity) {
          if (err || !pickupContactEntity) {
            return callback({err: orderError.internal_system_error});
          }

          callback(null, pickupContactEntity);
        });
      },
      deliveryContact: function (callback) {
        var deliveryContact = new Contact({
          name: assignInfo.delivery_contact_name,
          phone: assignInfo.delivery_contact_phone,
          mobile_phone: assignInfo.delivery_contact_mobile_phone,
          address: assignInfo.delivery_contact_address,
          email: assignInfo.delivery_contact_email,
          location: assignInfo.delivery_contact_location,
          brief: assignInfo.delivery_contact_brief
        });

        deliveryContact.save(function (err, deliveryContactEntity) {
          if (err || !deliveryContactEntity) {
            return callback(orderError.internal_system_error, null);
          }

          return callback(err, deliveryContactEntity);
        });
      },
      order: ['pickupContact', 'deliveryContact', function (callback, results) {
        var pickupCotact = results.pickupContact;
        var deliveryContact = results.deliveryContact;

        var newOrder = new Order({
          order_detail: order.order_detail,
          order_details: orderDetail,
          parent_order: order._id,
          status: 'unAssigned', //分配给公司，unAssigned
          customer_name: order.customer_name,
          create_user: user._id,
          create_company: user.company._id,
          create_group: order.execute_group,
          execute_company: company._id,
          execute_group: company.default_group,
          pickup_start_time: assignInfo.pickup_start_time,
          pickup_end_time: assignInfo.pickup_end_time,
          delivery_start_time: assignInfo.delivery_start_time,
          delivery_end_time: assignInfo.delivery_end_time,
          pickup_contact: pickupCotact._id,
          delivery_contact: deliveryContact._id,
          pickup_contacts: pickupCotact,
          delivery_contacts: deliveryContact,
          description: order.description,
          type: 'company',
          source: user.company.name,
          sender_name: order.sender_name,
          receiver_name: order.receiver_name,

          pickup_entrance_force: order.pickup_entrance_force,
          pickup_photo_force: order.pickup_photo_force,
          delivery_entrance_force: order.delivery_entrance_force,
          delivery_photo_force: order.delivery_photo_force,
          company_configuration: order.company_configuration
        });

        newOrder.order_details.refer_order_number = newOrder.order_details.order_number;

        newOrder.save(function (err, companyOrder) {
          if (err || !companyOrder) {
            return callback({err: orderError.internal_system_error}, null);
          }

          updateParentExecuters(companyOrder.parent_order, function (err) {
            if (err) {
              return callback(err, null);
            }
            companyOrder._doc.detail = orderDetail;
            companyOrder._doc.pickup_contact = pickupCotact;
            companyOrder._doc.delivery_contact = deliveryContact;
            return callback(null, companyOrder);
          });

        });
      }]
    }, function (err, results) {
      if (err)
        return callback(err);

      return callback(err, results.order);
    });

  });
}

function pushRemoveOrderMessageToDriver(driverId, orderId, callback) {
  //推送通知
  Driver.findOne({_id: driverId}, function (err, findDriver) {
    if (err) {
      return callback(orderError.internal_system_error);
    }
    if (!findDriver) {
      return callback(orderError.driver_not_exist);
    }

    pushDeleteInfoToDriver(findDriver, orderId);

    return callback();
  });
}

function removeSubOrders(parentOrder, callback) {
  Order.find({parent_order: parentOrder._id}, function (err, childOrders) {
    if (err || !childOrders) {
      return callback(orderError.internal_system_error);
    }
    if (childOrders.length <= 0) {  //没有子订单
      return callback();
    }

    async.each(childOrders, function (childrenOrder, eachCallback) {
      childrenOrder.delete_status = true;
      childrenOrder.save(function (err, saveChildrenOrder) {
        if (err || !saveChildrenOrder) {
          return eachCallback(orderError.internal_system_error);
        }

        if (saveChildrenOrder.type === 'company') {
          return removeSubOrders(saveChildrenOrder, eachCallback);
        }
        else {
          return pushRemoveOrderMessageToDriver(saveChildrenOrder.execute_driver, saveChildrenOrder._id, eachCallback);
        }
      });
    }, function (err) {
      if (err) {
        return callback(err);
      }

      return callback(null, null);

    });
  });
}

exports.assignOrderToDriver = function (user, order, orderDetail, assignInfo, isBatch, callback) {
  return assignDriver(user, order, orderDetail, assignInfo, isBatch, callback);
};
exports.assignOrderToWarehouse = function (user, order, orderDetail, assignInfo, isBatch, callback) {
  return assignWarehouse(user, order, orderDetail, assignInfo, isBatch, callback);
};
exports.assignOrderToCompany = function (user, order, orderDetail, assignInfo, callback) {
  return assignCompany(user, order, orderDetail, assignInfo, callback);
};

exports.matchOrderStatus = function (orderId, statusArray, callback) {
  if (!orderId || !statusArray) {
    return callback({err: orderError.params_null});
  }

  Order.findOne({_id: orderId, status: {$in: statusArray}}, function (err, findOrder) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }
    if (!findOrder) {
      return callback(null, {order: findOrder, inStatus: false});
    }
    return callback(null, {order: findOrder, inStatus: true});
  });
};

//修改订单分配基本信息
/*
 * 1、判断订单状态(unPickedUp)
 * 2、修改现有订单
 * 3、推送通知（司机、仓储）
 *
 * params
 * orderId: 订单Id
 * basicInfo: 基本信息
 * callback: 回调函数
 * */
exports.updateOrderBasicAssignInfo = function (orderId, newAssignInfo, callback) {
  //分配时，分配信息中关联了创建的订单
  if (newAssignInfo.order_id) {
    switch (newAssignInfo.type) {
      case 'driver':
      case 'warehouse':
      case 'company':
        Order.findOne({_id: newAssignInfo.order_id}).populate('order_detail pickup_contact delivery_contact').exec(function (err, findOrder) {
          if (err || !findOrder) {
            return callback(orderError.internal_system_error);
          }

          updatePickupContact(findOrder, newAssignInfo);
          updatePickupTime(findOrder, newAssignInfo);
          updateDeliveryContact(findOrder, newAssignInfo);
          updateDeliveryTime(findOrder, newAssignInfo);

          findOrder.pickup_contact.save(function (err, savePickup) {
            if (err || !savePickup) {
              return callback(orderError.internal_system_error);
            }

            findOrder.delivery_contact.save(function (err, saveDelivery) {
              if (err || !saveDelivery) {
                return callback(orderError.internal_system_error);
              }

              findOrder.save(function (err, saveOrder) {
                if (err || !saveOrder) {
                  return callback(orderError.internal_system_error);
                }

                if (findOrder.type !== 'company') {

                  Driver.findOne({_id: newAssignInfo.driver_id}, function (err, findDriver) {
                    if (err) {
                      return callback(orderError.internal_system_error);
                    }
                    if (!findDriver) {
                      return callback(orderError.driver_not_exist);
                    }

                    pushUpdateInfoToDriver(findDriver, findOrder.toJSON());

                    return callback(null, saveOrder);
                  });
                }
                else {
                  return callback(null, saveOrder);
                }

              });

            });

          });

        });
        break;

      default:
        return callback(orderError.assign_info_can_not_modify);
    }
  }
  else {
    return callback(orderError.assign_info_can_not_modify);
  }
};

function removeAssignedOrder(order_id, callback) {
  Order.findOne({_id: order_id}, function (err, removedOrder) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }
    if (!removedOrder) {
      return callback({err: orderError.order_not_exist});
    }

    if (removedOrder.status !== 'unAssigned' && removedOrder.status !== 'assigning' && removedOrder.status !== 'unPickupSigned') {
      return callback({err: orderError.order_can_not_delete});
    }


    removedOrder.delete_status = true;
    removedOrder.execute_drivers = [];
    removedOrder.execute_companies = [];
    removedOrder.save(function (err, saveRemovedOrder) {
      if (err || !saveRemovedOrder) {
        return callback({err: orderError.internal_system_error});
      }

      updateParentExecuters(removedOrder.parent_order, function (err) {
        if (err) {
          return callback(err);
        }

        if (saveRemovedOrder.type === 'company') {
          return removeSubOrders(saveRemovedOrder, callback);
        }
        else {
          return pushRemoveOrderMessageToDriver(saveRemovedOrder.execute_driver, saveRemovedOrder._id, callback);
        }
      });
    });

  });
}

//指定运单是否可见
//otherCondition 是指其他条件，如发货方，收货方。
exports.isOrderAllowSeeing = function (order, currentUser, otherCondition, callback) {
  return callback(null, true);

  if (otherCondition) {
    if (otherCondition.sender) {
      if (order.sender_company && order.sender_company.company_id && order.sender_company.company_id === currentUser.company._id.toString()) {
        return callback(null, true);
      }
      else {
        return callback(null, false);
      }
    }
    if (otherCondition.receiver) {
      if (order.receiver_company && order.receiver_company.company_id && order.receiver_company.company_id === currentUser.company._id.toString()) {
        return callback(null, true);
      }
      else {
        return callback(null, false);
      }
    }
  }

// 如果都不是，则判断当前用户是否为运单的创建者或执行者
  UserService.getGroups(currentUser._id, function (err, userGroups) {
    if (err) {
      return callback(err);
    }

    var canSeeTheOrder = false;
    userGroups.forEach(function (userGroup) {
      if (userGroup.group._id.toString() === order.create_group._id.toString() || userGroup.group._id.toString() === order.execute_group._id.toString()) {
        canSeeTheOrder = true;
        return;
      }
    });

    return callback(null, canSeeTheOrder);
  });
};

//根据assign_info_id获取分段信息
exports.getAssignInfoById = function (order, assignInfoId, callback) {
  if (!order || !assignInfoId) {
    return callback({err: orderError.params_null});
  }

  if (!order.assigned_infos || !Array.isArray(order.assigned_infos) || order.assigned_infos.length === 0) {
    return callback(null, null);
  }

  async.filter(order.assigned_infos, function (assignItem, asyncCallback) {
    if (assignItem._id && assignItem._id.toString() === assignInfoId.toString()) {
      return asyncCallback(true);
    }

    return asyncCallback(false);

  }, function (results) {
    return callback(null, results);
  });

};
exports.deleteAssignInfoById = function (order, assignInfoId, callback) {
  if (!order || !assignInfoId) {
    return callback({err: orderError.params_null});
  }

  if (!order.assigned_infos || !Array.isArray(order.assigned_infos) || order.assigned_infos.length === 0) {
    return callback();
  }

  var assignIndex = -1;
  order.assigned_infos.every(function (assignItem, index, arr) {
    if (assignItem._id && assignItem._id.toString() === assignInfoId.toString()) {
      assignIndex = index;
      return false;
    }
    return true;
  });

  if (assignIndex > -1) {
    order.assigned_infos.splice(assignIndex, 1);
  }

  return callback();
};
exports.removeAssignedOrder = function (order_id, callback) {
  return removeAssignedOrder(order_id, callback);
};

exports.pushDeleteInfoToDriver = function (driver, orderId) {
  pushDeleteInfoToDriver(driver, orderId);
};


//total_assign_count, assign_count, assign_status, status
exports.refreshOrderInfo = function (order, callback) {
  if (!order) {
    return callback({err: orderError.params_null});
  }

  if (!order.assigned_infos || !Array.isArray(order.assigned_infos)) {
    return callback();
  }

  if (order.assigned_infos.length === 0) {
    order.total_assign_count = 0;
    order.assigned_count = 0;
    order.status = 'unAssigned';
    order.assign_status = 'unAssigned';

    return callback();
  }

  var assignCount = 0;
  order.assigned_infos.forEach(function (assignItem) {
    //已经分配的
    if (assignItem.order_id && assignItem.is_assigned) {
      assignCount += 1;
    }
  });

  order.total_assign_count = order.assigned_infos.length;
  order.assigned_count = assignCount;

  if (order.total_assign_count > order.assigned_count) {
    order.assign_status = 'assigning';
    return callback();
  }
  else {
    order.assign_status = 'completed';

    if (order.status === 'unAssigned' || order.status === 'assigning') {
      order.status = 'unPickupSigned';
      return callback();
    }
    else {
      Order.find({parent_order: order._id}, function (err, childOrders) {
        var isComplete = true;
        for (var i = 0; i < childOrders.length; i++) {
          if (childOrders[i].status !== 'completed') {
            isComplete = false;
            break;
          }
        }

        if (isComplete) {
          order.status = 'completed';
        }

        return callback();
      });
    }
  }

};

exports.getOrderByOrderIdAndDriverId = function (orderId, driverId, callback) {
  Order.findOne({_id: orderId, execute_driver: driverId})
    .populate('execute_driver')
    .exec(function (err, order) {
      if (err) {
        return callback({err: orderError.internal_system_error});
      }
      return callback(null, order);
    });
};

exports.finishDriverOrderCount = function (driverId, callback) {
  Order.count({
    execute_driver: driverId,
    status: 'completed',
    $or: [{
      delete_status: {$exists: false}
    }, {
      delete_status: false
    }]
  }, function (err, count) {
    if (err) {
      return callback({err: orderError.internal_system_error});
    }
    return callback(null, count);
  });
};

exports.getWechatDriverOrders = function (driverId, statuses, skip, limit, callback) {
  var condition = {
    type: 'driver',
    execute_driver: driverId,
    status: {$in: statuses},
    delete_status: false,
    created: {
      $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
    },
    is_wechat: true
  };

  Order.find(condition)
    .sort({created: -1})
    .skip(skip)
    .limit(limit)
    .exec(function (err, orders) {
      if (err) {
        err = {err: orderError.internal_system_error};
      }
      return callback(err, orders);
    });
};

exports.exportCompanyOrder = function (groupIds, filter, columns) {
  return new Promise(function (fulfill, reject) {
    getOrdersOfGroupByFilter(groupIds, filter).then(function (cursor) {
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

      writeSheet(cursor, worksheet, columns, null).then(function () {
        worksheet.commit();
        workbook.commit()
          .then(function () {
            fulfill({root: '.', filePath: filePath, filename: filePath});
          });
      }).catch(reject);
    }, function (reason) {
      reject(reason);
    });
  });
};

function writeSheet(cursor, worksheet, columns, companyName) {
  return new Promise(function (fulfill, reject) {
    worksheet.columns = columns;
    var columns_map = {};
    columns.forEach(function (c) {
      if (columns_map.hasOwnProperty(c.key)) {
        throw new Error('重复的key' + c.key);
      }
      columns_map[c.key] = c;
    });

    var orders = [];
    var execute_company_map = {},
      execute_company_array = [],
      execute_driver_map = {},
      execute_driver_array = [],
      salesmen_map = {},
      salesman_array = [];

    var count = 0;

    var order_detail_map = {},
      order_detail_array = [],
      contact_map = {},
      contact_array = [];


    // 分批处理运单
    // 每个批次一次性查询前面的批次没有查询过的所有的关联数据
    var processOrders = function () {
      return new Promise(function (fulfill, reject) {
        var promises = [];
        var promises_map = {};
        var i = 0;
        if (columns_map.hasOwnProperty('承运商')) {
          var p1 = new Promise(function (fulfill, reject) {
            execute_company_array = execute_company_array.filter(function (elem, pos) {
              if (execute_company_map.hasOwnProperty(elem)) {
                return false;
              } else {
                return execute_company_array.indexOf(elem) == pos;
              }
            });
            Company.find({'_id': {$in: execute_company_array}}).lean().exec(function (err, result) {
              if (err) {
                return reject(err);
              } else {
                return fulfill(result);
              }
            });
          });
          promises.push(p1);
          promises_map['Company'] = i;
          i++;
        }
        if (columns_map.hasOwnProperty('司机姓名') || columns_map.hasOwnProperty('司机手机') || columns_map.hasOwnProperty('司机车牌')) {
          var p2 = new Promise(function (fulfill, reject) {
            execute_driver_array = execute_driver_array.filter(function (elem, pos) {
              if (execute_driver_map.hasOwnProperty(elem)) {
                return false;
              } else {
                return execute_driver_array.indexOf(elem) == pos;
              }
            });
            Driver.find({'_id': {$in: execute_driver_array}}).lean().exec(function (err, result) {
              if (err) {
                return reject(err);
              } else {
                return fulfill(result);
              }
            });
          });
          promises.push(p2);
          promises_map['Driver'] = i;
          i++;
        }

        var p4 = new Promise(function (fulfill, reject) {
          OrderDetail.find({'_id': {$in: order_detail_array}}).lean().exec(function (err, result) {
            if (err) {
              return reject(err);
            } else {
              return fulfill(result);
            }
          });
        });
        promises.push(p4);
        promises_map['OrderDetail'] = i;
        i++;

        var p5 = new Promise(function (fulfill, reject) {
          Contact.find({'_id': {$in: contact_array}}).lean().exec(function (err, result) {
            if (err) {
              return reject(err);
            } else {
              return fulfill(result);
            }
          });
        });
        promises.push(p5);
        promises_map['Contact'] = i;
        i++;

        if (columns_map.hasOwnProperty('关注人')) {
          var p6 = new Promise(function (fulfill, reject) {
            SalesmanCompany.find({username: salesman_array}).select({
              username: 1,
              nickname: 1
            }).sort({username: 1}).lean().exec(function (err, salesmen) {
              if (err) {
                return reject(err);
              } else {
                return fulfill(salesmen);
              }
            });
          });
          promises.push(p6);
          promises_map['SalesmanCompany'] = i;
        }

        Promise.all(promises).then(function (a) {
          if (columns_map.hasOwnProperty('承运商')) {
            a[promises_map['Company']].forEach(function (company) {
              execute_company_map[company._id] = company;
            });
          }
          if (columns_map.hasOwnProperty('司机姓名') || columns_map.hasOwnProperty('司机手机') || columns_map.hasOwnProperty('司机车牌')) {
            a[promises_map['Driver']].forEach(function (driver) {
              execute_driver_map[driver._id] = driver;
            });
          }

          a[promises_map['OrderDetail']].forEach(function (orderDetail) {
            order_detail_map[orderDetail._id] = orderDetail;
          });
          a[promises_map['Contact']].forEach(function (contact) {
            contact_map[contact._id] = contact;
          });

          if (columns_map.hasOwnProperty('关注人')) {
            a[promises_map['SalesmanCompany']].forEach(function (salesman) {
              contact_map[salesman.username] = salesman;
            });
          }
          orders.forEach(function (order) {
            if (!order.sender_company) {
              order.sender_company = {};
            }
            order.sender_company.company_name = companyName;

            if (order.execute_company && columns_map.hasOwnProperty('承运商')) {
              order.execute_company = execute_company_map[order.execute_company];
            }
            if (order.execute_driver && (columns_map.hasOwnProperty('司机姓名') || columns_map.hasOwnProperty('司机手机') || columns_map.hasOwnProperty('司机车牌'))) {
              order.execute_driver = execute_driver_map[order.execute_driver];
            }
            if (order.order_detail) {
              order.order_detail = order_detail_map[order.order_detail];
            }
            if (order.pickup_contact) {
              order.pickup_contact = contact_map[order.pickup_contact];
            }
            if (order.delivery_contact) {
              order.delivery_contact = contact_map[order.delivery_contact];
            }
            if (order.salesmen && columns_map.hasOwnProperty('关注人')) {
              var salesmen = [];
              for (var i = 0, len = order.salesmen.length; i < len; i++) {
                var salesman = order.salesmen[i];
                if (salesman) {
                  if (!salesman._id) {
                    var salesman1 = salesmen_map[salesman.username];
                    if (salesman1) {
                      salesmen.push(salesman1);
                    } else {
                      salesmen.push(salesman);
                    }
                  } else {
                    salesmen.push(salesman);
                  }
                }
              }
              order.salesmen = salesmen;
            }

            var row = OrderExport.generateOrderData(order);
            worksheet.addRow(row).commit();

            fulfill();
          });
        }).catch(function (reason) {
          return reject(reason);
        });
      });
    };

    cursor.on('data', function (order) {
      count++;

      if (order.execute_company && columns_map.hasOwnProperty('承运商')) {
        execute_company_array.push(order.execute_company);
      }
      if (order.execute_driver && (columns_map.hasOwnProperty('司机姓名') || columns_map.hasOwnProperty('司机手机') || columns_map.hasOwnProperty('司机车牌'))) {
        execute_driver_array.push(order.execute_driver);
      }
      if (order.order_detail) {
        order_detail_array.push(order.order_detail);
      }
      if (order.pickup_contact) {
        contact_array.push(order.pickup_contact);
      }
      if (order.delivery_contact) {
        contact_array.push(order.delivery_contact);
      }
      if (order.salesmen && columns_map.hasOwnProperty('关注人')) {
        for (var i = 0, len = order.salesmen.length; i < len; i++) {
          var salesman = order.salesmen[i];
          // 原来的salesmen只保存username属性，后来加入了其他属性
          // 如果只有username需要查询SalesmenCompany
          if (!salesman._id) {
            salesman_array.push(salesman.username);
          }
        }
      }

      orders.push(order);

      if (count == 10000) {
        cursor.pause();
        processOrders().then(function () {
          count = 0;
          orders = [];
          execute_company_array = [];
          execute_driver_array = [];
          order_detail_array = [];
          contact_array = [];
          salesman_array = [];
          // order_details和contact与order的关系是一对一的
          // 后面批次无法用到前面批次的数据
          order_detail_map = {};
          contact_map = {};
          cursor.resume();
        }).catch(reject);
      }
    });
    cursor.on('close', function () {

      if (orders.length > 0) {
        processOrders().then(function () {
          fulfill();
        }).catch(reject);
      } else {
        fulfill();
      }
    });
  });
}

function getOrdersOfGroupByFilter(groupIds, filter) {
  return new Promise(function (fulfill, reject) {
    var conditions = {
      execute_group: {$in: groupIds},
      create_time: {
        $gte: filter.startDate,
        $lte: filter.endDate
      }
    };
    if (filter.order_transport_type && filter.order_transport_type != '') {
      conditions.order_transport_type = filter.order_transport_type;
    }
    if (filter.damaged && filter.damaged !== '') {
      conditions.damaged = filter.damaged === 'true' ? true : false;
    }
    if (filter.customer_name && filter.customer_name !== '') {
      conditions.customer_name = filter.customer_name;
    }
    if (filter.isOnTime && filter.isOnTime !== '') {
      conditions.pickup_end_time = {
        $exists: true
      };
      conditions.delivery_end_time = {
        $exists: true
      };
      conditions.pickup_time = {
        $exists: true
      };
      conditions.delivery_time = {
        $exists: true
      };
      if (filter.isOnTime === 'true') {
        conditions.$where = function () {
          return this.pickup_time <= this.pickup_end_time && this.delivery_time <= this.delivery_end_time;
        };
      } else {
        conditions.$where = function () {
          return this.pickup_time > this.pickup_end_time || this.delivery_time > this.delivery_end_time;
        };
      }
    }
    if (filter.partner_id) {
      Order.find(conditions, {'_id': 1})
        .exec(function (err, result) {
          if (err) {
            return reject(err);
          }
          if (result && result instanceof Array && result.length > 0) {
            var cursor = Order.find({
                parent_order: {$in: result},
                execute_company: filter.partner_id
              })
              .batchSize(10000).lean().stream();
            fulfill(cursor);
          } else {
            reject('无结果');
          }
        });
    } else {
      var cursor = Order.find(conditions)
        .batchSize(10000).lean().stream();
      fulfill(cursor);
    }
  });
}


function getPushUserList(order, isSalesman, isPickup, isDelivery) {
  var userList = [];

  if (isSalesman && order.salesmen) {
    userList = userList.concat(order.salesmen.map(function (item) {
      return item.username;
    }));
  }

  if (isPickup && order.pickup_contacts.mobile_phone) {
    userList.push(order.pickup_contacts.mobile_phone);
  }

  if (isDelivery && order.delivery_contacts.mobile_phone) {
    userList.push(order.delivery_contacts.mobile_phone);
  }

  return userList.zzDistinct();
}

function getWechatSalesmanUserList(userList, callback) {
  SalesmanService.getSalesmanByUsernameList(userList, function (err, salesmanList) {
    return callback(err, salesmanList);
  });
}

exports.getPushUserListObj = function (order, isSalesman, isPickup, isDelivery, callback) {
  var phoneList = getPushUserList(order, isSalesman, isPickup, isDelivery);
  var wechatUserList = [];
  if (phoneList.length > 0) {
    getWechatSalesmanUserList(phoneList, function (err, salesmanList) {
      if (err) {
        return callback(err);
      }

      salesmanList = salesmanList || [];
      salesmanList.forEach(function (salesman) {
        if (salesman.wechat_openid) {
          wechatUserList.push(salesman);
          phoneList.splice(phoneList.indexOf(salesman.username), 1);
        }
      });

      return callback(null, {wechatList: wechatUserList, smsList: phoneList});

    });
  }
  else {
    return callback(null, {wechatList: wechatUserList, smsList: phoneList});
  }
};

exports.allowSendSMS = function (order) {
  return order.company_configuration && order.company_configuration.admin_option && order.company_configuration.admin_option.send_salesman_sms;
};


function pushCreateOrderSms(smsList, order) {
  if (!order.sender_name || !order.create_push || !that.allowSendSMS(order)) {
    return;
  }

  if (smsList && smsList.length > 0) {
    smsList.forEach(function (phone) {
      smsLib.ypSendCreateOrderInfoForAllOrderType(phone, order.order_details.order_number, order.sender_name, order.create_company.name || '', order.created, function () {
      });
    });
  }
}

function pushPickupOrderSmsWithUserList(smsList, order, driverText) {
  if (!order.pickup_push || !that.allowSendSMS(order)) {
    return;
  }

  if (smsList && smsList.length > 0) {
    smsList.forEach(function (phone) {
      smsLib.ypSendPickupOrderInfoForLtlType(phone, order.order_details.order_number, order.create_company.name, order.pickup_time, driverText, function () {
      });
    });
  }
}

function pushDeliverySignOrderSms(smsList, order, driverText) {
  if (!order.delivery_sign_push || !that.allowSendSMS(order)) {
    return;
  }

  if (smsList && smsList.length > 0) {
    smsList.forEach(function (phone) {
      smsLib.ypSendDeliverySignOrderInfoForLtlType(phone, order.order_details.order_number, order.create_company.name, order.delivery_sign_time, driverText, function () {
      });
    });
  }
}

function pushDeliveryOrderSms(smsList, order) {
  if (!order.delivery_push || !that.allowSendSMS(order)) {
    return;
  }

  if (smsList && smsList.length > 0) {
    smsList.forEach(function (phone) {
      smsLib.ypSendDeliveryOrderInfoForAllOrderType(phone, order.order_details.order_number, order.create_company.name, order.delivery_time, function () {
      });
    });
  }

}


exports.captureAddressLocation = function (companyId, address, callback) {
  Order.find(
    {
      'delivery_contacts.address': address,
      create_company: companyId,
      execute_company: companyId,
      delete_status: false,
      status: 'completed'
    })
    .sort({created: -1})
    .limit(1)
    .exec(function (err, orderList) {
      if (err) {
        console.log(err);
        return callback({err: orderError.internal_system_error});
      }
      if (!orderList || orderList.length === 0) {
        return callback();
      }
      if (orderList[0].delivery_events && orderList[0].delivery_events.length > 0) {
        orderList[0].delivery_events.sort(function (a, b) {
          return a.created < b.created;
        });

        return callback(null, orderList[0].delivery_events[0].location);
      }

      return callback();
    });
};

exports.getPickupAddressList = function (senderName, pickupAddress, companyId, callback) {
  Order.find({
    sender_name: senderName,
    create_company: companyId,
    execute_company: companyId,
    'pickup_contacts.address': {$regex: pickupAddress, $options: 'i'},
    delete_status: false
  }).select('pickup_contacts')
    .limit(5)
    .exec(function (err, orders) {
      if (err) {
        return callback({err: orderError.internal_system_error});
      }

      var addressList = orders.map(function (item) {
        return item.pickup_contacts.address;
      });

      return callback(null, addressList);
    });
};

exports.sendOrderMessage = function (type, order, driverPhone, plateNumber) {

  console.log('orderService send order message ----------------------------->>>');

  driverPhone = driverPhone || '';
  plateNumber = plateNumber || '';

  var isSalesman = false, isPickup = false, isDelivery = false;
  var smsHandle = function () {
  };
  var driverText = '';
  switch (type) {
    case allEnum.company_order_message_push_type.create:
      isSalesman = true;
      isPickup = false;
      isDelivery = true;
      smsHandle = pushCreateOrderSms;
      break;
    case allEnum.company_order_message_push_type.ltl_pickup:
    case allEnum.company_order_message_push_type.tlt_pickup:
      isSalesman = true;
      isPickup = false;
      isDelivery = true;
      smsHandle = pushPickupOrderSmsWithUserList;
      driverText = driverPhone;
      if (order.order_transport_type === 'tl' && plateNumber) {
        driverText = driverPhone + '，司机车牌号码' + plateNumber;
      }
      break;
    case allEnum.company_order_message_push_type.ltl_delivery_sign:
      isSalesman = false;
      isPickup = false;
      isDelivery = true;
      smsHandle = pushDeliverySignOrderSms;
      driverText = driverPhone;
      if (order.order_transport_type === 'ltl' && plateNumber) {
        driverText = driverPhone + '，司机车牌号码' + plateNumber;
      }
      break;
    case allEnum.company_order_message_push_type.delivery:
      isSalesman = true;
      isPickup = true;
      isDelivery = false;
      smsHandle = pushDeliveryOrderSms;
      break;
    default:
      break;
  }

  that.getPushUserListObj(order, isSalesman, isPickup, isDelivery, function (err, userObj) {
    if (err) {
      console.log(err);
    }
    else {
      if (userObj.wechatList.length > 0) {
        wechatLib.wechatPushOrderMessage(type, userObj.wechatList, order, driverText);
      }
      if (userObj.smsList.length > 0) {

        console.log('smsHandle send order message ----------------------------->>>');
        smsHandle(userObj.smsList, order, driverText);
      }
    }
  });

};

exports.verifyOrder = function (order, type, price, callback) {
  if (type != 'can_pay_last' && type != 'can_pay_top' && type != 'can_pay_tail' && type != 'can_pay_ya_jin') {
    return callback({err: {type: 'invalid_type'}});
  }


  Tender.findOne({order: order._id}, function (err, tender) {
    if (err || !tender) {
      return callback({err: orderError.internal_system_error});
    }

    if (type == 'can_pay_top') {
      tender.real_pay_top_cash = price;
      tender.real_pay_top_cash_time = new Date();
    }
    if (type == 'can_pay_tail') {
      tender.real_pay_tail_cash = price;
      tender.real_pay_tail_cash_time = new Date();
    }
    if (type == 'can_pay_last') {
      tender.real_pay_last_cash = price;
      tender.real_pay_last_cash_time = new Date();
    }
    if (type == 'can_pay_ya_jin') {
      tender.real_pay_ya_jin = price;
      tender.real_pay_ya_jin_time = new Date();
    }

    tender[type] = true;
    tender.save(function (err, saveTender) {
      if (err || !saveTender) {
        return callback({err: orderError.internal_system_error});
      }
      return callback(null, {success: true});
    });
  });
};