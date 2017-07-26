/**
 * Created by elinaguo on 15/4/6.
 */
'use strict';

var transportEventError = require('../errors/transport_event'),
  traceError = require('../errors/trace'),
  orderError = require('../errors/order'),
  orderShareError = require('../errors/order_share'),
  async = require('async'),
  smsLib = require('../libraries/sms'),
  wechatPushLib = require('../libraries/wechat_push'),
  wechatService = require('../services/wechat/wechat'),
  appDb = require('../../libraries/mongoose').appDb,
  TransportEvent = appDb.model('TransportEvent'),
  Order = appDb.model('Order'),
  Tender = appDb.model('Tender'),
  Card = appDb.model('Card'),
  Truck = appDb.model('Truck'),
  OrderShare = appDb.model('OrderShare');

var userService = require('../services/user'),
  transportEventService = require('../services/transport_event'),
  traceService = require('../services/trace'),
  driverService = require('../services/driver'),
  orderService = require('../services/order'),
  driverEvaluationService = require('../services/driver_evaluation'),
  salesmanService = require('../services/wechat/salesman'),
  pushService = require('../services/push');

var transportEventTypeEnum = require('../../enums/all').transport_event_type,
  informType = require('../../enums/all').inform_type,
  webAbnormalOrderType = require('../../enums/all').web_abnormal_order_type,
  allEnum = require('../../enums/all'),
  map = require('../../libraries/map'),
  mongoose = require('mongoose');

function isInvalidDistance(distance) {
  return distance > 1000;
}

//transportEvent 可以是上传的参数，也可以是数据库实体
function getAddressDifferenceDistance(order, transportEvent) {
  //只有提货或交货时检查
  if (transportEvent.type !== 'pickup' && transportEvent.type !== 'delivery') {
    return null;
  }
  var lat1, lng1;
  if (transportEvent.location && transportEvent.location.length === 2) {
    lat1 = transportEvent.location[1];
    lng1 = transportEvent.location[0];
  }
  else {
    lat1 = parseFloat(transportEvent.latitude);
    lng1 = parseFloat(transportEvent.longitude);
  }

  if (!lat1 || !lng1) {
    return null;
  }

  var location;
  if (transportEvent.type === 'pickup') {
    if (!order.pickup_contacts.location || order.pickup_contacts.location.length !== 2) {
      return null;
    }

    location = order.pickup_contacts.location;
  }
  else {
    if (!order.delivery_contacts.location || order.pickup_contacts.location.length !== 2) {
      return null;
    }

    location = order.delivery_contacts.location;
  }
  var distance = map.getLocationDistance(lat1, lng1, location[0], location[1]);
  return distance;
}
function setTransportEventDistance(order, transportEvent) {
  var diffDistance = getAddressDifferenceDistance(order, transportEvent);
  diffDistance = diffDistance || 0;
  transportEvent.address_difference_distance = diffDistance;
  transportEvent.address_difference = isInvalidDistance(diffDistance);
}
function setTransportEventPlateDifference(order, driver, transportEvent) {
  transportEvent.driver_plate_difference = false;
  transportEvent.transport_plate_difference = false;

  if (!order || !driver || !transportEvent) {
    return;
  }

  console.log('transportEvent.recognize_plates', transportEvent.recognize_plates);

  if (!transportEvent.recognize_plates || !Array.isArray(transportEvent.recognize_plates) || transportEvent.recognize_plates.length === 0) {
    return;
  }

  var isDifference = true;
  if (driver.plate_numbers && driver.plate_numbers.length > 0) {
    for (var i = 0; i < transportEvent.recognize_plates.length; i++) {
      if (driver.plate_numbers[0].indexOf(transportEvent.recognize_plates[i]) > -1) {
        isDifference = false;
        break;
      }
    }
  }
  transportEvent.driver_plate_difference = isDifference;

  var pickupPlates;

  if (transportEvent.type === 'delivery' || transportEvent.type === 'deliverySign') {
    if (order.pickup_events && order.pickup_events[0]) {
      pickupPlates = order.pickup_events[0].recognize_plates || [];
    }
    if (order.pickup_sign_events && order.pickup_sign_events[0]) {
      pickupPlates = pickupPlates.concat(order.pickup_sign_events[0].recognize_plates || []);
    }

    isDifference = true;
    if (pickupPlates && pickupPlates.length > 0) {
      for (var j = 0; j < transportEvent.recognize_plates.length; j++) {
        if (pickupPlates.indexOf(transportEvent.recognize_plates[j]) > -1) {
          isDifference = false;
          break;
        }
      }
    }
    transportEvent.transport_plate_difference = isDifference;
  }
}


function pushAbnormalToWeb(order, informType, subType) {
  if (order.type === 'company') {
    var groupId = order.execute_group;
    if (groupId._id) {
      groupId = groupId._id;
    }
    pushService.pushOrderToWebByCompanyId(order.execute_company.toString(), groupId.toString(),
      informType, {
        title: order.order_details.order_number,
        sub_type: subType.key,
        text: subType.value,
        time: new Date()
      });
    if (!order.parent_order) {

      //如果发货方与创建方相同，则不重复推送
      if (order.sender_company && order.sender_company.company_id && order.sender_company.company_id.toString() !== order.execute_company.toString()) {
        pushService.pushOrderToWebByCompanyId(order.sender_company.company_id.toString(), null,
          informType, {
            title: order.order_details.order_number,
            sub_type: subType.key,
            text: subType.value,
            time: new Date()
          });
      }
      if (order.receiver_company && order.receiver_company.company_id) {
        pushService.pushOrderToWebByCompanyId(order.receiver_company.company_id.toString(), null,
          informType, {
            title: order.order_details.order_number,
            sub_type: subType.key,
            text: subType.value,
            time: new Date()
          });
      }
    }

    if (!order.abnormal_push) {
      return;
    }

    var wechatUsers = [];
    if (order.salesmen) {
      wechatUsers = wechatUsers.concat(order.salesmen.map(function (item) {
        return item.username;
      }));
    }
    if (order.pickup_contacts.mobile_phone) {
      wechatUsers.push(order.pickup_contacts.mobile_phone);
    }
    if (order.delivery_contacts.mobile_phone) {
      wechatUsers.push(order.delivery_contacts.mobile_phone);
    }
    if (wechatUsers.length > 0) {
      wechatUsers = wechatUsers.zzDistinct();
      wechatUsers.forEach(function (userPhone) {
        if (userPhone.testPhone()) {
          wechatPushLib.pushAbnormalInfoToWechat(userPhone, order._id, order.order_details.order_number, subType.value);
        }
      });
    }
  }
}

//设置异常运单为未处理状态
function setAbnormalUnHandled(order) {
  order.abnormal_handle_user_ids = []; //已处理过异常的用户，默认设置为都未处理。
}
function updateOrderQrcodeStatusByEvent(order, transportEventEntity) {
  if (transportEventEntity.delivery_by_qrcode === true || transportEventEntity.delivery_by_qrcode === 'true') {
    order.delivery_by_qrcode = true;
  }
}

function updateOrderMissingPackageEvent(order, transportEventEntity) {
  if (transportEventEntity.type !== 'pickup' && transportEventEntity.type !== 'delivery') {
    return;
  }
  var isMiss = transportEventService.calculateMissingPackages(order, transportEventEntity);
  if (isMiss) {
    var informSubType = webAbnormalOrderType.delivery_missing_package;
    if (transportEventEntity.type === 'delivery') {
      order.delivery_missing_packages = true;
    }
    else {
      order.pickup_missing_packages = true;
      informSubType = webAbnormalOrderType.pickup_missing_package;
    }

    setAbnormalUnHandled(order);
    pushAbnormalToWeb(order, informType.web_abnormal_order_single, informSubType);
  }
}
function updateOrderPlateByEvent(order, transportEventEntity) {
  if (transportEventEntity.driver_plate_difference) {
    var informSubType;
    if (transportEventEntity.type === 'delivery' || transportEventEntity.type === 'deliverySign') {
      order.delivery_driver_plate_difference = true;
      informSubType = webAbnormalOrderType.delivery_driver_plate_difference;
    }
    else {
      order.pickup_driver_plate_difference = true;
      informSubType = webAbnormalOrderType.pickup_driver_plate_difference;
    }

    setAbnormalUnHandled(order);
    pushAbnormalToWeb(order, informType.web_abnormal_order_single, informSubType);
  }

  if (transportEventEntity.transport_plate_difference) {
    order.transport_plate_difference = true;
    setAbnormalUnHandled(order);
    pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.transport_plate_difference);
  }
}

function updateOrderDamagedByEvent(order, transportEventEntity) {
  if (transportEventEntity.damaged === true || transportEventEntity.damaged === 'true') {
    order.damaged = true;
    setAbnormalUnHandled(order);
    if (transportEventEntity.type === 'pickup') {
      pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.pickup_damaged);
    }
    if (transportEventEntity.type === 'delivery') {
      pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.delivery_damaged);
    }
  }
}
function updateOrderAddressDifferent(order, transportEventEntity) {
  //如果是最顶层运单，则需要优先比较它自己的提货交货地址，如果没有设置，再比较分配的提货交货地址
  if (!order.parent_order) {
    var distance = getAddressDifferenceDistance(order, transportEventEntity);
    if (distance || distance === 0) {
      transportEventEntity.address_difference_distance = distance;
    }
    transportEventEntity.address_difference = isInvalidDistance(transportEventEntity.address_difference_distance);
  }

  if (transportEventEntity.address_difference) {
    setAbnormalUnHandled(order);
    if (transportEventEntity.type === 'pickup') {
      order.pickup_address_difference = true;
      order.pickup_address_difference_distance = transportEventEntity.address_difference_distance;
      pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.pickup_address_difference);
    }
    if (transportEventEntity.type === 'delivery') {
      order.delivery_address_difference = true;
      order.delivery_address_difference_distance = transportEventEntity.address_difference_distance;
      pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.delivery_address_difference);
    }
  }
}

function updateOrderDescriptionByEvent(order, transportEventEntity) {
  if (transportEventEntity.description) {
    order.remark += transportEventEntity.description + ',';
  }
}
function updateOrderEventsByEvent(order, transportEventEntity, eventType) {
  if (!order[eventType]) {
    order[eventType] = [];
  }
  order[eventType].push(transportEventEntity);
}
function updateOrderPickupSignDeferedByEvent(order, time) {
  order.pickup_sign_time = time;
  if (order.pickup_end_time && time > order.pickup_end_time) {
    order.pickup_sign_deferred = true;
  }
}
function updateOrderDeliverySignDeferedByEvent(order, time) {
  order.delivery_sign_time = time;
  if (order.delivery_end_time && time > order.delivery_end_time) {
    order.delivery_sign_deferred = true;
  }
}

function updateOrderPickupDeferedByEvent(order, time) {
  order.pickup_time = time;
  if (order.pickup_end_time && time > order.pickup_end_time) {
    order.pickup_deferred = true;
    setAbnormalUnHandled(order);
    pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.pickup_deferred);
  }
}
function updateOrderDeliveryDeferedByEvent(order, time) {
  order.delivery_time = time;
  if (order.delivery_end_time && time > order.delivery_end_time) {
    order.delivery_deferred = true;
    setAbnormalUnHandled(order);
    pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.delivery_deferred);
  }
}
function addEventToOrder(order, transportEventEntity) {
  if (!order || !transportEventEntity) {
    return;
  }

  switch (transportEventEntity.type) {
    case transportEventTypeEnum.pickupSign:
      if (!order.pickup_sign_events) {
        order.pickup_sign_events = [];
      }

      order.pickup_sign_events.push(transportEventEntity);
      break;
    case transportEventTypeEnum.pickup:
      if (!order.pickup_events) {
        order.pickup_events = [];
      }

      order.pickup_events.push(transportEventEntity);
      break;
    case transportEventTypeEnum.deliverySign:
      if (!order.delivery_sign_events) {
        order.delivery_sign_events = [];
      }

      order.delivery_sign_events.push(transportEventEntity);
      break;
    case transportEventTypeEnum.delivery:
      if (!order.delivery_events) {
        order.delivery_events = [];
      }

      order.delivery_events.push(transportEventEntity);
      break;
    case transportEventTypeEnum.halfway:
      if (!order.halfway_events) {
        order.halfway_events = [];
      }
      order.halfway_events.push(transportEventEntity);

      setAbnormalUnHandled(order);
      pushAbnormalToWeb(order, informType.web_abnormal_order_single, webAbnormalOrderType.halfway_event);
      break;
    case transportEventTypeEnum.confirm:
      if (!order.confirm_events) {
        order.confirm_events = [];
      }
      order.confirm_events.push(transportEventEntity);
      break;
    default:
      break;
  }
}

function notifyReceiverWhenBegin2Transport(driverOrder, driver, callback) {
  //if (process.env.NODE_ENV !== 'production') {
  //  return;
  //}

  Order.findOne({order_detail: driverOrder.order_details._id, parent_order: {$exists: false}})
    .populate('create_company')
    .exec(function (err, topOrder) {
      if (err || !topOrder) {
        return callback({err: orderError.internal_system_error});
      }
      if (topOrder.pickup_events.length !== 1 || !topOrder.pickup_push) {
        return callback();
      }

      var executeDriver = driverOrder.execute_drivers[0] || {};
      orderService.sendOrderMessage(allEnum.company_order_message_push_type.ltl_pickup, topOrder, executeDriver.username, executeDriver.plate_numbers && executeDriver.plate_numbers[0]);

      return callback();
    });
}
function createEvaluation(order, driverId, callback) {
  //运单完成要系统自动好评, 但用户可以修改
  if (order.status !== 'completed') {
    return callback(null, order);
  }

  driverEvaluationService.systemCreate(order._id, driverId, function (err, result) {
    if (err) {
      console.log('create system evaluation error: ' + err);
    }
    return callback(null);
  });
}

// function updateParentOrderInfo(order, newStatus, transportEventObject, callback) {
//   if (!order.parent_order)
//     return callback(null, {success: true});
//
//   orderService.getOrderById(order.parent_order, function (err, parentOrder) {
//     if (err) {
//       return callback(err);
//     }
//
//     updateOrderDescriptionByEvent(parentOrder, transportEventObject);
//     updateOrderPlateByEvent(parentOrder, transportEventObject);
//     updateOrderDamagedByEvent(parentOrder, transportEventObject);
//     updateOrderQrcodeStatusByEvent(parentOrder, transportEventObject);
//     updateOrderMissingPackageEvent(parentOrder, transportEventObject);
//     addEventToOrder(parentOrder, transportEventObject);
//
//     if (transportEventObject.type === 'pickupSign' && !parentOrder.pickup_sign_time) {
//       updateOrderPickupSignDeferedByEvent(parentOrder, order.pickup_sign_time);
//     }
//
//     if (transportEventObject.type === 'pickup' && !parentOrder.pickup_time) {
//       updateOrderPickupDeferedByEvent(parentOrder, order.pickup_time);
//       updateOrderAddressDifferent(parentOrder, transportEventObject);
//     }
//
//     if (newStatus && parentOrder.status !== newStatus) {
//       parentOrder.status = newStatus;
//     }
//
//     parentOrder.save(function (err, saveOrderEntity) {
//       if (err) {
//         return callback({err: transportEventError.internal_system_error}, null);
//       }
//
//       //计算父运单所提供的地址是否异常, A --> B, 那么B的提货交货地址是由A提供的
//       setTransportEventDistance(saveOrderEntity, transportEventObject);
//       updateParentOrderInfo(saveOrderEntity, newStatus, transportEventObject, callback);
//     });
//
//   });
// }
// function updateParentOrderInfoToCompleted(order, newStatus, transportEventObject, callback) {
//   if (!order.parent_order)
//     return callback(null, {success: true});
//
//   orderService.getOrderById(order.parent_order, function (err, parentOrder) {
//     if (err) {
//       return callback(err);
//     }
//
//     if (parentOrder.status === 'completed') {
//       return callback({err: transportEventError.order_has_been_complete}, null);
//     }
//
//     //如果父运单还未分配完，则直接返回
//     if (parentOrder.assign_status !== 'completed') {
//       return callback(null, {success: true});
//     }
//
//     orderService.getChildrenByParentId(order.parent_order, function (err, brotherOrders) {
//       if (err) {
//         return callback(err);
//       }
//
//       //最后一个交货进场
//       if (transportEventObject.type === 'deliverySign') {
//         async.each(brotherOrders, function (brotherOrder, eachCallback) {
//           //如果是自己，则直接过
//           if (brotherOrder._id.toString() === order._id.toString()) {
//             return eachCallback();
//           }
//
//           if (brotherOrder.status !== 'completed') {
//             return eachCallback({err: transportEventError.uncompleted}, null);
//           }
//
//           return eachCallback();
//         }, function (err) {
//           if (err) {
//             return callback(null, {success: true});
//           }
//
//           if (!parentOrder.delivery_sign_time) {
//             updateOrderDeliverySignDeferedByEvent(parentOrder, order.delivery_sign_time);
//           }
//
//           parentOrder.save(function (err, saveParentOrder) {
//             if (err || !saveParentOrder)
//               return callback({err: transportEventError.internal_system_error}, null);
//
//             if (!saveParentOrder.parent_order) {
//               //推送短信通知
//
//               orderService.sendOrderMessage(allEnum.company_order_message_push_type.ltl_delivery_sign, parentOrder, transportEventObject.driver_phone, transportEventObject.driver_plate_numbers && transportEventObject.driver_plate_numbers[0]);
//             }
//
//
//             updateParentOrderInfoToCompleted(saveParentOrder, newStatus, transportEventObject, callback);
//           });
//
//         });
//
//       }
//       else {
//         async.each(brotherOrders, function (brotherOrder, eachCallback) {
//           if (brotherOrder.status !== 'completed') {
//             return eachCallback({err: transportEventError.uncompleted}, null);
//           }
//
//           return eachCallback();
//         }, function (err) {
//           if (err) {
//             return callback(null, {success: true});
//           }
//
//           if (!parentOrder.delivery_time) {
//             updateOrderDeliveryDeferedByEvent(parentOrder, order.delivery_time);
//             updateOrderAddressDifferent(parentOrder, transportEventObject);
//           }
//
//           parentOrder.status = 'completed';
//           parentOrder.save(function (err, saveParentOrder) {
//             if (err || !saveParentOrder)
//               return callback({err: transportEventError.internal_system_error}, null);
//
//
//             if (!saveParentOrder.parent_order) {
//               //推送短信通知
//
//               orderService.sendOrderMessage(allEnum.company_order_message_push_type.delivery, parentOrder);
//             }
//
//             //计算父运单所提供的地址是否异常, A --> B, 那么B的提货交货地址是由A提供的
//             setTransportEventDistance(saveParentOrder, transportEventObject);
//             updateParentOrderInfoToCompleted(saveParentOrder, newStatus, transportEventObject, callback);
//           });
//
//         });
//
//       }
//
//     });
//   });
// }

function updateOrderBasicInfosForPickupSign(order, transportEventEntity) {
  updateOrderPickupSignDeferedByEvent(order, transportEventEntity.time);
  updateOrderEventsByEvent(order, transportEventEntity, 'pickup_sign_events');
  var result = order.status = 'unPickuped';
  return result;

}
function updateOrderBasicInfosForPickup(order, transportEventEntity) {
  updateOrderPickupDeferedByEvent(order, transportEventEntity.time);
  updateOrderEventsByEvent(order, transportEventEntity, 'pickup_events');
  var result = order.status = 'unDeliverySigned';
  return result;
}
function updateOrderBasicInfosForDeliverySign(order, transportEventEntity) {
  updateOrderDeliverySignDeferedByEvent(order, transportEventEntity.time);
  updateOrderEventsByEvent(order, transportEventEntity, 'delivery_sign_events');
  var result = order.status = 'unDeliveried';
  return result;
}
function updateOrderBasicInfosForDelivery(order, transportEventEntity) {
  updateOrderDeliveryDeferedByEvent(order, transportEventEntity.time);
  updateOrderEventsByEvent(order, transportEventEntity, 'delivery_events');
  updateOrderMissingPackageEvent(order, transportEventEntity);//交货时计算是否缺失件数
  order.status = 'completed';
  return 'unDeliveried';
}
function updateOrderBasicInfosForHalfway(order, transportEventEntity) {
  updateOrderEventsByEvent(order, transportEventEntity, 'halfway_events');
  return '';
}

function updateOrderBasicInfosForConfirm(order, transportEventEntity) {
  updateOrderEventsByEvent(order, transportEventEntity, 'confirm_events');
  return '';
}

function updateOrderBasicInfosByEvent(order, transportEventEntity, callback) {
  updateOrderPlateByEvent(order, transportEventEntity);
  updateOrderDamagedByEvent(order, transportEventEntity);
  updateOrderDescriptionByEvent(order, transportEventEntity);

  var newStatus = '';
  switch (transportEventEntity.type) {
    case 'pickupSign':
    {
      if (order.status !== 'unPickupSigned') {
        return callback({err: transportEventError.can_not_execute_pickupSign});
      }
      newStatus = updateOrderBasicInfosForPickupSign(order, transportEventEntity);
      break;
    }
    case 'pickup':
    {
      if (order.status !== 'unPickupSigned' && order.status !== 'unPickuped') {
        return callback({err: transportEventError.can_not_execute_pickup});
      }

      order.pickup_real_tons = transportEventEntity.pickup_real_tons||0;
      updateOrderAddressDifferent(order, transportEventEntity);
      newStatus = updateOrderBasicInfosForPickup(order, transportEventEntity);
      break;
    }
    case 'deliverySign':
    {
      if (order.status !== 'unDeliverySigned') {
        return callback({err: transportEventError.can_not_execute_deliverySign});
      }
      newStatus = updateOrderBasicInfosForDeliverySign(order, transportEventEntity);
      break;
    }
    case 'delivery':
    {
      if (order.status !== 'unDeliverySigned' && order.status !== 'unDeliveried') {
        return callback({err: transportEventError.can_not_execute_delivery});
      }
      updateOrderAddressDifferent(order, transportEventEntity);
      newStatus = updateOrderBasicInfosForDelivery(order, transportEventEntity);
      break;
    }
    case 'halfway':
    {
      newStatus = updateOrderBasicInfosForHalfway(order, transportEventEntity);
      break;
    }
    case 'confirm':
    {
      if (order.confirm_events && order.confirm_events.length > 0) {
        return callback({err: transportEventError.can_not_execute_confirm});
      }
      newStatus = updateOrderBasicInfosForConfirm(order, transportEventEntity);
      break;
    }
    default:
      return callback({err: transportEventError.internal_system_error}, null);
  }

  order.save(function (err, orderEntity) {
    if (err || !orderEntity) {
      return callback({err: transportEventError.internal_system_error});
    }
    return callback(null, newStatus, orderEntity, transportEventEntity);
  });
}

function updateOrderInfo(order, transportEventEntity, callback) {
  updateOrderBasicInfosByEvent(order, transportEventEntity, function (err, newStatus, orderEntity, transportEventEntity) {
    if (err) {
      return callback(err);
    }

    createEvaluation(orderEntity, transportEventEntity.driver, function (err) {

      //初始化transportEventEntity的distance
      setTransportEventDistance(orderEntity, transportEventEntity);

      if (orderEntity.status != 'completed') {
        return callback(null, {success: true});
      }

      async.auto({
        tender: function (autoCallback) {
          Tender.findOne({_id: orderEntity.tender}, function (err, tender) {
            if (err || !tender) {
              return autoCallback({err: transportEventError.internal_system_error}, null);
            }
            tender.status = 'completed';
            return autoCallback(null, tender);
          });
        },
        card: ['tender', function (autoCallback, result) {
          var tender = result.tender;
          Card.findOne({_id: tender.card}, function (err, card) {
            if (err || !card) {
              return autoCallback({err: transportEventError.internal_system_error}, null);
            }
            card.truck = null;
            card.truck_number = '';
            return autoCallback(null, card);
          });
        }],
        truck: ['tender', function (autoCallback, result) {
          var tender = result.tender;
          Truck.findOne({_id: tender.truck}, function (err, truck) {
            if (err || !truck) {
              return autoCallback({err: transportEventError.internal_system_error}, null);
            }
            truck.card = null;
            truck.card_number = '';
            return autoCallback(null, truck);
          });
        }]
      }, function (err, result) {
        var tender = result.tender;
        var card = result.card;
        var truck = result.truck;
        tender.save(function (err, saveTender) {
          if (err || !saveTender) {
            return callback({err: transportEventError.internal_system_error}, null);
          }
          card.save(function (err, saveCard) {
            if (err || !saveCard) {
              return callback({err: transportEventError.internal_system_error}, null);
            }

            truck.save(function (err, saveTruck) {
              if (err || !saveTruck) {
                return callback({err: transportEventError.internal_system_error}, null);
              }
              return callback(err, {success: true})
            });
          });
        });
      });


      // updateParentOrderInfo(orderEntity || {}, newStatus, transportEventEntity, function (err, result) {
      //   if (err) {
      //     return callback(err, null);
      //   }
      //
      //   if (newStatus !== 'unDeliveried') {
      //     return callback(null, result);
      //   }

      //初始化transportEventEntity的distance
      // setTransportEventDistance(orderEntity, transportEventEntity);
      // updateParentOrderInfoToCompleted(orderEntity, 'completed', transportEventEntity, function (err, result) {
      //   if (err)
      //     return callback(err, null);
      //
      //   return callback(null, result);
      // });
    });
  });
}


//执行TransportEvent单个订单处理
function executeTransportEventHandle(orderId, currentDriver, transportEvent, callback) {
  orderService.getOrderByIdAndPopulate(orderId, 'order_detail pickup_contact delivery_contact', function (err, order) {
    if (err) {
      return callback(err);
    }

    if (order.delete_status) {
      return callback({err: transportEventError.order_is_deleted});
    }

    if (!order.execute_driver || order.execute_driver.toString() !== currentDriver._id.toString()) {
      return callback({err: transportEventError.order_driver_not_match});
    }

    setTransportEventDistance(order, transportEvent);
    setTransportEventPlateDifference(order, currentDriver, transportEvent);

    transportEvent.time = new Date().toISOString();
    transportEventService.create(order, currentDriver, transportEvent, function (err, transportEventEntity) {
      if (err) {
        return callback(err);
      }
      updateOrderInfo(order, transportEventEntity, function (err, transportEventResult) {
        if (err) {
          return callback(err);
        }

        if (transportEvent.type === 'confirm') {
          var execResult = {
            success: transportEventResult.success,
            order: order
          };
          return callback(null, execResult);
        }
        else {
          traceService.upload(currentDriver, transportEvent.address, transportEvent.longitude, transportEvent.latitude, transportEventEntity.time, 'gps', function (err, traceResult) {
            if (err || !traceResult) {
              return callback(err);
            }

            driverService.updateDriverCurTrace(transportEvent.longitude, transportEvent.latitude, currentDriver._id, function () {
              var execResult = {
                success: transportEventResult.success,
                order: order
              };
              return callback(null, execResult);
            });
          });
        }
      });
    });

  });
}

//判断与运单相关的事件是否已经上传
function isEventExist(transportEvent, callback) {
  if (!transportEvent || !transportEvent.event_id) {
    return callback(null, false);
  }

  TransportEvent.findOne({$and: [{event_id: {$exists: true}}, {event_id: transportEvent.event_id}, {order: transportEvent.order_id}]}, function (err, findEvent) {
    if (err) {
      console.log(err);
      return callback(transportEventError.internal_system_error);
    }
    if (!findEvent) {
      return callback(null, false);
    }
    else {
      return callback(null, true);
    }
  });
}

function singleUpload(currentDriver, transportEvent, callback) {
  if (!transportEvent) {
    return callback({err: transportEventError.params_null});
  }

  if (!transportEvent.order_id) {
    return callback({err: transportEventError.should_upload_orderId});
  }

  isEventExist(transportEvent, function (err, isExist) {
    if (err) {
      return callback({err: err});
    }
    if (isExist) {
      return callback({err: transportEventError.event_exist});
    }

    executeTransportEventHandle(transportEvent.order_id, currentDriver, transportEvent, function (err, result) {
      if (err) {
        return callback(err);
      }

      // if (transportEvent.type === 'pickup') {
      //   notifyReceiverWhenBegin2Transport(result.order, currentDriver, function (err) {
      //     if (err) { //通知失败不影响上传事件的返回结果
      //       console.log('checkAndNotifyReceiverWhenBegin2Transport error!');
      //     }
      //     console.log('pickup sms notify');
      //   });
      // }

      return callback(null, result);
    });
  });

}

//上传司机事件
exports.upload = function (req, res, next) {
  var currentDriver = req.driver || {};
  var transportEvent = req.body || {};

  singleUpload(currentDriver, transportEvent, function (err, result) {
    if (err) {
      req.err = err;
      return next();
    }
    else {
      req.data = result;
      return next();
    }
  });
};

exports.uploadMultiOrders = function (req, res, next) {
  var currentDriver = req.driver || {};
  var transportEvent = req.body || {};

  if (!transportEvent.order_ids) {
    req.err = {err: transportEventError.should_upload_orderId};
    return next();
  }

  //单个订单
  if (!Array.isArray(transportEvent.order_ids)) {
    var orderItem = transportEvent.order_ids;
    transportEvent.order_ids = [];
    transportEvent.order_ids.push(orderItem);
  }

  var errorArray = [];
  var successArray = [];

  var firstOrderEvent = {
    event_id: transportEvent.event_id,
    order_id: transportEvent.order_ids[0]
  };
  isEventExist(firstOrderEvent, function (err, isExist) {
    if (err) {
      req.err = {err: err};
      return next();
    }
    if (isExist) {
      req.err = {err: transportEventError.event_exist};
      return next();
    }

    async.eachSeries(transportEvent.order_ids, function (currentOrderId, eachCallback) {
      if (!currentOrderId)
        return eachCallback();

      executeTransportEventHandle(currentOrderId, currentDriver, transportEvent, function (err, result) {
        if (err) {
          if (!err.err || !err.err.message || !err.err.type) {
            err = transportEventError.internal_system_error;
          }
          else {
            err = err.err;
          }
          errorArray.push({order_id: currentOrderId.toString(), message: err.message, type: err.type});
        } else {
          successArray.push({order_id: currentOrderId.toString()});

          //不需要发送短信，因为有微信推送
          //if (transportEvent.type === 'pickup') {
          //  notifyReceiverWhenBegin2Transport(result.order, currentDriver, function (err) {
          //    if (err) { //通知失败不影响上传事件的返回结果
          //      console.log('checkAndNotifyReceiverWhenBegin2Transport error!');
          //    }
          //    console.log('pickup sms notify');
          //  });
          //}
        }
        return eachCallback();
      });


    }, function (err) {
      if (err) {
        req.err = {err: transportEventError.internal_system_error};
        return next();
      }

      if (errorArray.length === 0) {
        req.data = {success: successArray};
        return next();
      }

      req.data = {err: errorArray, success: successArray};
      return next();
    });

  });
};

//只能获取公司订单的事件，如获取司机相关的订单事件会报错，order.execute_group为空
exports.getEventByOrderId = function (req, res, next) {
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

  //获取订单
  Order.findOne({_id: orderId}).populate('execute_group create_group create_user').exec(function (err, order) {
    if (err) {
      return res.send({err: traceError.internal_system_error});
    }

    if (!order) {
      return res.send({err: orderError.order_not_exist});
    }

    var startTime = order.create_time;
    var endTime = order.delivery_time || new Date().toISOString();


    transportEventService.getEventByOrder([order._id], startTime, endTime, function (err, transportEvents) {
      if (err) {
        return res.send(err);
      }

      return res.send({
        order: {
          createUserNickname:'',// order.create_user.nickname,
          createUserPhone: '',//order.create_user.phone,
          createUsername: '',//order.create_user.username,
          create_time: order.create_time,
          pickup_time: order.pickup_time,
          delivery_time: order.delivery_time,
          status: order.status
        }, events: transportEvents
      });
    });

    // orderService.isOrderAllowSeeing(order, currentUser, otherCondition, function (err, canSeeing) {
    //   if (err) {
    //     return res.send(err);
    //   }
    //   if (!canSeeing) {
    //     return res.send({err: orderError.order_not_visible});
    //   }
    //
    //
    //   // orderService.getDriverChildrenOrderIds(orderId, function (err, driverOrderIds) {
    //   //   if (err) {
    //   //     return res.send(err);
    //   //   }
    //   //
    //   // });
    //
    // });
  });
};

//<editor-fold desc="被分享运单的查看事件信息，没有组的限制">
exports.getEventByOrderIdWithNoLimit = function (req, res, next) {
  var currentUser = req.user || {};
  var orderId = req.body.order_id || req.query.order_id || '';


  OrderShare.findOne({username: currentUser.username, order: orderId}).exec(function (err, orderShare) {
    if (err) {
      req.err = {err: orderShareError.internal_system_error};
      return next();
    }

    if (!orderShare) {
      res.err = {err: orderError.order_not_visible};
      return next();
    }

    Order.findOne({_id: orderShare.order}).populate('create_company').exec(function (err, order) {
      if (err) {
        req.err = {err: orderShareError.internal_system_error};
        return next();
      }

      var startTime = order.create_time;
      var endTime = order.delivery_time || new Date().toISOString();

      orderService.getDriverChildrenOrderIds(orderId, function (err, driverOrderIds) {
        if (err) {
          return res.send(err);
        }

        transportEventService.getEventByOrder(driverOrderIds, startTime, endTime, function (err, transportEvents) {
          if (err) {
            return res.send(err);
          }

          return res.send({
            order: {
              createUserNickname: order.create_user.nickname,
              createUserPhone: currentUser.phone,
              createUsername: currentUser.username,
              create_time: order.create_time,
              pickup_time: order.pickup_time,
              delivery_time: order.delivery_time
            }, events: transportEvents
          });
        });
      });
    });
  });
};
//</editor-fold>

exports.temporaryUploadEvent = function (req, res, next) {
  var currentDriver = req.driver;
  var transportEvent = req.body.transport_event || req.query.transport_event;

  singleUpload(currentDriver, transportEvent, function (err, result) {
    if (err) {
      req.err = err;
      return next();
    }
    else {
      req.data = result;
      return next();
    }
  });
};

exports.uploadActualGoodsDetail = function (req, res, next) {
  var driverOrder = req.currentOrder;
  var currentDriver = req.driver;
  var goods = req.body.goods || [];

  if (driverOrder.type !== 'driver' || !driverOrder.parent_order) {
    return res.send({err: transportEventError.params_invalid});
  }
  if (driverOrder.status !== 'unDeliverySigned' && driverOrder.status !== 'unDeliveried') {
    return res.send({err: transportEventError.order_status_invalid});
  }
  if (!Array.isArray(goods) || goods.length === 0) {
    return res.send({err: transportEventError.params_invalid});
  }

  var actualGoods = [];
  async.each(goods, function (goodItem, asyncCallback) {
    if (!goodItem._id) {
      try {
        goodItem = JSON.parse(goodItem);
      }
      catch (e) {
        //错误的格式，没有_id
        goodItem = {
          name: '',
          count: null,
          unit: null,
          price: null
        };
      }
    }
    actualGoods.push(goodItem);
    return asyncCallback();
  }, function (err) {

    //设置driverOrder的父运单的实收货物字段
    Order.findOne({_id: driverOrder.parent_order, delete_status: false}, function (err, parentOrder) {
      if (err) {
        return res.send({err: transportEventError.internal_system_error});
      }

      parentOrder.actual_delivery_goods = actualGoods;
      parentOrder.save(function (err, saveOrder) {
        if (err) {
          return res.send({err: transportEventError.internal_system_error});
        }

        if (driverOrder.delivery_contacts.mobile_phone) {
          //推送
          var plateNumber = (currentDriver.plate_numbers && currentDriver.plate_numbers.length > 0) ? currentDriver.plate_numbers[0] : '未知';
          var driverName = currentDriver.nickname ? currentDriver.nickname : currentDriver.username;
          var senderName = parentOrder.sender_name || '未知';
          wechatPushLib.pushReceiveGoodsMessageToWechat(driverOrder.delivery_contacts.mobile_phone, saveOrder._id.toString(), plateNumber, driverName, senderName);
        }

        return res.send({success: true});

      });
    });

  });

};

exports.wechatUploadEvent = function (req, res, next) {
  var currentDriver = req.driver;
  var transportEvent = req.body;

  transportEvent.is_wechat = true;
  console.log(transportEvent);


  var photos = [];
  if (transportEvent.wechat_photos && Array.isArray(transportEvent.wechat_photos) && transportEvent.wechat_photos.length > 0) {
    transportEvent.wechat_photos.forEach(function (item) {
      photos.push({
        name: item.name,
        url: item.filename
      });
    });
  }
  transportEvent.photos = photos;


  singleUpload(currentDriver, transportEvent, function (err, result) {
    if (err) {
      return res.send(err);
    }

    wechatService.sendWechatPhotoToQiniu(transportEvent.wechat_photos);
    return res.send(result);
  });

};