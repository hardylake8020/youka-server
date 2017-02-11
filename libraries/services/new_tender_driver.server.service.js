/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all'),
  dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment'),
  Promise = require('promise'),
  Excel = require('exceljs');

var appDb = require('../mongoose').appDb,
  Tender = appDb.model('Tender'),
  Driver = appDb.model('Driver'),
  Contact = appDb.model('Contact'),
  Order = appDb.model('Order'),
  TenderRecorder = appDb.model('TenderRecorder'),
  TransportEvent = appDb.model('TransportEvent'),
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;


exports.grab = function (currentDriver, tenderId, callback) {
  Tender.update({
    _id: tenderId,
    status: 'unStarted'
  }, {$set: {driver_winner: currentDriver._id, status: 'unAssigned', winner_time: new Date()}}, function (err, count) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Tender.findOne({_id: tenderId}, function (err, tender) {
      if (err || !tender) {
        console.log(err);
        return callback({err: error.system.db_error});
      }
      console.log('driver grab :' + currentDriver.username + ' tender :' + tender.order_number);
      if (tender.driver_winner.toString() != currentDriver._id.toString()) {
        console.log('failed');
        return callback({err: error.business.tender_grab_failed})
      }
      console.log('success');
      return callback(null, {success: true});
    });
  });
};

exports.compare = function (currentDriver, currentTender, price, callback) {
  if (currentTender.status != 'comparing') {
    return callback({err: {type: 'tender_status_valid'}});
  }

  if (currentTender.highest_protect_price < price) {
    return callback({err: {type: 'price_invalid'}});
  }

  TenderRecorder.findOne({tender: currentTender._id, driver: currentDriver._id}, function (err, tenderRecord) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (tenderRecord) {
      return callback({err: {type: 'has_compared'}});
    }
    tenderRecord = new TenderRecorder({
      tender: currentTender._id,
      driver: currentDriver._id,
      price: price
    });
    tenderRecord.save(function (err, saveTenderRecord) {
      if (err || !saveTenderRecord) {
        return callback({err: error.system.db_error});
      }

      TenderRecorder.find({tender: currentTender._id}, function (err, tenderRecords) {
        if (err || !tenderRecords) {
          return callback({err: error.system.db_error});
        }
        currentTender.tender_records = tenderRecords;
        currentTender.markModified('tenderRecords');
        currentTender.save(function (err, saveTender) {
          if (err || !saveTender) {
            return callback({err: error.system.db_error});
          }
          return callback(null, {success: true});
        });
      });
    });

  });

};

exports.getStartedListByDriver = function (currentDriver, condition, callback) {
  var query = {status: condition.status, driver_winner: currentDriver._id};
  if (condition.status == 'unAssigned') {
    query = {
      $or: [
        {status: 'unAssigned', driver_winner: currentDriver._id},
        {status: 'unAssigned', 'tender_records.driver': currentDriver._id},
        {
          status: 'comparing',
          'tender_records.driver': currentDriver._id
        }
      ]
    };
  }

  async.auto({
    getCount: function (countCallback) {
      Tender.count(query).exec(function (err, totalCount) {
        if (err) {
          return countCallback({err: error.system.db_error});
        }
        return countCallback(null, totalCount);
      });
    },
    getData: ['getCount', function (dataCallback, result) {
      if (!result.getCount) {
        return dataCallback(null, []);
      }
      Tender.find(query)
        .populate('driver_winner')
        .skip(condition.currentCount || 0)
        .limit(condition.limit)
        .sort(condition.sort)
        .exec(function (err, tenders) {
          if (err) {
            return dataCallback({err: error.system.db_error});
          }
          return dataCallback(null, tenders);
        });
    }]
  }, function (err, result) {
    if (err) {
      console.log(err);
      return callback(err);
    }

    return callback(null, {
      totalCount: result.getCount,
      currentPage: condition.currentPage,
      limit: condition.limit,
      tenders: result.getData
    });
  });
};


exports.getUnStartedListByDriver = function (currentDriver, condition, callback) {
  var query = {
    status: {$in: ['unStarted', 'comparing']},
    'tender_records.driver': {$ne: currentDriver._id},
    start_time:{$lte:new Date()}
  };
  if (condition.pickupAddress) {
    query.pickup_address = new RegExp(condition.pickupAddress, "i")
  }

  if (condition.deliveryAddress) {
    query.delivery_address = new RegExp(condition.deliveryAddress, "i")
  }

  // if (condition.tenderType) {
  //   query.tender_type = condition.tenderType;
  // }

  async.auto({
    getCount: function (countCallback) {
      Tender.count(query).exec(function (err, totalCount) {
        if (err) {
          return countCallback({err: error.system.db_error});
        }
        return countCallback(null, totalCount);
      });
    },
    getData: ['getCount', function (dataCallback, result) {
      if (!result.getCount) {
        return dataCallback(null, []);
      }
      Tender.find(query)
        .skip(condition.currentCount || 0)
        .limit(condition.limit)
        .sort(condition.sort)
        .exec(function (err, tenders) {
          if (err) {
            return dataCallback({err: error.system.db_error});
          }
          return dataCallback(null, tenders);
        });
    }]
  }, function (err, result) {
    if (err) {
      console.log(err);
      return callback(err);
    }

    return callback(null, {
      totalCount: result.getCount,
      currentPage: condition.currentPage,
      limit: condition.limit,
      tenders: result.getData
    });
  });
};

exports.getEventByTender = function (currentTender, callback) {
  if (!currentTender.order) {
    return callback({err: error.system.db_error});
  }

  TransportEvent
    .find({order: currentTender.order._id})
    .populate('driver')
    .sort({time: -1})
    .exec(function (err, transportEvents) {
      if (err) {
        return callback({err: error.system.db_error});
      }
      return callback(err, {transport_events: transportEvents});
    });
};

exports.assignDriver = function (currentTender, card, truck, callback) {
  if (currentTender.status != 'unAssigned') {
    return callback({err: {type: '订单状态无效'}});
  }

  if (!truck.driver) {
    return callback({err: {type: 'truck_not_assigned_driver'}});
  }

  if (truck.card) {
    return callback({err: {type: 'truck_is_in_use'}});
  }

  if (card.truck) {
    return callback({err: {type: 'card_is_in_use'}});
  }

  assignDriver(currentTender, truck.driver_number, card, truck, function (err, result) {
    if (err) {
      return callback(err);
    }

    currentTender.truck_number = truck.truck_number;
    currentTender.card = card._id;
    currentTender.truck = truck._id;
    currentTender.execute_driver = result.driver.toJSON();
    currentTender.status = 'inProgress';
    currentTender.order = result.order;
    currentTender.save(function (err, tender) {
      if (err || !tender) {
        return callback({err: error.system.db_error});
      }
      return callback(null, tender);
    });
  });
};

function assignDriver(tender, driverNumber, card, truck, callback) {
  //提货收获的联系人必须由外界传进来
  async.auto({
      driver: function (autoCallback) {
        Driver.findOne({username: driverNumber}, function (err, driver) {
          if (err) {
            return autoCallback({err: error.system.db_error});
          }
          if (!driver) {
            return autoCallback({err: {type: 'driver_id_invalid'}});
          }
          return autoCallback(null, driver);
        });
      },
      card: function (autoCallback) {
        card.truck = truck._id;
        card.truck_number = truck.truck_number;
        card.save(function (err, card) {
          if (err || !card) {
            return autoCallback({err: error.system.db_error});
          }
          return autoCallback();
        });
      },
      truck: function (autoCallback) {
        truck.card = card._id;
        truck.card_number = card.number;
        truck.save(function (err, truck) {
          if (err || !card) {
            return autoCallback({err: error.system.db_error});
          }
          return autoCallback();
        });
      },
      pickupContact: function (autoCallback) {
        var newPickupContact = new Contact({
          name: tender.pickup_name,
          phone: tender.pickup_tel_phone,
          mobile_phone: tender.pickup_mobile_phone,
          address: tender.pickup_address,
          location: tender.pickup_location
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
          name: tender.delivery_name,
          phone: tender.delivery_tel_phone,
          mobile_phone: tender.delivery_mobile_phone,
          address: tender.delivery_address,
          location: tender.delivery_location
        });

        deliveryContact.save(function (err, deliveryContactEntity) {
          if (err || !deliveryContactEntity) {
            return autoCallback({err: error.system.db_error});
          }

          return autoCallback(err, deliveryContactEntity);
        });
      },
      order: ['pickupContact', 'deliveryContact', 'driver', 'card', 'truck', function (autoCallback, results) {
        var pickupContact = results.pickupContact;
        var deliveryContact = results.deliveryContact;
        var driver = results.driver;

        delete driver._doc.password;
        delete driver._doc.salt;
        var execute_drivers = [];
        execute_drivers.push(driver.toJSON());


        var newOrder = new Order({
          order_number: tender.order_number,
          refer_order_number: tender.refer_order_number,
          parent_order: null,
          status: 'unPickupSigned', //分配给司机，则订单变为unPickupSigned
          create_company: tender.create_company,
          create_user: tender.create_user,
          execute_driver_object: driver.toJSON(),
          execute_driver: driver._id,
          execute_drivers: execute_drivers,
          pickup_start_time: tender.pickup_start_time,
          pickup_end_time: tender.pickup_end_time,
          delivery_start_time: tender.delivery_start_time,
          delivery_end_time: tender.delivery_end_time,
          pickup_contacts: pickupContact,
          delivery_contacts: deliveryContact,
          type: 'driver',
          sender_name: tender.sender_company,
          tender: tender,
          pickup_entrance_force: true,
          pickup_photo_force: true,
          delivery_entrance_force: true,
          delivery_photo_force: true,
          goods: tender.mobile_goods
        });

        newOrder.save(function (err, driverOrder) {
          console.log(JSON.stringify(err));
          console.log(driverOrder);
          if (err || !driverOrder) {
            return callback({err: error.system.db_error});
          }

          // if (driverOrder.is_wechat) {
          //   wechatLib.pushNewOrderMessageToWechat(driver.wechat_profile.openid, driver._id, driverOrder);
          // }
          // else if (driver.device_id || driver.device_id_ios) {
          //   driverOrder._doc.order_detail = order.order_details;
          //   driverOrder._doc.pickup_contact = pickupContact;
          //   driverOrder._doc.delivery_contact = deliveryContact;
          //   pushSingleAssignToDriver(driver, driverOrder);
          // }
          return autoCallback(err, {order: driverOrder, driver: driver});
        });
      }]
    },
    function (err, results) {
      if (err)
        return callback(err);

      return callback(err, results.order);
    }
  );
}

exports.getDashboardData = function (driver, callback) {
  Tender.count({driver_winner: driver._id, status: {$ne: 'completed'}}, function (err, tenderCount) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Order.count({execute_driver: driver._id, status: {$ne: 'completed'}}, function (err, orderCount) {
      if (err) {
        return callback({err: error.system.db_error});
      }
      return callback(null, {tender_count: tenderCount, order_count: orderCount});
    });
  });
};

