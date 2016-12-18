/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  q = require('q'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  Order = appDb.model('Order'),
  Contact = appDb.model('Contact'),
  GoodsDetail = appDb.model('GoodsDetail'),
  OrderDetail = appDb.model('OrderDetail');

var companyService = require('./company'),
  salesmanService = require('./salesman'),
  userProfileService = require('./user_profile'),
  userService = require('./user'),
  wechatLib = require('./wechat_push'),
  pushLib = require('../getui'),
  driverService = require('./driver');

var self = exports;

function getOrdersByCondition(condition, skip, limit, sort, callback) {
  var query = Order.find(condition);
  if (skip) {
    query = query.skip(skip);
  }
  if (limit) {
    query = query.limit(limit);
  }
  if (sort) {
    query = query.sort(sort);
  }
  query.exec(function (err, orders) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, orders);
  });
}

function getOneOrderByCondition(condition, callback) {
  Order.findOne(condition, function (err, order) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, order);
  });
}

function checkReceiverCompany(orderInfo, callback) {
  if (!orderInfo) {
    return callback();
  }
  if (!orderInfo.receiver_company_id && !orderInfo.receiver_name) {
    return callback();
  }

  if (!orderInfo.receiver_company_id && orderInfo.receiver_name) {

    companyService.getCompanyByName(orderInfo.receiver_name, function (err, companyEntity) {
      if (err) {
        return callback(err);
      }
      if (companyEntity) {
        orderInfo.receiver_company_id = companyEntity._id.toString();
      }
      return callback();
    });
  }
  else {
    return callback();
  }
}
function checkSenderCompany(orderInfo, callback) {
  if (!orderInfo) {
    return callback();
  }
  if (!orderInfo.sender_company_id && !orderInfo.sender_name) {
    return callback();
  }

  if (!orderInfo.sender_company_id && orderInfo.sender_name) {
    companyService.getCompanyByName(orderInfo.sender_name, function (err, companyEntity) {
      if (err) {
        return callback(err);
      }
      if (companyEntity) {
        orderInfo.sender_company_id = companyEntity._id.toString();
      }
      return callback();
    });
  }
  else {
    return callback();
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
function createOrUpdateOrder(createUserId, createCompanyId, groupId, orderInfo, callback) {
  //运单号必须有
  if (!orderInfo.order_number) {
    return callback({err: error.business.order_number_empty}, null);
  }
  else {
    async.auto({
      saveOrderDetail: function (autoCallback) {
        //如果是多货物
        checkGoodsDetail(orderInfo, function () {
          var newOrderDetail = new OrderDetail({
            order_number: orderInfo.order_number,
            refer_order_number: orderInfo.refer_order_number,
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
              console.log(err);
              err = {err: error.system.db_error};
            }
            return autoCallback(err, orderDetailEntity);
          });

        });
      },
      savePickupContact: function (autoCallback) {
        var pickupContact = new Contact();
        pickupContact.name = orderInfo.pickup_contact_name;
        pickupContact.phone = orderInfo.pickup_contact_phone;
        pickupContact.mobile_phone = orderInfo.pickup_contact_mobile_phone;
        pickupContact.address = orderInfo.pickup_contact_address;
        pickupContact.email = orderInfo.pickup_contact_email;
        pickupContact.company = createCompanyId;

        companyService.getLocationInfoByAddress(createCompanyId, pickupContact.address, function (err, locationInfo) {
          if (locationInfo) {
            pickupContact.location = locationInfo.location || [];
            pickupContact.brief = locationInfo.brief;
          }

          pickupContact.save(function (err, updateContact) {
            if (err) {
              console.log(err);
              err = {err: error.system.db_error};
            }
            return autoCallback(err, updateContact);
          });

        });
      },
      saveDeliveryContact: [function (autoCallback) {
        var deliveryContact = new Contact();
        deliveryContact.name = orderInfo.delivery_contact_name;
        deliveryContact.phone = orderInfo.delivery_contact_phone;
        deliveryContact.mobile_phone = orderInfo.delivery_contact_mobile_phone;
        deliveryContact.address = orderInfo.delivery_contact_address;
        deliveryContact.email = orderInfo.delivery_contact_email;
        deliveryContact.company = createCompanyId;

        companyService.getLocationInfoByAddress(createCompanyId, deliveryContact.address, function (err, locationInfo) {
          if (locationInfo) {
            deliveryContact.location = locationInfo.location || [];
            deliveryContact.brief = locationInfo.brief;
          }

          deliveryContact.save(function (err, updateContact) {
            if (err) {
              console.log(err);
              err = {err: error.system.db_error};
            }
            return autoCallback(err, updateContact);
          });

        });
      }],
      findSalesman: function (autoCallback) {
        if (!orderInfo.salesmen || !Array.isArray(orderInfo.salesmen) || orderInfo.salesmen.length === 0) {
          return autoCallback(null, []);
        }
        salesmanService.createSalesmanCompany(createCompanyId, orderInfo.salesmen, function (err, salesmanList) {
          return autoCallback(err, salesmanList);
        });
      },
      findUserProfile: function (autoCallback) {
        userProfileService.getUserProfile(createUserId, function (err, profile) {
          if (err) {
            return autoCallback(err);
          }
          if (profile) {
            orderInfo.pickup_entrance_force = profile.pickup_entrance_force;
            orderInfo.pickup_photo_force = profile.pickup_photo_force;
            orderInfo.delivery_entrance_force = profile.delivery_entrance_force;
            orderInfo.delivery_photo_force = profile.delivery_photo_force;
          }
          return autoCallback();
        });
      },
      findCompanyConfiguration: function (autoCallback) {
        companyService.getConfiguration(createCompanyId, function (err, configuration) {
          if (err) {
            return autoCallback(err);
          }
          if (configuration) {

            configuration.pickup_option = configuration.pickup_option || {};
            configuration.delivery_option = configuration.delivery_option || {};
            configuration.admin_option = configuration.admin_option || {};

            if (!configuration.pickup_option.must_entrance_photo) {
              configuration.pickup_option.entrance_photos = [];
            }
            if (!configuration.pickup_option.must_take_photo) {
              configuration.pickup_option.take_photos = [];
            }
            if (!configuration.delivery_option.must_entrance_photo) {
              configuration.delivery_option.entrance_photos = [];
            }
            if (!configuration.delivery_option.must_take_photo) {
              configuration.delivery_option.take_photos = [];
            }
          }

          return autoCallback(null, configuration);
        });
      }
    }, function (err, results) {
      if (err) {
        return callback(err);
      }

      checkReceiverCompany(orderInfo, function (err) {
        if (err) {
          return callback(err);
        }

        checkSenderCompany(orderInfo, function (err) {
          if (err) {
            return callback(err);
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

            if (orderInfo.tender_id) {
              oldOrder.tender = orderInfo.tender_id;
            }
            if (orderInfo.bidder_id) {
              oldOrder.bidder = orderInfo.bidder_id;
            }

            oldOrder.save(function (err, orderEntity) {
              if (err || !orderEntity) {
                return callback({err: error.system.db_error});
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

function getCompanyOrders(sourceOrder, callback) {
  var companyOrders = [];
  companyOrders.push(sourceOrder);

  Order.find({parent_order: sourceOrder._id, $or: [{delete_status: {$exists: false}}, {delete_status: false}]})
    .populate('create_company execute_company execute_group create_group execute_driver')
    .sort({'create_time': -1})
    .exec(function (err, orders) {
      if (err) {
        return callback({err: error.system.db_error});
      }

      if (!orders || orders.length === 0)
        return callback(null, companyOrders);

      async.each(orders, function (order, itemCallback) {

        if (order.execute_driver) {
          if (!sourceOrder._doc.drivers) {
            sourceOrder._doc.drivers = [];
          }

          sourceOrder._doc.drivers.push(order);
          return itemCallback();
        }
        else {

          getCompanyOrders(order,
            function (err, childrenOrders) {
              if (err)
                return itemCallback(err);

              if (childrenOrders.length > 0) {
                companyOrders = companyOrders.concat(childrenOrders);
              }

              return itemCallback();
            });
        }
      }, function (err) {
        return callback(err, companyOrders);
      });

    });
}
function getDriverOrder(orderId, callback) {
  var driverOrders = [];
  Order.find({parent_order: orderId}).exec(function (err, orders) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    async.each(orders, function (order, itemCallback) {
      if (!order.execute_driver) {
        getDriverOrder(order._id, function (err, childrenOrders) {
          if (err)
            return itemCallback(err);

          if (childrenOrders.length > 0) {
            driverOrders = driverOrders.concat(childrenOrders);
          }

          return itemCallback();
        });
      }
      else {
        driverOrders.push(order);
        return itemCallback();
      }
    }, function (err) {
      if (err)
        return callback(err, null);

      return callback(null, driverOrders);
    });

  });
}
function findChildOrdersByParentWithPopulate(parentId, populate, callback) {
  Order.find({parent_order: parentId, delete_status: false}).populate(populate).exec(function (err, childOrders) {
    if (err || !childOrders) {
      console.log(err);
      err = {err: error.system.db_error};
    }

    return callback(err, childOrders);
  });
}
function findOrdersById(id, callback) {
  Order.findOne({_id: id, delete_status: false}, function (err, order) {
    if (err || !order) {
      console.log(err);
      err = {err: error.system.db_error};
    }

    return callback(err, order);
  });
}
function updateParentExecutors(parentOrder, callback) {
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
            return callback({err: error.system.db_error});
          }
          return updateParentExecutors(findOrder.parent_order, callback);
        });
      });
    });
  });
}

exports.pushSingleAssignToDriver = function (driver, order) {
  pushSingleAssignToDriver(driver, order)
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
function multiAssignOrder(userId, companyId, order, assignInfos, isBatch) {

  var defered = q.defer();
  var assignedOrderList = [];
  async.eachSeries(assignInfos, function (assignInfo, callback) {
    if (assignInfo.is_assigned === true || assignInfo.is_assigned === 'true') {
      return callback();
    }

    companyService.getLocationInfosByAddresses(companyId, [assignInfo.pickup_contact_address, assignInfo.delivery_contact_address], function (err, locationInfo) {
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
        self.assignOrderToDriver(userId, companyId, order, assignInfo, isBatch, function (err, driverOrder) {
          if (!err) {
            assignedOrderList.push(driverOrder);
            assignInfo.is_assigned = true;
            assignInfo.order_id = driverOrder._id.toString();
          }

          return callback();
        });
      }
      //else if (assignInfo.type === 'warehouse') {
      //  //self.assignOrderToWarehouse(user, order, orderDetail, assignInfo, isBatch, function (err, driverOrder) {
      //  //  if (!err) {
      //  //    assignedOrderList.push(driverOrder);
      //  //    assignInfo.is_assigned = true;
      //  //    assignInfo.order_id = driverOrder._id.toString();
      //  //  }
      //  //
      //  //  return callback();
      //  //});
      //}
      //else if (assignInfo.type === 'company') {
      //  //self.assignOrderToCompany(user, order, orderDetail, assignInfo, function (err, companyOrder) {
      //  //  if (!err) {
      //  //    assignedOrderList.push(companyOrder);
      //  //    assignInfo.is_assigned = true;
      //  //    assignInfo.order_id = companyOrder._id.toString();
      //  //  }
      //  //  return callback();
      //  //});
      //}
      else {
        return callback();
      }
    });

  }, function (err) {
    if (err) {
      return defered.reject(err);
    }
    else {
      defered.resolve({assignedOrderList: assignedOrderList, assignedInfos: assignInfos});
    }
  });
  return defered.promise;
}
function assignDriver(userId, companyId, order, assignInfo, isBatch, callback) {
  driverService.getAssignDriver(assignInfo, companyId, function (err, driver) {
    if (err) {
      return callback(err);
    }
    if (!driver) {
      return callback({err: error.business.driver_not_exist});
    }

    if (assignInfo.is_wechat && (!driver.wechat_profile || !driver.wechat_profile.openid)) {
      return callback({err: error.business.driver_openid_empty});
    }

    assignInfo.driver_id = driver._id;

    //提货收获的联系人必须由外界传进来
    async.auto({
        pickupContact: function (autoCallback) {
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
              return autoCallback({err: error.system.db_error});
            }

            autoCallback(null, pickupContactEntity);
          });
        },
        deliveryContact: function (autoCallback) {
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
              return autoCallback({err: error.system.db_error});
            }

            return autoCallback(err, deliveryContactEntity);
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
            order_details: order.order_details,
            parent_order: order._id,
            status: 'unPickupSigned', //分配给司机，则订单变为unPickupSigned
            customer_name: order.customer_name,
            create_user: userId,
            create_company: companyId,
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
            sender_name: order.sender_name,
            receiver_name: order.receiver_name,
            tender: order.tender,
            bidder: order.bidder,

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

          newOrder.save(function (err, driverOrder) {
            if (err || !driverOrder) {
              return callback({err: error.system.db_error});
            }

            updateParentExecutors(driverOrder.parent_order, function (err) {
              if (err) {
                return callback(err);
              }

              if (driverOrder.is_wechat) {
                wechatLib.pushNewOrderMessageToWechat(driver.wechat_profile.openid, driver._id, driverOrder);
              }
              else if (driver.device_id || driver.device_id_ios) {
                if (!isBatch) {
                  driverOrder._doc.order_detail = order.order_details;
                  driverOrder._doc.pickup_contact = pickupContact;
                  driverOrder._doc.delivery_contact = deliveryContact;
                  pushSingleAssignToDriver(driver, driverOrder);
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

function handleDeferOrderForTender(condition, limitCount, breachType, callback) {
  getOrdersByCondition(condition, null, limitCount, null, function (err, orders) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!orders || orders.length === 0) {
      return callback(null, []);
    }

    async.each(orders, function (orderItem, eachCallback) {
      orderItem[breachType] = true;
      orderItem.save(function (err, saveItem) {
        if (err || !saveItem) {
          err = error.system.db_error;
        }
        return eachCallback(err);
      });

    }, function (err, result) {
      if (err) {
        return callback(err);
      }

      return callback(null, orders.map(function (item) {
        return item._id;
      }));
    });

  });
}

exports.createOrder = function (createUserId, createCompanyId, groupId, orderInfo, callback) {
  createOrUpdateOrder(createUserId, createCompanyId, groupId, orderInfo, function (err, result) {
    if (err) {
      return callback(err, result);
    }

    return callback(null, result);
  });
};

exports.assignOrderToDriver = function (userId, companyId, order, assignInfo, isBatch, callback) {
  return assignDriver(userId, companyId, order, assignInfo, isBatch, callback);
};

exports.createAndAssignToDrivers = function (orderInfo, drivers, userId, companyId, groupId, callback) {
  async.auto({
    createOrder: function (createCallback) {
      self.createOrder(userId, companyId, groupId, orderInfo, function (err, newOrder) {
        if (err) {
          return createCallback(err);
        }
        if (!newOrder) {
          return createCallback({err: error.business.order_create_failed});
        }
        return createCallback(null, newOrder);
      });
    },
    formatAssignInfo: ['createOrder', function (formatCallback, result) {
      var assignInfos = [];
      async.each(drivers, function (driverItem, itemCallback) {
        assignInfos.push({
          type: 'driver',
          partner_name: ((driverItem.nickname || '') + '/' + (driverItem.username || '')),
          road_order_name: '',
          road_order_id: '',
          company_id: '',
          driver_id: driverItem._id || '',
          driver_username: driverItem.username,
          order_id: '',

          pickup_contact_name: result.createOrder.pickup_contacts.name || '',
          pickup_contact_phone: result.createOrder.pickup_contacts.phone || '',
          pickup_contact_mobile_phone: result.createOrder.pickup_contacts.mobile_phone || '',
          pickup_contact_email: result.createOrder.pickup_contacts.email || '',
          pickup_contact_address: result.createOrder.pickup_contacts.address || '',

          delivery_contact_name: result.createOrder.delivery_contacts.name || '',
          delivery_contact_phone: result.createOrder.delivery_contacts.phone || '',
          delivery_contact_mobile_phone: result.createOrder.delivery_contacts.mobile_phone || '',
          delivery_contact_email: result.createOrder.delivery_contacts.email || '',
          delivery_contact_address: result.createOrder.delivery_contacts.address || '',

          pickup_start_time: result.createOrder.pickup_start_time,
          pickup_end_time: result.createOrder.pickup_end_time,
          delivery_start_time: result.createOrder.delivery_start_time,
          delivery_end_time: result.createOrder.delivery_end_time
        });
        return itemCallback();
      }, function (err) {
        return formatCallback(null, assignInfos);
      });
    }],
    assignOrders: ['createOrder', 'formatAssignInfo', function (assignCallback, result) {
      if (result.formatAssignInfo.length <= 0) {
        return assignCallback({err: error.business.order_assign_info_empty});
      }

      result.createOrder.total_assign_count = result.formatAssignInfo.length;
      result.createOrder.status = 'assigning';
      result.createOrder.assign_status = 'assigning';

      result.createOrder.save(function (err, saveCreateOrder) {
        if (err || !saveCreateOrder) {
          return assignCallback({err: error.system.db_error});
        }
        multiAssignOrder(userId, companyId, saveCreateOrder, result.formatAssignInfo, false)
          .then(function (result) {
            Order.findOne({_id: saveCreateOrder._id}, function (err, findOrderEntity) {
              if (err) {
                return assignCallback({err: error.system.db_error});
              }

              findOrderEntity.assigned_count += result.assignedOrderList.length;
              findOrderEntity.assigned_infos = result.assignedInfos;

              if (findOrderEntity.total_assign_count === findOrderEntity.assigned_count) {
                findOrderEntity.status = 'unPickupSigned';
                findOrderEntity.assign_status = 'completed';
              }

              findOrderEntity.assign_time = new Date();  //添加分配时间

              var failedAssignCount = findOrderEntity.total_assign_count - result.assignedOrderList.length;

              findOrderEntity.save(function (err, orderResult) {
                if (err) {
                  return assignCallback({err: error.system.db_error});
                }
                return assignCallback(null, {companyOrder: orderResult, failedCount: failedAssignCount});
              });
            });
          }, function (err) {
            return assignCallback({err: error.system.server_error});
          });
      });
    }]
  }, function (err, results) {
    return callback(err, results.assignOrders);
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

  getOrdersByCondition(condition, skip, limit, {created: -1}, function (err, orders) {
    return callback(err, orders);
  });
};

exports.getBidderOrders = function (bidderId, statuses, skip, limit, callback) {
  var condition = {
    type: 'company',
    bidder: bidderId,
    status: {$in: statuses},
    delete_status: false,
    created: {
      $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
    }
  };

  getOrdersByCondition(condition, skip, limit, {created: -1}, function (err, orders) {
    return callback(err, orders);
  });
};

exports.getSingleBidderOrderWithTenderId = function (bidderId, tenderId, callback) {
  getOneOrderByCondition({
    type: 'company',
    bidder: bidderId,
    tender: tenderId,
    delete_status: false
  }, function (err, order) {
    return callback(err, order);
  });
};

exports.getOrderByIdWithoutDeleted = function (orderId, callback) {
  if (!orderId) {
    return callback({err: error.params.empty});
  }

  Order.findOne({
    _id: orderId,
    $or: [{delete_status: false}, {delete_status: {$exists: false}}]
  }).
    populate('create_company create_user execute_company execute_group create_group execute_driver')
    .exec(function (err, order) {
      if (err) {
        return callback({err: error.system.db_error});
      }

      if (!order) {
        return callback({err: error.business.order_not_exist});
      }

      return callback(null, order);
    });
};

exports.getDriverChildrenOrders = function (orderId, callback) {

  Order.findOne({_id: orderId}).exec(function (err, order) {
    if (err) {
      return callback({err: error.system.db_error}, null);
    }

    if (!order) {
      return callback({err: error.system.order_not_exist}, null);
    }

    getDriverOrder(orderId, function (err, driverOrders) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, driverOrders);
    });

  });
};

/*
 * currentUser: 当前访问的用户
 * senderCompany: 运单的发货方
 * receiveCompany: 运单的收货方
 * createGroupId: 运单的创建组
 * executeGroupId: 运单的执行组
 * role: 访问的角色，如：sender(发货方), receiver(收货方), 创建者，执行者
 * */
exports.isAllowSeeing = function (currentUser, senderCompany, receiveCompany, createGroupId, executeGroupId, role, callback) {
  switch (role) {
    case 'sender':
      if (senderCompany && senderCompany.company_id && senderCompany.company_id.toString() === currentUser.company._id.toString()) {
        return callback(null, true);
      }
      else {
        return callback(null, false);
      }
      break;
    case 'receiver':
      if (receiveCompany && receiveCompany.company_id && receiveCompany.company_id.toString() === currentUser.company._id.toString()) {
        return callback(null, true);
      }
      else {
        return callback(null, false);
      }
      break;
    default:
      // 如果都不是，则判断当前用户是否为运单的创建者或执行者
      userService.getGroups(currentUser._id, function (err, userGroups) {
        if (err) {
          return callback(err);
        }

        var isSeeing = false;
        async.each(userGroups, function (groupItem, itemCallback) {
          if (groupItem.group._id.toString() === createGroupId.toString() || groupItem.group._id.toString() === executeGroupId.toString()) {
            isSeeing = true;
            return itemCallback({err: error.business.user_is_in_group});
          }
          else {
            return itemCallback();
          }
        }, function (err) {
          return callback(null, isSeeing);
        });
      });
      break;
  }
};

exports.getOrderAssignedInfoByOrderId = function (order, callback) {
  if (!order) {
    return callback({err: error.params.empty});
  }

  getCompanyOrders(order, function (err, companyOrders) {
    if (err) {
      return callback(err, null);
    }

    return callback(null, companyOrders);
  });
};

//获取当前订单下游所有司机订单
exports.getDriverChildrenOrderIds = function (orderId, callback) {

  self.getDriverChildrenOrders(orderId, function (err, driverOrders) {
    if (err) {
      return callback(err);
    }

    var driverOrderIds = driverOrders.map(function (item) {
      return item._id;
    });
    return callback(null, driverOrderIds);
  });
};


exports.queryDeferPickupOrderForTender = function (limitCount, callback) {
  handleDeferOrderForTender({
    parent_order: {$exists: false},
    tender: {$exists: true},
    pickup_end_time: {$lt: new Date()},
    status: {$in: ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped']},
    pickup_breach: false
  }, limitCount, 'pickup_breach', function (err, orderIds) {
    return callback(err, orderIds || []);
  });

};
exports.queryDeferDeliveryOrderForTender = function (limitCount, callback) {
  handleDeferOrderForTender({
    parent_order: {$exists: false},
    tender: {$exists: true},
    delivery_end_time: {$lt: new Date()},
    status: {$ne: 'completed'},
    delivery_breach: false
  }, limitCount, 'delivery_breach', function (err, orderIds) {
    return callback(err, orderIds || []);
  });
};