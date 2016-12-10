/**
 * //订单业务实体，可引用多个资源
 */
'use strict';

var async = require('async'),
  lodash = require('lodash');

var appDb = require('../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  OrderDetail = appDb.model('OrderDetail'),
  Contact = appDb.model('Contact');

var orderError = require('../errors/order'),
  orderService = require('../services/order'),
  UserProfileService = require('../services/user_profile'),
  CompanyService = require('../services/company'),
  salesmanCompanyService = require('../services/wechat/salesman_company');


module.exports = function () {
  //修改已分配的订单信息，包含自己分配的司机订单和子公司订单的数据都需要修改
  this.updateAssignedOrder = function (createUserId, createCompanyId, orderInfo, groupId, orderSource, callback) {
    Order.findOne({_id: orderInfo.order_id})
      .populate('order_detail pickup_contact delivery_contact')
      .exec(function (err, oldOrder) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }

        if (!oldOrder) {
          return callback({err: orderError.order_not_exist});
        }

        if (oldOrder.create_company.toString() !== createCompanyId.toString() || oldOrder.execute_company.toString() !== oldOrder.create_company.toString()) {
          return callback({err: orderError.must_self_company_order});
        }

        if (oldOrder.status === 'completed') {
          return callback({err: orderError.order_completed});
        }

        async.auto({
          updateOrderDetail: function (asyncCallback) {
            OrderDetail.findOne({_id: oldOrder.order_detail}).exec(function (err, orderDetail) {
              if (err) {
                return asyncCallback({err: orderError.internal_system_error});
              }

              orderService.checkGoodsDetail(orderInfo, function () {
                orderDetail.order_number = orderInfo.order_number;
                orderDetail.refer_order_number = orderInfo.refer_order_number;
                orderDetail.original_order_number = orderInfo.original_order_number;
                orderDetail.goods_name = orderInfo.goods_name;
                orderDetail.count = orderInfo.count;
                orderDetail.weight = orderInfo.weight;
                orderDetail.volume = orderInfo.volume;
                orderDetail.count_unit = orderInfo.count_unit;
                orderDetail.weight_unit = orderInfo.weight_unit;
                orderDetail.volume_unit = orderInfo.volume_unit;
                orderDetail.freight_charge = orderInfo.freight_charge;
                orderDetail.goods = orderInfo.goods;
                orderDetail.save(function (err, newOrderDetail) {
                  if (err || !newOrderDetail) {
                    return asyncCallback({err: orderError.internal_system_error});
                  }
                  return asyncCallback(null, newOrderDetail);
                });
              });

            });
          },
          updatePickupContact: function (asyncCallback) {
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
              pickupContact.save(function (err, newPickupContact) {
                if (err || !newPickupContact) {
                  return asyncCallback({err: orderError.internal_system_error});
                }
                return asyncCallback(null, newPickupContact);
              });
            });
          },
          updateDeliverContact: function (asyncCallback) {
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
              deliveryContact.save(function (err) {
                if (err) {
                  return asyncCallback({err: orderError.internal_system_error});
                }
                return asyncCallback(null, deliveryContact);
              });
            });
          },
          findSalesman: function (asyncCallback) {
            if (!orderInfo.salesmen || !Array.isArray(orderInfo.salesmen) || orderInfo.salesmen.length === 0) {
              return asyncCallback(null, []);
            }
            salesmanCompanyService.createSalesmanCompany(createCompanyId, orderInfo.salesmen, function (err, salesmanList) {
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

              return asyncCallback(null, configuration);
            });
          },

          updateOrder: ['updateOrderDetail', 'updatePickupContact', 'updateDeliverContact', 'findSalesman', 'findUserProfile', 'findCompanyConfiguration', function (asyncCallback, result) {
            Order.find({order_detail: oldOrder.order_detail})
              .populate('order_detail')
              .exec(function (err, orders) {
                if (err) {
                  return asyncCallback({err: orderError.internal_system_error});
                }

                var modifyOrder = oldOrder;
                async.each(orders, function (orderItem, eachCallback) {
                  //orderItem.order_details = result.updateOrderDetail;
                  orderItem.customer_name = orderInfo.customer_name;
                  orderItem.description = orderInfo.description;
                  orderItem.sender_name = orderInfo.sender_name || '';
                  orderItem.receiver_name = orderInfo.receiver_name || '';

                  orderItem.pickup_entrance_force = orderInfo.pickup_entrance_force || false;
                  orderItem.pickup_photo_force = orderInfo.pickup_photo_force || false;
                  orderItem.delivery_entrance_force = orderInfo.delivery_entrance_force || false;
                  orderItem.delivery_photo_force = orderInfo.delivery_photo_force || true;
                  orderItem.company_configuration = result.findCompanyConfiguration || null;

                  //如果是创建者
                  if (orderItem._id.toString() === oldOrder._id.toString()) {
                    orderItem.order_details = result.updateOrderDetail;


                    orderItem.execute_group = groupId;
                    orderItem.pickup_contact = result.updatePickupContact._id;
                    orderItem.delivery_contact = result.updateDeliverContact._id;
                    orderItem.pickup_contacts = result.updatePickupContact;
                    orderItem.delivery_contacts = result.updateDeliverContact;
                    orderItem.pickup_start_time = orderInfo.pickup_start_time;
                    orderItem.delivery_start_time = orderInfo.delivery_start_time;
                    orderItem.pickup_end_time = orderInfo.pickup_end_time || orderInfo.pickup_start_time;
                    orderItem.delivery_end_time = orderInfo.delivery_end_time || orderInfo.delivery_start_time;
                    orderItem.salesmen = result.findSalesman;
                    orderItem.receiver_company = {
                      company_id: orderInfo.receiver_company_id || '',
                      company_name: orderInfo.receiver_name || ''
                    };
                    orderItem.sender_company = {
                      company_id: orderInfo.sender_company_id || '',
                      company_name: orderInfo.sender_name || ''
                    };

                    orderItem.create_push = orderInfo.create_push === 'true';
                    orderItem.delivery_sign_push = orderInfo.delivery_sign_push === 'true';
                    orderItem.pickup_push = orderInfo.pickup_push === 'true';
                    orderItem.delivery_push = orderInfo.delivery_push === 'true';
                    orderItem.abnormal_push = orderInfo.abnormal_push === 'true';

                    orderItem.order_transport_type = orderInfo.order_transport_type || 'ltl';

                    orderItem.pickup_deferred_duration = parseInt(orderInfo.pickup_deferred_duration) || 0;
                    orderItem.delivery_early_duration = parseInt(orderInfo.delivery_early_duration) || 0;
                  }
                  else {
                    var orderNumber = orderItem.order_details.order_number;
                    var referOrderNumber = orderItem.order_details.refer_order_number;

                    lodash.extend(orderItem.order_details, result.updateOrderDetail._doc);

                    //如果子运单是第一层,则参考单号等于父运单号
                    if (orderItem.parent_order && orderItem.parent_order.toString() === oldOrder._id.toString()) {
                      orderItem.order_details.refer_order_number = orderItem.order_details.order_number;
                    }
                    else {
                      orderItem.order_details.refer_order_number = referOrderNumber;
                    }

                    //子运单号不发生改变
                    orderItem.order_details.order_number = orderNumber;
                  }

                  orderItem.markModified('order_details');

                  orderItem.save(function (err, newOrder) {
                    if (err) {
                      return eachCallback({err: orderError.internal_system_error});
                    }

                    if (orderItem._id === oldOrder._id) {
                      modifyOrder = newOrder;     //创建的时候指定该订单的执行组，方便之后用户查询订单的时候，不管是大订单还是自订单，都可以根据此字段来筛选
                    }

                    return eachCallback();
                  });
                }, function (err) {
                  if (err)
                    return asyncCallback(err);

                  return asyncCallback(null, modifyOrder);
                });
              });
          }]
        }, function (err, results) {
          if (err) {
            return callback(err);
          }

          return callback(null, results.updateOrder);
        });

      });
  };

  this.deleteAssignedOrder = function (createCompanyId, orderId, callback) {
    Order.findOne({_id: orderId}, function (err, oldOrder) {
      if (err) {
        return callback({err: orderError.internal_system_error});
      }
      if (!oldOrder) {
        return callback({err: orderError.order_not_exist});
      }

      if (oldOrder.create_company.toString() !== createCompanyId.toString() || oldOrder.execute_company.toString() !== oldOrder.create_company.toString()) {
        return callback({err: orderError.must_self_company_order});
      }

      if (oldOrder.status !== 'unAssigned' && oldOrder.status !== 'assigning' && oldOrder.status !== 'unPickupSigned') {
        return callback({err: orderError.order_transporting});
      }

      Order.find({order_detail: oldOrder.order_detail}).exec(function (err, orders) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }

        async.each(orders, function (order, asyncCallback) {
          order.delete_status = true;
          order.save(function (err, newOrder) {
            if (err || !newOrder) {
              return asyncCallback({err: orderError.internal_system_error});
            }

            asyncCallback();
          });
        }, function (err) {
          if (err) {
            return callback(err);
          }

          return callback();
        });

      });
    });
  };

  this.getAllDriverOrders = function (orderId, callback) {
    Order.findOne({_id: orderId})
      .exec(function (err, order) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }

        if (!order) {
          return callback({err: orderError.internal_system_error});
        }

        Order.find({order_detail: order.order_detail, execute_driver: {$exists: true}})
          .populate('order_detail pickup_contact delivery_contact execute_driver')
          .exec(function (err, driverOrders) {
            if (err) {
              return callback({err: orderError.internal_system_error});
            }

            return callback(null, driverOrders);
          });
      });
  };

  this.getCreateOrderByOrderDetailId = function (order_detail_id, callback) {
    Order.findOne({order_detail: order_detail_id, parent_order: {$exists: false}})
      .populate('order_detail pickup_contact delivery_contact')
      .exec(function (err, order) {
        if (err || !order) {
          return callback({err: orderError.internal_system_error});
        }

        return callback(null, order);
      });
  };
};
