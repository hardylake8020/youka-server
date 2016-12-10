'use strict';

var async = require('async'),
  cryptoLib = require('../../libraries/crypto'),
  pushLib = require('../../libraries/getui'),
  appDb = require('../../../libraries/mongoose').appDb,
  orderApiError = require('../../errors/apis/api.order'),
  Company = appDb.model('Company'),
  Group = appDb.model('Group'),
  Order = appDb.model('Order'),
  Contact = appDb.model('Contact'),
  Driver = appDb.model('Driver'),
  AssignInfo = appDb.model('AssignInfo'),
  Trace = appDb.model('Trace');

//只有公司运单号统一的情况下可以查看
exports.getOrderByOrderNumber = function (orderNumber, companyId, isReturnClient, callback) {
  if (!orderNumber) {
    return callback({err: orderApiError.empty_order_number});
  }

  if (!companyId) {
    return callback({err: orderApiError.empty_company_id});
  }

  var selectedFiled = '_id parent_order created updated delivery_contacts pickup_contacts order_details halfway_events delivery_events delivery_sign_events pickup_events pickup_sign_events remark description delivery_deferred pickup_deferred status receiver_name sender_name object total_assign_count assigned_count assigned_infos';
  if (!isReturnClient) {
    selectedFiled = '';
  }

  Order.findOne({
    'order_details.order_number': orderNumber,
      /*create_company: companyId,
    execute_company: companyId*/
      '$or':[{create_company: companyId},{execute_company: companyId}]
  }).select(selectedFiled).sort({created: -1}).exec(function (err, order) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }
    if (!order) {
      return callback({err: orderApiError.invalid_order_number});
    }
    if(!order.assigned_infos||order.assigned_infos.length<1){
        Order.findOne({_id:order.parent_order}).select(selectedFiled).exec(function (err, _order) {
            if (err || !_order) {
                return callback(null, order);
            }
            if(_order.assigned_infos&&_order.assigned_infos.length>0){
                if(_order.assigned_infos[0].partner_name.indexOf('/')<0){
                    _order.assigned_infos=null;
                }
            }
            return callback(null, _order);
        });
    }else{
        return callback(null, order);
    }
  });
};

exports.getDriverById = function (driverId, callback) {
  if (!driverId) {
    return callback({err: orderApiError.empty_driver_id});
  }
  Driver.findOne({_id: driverId}, function (err, driver) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }
    if (!driver) {
      return callback(null, {});
    }

    return callback(null, driver);
  });
};

exports.getCurDriverTraceByDriverId = function (driverId, endTime, callback) {
  if (!driverId) {
    return callback({err: orderApiError.empty_driver_id});
  }
  endTime = endTime || new Date();
  Trace.findOne({
    driver: driverId,
    created: {
      $lte: endTime
    }
  }).sort('-created').exec(function (err, trace) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }

    if (!trace) {
      trace = {};
    }

    return callback(null, trace);
  });
};

//只有一段分配信息
exports.assignDriver = function (assignInfo, order, user, callback) {

  if (assignInfo.type !== 'driver') {
    return callback({err: {type: 'type_error', message: 'type must be driver'}});
  }

  Driver.findOne({username: assignInfo.driver_username}, function (err, driver) {
    if (err) {
      return callback({err: orderApiError.internal_system_error});
    }

    if (!driver) {
      return callback({err: {type: 'driver_not_existed'}});
    }

    async.auto({
      pickupContact: function (autoCallback) {
        var newPickupContact = new Contact({
          name: assignInfo.pickup_contact_name,
          phone: assignInfo.pickup_contact_phone,
          mobile_phone: assignInfo.pickup_contact_mobile_phone,
          address: assignInfo.pickup_contact_address,
          email: assignInfo.pickup_contact_email
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
          name: assignInfo.delivery_contact_name,
          phone: assignInfo.delivery_contact_phone,
          mobile_phone: assignInfo.delivery_contact_mobile_phone,
          address: assignInfo.delivery_contact_address,
          email: assignInfo.delivery_contact_email
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

          pickup_entrance_force: order.pickup_entrance_force,
          pickup_photo_force: order.pickup_photo_force,
          delivery_entrance_force: order.delivery_entrance_force,
          delivery_photo_force: order.delivery_photo_force
        });

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
        return callback(err);
      }
      return callback(null, results.order);
    });
  });
};