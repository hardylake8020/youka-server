/**
 * Created by elinaguo on 15/4/9.
 */
'use strict';

var _ = require('lodash'),
  pushLib = require('../libraries/getui'),
  smsLib = require('../libraries/sms'),
  wechatPushLib = require('../libraries/wechat_push'),


  config = require('../../config/config'),
  orderError = require('../errors/order'),
  appDb = require('../../libraries/mongoose').appDb,
  async = require('async'),
  Order = appDb.model('Order'),
  GoodsDetail = appDb.model('GoodsDetail'),
  OrderDetail = appDb.model('OrderDetail'),
  Detail = appDb.model('Detail'),
  Contact = appDb.model('Contact'),
  Group = appDb.model('Group'),
  Driver = appDb.model('Driver'),
  Company = appDb.model('Company'),
  CompanyService = require('../services/company'),
  CustomerContact = appDb.model('CustomerContact'),
  UserProfile = appDb.model('UserProfile'),
  Tender = appDb.model('Tender'),
  TenderRecorder = appDb.model('TenderRecorder'),
  salesmanService = require('../services/wechat/salesman'),
  pushService = require('../services/push'),
  OrderService = require('../services/order');

var InformType = require('../../enums/all').inform_type,
  WebAbnormalOrderType = require('../../enums/all').web_abnormal_order_type;


exports.checkTenderStart = function () {
  checkTenderStart();
};

exports.checkTenderEnd = function () {
  checkTenderEnd();
};

function checkTenderEnd() {
  setTimeout(function () {
    console.log('check tender end===============================>' + new Date().toLocaleTimeString());
    Tender.findOne({
      status: 'comparing',
      tender_type: 'compare',
      end_time: {$lte: new Date()}
    }, function (err, tender) {
      if (!tender) {
        return checkTenderEnd();
      }

      if (!tender.tender_records || tender.tender_records.length == 0) {
        tender.status == 'compareEnd';
        tender.save(function () {
          return checkTenderEnd();
        });
      }
      else {
        TenderRecorder.find({tender: tender._id}).sort({price: 1}).exec(function (err, tenderRecords) {
          if (err || !tenderRecords) {
            return checkTenderEnd();
          }
          tender.driver_winner = tenderRecords[0].driver;
          tender.status = 'unAssigned';
          tender.winner_time = new Date();
          tender.save(function (err) {
            checkTenderEnd();
          });
        });
      }

    });
  }, 5000);
}


function checkTenderStart() {
  setTimeout(function () {
    console.log('check tender start===============================>' + new Date().toLocaleTimeString());
    Tender.find({
      status: 'unStarted',
      tender_type: 'compare',
      start_time: {$lte: new Date()}
    }, function (err, tenders) {
      async.each(tenders, function (tender, callback) {
        tender.status = 'comparing';
        tender.save(function (err, saveTender) {
          if (err || !saveTender) {
            console.log('start tender failed:  ' + JSON.stringify(err));
          }
          return callback();
        });
      }, function () {
        checkTenderStart();
      });
    });
  }, 5000);
}

//
// function getPushObjects(order, callback) {
//   var wechatUsers = [];
//   if (order.salesmen) {
//     wechatUsers = wechatUsers.concat(order.salesmen.map(function (item) {
//       return item.username;
//     }));
//   }
//   if (order.delivery_contacts.mobile_phone) {
//     wechatUsers.push(order.delivery_contacts.mobile_phone);
//   }
//   if (wechatUsers.length === 0) {
//     return callback(null, {salesmanList: [], wechatList: []});
//   }
//
//   wechatUsers = wechatUsers.zzDistinct();
//   salesmanService.getSalesmanByUsernameList(wechatUsers, function (err, salesmanList) {
//     if (err) {
//       return callback(err);
//     }
//
//     return callback(null, {salesmanList: salesmanList, wechatList: wechatUsers});
//   });
// }
//
//
// function notifyPickupDeferredPush(order, callback) {
//   getPushObjects(order, function (err, result) {
//     if (err) {
//       return callback(err);
//     }
//
//     var salesmanList = result.salesmanList || [];
//     var wechatUsers = result.wechatList || [];
//
//     salesmanList.forEach(function (salesmen) {
//       if (salesmen.wechat_openid) {
//         //微信
//         wechatPushLib.pushPickupDeferredInfoToWechat(salesmen.username, order._id, order.order_details.order_number, order.pickup_end_time, order.pickup_contacts.address || '');
//         wechatUsers.splice(wechatUsers.indexOf(salesmen.username), 1);
//       }
//     });
//
//     if (!OrderService.allowSendSMS(order)) {
//       return callback();
//     }
//
//     wechatUsers.forEach(function (phone) {
//       if (phone && phone.length === 11) {
//         smsLib.ypSendPickupDeferredInfoForSalesman(phone, order.order_details.order_number, function (err, result) {
//           if (err) {
//             console.log('Notify to pickup defer sms [' + phone + '] : Error!');
//             console.log('Error is', err);
//           }
//           console.log(result);
//         });
//       }
//     });
//
//     return callback();
//   });
// }
//
// function notifyDeliveryEarlyPush(order, callback) {
//
//   getPushObjects(order, function (err, result) {
//     if (err) {
//       return callback(err);
//     }
//
//     var salesmanList = result.salesmanList || [];
//     var wechatUsers = result.wechatList || [];
//
//     salesmanList.forEach(function (salesmen) {
//       if (salesmen.wechat_openid) {
//         //微信
//         wechatPushLib.pushDeliveryEarlyInfoToWechat(salesmen.username, order._id, order.order_details.order_number, order.delivery_start_time);
//         wechatUsers.splice(wechatUsers.indexOf(salesmen.username), 1);
//       }
//     });
//
//     if (!OrderService.allowSendSMS(order)) {
//       return callback();
//     }
//
//     wechatUsers.forEach(function (phone) {
//       if (phone && phone.length === 11) {
//         smsLib.ypSendDeliveryEarlyInfoForSalesman(phone, order.order_details.order_number, function (err, result) {
//           if (err) {
//             console.log('Notify to delivery early sms [' + phone + '] : Error!');
//             console.log('Error is', err);
//           }
//           console.log(result);
//         });
//       }
//     });
//
//     return callback();
//   });
// }
//
//
// //检查到指定时间还未提货的运单
// function startCheckPickupDeferred(callback) {
//   async.auto({
//     findOrders: function (autoCallback) {
//       Order.find({
//         parent_order: {$exists: false},
//         pickup_deferred_push_status: false,
//         pickup_deferred_push: true,
//         pickup_deferred_time: {$lt: new Date()},
//         delete_status: false,
//         status: {$in: ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped']}
//       }).limit(10)
//         .exec(function (err, orders) {
//           if (err) {
//             return autoCallback({err: {type: 'find pickup deferred order err'}});
//           }
//           return autoCallback(null, orders);
//         });
//     },
//     executePush: ['findOrders', function (autoCallback, result) {
//       async.each(result.findOrders, function (order, eachCallback) {
//         notifyPickupDeferredPush(order, function (err) {
//           console.log('notifyPickupDeferredPush result --->: ');
//           console.log(err);
//
//           order.pickup_deferred_push_status = true;
//           order.save(function (err) {
//             console.log('save pickup_deferred_push_status result --->: ');
//             console.log(err);
//
//             return eachCallback();
//           });
//         });
//       }, function (err) {
//         return autoCallback(err);
//       });
//     }]
//   }, function (err) {
//     console.log('startCheckPickupDeferred result --->: ');
//     console.log(err);
//     return callback();
//   });
// }
//
// //检查预收货运单
// function startCheckDeliveryEarly(callback) {
//   async.auto({
//     findOrders: function (autoCallback) {
//       Order.find({
//         parent_order: {$exists: false},
//         delivery_early_push_status: false,
//         delivery_early_push: true,
//         delivery_early_time: {$lt: new Date()},
//         delete_status: false,
//         status: {$ne: 'completed'}
//       }).limit(10)
//         .exec(function (err, orders) {
//           if (err) {
//             return autoCallback({err: {type: 'find delivery early order err'}});
//           }
//           return autoCallback(null, orders);
//         });
//     },
//     executePush: ['findOrders', function (autoCallback, result) {
//       async.each(result.findOrders, function (order, eachCallback) {
//         notifyDeliveryEarlyPush(order, function (err) {
//           console.log('notifyDeliveryEarlyPush result --->: ');
//           console.log(err);
//           order.delivery_early_push_status = true;
//           order.save(function (err) {
//             console.log('save delivery_early_push_status result --->: ');
//             console.log(err);
//             return eachCallback();
//           });
//         });
//       }, function (err) {
//         return autoCallback(err);
//       });
//     }]
//   }, function (err) {
//     console.log('startCheckDeliveryEarly result --->: ');
//     console.log(err);
//     return callback();
//   });
// }
//
//
// function startPickupDeferredClock() {
//   console.log('##### timer ** pickup-defer ** clock #####');
//
//   setTimeout(function () {
//     startCheckPickupDeferred(function (err) {
//       startPickupDeferredClock();
//     });
//   }, 30 * 1000);
// }
//
// function startDeliveryEarlyClock() {
//   console.log('##### timer ** delivery-early ** clock #####');
//
//   setTimeout(function () {
//     startCheckDeliveryEarly(function (err) {
//       startDeliveryEarlyClock();
//     });
//   }, 30 * 1000);
// }
//
// //开启提货滞留检查定时器
// exports.startPickupDeferredClock = function () {
//   setTimeout(function () {
//     console.log('*** start pickup-defer clock ****');
//
//     startPickupDeferredClock();
//   }, 1000 * 5);
// };
// //开启预收货推送检查定时器
// exports.startDeliveryEarlyClock = function () {
//   setTimeout(function () {
//     console.log('*** start delivery-early clock ****');
//     startDeliveryEarlyClock();
//   }, 1000 * 10);
// };
//
// function pushToWeb(companyOrder, informType, abnormalType) {
//   console.log('push to web: ' + abnormalType.value);
//   var groupId = companyOrder.execute_group._id || companyOrder.execute_group;
//
//   pushService.pushOrderToWebByCompanyId(companyOrder.execute_company.toString(), groupId.toString(),
//     informType, {
//       title: companyOrder.order_details.order_number,
//       sub_type: abnormalType.key,
//       text: abnormalType.value,
//       time: new Date()
//     });
// }
//
// function executeFirstUnConfirm(driverOrder, callback) {
//   async.auto({
//     noticeDriver: function (autoCallback) {
//       driverOrder.un_confirm_first_inform = true;
//       driverOrder.save(function (err, saveDriverOrder) {
//         if (err) {
//           return autoCallback({err: orderError.internal_system_error});
//         }
//         if (driverOrder.execute_drivers[0] && driverOrder.execute_drivers[0].username) {
//           smsLib.goConfirmOrder(driverOrder.execute_drivers[0].username, driverOrder.order_details.order_number, function (err) {
//             console.log('executeFirstUnConfirm sms send result');
//           });
//         }
//         return autoCallback();
//       });
//     },
//     noticeWeb: function (autoCallback) {
//       Order.findOne({_id: driverOrder.parent_order}, function (err, companyOrder) {
//         if (err || !companyOrder) {
//           return autoCallback({err: orderError.internal_system_error});
//         }
//
//         companyOrder.abnormal_handle_user_ids = [];
//         companyOrder.un_confirm_first_inform = true;
//         companyOrder.save(function (err, saveCompanyOrder) {
//           pushToWeb(companyOrder, InformType.web_abnormal_order_single, WebAbnormalOrderType.confirm_order_time_out);
//
//           return autoCallback();
//         });
//
//       });
//     }
//   }, function (err, result) {
//     return callback(err);
//   });
// }
// function checkFirstUnConfirmOrder(callback) {
//
//   async.auto({
//     findDriverOrders: function (autoCallback) {
//       Order.find({
//         execute_driver: {$exists: true},
//         delete_status: false,
//         is_wechat: false,
//         confirm_status: 'un_confirmed',
//         un_confirm_first_inform: false,
//         un_confirm_first_inform_time: {$lt: new Date()}
//       }).limit(10)
//         .exec(function (err, orders) {
//           if (err) {
//             return autoCallback({err: {type: 'findDriverOrders not confirm err'}});
//           }
//           return autoCallback(null, orders || []);
//         });
//     },
//     executePush: ['findDriverOrders', function (autoCallback, result) {
//       async.eachSeries(result.findDriverOrders, function (driverOrder, eachCallback) {
//         executeFirstUnConfirm(driverOrder, function (err) {
//           return eachCallback(err);
//         });
//       }, function (err) {
//         return autoCallback(err);
//       });
//     }]
//
//   }, function (err, result) {
//     return callback(err);
//   });
// }
//
// function executeSecondUnConfirm(driverOrder, callback) {
//   async.auto({
//     deleteDriverOrder: function (autoCallback) {
//       driverOrder.delete_status = true;
//       driverOrder.un_confirm_second_inform = true;
//
//       driverOrder.save(function (err) {
//         if (err) {
//           console.log(err);
//           return autoCallback({err: orderError.internal_system_error});
//         }
//         if (driverOrder.execute_drivers && driverOrder.execute_drivers[0]) {
//           OrderService.pushDeleteInfoToDriver(driverOrder.execute_drivers[0], driverOrder._id);
//           //发送短信
//           smsLib.repealDriverOrder(driverOrder.execute_drivers[0].username, driverOrder.order_details.order_number, function (err) {
//             console.log('executeSecondUnConfirm sms send result');
//           });
//         }
//         return autoCallback();
//       });
//     },
//     updateCompanyOrder: ['deleteDriverOrder', function (autoCallback) {
//       OrderService.getOrderById(driverOrder.parent_order, function (err, companyOrder) {
//         if (err) {
//           return autoCallback(err);
//         }
//
//         //更新assigned_infos
//         for (var i = 0, l = companyOrder.assigned_infos.length; i < l; i++) {
//           if (companyOrder.assigned_infos[i].order_id === driverOrder._id.toString()) {
//             companyOrder.assigned_infos[i].driver_username = '';
//             companyOrder.assigned_infos[i].driver_id = '';
//             companyOrder.assigned_infos[i].company_id = '';
//             companyOrder.assigned_infos[i].order_id = '';
//             companyOrder.assigned_infos[i].is_wechat = '';
//             companyOrder.assigned_infos[i].partner_name = '';
//             companyOrder.assigned_infos[i].is_assigned = false;
//             break;
//           }
//         }
//         companyOrder.markModified('assigned_infos');
//         companyOrder.assigned_count = companyOrder.assigned_infos.filter(function (item) {
//           return item.is_assigned;
//         }).length;
//
//         companyOrder.status = 'unAssigned';
//         companyOrder.assign_status = 'unAssigned';
//
//         if (companyOrder.assigned_count > 0) {
//           companyOrder.status = 'assigning';
//           companyOrder.assign_status = 'assigning';
//         }
//
//         if (companyOrder.total_assign_count === companyOrder.assigned_count) {
//           companyOrder.status = 'unPickupSigned';
//           companyOrder.assign_status = 'completed';
//         }
//
//         companyOrder.un_confirm_second_inform = true;
//
//         companyOrder.save(function (err, saveCompanyOrder) {
//           if (err) {
//             console.log(err);
//             return autoCallback({err: orderError.internal_system_error});
//           }
//           pushToWeb(saveCompanyOrder, InformType.web_abnormal_order_single, WebAbnormalOrderType.repeal_driver_order);
//
//           OrderService.updateParentExecuters(saveCompanyOrder._id, function (err) {
//             if (err) {
//               console.log(err);
//               return autoCallback(err);
//             }
//
//             return autoCallback(null, saveCompanyOrder);
//           });
//
//         });
//
//       });
//     }],
//     recordUnConfirm: ['updateCompanyOrder',function (autoCallback, result) {
//       var driverPhone = '';
//       if (driverOrder.execute_drivers && driverOrder.execute_drivers[0]) {
//         driverPhone = driverOrder.execute_drivers[0].username;
//       }
//
//       var orderReject = new OrderReject({
//         company: driverOrder.create_company,
//         driver: driverOrder.execute_driver,
//         driver_phone: driverPhone,
//         order: driverOrder._id,
//         order_details: driverOrder.order_details
//       });
//
//       orderReject.save(function (err, saveObject) {
//         if (err) {
//           return autoCallback({err: orderError.internal_system_error});
//         }
//         return autoCallback();
//       });
//     }]
//   }, function (err, result) {
//     return callback(err);
//   });
// }
// function checkSecondUnConfirmOrder(callback) {
//   async.auto({
//     findDriverOrders: function (autoCallback) {
//       Order.find({
//         execute_driver: {$exists: true},
//         delete_status: false,
//         is_wechat: false,
//         confirm_status: 'un_confirmed',
//         un_confirm_first_inform: true,
//         un_confirm_second_inform_time: {$lt: new Date()}
//       }).limit(10)
//         .exec(function (err, orders) {
//           if (err) {
//             return autoCallback({err: {type: 'findDriverOrders not confirm err'}});
//           }
//           return autoCallback(null, orders || []);
//         });
//     },
//     executePush: ['findDriverOrders', function (autoCallback, result) {
//       async.eachSeries(result.findDriverOrders, function (driverOrder, eachCallback) {
//         executeSecondUnConfirm(driverOrder, function (err) {
//           return eachCallback(err);
//         });
//       }, function (err) {
//         return autoCallback(err);
//       });
//     }]
//
//   }, function (err, result) {
//     return callback(err);
//   });
// }
//
// function startCheckOrderConfirm(callback) {
//   async.auto({
//     //检查1小时内未确认的司机运单，并通知
//     checkTimeout: function (autoCallback) {
//       checkFirstUnConfirmOrder(function (err) {
//         if (err) {
//           console.log('first check unconfirm over err' + err);
//         }
//         return autoCallback(err);
//       });
//     },
//     //检查2小时内未确认的司机运单，并删除
//     repealDriverOrder: ['checkTimeout', function (autoCallback) {
//       checkSecondUnConfirmOrder(function (err) {
//         if (err) {
//           console.log('sencond check unconfirm over err' + err);
//         }
//
//         return autoCallback(err);
//       });
//     }]
//
//   }, function (err, result) {
//     return callback(err);
//   });
// }
//
// //30秒一次
// function startCheckOrderConfirmClock() {
//   console.log('##### timer ** confirm order ** clock #####');
//
//   setTimeout(function () {
//     startCheckOrderConfirm(function (err) {
//       startCheckOrderConfirmClock();
//     });
//   }, 30 * 1000);
// }
//
// exports.startCheckOrderConfirmClock = function () {
//   //setTimeout(function () {
//   //  console.log('*** start confirm order clock ****');
//   //  startCheckOrderConfirmClock();
//   //}, 1000 * 20);
// };