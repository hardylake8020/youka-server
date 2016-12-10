/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  BidRecord = appDb.model('BidRecord');

var wechatPushService = require('./wechat_push');


var that = exports;

function getRecordCountByCondition(condition, callback) {
  BidRecord.count(condition, function (err, count) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, count);
  });
}
function findOneByCondition(condition, callback) {
  BidRecord.findOne(condition)
    .populate('bidder')
    .exec(function (err, bidRecord) {
      if (err) {
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, bidRecord);
    });
}

function getRecordByConditionAndLimit(condition, populateString, skip, limit, sort, callback) {
  var query = BidRecord.find(condition);
  if (populateString) {
    query = query.populate(populateString);
  }
  if (sort) {
    query = query.sort(sort);

  }
  if (skip) {
    query = query.skip(skip);
  }
  if (limit) {
    query = query.limit(limit);
  }
  query.exec(function (err, bidRecords) {
      if (err) {
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, bidRecords);
    });
}


function setWinner(recordItem, callback) {
  recordItem.status = 'success';
  recordItem.save(function (err, saveRecord) {
    if (err || !saveRecord) {
      err = {err: error.system.db_error};
    }
    return callback(err, saveRecord);
  });
}
function setUnWinner(recordItem, callback) {
  recordItem.status = 'failed';
  recordItem.save(function (err, saveRecord) {
    if (err || !saveRecord) {
      err = {err: error.system.db_error};
    }
    return callback(err, saveRecord);
  });
}
function setObsolete(recordItem, callback) {
  recordItem.status = 'obsolete';
  recordItem.save(function (err, saveRecord) {
    if (err || !saveRecord) {
      err = {err: error.system.db_error};
    }
    return callback(err, saveRecord);
  });
}

function createRecord(tenderId, bidderId, callback) {
  if (!tenderId || !bidderId) {
    return callback({err: error.params.empty});
  }

  findOneByCondition({tender: tenderId, bidder: bidderId}, function (err, bidRecord) {
    if (err) {
      return callback(err);
    }
    if (!bidRecord) {
      bidRecord = new BidRecord({
        tender: tenderId,
        bidder: bidderId
      });
    }
    bidRecord.status = 'unQuoted';
    bidRecord.save(function (err, saveRecord) {
      if (err || !saveRecord) {
        err = {err: error.business.db_error};
      }
      return callback(err, saveRecord);
    });
  });
}


exports.create = function (tenderId, bidderId, callback) {
  if (!tenderId || !bidderId) {
    return callback({err: error.params.empty});
  }

  async.auto({
    findRecord: function (findCallback) {
      findOneByCondition({tender: tenderId, bidder: bidderId}, function (err, bidRecord) {
        return findCallback(err, bidRecord);
      });
    },
    createRecord: ['findRecord', function (createCallback, result) {
      if (!result.findRecord) {
        result.findRecord = new BidRecord({
          tender: tenderId,
          bidder: bidderId
        });
      }
      result.findRecord.status = 'unStarted';

      result.findRecord.save(function (err, saveRecord) {
        if (err || !saveRecord) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return callback(err, saveRecord);
      });

    }]
  }, function (err, result) {

    if (err) {
      return callback(err);
    }
    return callback(null, result.createRecord);
  });
};

exports.getQuotedRecordByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }
  getRecordByConditionAndLimit({tender: tenderId, status: 'quoted'}, 'bidder', null, null, null, function (err, bidRecords) {
    return callback(err, bidRecords);
  });
};

exports.getRecordByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }

  getRecordByConditionAndLimit({tender: tenderId}, 'bidder', null, null, null, function (err, bidRecords) {
    return callback(err, bidRecords);
  });
};

exports.getLowestPriceBidderRecordByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }
  getRecordByConditionAndLimit({tender: tenderId, status: 'quoted'}, null, null, null, {current_price: 1}, function (err, bidRecords) {
    if (err) {
      return callback(err);
    }
    if (!bidRecords || bidRecords.length === 0) {
      return callback();
    }
    return callback(null, bidRecords[0]);
  });
};


//暂时获取所有
exports.getAllQuotedRecordByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }
  getRecordByConditionAndLimit({
    tender: tenderId,
    status: 'quoted'
  }, 'bidder', 0, null, {current_price: 1}, function (err, bidRecords) {
    return callback(err, bidRecords);
  });
};

exports.getRecordByStatus = function (bidderId, skip, limit, statuses, callback) {
  getRecordByConditionAndLimit({
    bidder: bidderId,
    status: {$in: statuses}
  }, 'tender', skip, limit, {updated: -1}, function (err, records) {

    return callback(err, records);
  });
};

exports.getWinnerRecordByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }
  findOneByCondition({tender: tenderId, status: 'success'}, function (err, successRecord) {
    if (err) {
      return callback(err);
    }
    if (!successRecord) {
      err = {err: error.business.bid_record_not_exist};
    }

    return callback(err, successRecord);
  });
};

exports.getRecordById = function (id, populateString, callback) {
  if (!id) {
    return callback({err: error.params.empty});
  }
  var query = BidRecord.findOne({_id: id});
  if (populateString) {
    query = query.populate(populateString);
  }

  query.exec(function (err, bidRecord) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, bidRecord);
  });
};

exports.getQuotedCountByTenderId = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }

  getRecordCountByCondition({tender: tenderId, status: 'quoted'}, function (err, count) {
    return callback(err, count);
  });
};

exports.getSuccessCountByBidderId = function (bidderId, callback) {
  if (!bidderId) {
    return callback({err: error.params.empty});
  }

  getRecordCountByCondition({bidder: bidderId, status: 'success'}, function (err, count) {
    return callback(err, count);
  });
};

exports.getQuoteSuccessRecord = function (tenderId, callback) {
  if (!tenderId) {
    return callback({err: error.params.empty});
  }
  findOneByCondition({tender: tenderId, status: 'success'}, function (err, data) {
    if (err) {
      return callback(err);
    }
    if (!data) {
      return callback({err: error.business.bid_record_not_exist});
    }
    return callback(null, data);
  });
};

exports.winTender = function (tenderId, winBidderId, callback) {
  if (!tenderId || !winBidderId) {
    return callback({err: error.params.empty});
  }
  winBidderId = winBidderId.toString();

  async.auto({
    findRecords: function (findCallback) {
      getRecordByConditionAndLimit({tender: tenderId}, 'tender bidder', null, null, null, function (err, records) {
        return findCallback(err, records);
      });
    },
    setWinner: ['findRecords', function (autoCallback, result) {
      if (result.findRecords && result.findRecords.length > 0) {
        var winRecord = result.findRecords.filter(function (item) {
          return item.bidder._id.toString() === winBidderId;
        });

        if (winRecord && winRecord.length > 0) {
          winRecord = winRecord[0];

          setWinner(winRecord, function (err, data) {
            if (!err && winRecord.bidder.wechat_profile && winRecord.bidder.wechat_profile.openid) {
              //发送微信推送 已中标
              wechatPushService.pushSuccessTenderMessageToWechat(winRecord.bidder.wechat_profile.openid, winRecord);
              console.log('微信推送 已中标:' + winRecord.tender.order_number + winRecord.bidder.username);
            }

            return autoCallback(err, winRecord); //不使用data的原因，主要是winRecord中包含了tender 和 bidder 信息
          });

        }
        else {
          return autoCallback();
        }
      }
      else {
        return autoCallback();
      }

    }],
    updateRecords: ['findRecords', 'setWinner', function (updateCallback, result) {
      if (result.findRecords && result.findRecords.length > 0) {
        async.each(result.findRecords, function (recordItem, itemCallback) {
          if (recordItem.bidder._id.toString() === winBidderId) {
            //setWinner(recordItem, function (err, data) {
            //  if (!err && recordItem.bidder.wechat_profile && recordItem.bidder.wechat_profile.openid) {
            //    //发送微信推送 已中标
            //    wechatPushService.pushSuccessTenderMessageToWechat(recordItem.bidder.wechat_profile.openid, recordItem);
            //    console.log('微信推送 已中标:' + recordItem.tender.order_number + recordItem.bidder.username);
            //  }
            //
            //  return itemCallback(err);
            //});

            return itemCallback();
          }
          else {
            if (recordItem.status === 'quoted') {
              setUnWinner(recordItem, function (err, data) {
                if (!err && recordItem.bidder.wechat_profile && recordItem.bidder.wechat_profile.openid) {
                  //发送微信推送 未中标
                  wechatPushService.pushFailedTenderMessageToWechat(recordItem.bidder.wechat_profile.openid, recordItem, result.setWinner);
                  console.log('微信推送 未中标:' + recordItem.tender.order_number + recordItem.bidder.username);
                }

                return itemCallback(err);
              });
            }
            else {
              //设置状态为过时
              setObsolete(recordItem, function (err, data) {
                console.log('修改纪录 已过时 未及时竞标' + recordItem.bidder.username);
                return itemCallback(err);
              });
            }
          }

        }, function (err) {
          return updateCallback(err);
        });
      }
      else {
        return updateCallback();
      }

    }]
  }, function (err, result) {
    return callback(err);
  });

};
exports.quoteTender = function (tenderId, bidderId, price, callback) {
  if (!tenderId || !bidderId || !price) {
    return callback({err: error.params.empty});
  }
  if (!isFinite(price) || price < 1) {
    return callback({err: error.params.invalid_value});
  }

  findOneByCondition({tender: tenderId, bidder: bidderId}, function (err, record) {
    if (err) {
      return callback(err);
    }
    if (!record) {
      return callback({err: error.business.bid_record_not_exist});
    }
    //目前只允许报价依次，多次报价的情况要修改条件
    if (record.status !== 'unQuoted') {
      return callback({err: error.business.bid_record_price_limit});
    }

    var priceItem = {
      value: price,
      time: new Date()
    };

    record.current_price = price;
    record.status = 'quoted';
    record.all_price.push(priceItem);

    record.save(function (err, saveRecord) {
      if (err || !saveRecord) {
        console.log(err);
        err = {err: error.system.db_error};
      }
      return callback(err, saveRecord);
    });
  });
};


exports.startRecord = function (tenderItem, callback) {
  async.auto({
    createRecord: function (autoCallback) {

      if (tenderItem.all_bidders && tenderItem.all_bidders.length > 0) {

        async.each(tenderItem.all_bidders, function (bidder, itemCallback) {
          createRecord(tenderItem._id, bidder._id, function (err, record) {
            if (err) {
              return itemCallback(err);
            }
            if (record && bidder.wechat_profile && bidder.wechat_profile.openid) {
              record._doc.tender = tenderItem;
              record._doc.bidder = bidder;

              wechatPushService.pushNewTenderMessageToWechat(bidder.wechat_profile.openid, record);
              console.log('微信推送 标书已开始：' + record.tender.order_number + ', ' + record.bidder.username);
            }

            return itemCallback();
          });

        }, function (err) {
          return autoCallback(err);
        });
      }
      else {
        return autoCallback();
      }
    }
  }, function (err) {
    return callback(err);
  });
};


exports.endRecord = function (tenderItem, callback) {
  async.auto({
    findBidRecords: function (bidderCallback) {
      getRecordByConditionAndLimit({tender: tenderItem._id}, 'tender bidder', null, null, null, function (err, bidRecords) {
        return bidderCallback(err, bidRecords);
      });
    },
    recordBid: ['findBidRecords', function (recordCallback, result) {
      if (result.findBidRecords && result.findBidRecords.length > 0) {
        async.each(result.findBidRecords, function (bidRecordItem, itemCallback) {

          if (bidRecordItem.status === 'unQuoted') {
            bidRecordItem.status = 'obsolete';

            bidRecordItem.save(function (err, saveRecord) {
              if (err || !saveRecord) {
                console.log(err);
                err = {err: error.system.db_error};
              }
              return itemCallback(err);
            });
          }
          else {
            return itemCallback();
          }

        }, function (err) {
          return recordCallback(err);
        });
      }
      else {
        return recordCallback();
      }
    }]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, result.findBidRecords);
  });
};


exports.obsoleteRecord = function (tenderItem, callback) {
  async.auto({
    findBidRecords: function (bidderCallback) {
      getRecordByConditionAndLimit({tender: tenderItem._id}, 'tender bidder', null, null, null, function (err, bidRecords) {
        return bidderCallback(err, bidRecords);
      });
    },
    recordBid: ['findBidRecords', function (recordCallback, result) {
      if (result.findBidRecords && result.findBidRecords.length > 0) {
        async.each(result.findBidRecords, function (bidRecordItem, itemCallback) {
          if (bidRecordItem.status === 'quoted' && bidRecordItem.bidder.wechat_profile && bidRecordItem.bidder.wechat_profile.openid) {
            //发送微信推送
            wechatPushService.pushFailedTenderMessageToWechat(bidRecordItem.bidder.wechat_profile.openid, bidRecordItem);
            console.log('微信推送 未中标 标书已过时：' + tenderItem.order_number + ', ' + bidRecordItem.bidder.username);
          }

          if (bidRecordItem.status === 'quoted') {
            bidRecordItem.status = 'failed';
          }
          else {
            bidRecordItem.status = 'obsolete';
          }

          bidRecordItem.save(function (err, saveRecord) {
            if (err || !saveRecord) {
              console.log(err);
              err = {err: error.system.db_error};
            }
            return itemCallback(err, saveRecord);
          });

        }, function (err) {
          return recordCallback(err);
        });
      }
      else {
        return recordCallback();
      }
    }]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, result.findBidRecords);
  });
};

exports.previewTender = function (bidRecordId, callback) {
  findOneByCondition({_id: bidRecordId}, function (err, bidRecord) {
    if (err) {
      return callback(err);
    }
    if (!bidRecord) {
      return callback({err: error.business.bid_record_not_exist});
    }
    if (bidRecord.has_preview) {
      return callback(null, bidRecord);
    }

    bidRecord.has_preview = true;
    bidRecord.save(function (err, saveBidRecord) {
      if (err) {
        err = {err: error.system.db_error};
      }
      return callback(err, saveBidRecord);
    });
  });
};
