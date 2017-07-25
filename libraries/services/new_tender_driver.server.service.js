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
  Truck = appDb.model('Truck'),
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
exports.grabAndReturnTender = function (driverId, tender, callback) {
  that.grab(driverId, tender, true, function (err, result) {
    return callback(err, result);
  })
};

exports.grab = function (driverId, tender, isReturnTender, callback) {

  Tender.update({
    _id: tender._id,
    status: 'unStarted'
  }, {
    $set: {
      winner_price: tender.current_grab_price || 0,
      driver_winner: driverId,
      status: 'unAssigned',
      winner_time: new Date()
    }
  }, function (err, count) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Tender.findOne({_id: tender._id}, function (err, tender) {
      if (err || !tender) {
        console.log(err);
        return callback({err: error.system.db_error});
      }
      console.log('driver grab :' + driverId + ' tender :' + tender.order_number);
      if (tender.driver_winner.toString() != driverId.toString()) {
        console.log('failed');
        return callback({err: error.business.tender_grab_failed})
      }
      console.log('success');
      if (isReturnTender) {
        return callback(null, tender);

      }
      else {
        return callback(null, {success: true});
      }
    });
  });
};

exports.compare = function (currentDriver, currentTender, info, callback) {
  var price = info.price || 0;
  var price_per_ton = info.price_per_ton || 0;

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

    if (!tenderRecord) {
      tenderRecord = new TenderRecorder({
        tender: currentTender._id,
        driver: currentDriver._id,
      });
    }
    tenderRecord.price = price;
    tenderRecord.price_per_ton = price_per_ton;

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
          return callback(null, {success: true, tender: currentTender});
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
    start_time: {$lte: new Date()}
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
          goods: tender.mobile_goods,
          lowest_tons_count: tender.lowest_tons_count
        });

        newOrder.save(function (err, driverOrder) {
          console.log(JSON.stringify(err));
          console.log(driverOrder);
          if (err || !driverOrder) {
            return callback({err: error.system.db_error});
          }
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

  var tenderQuery = {
    $or: [
      {driver_winner: driver._id, status: {$in: ['comparing', 'compareEnd', 'unAssigned']}},
      {
        status: 'comparing',
        'tender_records.driver': driver._id
      }
    ]
  };

  var orderQuery = {
    execute_driver: driver._id,
    status: {$ne: 'completed'}

  };
  Tender.count(tenderQuery, function (err, tenderCount) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Order.count(orderQuery, function (err, orderCount) {
      if (err) {
        return callback({err: error.system.db_error});
      }
      return callback(null, {tender_count: tenderCount, order_count: orderCount});
    });
  });
};

exports.updateDriverProfile = function (currentDriver, profile, callback) {
  // 车辆照片
  // if (!profile.truck_photo) {
  //   return callback({err: {type: 'truck_photo is empty'}});
  // }
  // //身份证照片
  // if (!profile.id_card_photo) {
  //   return callback({err: {type: 'id_card_photo is empty'}});
  // }
  //
  // //银行卡照片
  // if (!profile.bank_number_photo) {
  //   return callback({err: {type: 'bank_number_photo is empty'}});
  // }
  //
  // // 驾驶证照片
  // if (!profile.driving_id_photo) {
  //   return callback({err: {type: 'driving_id_photo is empty'}});
  // }
  //
  // // 行驶证照片
  // if (!profile.travel_id_photo) {
  //   return callback({err: {type: 'travel_id_photo is empty'}});
  // }
  //
  // // 车牌号照片
  // if (!profile.plate_photo) {
  //   return callback({err: {type: 'plate_photo is empty'}});
  // }
  // // 装车单照片
  // if (!profile.truck_list_photo) {
  //   return callback({err: {type: 'plate_photo is empty'}});
  // }

  if (profile.id_card_photo)
    currentDriver.id_card_photo = profile.id_card_photo;
  if (profile.truck_photo)
    currentDriver.truck_photo = profile.truck_photo;
  if (profile.bank_number_photo)
    currentDriver.bank_number_photo = profile.bank_number_photo;

  if (profile.bank_number)
    currentDriver.bank_number = profile.bank_number;

  if (profile.bank_name)
    currentDriver.bank_name = profile.bank_name;

  if (profile.bank_username)
    currentDriver.bank_username = profile.bank_username;

  if (profile.driving_id_photo)
    currentDriver.driving_id_photo = profile.driving_id_photo;
  if (profile.travel_id_photo)
    currentDriver.travel_id_photo = profile.travel_id_photo;
  if (profile.plate_photo)
    currentDriver.plate_photo = profile.plate_photo;
  if (profile.truck_list_photo)
    currentDriver.truck_list_photo = profile.truck_list_photo;
  if (profile.truck_number)
    currentDriver.truck_number = profile.truck_number;
  

  if (profile.nickname)
    currentDriver.nickname = profile.nickname;

  if (profile.truck_type)
    currentDriver.truck_type = profile.truck_type;

  if (profile.photo)
    currentDriver.photo = profile.photo;

  if (profile.id_card_number)
    currentDriver.id_card_number = profile.id_card_number;

  currentDriver.verify_status = 'unVerifyPassed';
  currentDriver.save(function (err, saveDriver) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    Truck.update({driver: saveDriver._id}, {
      $set: {
        truck_type: saveDriver.truck_type,
        truck_number: saveDriver.truck_number,
        driver_name: saveDriver.nickname
      }
    }, function (err) {
      if (err) {
        return callback({err: error.system.db_error});
      }
      return callback(null, {success: true, driver: saveDriver});
    });
  });
};

exports.getDriverProfile = function (currentDriver, callback) {
  return callback(null, {id_card_number: currentDriver.id_card_number, bank_number: currentDriver.bank_number});
};

exports.searchDrivers = function (currentDriver, keyword, callback) {
  Truck.find({owner: currentDriver._id}, function (err, trucks) {
    if (err || !trucks) {
      return callback({err: error.system.db_error});
    }
    var ids = [];
    async.each(trucks, function (truck, eachCallback) {
      if (ids.indexOf(truck.driver.toString()))
        ids.push(truck.driver.toString());
      eachCallback();
    }, function () {
      Driver.find({_id: {$nin: ids}, $or: [{username: new RegExp(keyword)}, {truck_number: new RegExp(keyword)}]})
        .limit(10)
        .exec(function (err, drivers) {
          if (err || !drivers) {
            return callback({err: error.system.db_error});
          }
          return callback(null, {drivers: drivers})
        })
    });
  });
};

exports.addDriversToOwner = function (currentDriver, driver, callback) {
  Truck.findOne({driver: driver._id, owner: currentDriver}, function (err, truck) {
    if (err) {
      return callback({err: error.system.db_error});
    }

    if (truck) {
      return callback({err: {type: 'driver_has_added'}});
    }

    truck = new Truck({
      truck_number: driver.truck_number,
      truck_type: driver.truck_type,
      owner: currentDriver._id,
      driver: driver._id,
      driver_number: driver.username,
      driver_name: driver.nickname
    });

    truck.save(function (err, newTruck) {
      if (err || !newTruck) {
        return callback({err: error.system.db_error});
      }
      return callback(err, newTruck);
    });
  });
};

exports.addNewDriver = function (currentDriver, driverInfo, callback) {
  if (!driverInfo) {
    return callback({err: {type: 'truck_info_empty'}});
  }

  if (!driverInfo.driver_number) {
    return callback({err: {type: 'driver_number_empty'}});
  }

  if (!driverInfo.truck_number) {
    return callback({err: {type: 'truck_number_empty'}});
  }

  if (!driverInfo.truck_type) {
    return callback({err: {type: 'truck_type_empty'}});
  }

  Driver.findOne({username: driverInfo.driver_number}, function (err, driver) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (driver) {
      return callback({err: {type: 'driver_has_existed'}});
    }
    driver = new Driver();
    driver.username = driverInfo.driver_number;
    driver.password = driver.hashPassword('111111');
    driver.nickname = driverInfo.nickname;
    driver.truck_number = driverInfo.truck_number;
    driver.truck_type = driverInfo.truck_type;
    driver.photo = driverInfo.photo;

    driver.save(function (err, saveDriver) {
      if (err || !saveDriver) {
        return callback({err: error.system.db_error});
      }
      var truck = new Truck({
        truck_number: driverInfo.truck_number,
        truck_type: driverInfo.truck_type,
        owner: currentDriver._id,
        driver: saveDriver._id,
        driver_number: saveDriver.username,
        driver_name: saveDriver.nickname
      });
      truck.save(function (err, saveTruck) {
        if (err) {
          return callback({err: error.system.db_error});
        }
        return callback(null, saveTruck);
      });
    });
  });
};

exports.getAllDrivers = function (status, callback) {
  var array = ['verifyPassed', 'unVerifyPassed'];
  if (array.indexOf(status) < 0) {
    return callback({err: {type: 'invalid_verify_status'}});
  }

  Driver.find({verify_status: status}, function (err, results) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    return callback(null, results);
  });
};

exports.verifyDriver = function (curDriver, status, callback) {
  var array = ['verifyPassed', 'unVerifyPassed'];
  if (array.indexOf(status) < 0) {
    return callback({err: {type: 'invalid_verify_status'}});
  }

  curDriver.verify_status = status;
  curDriver.save(function (err, result) {
    if (err || !result) {
      return callback({err: error.system.db_error});
    }
    return callback(null, result);
  });
};
