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
  BidRecord = appDb.model('BidRecord');

var bidderService = require('./bidder'),
  bidRecordService = require('./bid_record'),
  groupService = require('./group'),
  orderService = require('./order'),
  driverService = require('./driver');

var that = exports;

function checkTruckType(type) {
  var truckTypes = ['金杯车', '4.2米', '6.8米', '7.6米', '9.6前四后四', '9.6前四后八', '12.5米', '14.7米', '16.5米', '17.5米'];
  if (!type || truckTypes.indexOf(type) === -1) {
    return false;
  }
  return true;
}
function checkGoods(goods) {
  if (!goods || !Array.isArray(goods) || goods.length <= 0) {
    return false;
  }
  var result = true;
  for (var i = 0; i < goods.length; i++) {
    if (!goods[i].name) {
      result = false;
      break;
    }
  }
  return result;
}

function generateQueryCondition(query, searchArray, userId) {
  if (!searchArray || !Array.isArray(searchArray) || searchArray.length === 0 || !query) {
    return;
  }

  query.$and.push({create_user: userId});

  var isSetStatus = false;
  searchArray.forEach(function (searchItem) {
    switch (searchItem.key) {
      case 'order_number':
        if (searchItem.value) {
          query.$and.push({
            $or: [{
              'order_number': {$regex: searchItem.value, $options: 'i'}
            },
              {'refer_order_number': {$regex: searchItem.value, $options: 'i'}}
            ]
          });
        }
        break;
      case 'status':
        if (searchItem.value && Array.isArray(searchItem.value) && searchItem.value.length > 0) {
          isSetStatus = true;
          query.$and.push({'status': {$in: searchItem.value}});
        }
        break;
      default:
        break;
    }
  });

  if (!isSetStatus) {
    query.$and.push({status: {$nin: ['deleted', 'obsolete']}});
  }
}
function getSortCondition(sort) {
  sort = sort || {};
  var result = {'created': -1};
  switch (sort.name) {
    case 'order_number':
      result = {'order_number': sort.value};
      break;
    case 'start_time':
      result = {'start_time': sort.value};
      break;
    case 'end_time':
      result = {'end_time': sort.value};
      break;
    default:
      break;
  }
  return result;
}
function getOneByCondition(condition, callback) {
  Tender.findOne(condition || {}).populate('order driver_winner').exec(function (err, findTender) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    if (!findTender) {
      return callback({err: error.business.tender_not_exist});
    }
    return callback(null, findTender);
  });
}

function startTender(tenderItem, callback) {
  //查找要指定的中介
  //发送微信推送
  //创建竞标纪录
  //修改标书：接收中介，状态
  //回调
  console.log('=== start tender ' + tenderItem.order_number + ' =====');

  async.auto({
    recordBid: function (recordCallback, result) {
      bidRecordService.startRecord(tenderItem, function (err) {
        return recordCallback(err);
      });
    },
    updateTender: ['recordBid', function (updateCallback) {
      tenderItem.status = 'inProgress';
      tenderItem.save(function (err, saveTender) {
        if (err || !saveTender) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return updateCallback(err, saveTender);
      });

    }]
  }, function (err, result) {

    return callback(err);
  });
}
function endTender(tenderItem, callback) {
  //查找已指定的中介
  //发送微信推送
  //修改竞标纪录
  //修改标书：接收中介，状态
  //回调

  console.log('=== end tender ' + tenderItem.order_number + ' =====');

  async.auto({
    recordBid: function (recordCallback, result) {
      bidRecordService.endRecord(tenderItem, function (err, records) {
        return recordCallback(err, records);
      });
    },
    updateTender: ['recordBid', function (updateCallback, result) {

      tenderItem.status = 'stop'; //已截止
      tenderItem.save(function (err, saveTender) {
        if (err || !saveTender) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return updateCallback(err, saveTender);
      });

    }]
  }, function (err, result) {
    return callback(err);
  });
}
function terminalTender(tenderItem, callback) {
  //查找报价最低的中介
  //有中介，选择中标人，推送信息
  //无中介，推送信息

  console.log('=== terminal tender ' + tenderItem.order_number + ' =====');

  async.auto({
    findLowestPriceBidderRecord: function (autoCallback) {
      bidRecordService.getLowestPriceBidderRecordByTenderId(tenderItem._id, function (err, bidder) {
        return autoCallback(err, bidder);
      });
    },
    completeTender: ['findLowestPriceBidderRecord', function (autoCallback, result) {
      if (!result.findLowestPriceBidderRecord) {
        return autoCallback();
      }

      var params = {
        tenderId: result.findLowestPriceBidderRecord.tender,
        bidderId: result.findLowestPriceBidderRecord.bidder,
        bidRecordId: result.findLowestPriceBidderRecord._id,
        price: result.findLowestPriceBidderRecord.current_price
      };

      that.applyBidder(params, function (err) {
        return autoCallback(err);
      });

    }],
    obsoleteTender: ['findLowestPriceBidderRecord', 'completeTender', function (autoCallback, result) {
      if (result.findLowestPriceBidderRecord) {
        return autoCallback();
      }

      //obsolete
      async.auto({
        recordBid: function (subAutoCallback, result) {
          bidRecordService.obsoleteRecord(tenderItem, function (err, records) {
            return subAutoCallback(err, records);
          });
        },
        updateTender: ['recordBid', function (subAutoCallback, result) {
          tenderItem.status = 'obsolete'; //已过时
          tenderItem.save(function (err, saveTender) {
            if (err || !saveTender) {
              console.log(err);
              err = {err: error.system.db_error};
            }
            return subAutoCallback(err, saveTender);
          });

        }]

      }, function (err, result) {
        return autoCallback(err);
      });
    }]

  }, function (err, result) {
    return callback(err);
  });

}

function startUnStartedPartTender(callback) {
  var now = new Date();

  async.auto({
    findTender: function (findCallback) {
      Tender.find({status: 'unStarted', start_time: {$lte: now}})
        .sort({start_time: 1})
        .limit(10)
        .exec(function (err, data) {
          if (err) {
            console.log(err);
            err = {err: error.all.system.db_error};
          }
          return findCallback(err, data);
        });
    },
    startTender: ['findTender', function (startCallback, result) {
      if (result.findTender && result.findTender.length > 0) {
        async.each(result.findTender, function (tenderItem, itemCallback) {
          //标书已过期
          if (now.greaterThan(tenderItem.end_time)) {
            endTender(tenderItem, function (err) {
              return itemCallback(err);
            });
          }
          else {
            startTender(tenderItem, function (err) {
              return itemCallback(err);
            });
          }

        }, function (err) {
          return startCallback(err);
        });
      }
      else {
        return startCallback();
      }
    }]
  }, function (err, result) {
    return callback(err);
  });
}
function endInProgressPartTender(callback) {
  var now = new Date();

  async.auto({
    findTender: function (findCallback) {
      Tender.find({status: 'inProgress', end_time: {$lte: now}})
        .sort({end_time: 1})
        .limit(10)
        .exec(function (err, data) {
          if (err) {
            console.log(err);
            err = {err: error.all.system.db_error};
          }
          return findCallback(err, data);
        });
    },
    endTender: ['findTender', function (startCallback, result) {
      if (result.findTender && result.findTender.length > 0) {
        async.each(result.findTender, function (tenderItem, itemCallback) {
          //标书已过期
          endTender(tenderItem, function (err) {
            return itemCallback(err);
          });

        }, function (err) {
          return startCallback(err);
        });
      }
      else {
        return startCallback();
      }
    }]
  }, function (err, result) {
    return callback(err);
  });
}

function terminalStopPartTender(callback) {
  var now = new Date();

  async.auto({
    findTender: function (findCallback) {
      Tender.find({status: 'stop', auto_close_time: {$lte: now}})
        .sort({auto_close_time: 1})
        .limit(10)
        .exec(function (err, data) {
          if (err) {
            console.log(err);
            err = {err: error.all.system.db_error};
          }
          return findCallback(err, data);
        });
    },
    terminalTender: ['findTender', function (terminalCallback, result) {
      if (result.findTender && result.findTender.length > 0) {
        async.each(result.findTender, function (tenderItem, itemCallback) {
          //标书已过期
          terminalTender(tenderItem, function (err) {
            return itemCallback(err);
          });

        }, function (err) {
          return terminalCallback(err);
        });
      }
      else {
        return terminalCallback();
      }
    }]
  }, function (err, result) {
    return callback(err);
  });

}

function startClock() {
  console.log('***** tender ** start ** clock *****');

  setTimeout(function () {
    startUnStartedPartTender(function (err) {

      startClock();
    });
  }, 60 * 1000);
}

//包含停止和终止
function endClock() {
  console.log('***** tender ** end ** terminal ** clock *****');

  setTimeout(function () {
    async.auto({
      endTender: function (autoCallback) {
        endInProgressPartTender(function (err) {
          console.log('endInProgressPartTender err: ' + JSON.stringify(err));
          return autoCallback();
        });
      },
      terminalTender: function (autoCallback) {
        terminalStopPartTender(function (err) {
          console.log('terminalStopPartTender err: ' + JSON.stringify(err));
          return autoCallback();
        });
      }
    }, function (err, result) {
      endClock();
    });

  }, 60 * 1000);
}

function startPickupBreachTender(callback) {
  async.auto({
    orderIds: function (autoCallback) {
      orderService.queryDeferPickupOrderForTender(10, function (err, orderIds) {
        return autoCallback(err, orderIds);
      });
    },
    tenders: ['orderIds', function (autoCallback, result) {
      //以bidder来分组
      if (!result.orderIds || result.orderIds.length === 0) {
        return autoCallback(null, []);
      }

      console.log('---- defer pickup order ---' + result.orderIds);


      Tender.find({
        status: 'completed',
        order: {$in: result.orderIds},
        bidder_winner: {$exists: true},
        pickup_breach: false
      }, function (err, tenders) {
        if (err) {
          return autoCallback({err: error.system.db_error});
        }
        if (!tenders || tenders.length === 0) {
          return autoCallback(null, []);
        }

        var tenderIds = tenders.map(function (item) {
          return item._id;
        });


        console.log('---- defer pickup tender ---' + tenderIds);

        Tender.update({_id: {$in: tenderIds}}, {
          $set: {
            pickup_breach: true,
            untreated_breach: false
          }
        }, {multi: true}, function (err, raw) {
          if (err) {
            return autoCallback({err: error.system.db_error});
          }

          var bidderObject = {};
          tenders.forEach(function (tenderItem) {
            if (!bidderObject[tenderItem.bidder_winner]) {
              bidderObject[tenderItem.bidder_winner] = [];
            }
            bidderObject[tenderItem.bidder_winner].push({
              _id: tenderItem._id.toString(),
              order_number: tenderItem.order_number
            });
          });
          var bidderTenders = [];
          for (var pro in bidderObject) {
            bidderTenders.push({
              bidderId: pro,
              tenders: bidderObject[pro]
            });
          }
          return autoCallback(null, bidderTenders);

        });

      });
    }],
    updateBidder: ['tenders', function (autoCallback, result) {
      if (!result.tenders || result.tenders.length === 0) {
        return autoCallback(null, []);
      }
      bidderService.breach(result.tenders, 'pickup', function (err) {
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });
}
function startDeliveryBreachTender(callback) {
  async.auto({
    orderIds: function (autoCallback) {
      orderService.queryDeferDeliveryOrderForTender(10, function (err, orderIds) {
        return autoCallback(err, orderIds);
      });
    },
    tenders: ['orderIds', function (autoCallback, result) {
      //以bidder来分组
      if (!result.orderIds || result.orderIds.length === 0) {
        return autoCallback(null, []);
      }
      console.log('---- defer delivery order ---' + result.orderIds);

      Tender.find({
        status: 'completed',
        order: {$in: result.orderIds},
        bidder_winner: {$exists: true},
        delivery_breach: false
      }, function (err, tenders) {
        if (err) {
          return autoCallback({err: error.system.db_error});
        }
        if (!tenders || tenders.length === 0) {
          return autoCallback(null, []);
        }

        var tenderIds = tenders.map(function (item) {
          return item._id;
        });
        console.log('---- defer delivery tender ---' + tenderIds);

        Tender.update({_id: {$in: tenderIds}}, {
          $set: {
            delivery_breach: true,
            untreated_breach: false
          }
        }, {multi: true}, function (err, raw) {
          if (err) {
            return autoCallback({err: error.system.db_error});
          }

          var bidderObject = {};
          tenders.forEach(function (tenderItem) {
            if (!bidderObject[tenderItem.bidder_winner]) {
              bidderObject[tenderItem.bidder_winner] = [];
            }
            bidderObject[tenderItem.bidder_winner].push({
              _id: tenderItem._id.toString(),
              order_number: tenderItem.order_number
            });
          });
          var bidderTenders = [];
          for (var pro in bidderObject) {
            bidderTenders.push({
              bidderId: pro,
              tenders: bidderObject[pro]
            });
          }
          return autoCallback(null, bidderTenders);

        });

      });

    }],
    updateBidder: ['tenders', function (autoCallback, result) {
      if (!result.tenders || result.tenders.length === 0) {
        return autoCallback(null, []);
      }
      bidderService.breach(result.tenders, 'delivery', function (err) {
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });
}


function startPickupClock() {
  console.log('##### tender ** pickup-breach ** clock #####');

  setTimeout(function () {
    startPickupBreachTender(function (err) {

      startPickupClock();
    });
  }, 60 * 1000);
}

function startDeliveryClock() {
  console.log('##### tender ** delivery-breach ** clock #####');

  setTimeout(function () {
    startDeliveryBreachTender(function (err) {

      startDeliveryClock();
    });
  }, 60 * 1000);
}

//处理违约
function handleBreach(bidderId, isDeducted, callback) {
  if (!bidderId) {
    return callback({err: error.params.invalid});
  }

  async.auto({
    tenders: function (autoCallback) {

      Tender.find({
        bidder_winner: bidderId,
        $or: [{pickup_breach: true}, {delivery_breach: true}],
        untreated_breach: false
      }, function (err, tenders) {
        if (err) {
          return autoCallback({err: error.system.db_error});
        }
        if (!tenders || tenders.length === 0) {
          return autoCallback(null, []);
        }

        return autoCallback(null, tenders.map(function (item) {
          return {_id: item._id.toString(), order_number: item.order_number}
        }));
      });

    },
    update: ['tenders', function (autoCallback, result) {
      if (!result.tenders || result.tenders.length === 0) {
        return autoCallback();
      }
      else {

        var tenderIds = result.tenders.map(function (item) {
          return item._id;
        });

        var updateFiled = {untreated_breach: true};
        if (isDeducted) {
          updateFiled.breach_deducted = true;
        }

        Tender.update(
          {
            _id: {$in: tenderIds}
          },
          {
            $set: updateFiled
          },
          {
            multi: true
          },
          function (err, raw) {
            if (err) {
              err = {err: error.system.db_error};
            }
            return autoCallback(err);
          });
      }
    }]
  }, function (err, result) {

    return callback(err, result.tenders);

  });
}


exports.create = function (currentUser, tenderInfo, callback) {
  that.checkTenderInfo(tenderInfo, function (err) {
    if (err) {
      return callback(err);
    }

    async.auto({
      oldTender: function (oldCallback) {
        if (tenderInfo.tender_id) {
          Tender.findOne({_id: tenderInfo.tender_id}, function (err, oldData) {
            if (err) {
              return oldCallback({err: error.system.db_error});
            }
            if (!oldData) {
              return oldCallback({err: error.business.tender_not_exist});
            }
            if (oldData.status !== 'unStarted') {
              return oldCallback({err: error.business.tender_can_not_modify});
            }
            return oldCallback(null, oldData);
          });
        }
        else {
          return oldCallback();
        }
      },
      saveTender: ['oldTender', function (saveCallback, result) {
        var newTender = result.oldTender;
        if (!newTender) {
          newTender = new Tender();
        }

        newTender.mobile_goods = [];
        if (tenderInfo.goods && Array.isArray(tenderInfo.goods) && tenderInfo.goods.length) {
          for (var i = 0; i < tenderInfo.goods.length; i++) {
            newTender.mobile_goods.push(
              {
                "name": tenderInfo.goods[i].name,
                "count": isNaN(parseInt(tenderInfo.goods[i].count)) ? 0 : parseInt(tenderInfo.goods[i].count),
                "unit": tenderInfo.goods[i].unit,
                "count2": isNaN(parseInt(tenderInfo.goods[i].count2)) ? 0 : parseInt(tenderInfo.goods[i].count2),
                "unit2": tenderInfo.goods[i].unit2,
                "count3": isNaN(parseInt(tenderInfo.goods[i].count3)) ? 0 : parseInt(tenderInfo.goods[i].count3),
                "unit3": tenderInfo.goods[i].unit3,
                "price": isNaN(parseInt(tenderInfo.goods[i].price)) ? 0 : parseInt(tenderInfo.goods[i].price)
              }
            )
          }
        }

        newTender.order_number = tenderInfo.order_number;
        newTender.refer_order_number = tenderInfo.refer_order_number || '';

        newTender.sender_company = tenderInfo.sender_company || '';
        newTender.pay_approver = tenderInfo.pay_approver || '';
        newTender.finance_officer = tenderInfo.finance_officer || '';

        newTender.start_time = tenderInfo.start_time;
        newTender.end_time = tenderInfo.end_time;
        newTender.salesmen = tenderInfo.salesmen;
        newTender.goods = tenderInfo.goods;
        newTender.truck_type = tenderInfo.truck_type;
        newTender.truck_count = tenderInfo.truck_count;
        newTender.remark = tenderInfo.remark || '';
        newTender.auto_close_duration = tenderInfo.auto_close_duration;

        newTender.pickup_start_time = tenderInfo.pickup_start_time;
        newTender.pickup_end_time = tenderInfo.pickup_end_time;
        newTender.pickup_province = tenderInfo.pickup_contact_province;
        newTender.pickup_city = tenderInfo.pickup_contact_city;
        newTender.pickup_region = tenderInfo.pickup_contact_region || '';
        newTender.pickup_region_location = tenderInfo.pickup_contact_region_location || [];
        newTender.pickup_street = tenderInfo.pickup_contact_street;
        newTender.pickup_name = tenderInfo.pickup_contact_name;
        newTender.pickup_mobile_phone = tenderInfo.pickup_contact_mobile_phone;
        newTender.pickup_tel_phone = tenderInfo.pickup_contact_phone;

        newTender.delivery_start_time = tenderInfo.delivery_start_time;
        newTender.delivery_end_time = tenderInfo.delivery_end_time;
        newTender.delivery_province = tenderInfo.delivery_contact_province;
        newTender.delivery_city = tenderInfo.delivery_contact_city;
        newTender.delivery_region = tenderInfo.delivery_contact_region || '';
        newTender.delivery_region_location = tenderInfo.delivery_contact_region_location || [];
        newTender.delivery_street = tenderInfo.delivery_contact_street;
        newTender.delivery_name = tenderInfo.delivery_contact_name;
        newTender.delivery_mobile_phone = tenderInfo.delivery_contact_mobile_phone;
        newTender.delivery_tel_phone = tenderInfo.delivery_contact_phone;

        newTender.payment_top_rate = tenderInfo.top_rate;
        newTender.payment_top_cash_rate = tenderInfo.top_cash_rate;
        newTender.payment_top_card_rate = 100 - tenderInfo.top_cash_rate;

        newTender.payment_tail_rate = tenderInfo.tail_rate;
        newTender.payment_tail_cash_rate = tenderInfo.tail_cash_rate;
        newTender.payment_tail_card_rate = 100 - tenderInfo.tail_cash_rate;

        newTender.payment_last_rate = tenderInfo.last_rate;
        newTender.payment_last_cash_rate = tenderInfo.last_cash_rate;
        newTender.payment_last_card_rate = 100 - tenderInfo.last_cash_rate;

        newTender.assign_target = tenderInfo.assign_target;
        newTender.create_user = currentUser._id;
        // newTender.create_company = currentUser.company._id;

        newTender.lowest_protect_price = tenderInfo.lowest_protect_price;
        newTender.highest_protect_price = tenderInfo.highest_protect_price;
        newTender.tender_type = tenderInfo.tender_type;

        newTender.deposit = tenderInfo.deposit;
        newTender.lowest_grab_price = tenderInfo.lowest_grab_price;
        newTender.highest_grab_price = tenderInfo.highest_grab_price;
        newTender.grab_time_duration = tenderInfo.grab_time_duration;
        newTender.grab_increment_price = tenderInfo.grab_increment_price;
        newTender.current_grab_price = tenderInfo.current_grab_price;

        newTender.lowest_tons_count = tenderInfo.lowest_tons_count;
        newTender.highest_more_price_per_ton = tenderInfo.highest_more_price_per_ton;

        newTender.ya_jin = tenderInfo.ya_jin || 0;

        if (newTender.tender_type == 'compare') {
          if (newTender.start_time <= new Date()) {
            newTender.status = 'comparing';
          }
        }

        newTender.save(function (err, tenderEntity) {
          if (err) {
            console.log(err);
            return saveCallback({err: error.system.db_error});
          }
          return saveCallback(null, tenderEntity);
        });
      }],
      assignBidder: ['saveTender', function (assignCallback, result) {
        var isAll = result.saveTender.assign_target === 'all';
        bidderService.assignBidder(isAll, result.saveTender, function (err, bidders) {
          return assignCallback(err, bidders);
        });
      }],
      recordCount: ['saveTender', 'assignBidder', function (recordCallback, result) {
        getOneByCondition({_id: result.saveTender._id}, function (err, tenderEntity) {
          if (err) {
            return recordCallback(err);
          }

          tenderEntity.all_bidders = result.assignBidder;
          tenderEntity.save(function (err, saveEntity) {
            if (err) {
              console.log(err);
              err = {err: error.system.db_error};
            }
            return recordCallback(err, saveEntity);
          });
        });
      }]
    }, function (err, result) {
      return callback(err);
    });
  });
};


exports.checkTenderInfo = function (tenderInfo, callback) {
  var now = new Date();

  if (!tenderInfo) {
    return callback({err: error.business.tender_info_empty});
  }
  if (!tenderInfo.order_number) {
    return callback({err: error.business.order_number_empty});
  }

  if (!tenderInfo.start_time) {
    return callback({err: error.business.tender_start_time_empty});
  }
  if (!now.isDate(tenderInfo.start_time)) {
    return callback({err: error.business.tender_start_time_invalid});
  }
  if (!tenderInfo.end_time) {
    return callback({err: error.business.tender_end_time_empty});
  }
  if (!now.isDate(tenderInfo.end_time)) {
    return callback({err: error.business.tender_end_time_invalid});
  }
  if (now.compareTime(tenderInfo.start_time, tenderInfo.end_time)) {
    return callback({err: error.business.tender_end_time_less_start_time});
  }
  if (now.compareTime(now, tenderInfo.end_time)) {
    return callback({err: error.business.tender_end_time_less_now});
  }

  tenderInfo.salesmen = tenderInfo.salesmen || [];
  if (!Array.isArray(tenderInfo.salesmen)) {
    return callback({err: error.business.tender_salesman_invalid});
  }

  if (!checkTruckType(tenderInfo.truck_type)) {
    return callback({err: error.business.tender_truck_type_invalid});
  }
  tenderInfo.truck_count = parseFloat(tenderInfo.truck_count) || 0;
  if (tenderInfo.truck_count < 1) {
    return callback({err: error.business.tender_truck_count_invalid});
  }

  if (!checkGoods(tenderInfo.goods)) {
    return callback({err: error.business.tender_goods_invalid});
  }

  tenderInfo.auto_close_duration = parseInt(tenderInfo.auto_close_duration) || 0;
  if (tenderInfo.auto_close_duration < 1 || tenderInfo.auto_close_duration > 60) {
    return callback({err: error.business.tender_auto_close_duration_invalid});
  }

  if (!tenderInfo.pickup_contact_province || !tenderInfo.pickup_contact_city || !tenderInfo.pickup_contact_street) {
    return callback({err: error.business.tender_pickup_address_invalid});
  }
  if (!tenderInfo.delivery_contact_province || !tenderInfo.delivery_contact_city || !tenderInfo.delivery_contact_street) {
    return callback({err: error.business.tender_delivery_address_invalid});
  }
  if (tenderInfo.pickup_contact_mobile_phone && !tenderInfo.pickup_contact_mobile_phone.testPhone()) {
    return callback({err: error.business.tender_pickup_mobile_phone_invalid});
  }
  if (tenderInfo.delivery_contact_mobile_phone && !tenderInfo.delivery_contact_mobile_phone.testPhone()) {
    return callback({err: error.business.tender_delivery_mobile_phone_invalid});
  }

  if (!now.isDate(tenderInfo.pickup_start_time) || !now.isDate(tenderInfo.pickup_end_time)) {
    return callback({err: error.business.tender_pickup_time_empty});
  }
  if (!now.isDate(tenderInfo.delivery_start_time) || !now.isDate(tenderInfo.delivery_end_time)) {
    return callback({err: error.business.tender_delivery_time_empty});
  }
  if (now.compareTime(tenderInfo.start_time, tenderInfo.pickup_end_time)) {
    return callback({err: error.business.tender_pickup_time_less_start_time});
  }

  tenderInfo.top_rate = parseFloat(tenderInfo.top_rate) || 0;
  tenderInfo.tail_rate = parseFloat(tenderInfo.tail_rate) || 0;
  tenderInfo.last_rate = parseFloat(tenderInfo.last_rate) || 0;
  if (tenderInfo.top_rate + tenderInfo.tail_rate + tenderInfo.last_rate !== 100) {
    return callback({err: error.business.tender_payment_invalid});
  }

  tenderInfo.top_cash_rate = parseFloat(tenderInfo.top_cash_rate) || 0;
  tenderInfo.tail_cash_rate = parseFloat(tenderInfo.tail_cash_rate) || 0;
  tenderInfo.last_cash_rate = parseFloat(tenderInfo.last_cash_rate) || 0;
  if (tenderInfo.top_cash_rate < 0 || tenderInfo.top_cash_rate > 100
    || tenderInfo.tail_cash_rate < 0 || tenderInfo.tail_cash_rate > 100
    || tenderInfo.last_cash_rate < 0 || tenderInfo.last_cash_rate > 100) {
    return callback({err: error.business.tender_payment_invalid});
  }

  tenderInfo.lowest_protect_price = parseInt(tenderInfo.lowest_protect_price) || 0;
  tenderInfo.highest_protect_price = parseInt(tenderInfo.highest_protect_price) || 0;

  tenderInfo.lowest_grab_price = parseInt(tenderInfo.lowest_grab_price) || 0;
  tenderInfo.highest_grab_price = parseInt(tenderInfo.highest_grab_price) || 0;

  tenderInfo.grab_time_duration = parseInt(tenderInfo.grab_time_duration) || 0;
  tenderInfo.grab_increment_price = parseInt(tenderInfo.grab_increment_price) || 0;

  tenderInfo.current_grab_price = parseInt(tenderInfo.current_grab_price) || 0;
  if (tenderInfo.tender_type == 'assign') {
    if (!tenderInfo.driver_id) {
      return callback({err: {type: 'empty_driver_id'}});
    }

    if (!tenderInfo.card_id) {
      return callback({err: {type: 'empty_card_id'}});
    }

    if (!tenderInfo.truck_id) {
      return callback({err: {type: 'empty_truck_id'}});
    }
  }
  return callback();
};

exports.getListByUser = function (currentUser, condition, callback) {
  var query = {
    $or: [],
    $and: []
  };

  if (condition.created) {
    query.$and.push({created: condition.created});
  }
  generateQueryCondition(query, condition.searchArray, currentUser._id);

  if (query.$or.length === 0) {
    delete query.$or;
  }
  if (query.$and.length === 0) {
    delete query.$and;
  }

  var sort = getSortCondition(condition.sort);
  var skipCount = condition.limit * (condition.currentPage - 1);

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
        .skip(skipCount)
        .limit(condition.limit)
        .sort(sort)
        .populate('order driver_winner')
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

exports.getOneByUser = function (tenderId, callback) {
  if (!tenderId) {
    return res.send({err: error.params.empty});
  }
  getOneByCondition({_id: tenderId}, function (err, findTender) {
    if (err) {
      return callback(err);
    }

    if (findTender.status === 'deleted') {
      return callback({err: error.business.tender_has_deleted});
    }

    return callback(null, findTender);
  });
};

exports.deleteByUser = function (tenderId, callback) {
  if (!tenderId) {
    return res.send({err: error.params.empty});
  }
  getOneByCondition({_id: tenderId}, function (err, findTender) {
    if (err) {
      return callback(err);
    }

    if (findTender.status === 'deleted') {
      return callback({err: error.business.tender_has_deleted});
    }
    if (findTender.status !== 'unStarted') {
      return callback({err: error.business.tender_has_deleted});
    }


    findTender.status = 'deleted';
    findTender.save(function (err, saveTender) {
      if (err || !saveTender) {
        return callback({err: error.system.db_error});
      }
      return callback({success: true});
    });
  });

};

exports.startTenderClock = function () {
  setTimeout(function () {
    startClock();
  }, 0);

};
exports.endTenderClock = function () {
  setTimeout(function () {
    endClock();
  }, 1000 * 10);
};

//开启提货违约检查定时器
exports.startPickupBreachClock = function () {
  setTimeout(function () {
    startPickupClock();
  }, 1000 * 20);
};
//开启交货违约检查定时器
exports.startDeliveryBreachClock = function () {
  setTimeout(function () {
    startDeliveryClock();
  }, 1000 * 30);
};

//解除违约
exports.removeBreach = function (bidderId, callback) {
  handleBreach(bidderId, false, function (err, tenders) {
    return callback(err, tenders);
  });
};
//违约扣款
exports.deductBreach = function (bidderId, callback) {
  handleBreach(bidderId, true, function (err, tenders) {
    return callback(err, tenders);
  });
};


exports.quoteTender = function (tenderItem, bidderItem, price, callback) {
  async.auto({
    checkTender: function (checkCallback) {
      if (tenderItem.status !== 'inProgress') {
        return checkCallback({err: error.business.tender_status_wrong});
      }
      else {
        return checkCallback();
      }
    },
    quoteRecord: ['checkTender', function (quoteCallback, result) {
      bidRecordService.quoteTender(tenderItem._id, bidderItem._id, price, function (err, record) {
        return quoteCallback(err, record);
      });
    }],
    updateTender: ['quoteRecord', function (updateCallback, result) {
      bidRecordService.getQuotedCountByTenderId(tenderItem._id, function (err, count) {
        if (err) {
          return updateCallback(err);
        }

        tenderItem.has_participate_bidders_count = count;
        tenderItem.save(function (err, saveTender) {
          if (err || !saveTender) {
            console.log(err);
            err = {err: error.system.db_error};
          }
          return updateCallback(err, saveTender);
        });
      });
    }]
  }, function (err, result) {
    return callback(err);
  });
};
exports.applyBidder = function (params, callback) {
  if (!params || !params.tenderId || !params.bidderId || !params.bidRecordId || !params.price) {
    return callback({err: error.params.empty});
  }

  async.auto({
    findTender: function (tenderCallback) {
      getOneByCondition({_id: params.tenderId}, function (err, data) {
        return tenderCallback(err, data);
      });
    },
    findRecord: function (recordCallback) {
      bidRecordService.getRecordById(params.bidRecordId, null, function (err, record) {
        return recordCallback(err, record);
      });
    },
    check: ['findTender', 'findRecord', function (checkCallback, result) {
      if (!result.findTender) {
        return checkCallback({err: error.business.tender_not_exist});
      }
      if (result.findTender.status !== 'inProgress' && result.findTender.status !== 'stop') {
        return checkCallback({err: error.business.tender_status_wrong});
      }
      if (result.findTender.end_time && result.findTender.end_time.getTime() > Date.now()) {
        return checkCallback({err: error.business.tender_not_end_when_apply_bidder});
      }
      if (!result.findRecord) {
        return checkCallback({err: error.business.bid_record_not_exist});
      }
      if (result.findRecord.current_price !== params.price) {
        return checkCallback({err: error.business.bid_record_not_exist});
      }
      if (result.findRecord.status !== 'quoted') {
        return checkCallback({err: error.business.bid_record_status_wrong});
      }

      return checkCallback();
    }],
    updateRecord: ['check', function (updateRecordCallback, result) {
      bidRecordService.winTender(params.tenderId, params.bidderId, function (err, data) {
        return updateRecordCallback(err, data);
      });
    }],
    updateTender: ['findTender', 'findRecord', 'updateRecord', function (updateTenderCallback, result) {
      result.findTender.bidder_winner = result.findRecord.bidder;
      result.findTender.status = 'completed';
      result.findTender.winner_price = params.price;
      result.findTender.winner_reason = params.reason;

      result.findTender.save(function (err, saveTender) {
        if (err || !saveTender) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return updateTenderCallback(err, saveTender);
      });
    }],
    updateBidder: ['updateTender', function (bidderCallback, result) {
      bidderService.addCooperateCompany(params.bidderId, result.updateTender.create_company.toString(), function (err) {
        return bidderCallback(err);
      });
    }]

  }, function (err, result) {

    return callback(err, {success: true});
  });
};

exports.applyDrivers = function (tenderItem, bidderItem, drivers, callback) {
  if (tenderItem.status !== 'completed' || tenderItem.order) {
    return callback({err: error.business.tender_status_wrong});
  }
  if (tenderItem.bidder_winner.toString() !== bidderItem._id.toString()) {
    return callback({err: error.business.bidder_not_right});
  }

  async.auto({
    checkBidRecord: function (autoCallback) {
      bidRecordService.getQuoteSuccessRecord(tenderItem._id, function (err, record) {
        if (err) {
          return autoCallback(err);
        }
        if (!record) {
          return autoCallback({err: error.business.bid_record_not_exist});
        }
        if (record.bidder._id.toString() !== bidderItem._id.toString()) {
          return autoCallback({err: error.business.bidder_not_right});
        }
        return autoCallback();
      });
    },
    checkDrivers: ['checkBidRecord', function (autoCallback) {
      async.each(drivers, function (driverItem, itemCallback) {
        if (!driverItem || !driverItem.testPhone()) {
          return itemCallback({err: error.business.phone_invalid});
        }
        return itemCallback();

      }, function (err) {
        return autoCallback(err);
      });
    }],
    //如果司机不存在
    getSignupDrivers: ['checkDrivers', function (autoCallback, result) {
      driverService.getSignupedDriversByPhoneArray(drivers, function (err, driverEntities) {
        if (err) {
          return autoCallback(err);
        }
        if (!driverEntities || driverEntities.length === 0) {
          return autoCallback({err: error.business.driver_not_signup});
        }
        if (driverEntities.length < drivers.length) {
          return autoCallback({err: error.business.driver_not_signup});
        }
        return autoCallback(null, driverEntities);
      });
    }],
    findGroup: ['getSignupDrivers', function (autoCallback) {
      groupService.getDefaultGroup(tenderItem.create_company, function (err, group) {
        return autoCallback(err, group);
      });
    }],
    formatOrderInfo: function (autoCallback) {
      var orderInfo = {
        order_number: tenderItem.order_number,
        refer_order_number: tenderItem.refer_order_number,

        pickup_contact_name: tenderItem.pickup_name,
        pickup_contact_phone: tenderItem.pickup_tel_phone,
        pickup_contact_mobile_phone: tenderItem.pickup_mobile_phone,
        pickup_contact_address: tenderItem.pickup_address,
        pickup_contact_email: '',
        pickup_start_time: tenderItem.pickup_start_time,
        pickup_end_time: tenderItem.pickup_end_time,

        delivery_contact_name: tenderItem.delivery_name,
        delivery_contact_phone: tenderItem.delivery_tel_phone,
        delivery_contact_mobile_phone: tenderItem.delivery_mobile_phone,
        delivery_contact_address: tenderItem.delivery_address,
        delivery_contact_email: '',
        delivery_start_time: tenderItem.delivery_start_time,
        delivery_end_time: tenderItem.delivery_end_time,

        goods: tenderItem.goods,
        salesmen: tenderItem.salesmen,
        sender_company_id: tenderItem.create_company.toString(),
        description: tenderItem.remark,
        tender_id: tenderItem._id,
        bidder_id: bidderItem._id
      };
      return autoCallback(null, orderInfo);
    },
    //创建运单，分配运单 －－－ 服务, tender, bidder
    createAndAssign: ['getSignupDrivers', 'findGroup', 'formatOrderInfo', function (autoCallback, result) {
      orderService.createAndAssignToDrivers(result.formatOrderInfo, result.getSignupDrivers, tenderItem.create_user, tenderItem.create_company, result.findGroup._id, function (err, result) {
        return autoCallback(err, result);
      });
    }],
    //修改标书纪录 order, carry_drivers
    updateTender: ['createAndAssign', 'getSignupDrivers', function (autoCallback, result) {
      if (!result.createAndAssign || !result.createAndAssign.companyOrder || result.createAndAssign.failedCount > 0) {
        return autoCallback({err: error.business.tender_apply_driver_failed});
      }

      tenderItem.order = result.createAndAssign.companyOrder._id;
      tenderItem.carry_drivers = result.getSignupDrivers;

      tenderItem.save(function (err, saveTender) {
        if (err || !saveTender) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return autoCallback(err, saveTender);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });

};

exports.exportTenders = function (filter, columns) {
  return new Promise(function (fulfill, reject) {
    Tender.find(filter).sort({
      'create_company': 1,
      'create_user': 1,
      'created': 1
    }).populate('create_company create_user').lean().exec(function (err, tenders) {
      if (err) {
        return reject(err);
      }
      var ids = [];
      for (var i = 0, len = tenders.length; i < len; i++) {
        ids.push(tenders[i]._id);
      }
      BidRecord.find({
        tender: {
          $in: ids
        }
      }).sort({tender: 1}).populate('bidder').exec(function (err, bidrecords) {
        if (err) {
          return reject(err);
        }
        var compare = function (a, b) {
          var as = a.tender.toString(),
            bs = b.tender.toString();
          if (as === bs) {
            return 0;
          } else if (as > bs) {
            return 1;
          } else {
            return -1;
          }
        };

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
        worksheet.columns = columns;

        for (var i = 0, len = tenders.length; i < len; i++) {
          var tender = tenders[i];
          tender.bidrecords = filterBidrecords(bidrecords, {tender: tender._id}, compare);

          var rows = processTenderForXlsx(tender);
          rows.forEach(function (row) {
            worksheet.addRow(row).commit();
          });
        }
        worksheet.commit();
        workbook.commit()
          .then(function () {
            fulfill({root: '.', filePath: filePath, filename: filePath});
          });
      });
    });
  });
};

function processTenderForXlsx(tender) {
  var rows = [],
    tpl = {
      '运单号': tender.order_number,
      '公司': tender.create_company ? tender.create_company.name : '',
      '用户': tender.create_user ? tender.create_user.username : '',
      '开始时间': tender.start_time ? moment(tender.start_time).add(timezone, 'h').toDate() : null,
      '截止时间': tender.end_time ? moment(tender.end_time).add(timezone, 'h').toDate() : null,
      '创建时间': tender.created ? moment(tender.created).add(timezone, 'h').toDate() : null,
      '车辆要求': tender.truck_type,
      '提货地址': tender.pickup_address,
      '收货地址': tender.delivery_address
    };

  if (tender.goods && tender.goods.length > 0) {
    var goods = '';
    for (var i = 0, len = tender.goods.length; i < len; i++) {
      var g = tender.goods[i];
      var t = g.name + ': ';
      if (g.count && g.unit) {
        t += g.count + g.unit;
      }
      if (g.count2 && g.unit2) {
        t += g.count2 + g.unit2;
      }
      if (g.count3 && g.unit3) {
        t += g.count3 + g.unit3;
      }
      if (t != '') {
        goods += '; ' + t;
      }
    }
    tpl['商品明细'] = goods.substr(1);
  } else {
    tpl['商品明细'] = null;
  }


  if (tender.bidrecords && tender.bidrecords instanceof Array && tender.bidrecords.length > 0) {

    for (var i = 0, len = tender.bidrecords.length; i < len; i++) {
      var bidrecord = tender.bidrecords[i];
      var row = {
        '运单号': tpl['运单号'],
        '公司': tpl['公司'],
        '用户': tpl['用户'],
        '开始时间': tpl['开始时间'],
        '截止时间': tpl['截止时间'],
        '创建时间': tpl['创建时间'],
        '车辆要求': tpl['车辆要求'],
        '提货地址': tpl['提货地址'],
        '收货地址': tpl['收货地址'],
        '商品明细': tpl['商品明细'],
        '投标人': bidrecord.bidder ? bidrecord.bidder.username : null,
        '当前报价': bidrecord.current_price
      };

      switch (bidrecord.status) {
        case 'quoted': // 已报价
        case 'failed' : // 未中标
        case 'obsolete' : // 已过时
          row['投标状态'] = '未中标';
          break;
        case 'success' :
          row['投标状态'] = '已中标';
          break;
        case 'unQuoted' : // 未报价
          row['投标状态'] = '已查看';
          break;
        default :
          row['投标状态'] = '未查看';
          break;
      }
      rows.push(row);
    }

  } else {
    tpl['投标状态'] = '未查看';
    rows.push(tpl);
  }
  return rows;
}

function filterBidrecords(bidrecords, tender, compare) {
  var result = [];
  var len = bidrecords.length;

  var idx = binarySearch(bidrecords, tender, compare);
  if (idx != -1) {
    result.push(bidrecords[idx]);
    if (idx - 1 >= 0) {
      for (var i = idx - 1; i > 0; i--) {
        var c = compare(bidrecords[i], tender);
        if (c == 0) {
          result.push(bidrecords[i]);
        } else {
          break;
        }
      }
    }
    if (idx + 1 < len) {
      for (var i = idx + 1; i < len; i++) {
        var c = compare(bidrecords[i], tender);
        if (c == 0) {
          result.push(bidrecords[i]);
        } else {
          break;
        }
      }
    }
  }
  return result;
}

function binarySearch(items, value, compare) {

  if (items.length == 0) {
    return -1;
  }

  var startIndex = 0,
    stopIndex = items.length - 1,
    middle = Math.floor((stopIndex + startIndex) / 2);

  while (compare(items[middle], value) != 0 && startIndex < stopIndex) {

    //adjust search area
    if (compare(value, items[middle]) < 0) {
      stopIndex = middle - 1;
    } else if (compare(value, items[middle]) > 0) {
      startIndex = middle + 1;
    }

    //recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  //make sure it's the right value
  return (compare(items[middle], value) != 0) ? -1 : middle;
}
