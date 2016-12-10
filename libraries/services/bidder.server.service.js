/**
 * Created by Wayne on 16/3/17.
 */
'use strict';

var async = require('async'),
  error = require('../../errors/all');

var appDb = require('../mongoose').appDb,
  Bidder = appDb.model('Bidder');

var bidRecordService = require('./bid_record'),
  driverService = require('./driver'),
  paymentService = require('./payment'),
  depositLogService = require('./deposit_log');

var depositAmount = parseInt(process.env.depositAmount);
var self = exports;

function getOneByCondition(condition, callback) {
  Bidder.findOne(condition, function (err, bidder) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, bidder);
  });
}
function getBidders(condition, limit, sort, callback) {
  var expression = Bidder.find(condition);
  if (limit > 0) {
    expression = expression.limit(limit);
  }
  if (sort) {
    expression = expression.sort(sort);
  }
  expression.exec(function (err, bidders) {
    if (err) {
      console.log(err);
      err = {err: error.system.db_error};
    }
    return callback(err, bidders);
  });
}

function getAssignBidders(isAll, companyId, callback) {
  if (!isAll) {
    self.getCooperateBidders(companyId, function (err, bidders) {
      return callback(err, bidders);
    });
  }
  else {
    self.getAllBidders(function (err, bidders) {
      return callback(err, bidders);
    });
  }
}

exports.getByOpenid = function (openid, callback) {
  if (!openid) {
    return callback({err: error.params.empty});
  }

  getOneByCondition({'wechat_profile.openid': openid}, function (err, bidder) {
    return callback(err, bidder);
  });
};

exports.getByUsername = function (username, callback) {
  if (!username) {
    return callback({err: error.params.empty});
  }
  if (!username.testPhone()) {
    return callback({err: error.params.invalid_value});
  }

  getOneByCondition({username: username}, function (err, bidder) {
    return callback(err, bidder);
  });
};
exports.getById = function (bidderId, callback) {
  if (!bidderId) {
    return callback({err: error.params.empty});
  }

  getOneByCondition({_id: bidderId}, function (err, bidder) {
    return callback(err, bidder);
  });
};

exports.getCooperateBidders = function (companyId, callback) {
  if (!companyId) {
    return callback({err: error.params.empty});
  }

  getBidders({
    cooperate_companies: companyId.toString(),
    'wechat_profile.openid': {$exists: true}
  }, 50, null, function (err, bidders) {
    return callback(err, bidders);
  });
};

exports.getAllBidders = function (callback) {
  getBidders({'wechat_profile.openid': {$exists: true}}, 50, null, function (err, bidders) {
    return callback(err, bidders);
  });
};

exports.addCooperateCompany2 = function(bidderId, companyId, real_name, callback) {
  if (!bidderId || !companyId) {
    return callback({err: error.params.empty});
  }

  var update = {$addToSet: {cooperate_companies: companyId.toString()}};
  if(real_name){
    var key = 'real_names.' + companyId.toString();
    update.$set = {};
    update.$set[key] = real_name;
  }

  Bidder.update({_id: bidderId}, update, function (err, raw) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    return callback();
  });
};

exports.addCooperateCompany = function (bidderId, companyId, callback) {
  if (!bidderId || !companyId) {
    return callback({err: error.params.empty});
  }

  Bidder.update({_id: bidderId}, {$addToSet: {cooperate_companies: companyId.toString()}}, function (err, raw) {
    if (err) {
      return callback({err: error.system.db_error});
    }
    return callback();
  });
};

//创建标书后指派那些竞标人可以参与，不创建竞标纪录
exports.assignBidder = function (isAll, tenderItem, callback) {
  async.auto({
    findBidders: function (bidderCallback) {
      getAssignBidders(isAll, tenderItem.create_company, function (err, bidders) {
        return bidderCallback(err, bidders);
      });
    }
    //recordBid: ['findBidders', function (recordCallback, result) {
    //  if (result.findBidders && result.findBidders.length > 0) {
    //    async.each(result.findBidders, function (bidderItem, itemCallback) {
    //      bidRecordService.create(tenderItem._id, bidderItem._id, function (err, newRecord) {
    //        return itemCallback(err, newRecord);
    //      });
    //    }, function (err) {
    //      return recordCallback(err);
    //    });
    //  }
    //  else {
    //    return recordCallback();
    //  }
    //}]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, result.findBidders);
  });
};

exports.bindWx = function (username, openid, wxProfile, callback) {
  if (!wxProfile || !wxProfile.openid) {
    return callback({err: error.params.invalid_value});
  }

  async.auto({
    findByOpenId: function (autoCallback) {
      getOneByCondition({'wechat_profile.openid': openid}, function (err, bidder) {
        if (err) {
          return autoCallback(err);
        }
        if (bidder) {
          bidder.wechat_profile = {};
          bidder.markModified('wechat_profile');
          bidder.save(function (err, saveBidder) {
            if (err || !saveBidder) {
              err = {err: error.system.db_error};
            }

            return autoCallback(err);
          });
        }
        else {
          return autoCallback();
        }
      });
    },
    findCooperateCompanyIds: function (autoCallback) {
      driverService.getDriverCompanyIdsByUsername(username, function (err, companyIds) {
        return autoCallback(err, companyIds);
      });
    },
    bind: ['findByOpenId', 'findCooperateCompanyIds', function (autoCallback, result) {
      self.getByUsername(username, function (err, bidder) {
        if (err) {
          return autoCallback(err);
        }

        if (!bidder) {
          bidder = new Bidder({username: username});
        }
        bidder.bind_time = new Date();
        bidder.cooperate_companies = result.findCooperateCompanyIds;
        bidder.wechat_profile = wxProfile;
        bidder.markModified('wechat_profile');
        bidder.markModified('cooperate_companies');
        bidder.save(function (err, saveBidder) {
          if (err || !saveBidder) {
            err = {err: error.system.db_error};
          }
          return autoCallback(err, saveBidder);
        });
      });
    }]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }

    return callback(null, result.bind);
  });
};

exports.unbindWx = function (openid, callback) {
  getOneByCondition({'wechat_profile.openid': openid}, function (err, bidder) {
    if (err) {
      return callback(err);
    }
    if (!bidder) {
      return callback({err: error.business.openid_invalid});
    }

    bidder.wechat_profile = {};
    bidder.cooperate_companies = [];

    bidder.markModified('wechat_profile');
    bidder.markModified('cooperate_companies');
    bidder.save(function (err, saveBidder) {
      if (err || !saveBidder) {
        err = {err: error.system.db_error};
      }

      return callback(err, saveBidder);
    });

  });

};

exports.unbindWxWithBidder = function (bidder, callback) {
  if (!bidder) {
    return callback({err: error.params.empty});
  }

  bidder.wechat_profile = {};
  bidder.cooperate_companies = [];

  bidder.markModified('wechat_profile');
  bidder.markModified('cooperate_companies');
  bidder.save(function (err, saveBidder) {
    if (err || !saveBidder) {
      err = {err: error.system.db_error};
    }

    return callback(err, saveBidder);
  });
};

exports.getCompanyBidderDetail = function (companyId, callback) {
  if (!companyId) {
    return callback({err: error.params.empty});
  }
  async.auto({
    findBidders: function (autoCallback) {
      getBidders({cooperate_companies: companyId.toString()}, null, {created: -1}, function (err, bidders) {
        if (err) {
          err = {err: error.system.db_error};
        }
        bidders.forEach(function(bidder){
          if(bidder.real_names){
            bidder._doc.real_name = bidder.real_names[companyId.toString()];
          }
        });
        return autoCallback(err, bidders);
      });
    },
    getWinCount: ['findBidders', function (autoCallback, result) {
      if (result.findBidders && result.findBidders.length > 0) {
        async.each(result.findBidders, function (bidderItem, itemCallback) {
          bidRecordService.getSuccessCountByBidderId(bidderItem._id, function (err, count) {
            if (err) {
              return itemCallback(err);
            }

            bidderItem._doc.win_count = count;
            return itemCallback();
          });

        }, function (err) {
          return autoCallback(err);
        });
      }
      else {
        return autoCallback();
      }

    }]
  }, function (err, result) {
    return callback(err, result.findBidders);
  });


};


exports.saveDeposit = function (bidder, callback) {
  if (!bidder || !bidder._id) {
    return callback({err: error.business.bidder_not_exist});
  }

  async.auto({
    check: function (autoCallback) {
      if (!bidder.wechat_profile.openid) {
        return autoCallback({err: error.business.bidder_not_bind_wechat});
      }

      if (bidder.deposit_status === 'paid') {
        return autoCallback({err: error.business.bidder_deposit_paid});
      }
      if (bidder.deposit_status === 'freeze') {
        return autoCallback({err: error.business.bidder_deposit_freeze});
      }
      //检查当前保证金金额数值
      if (bidder.deposit_amount !== 0) {
        return autoCallback({err: error.business.bidder_deposit_amount_invalid});
      }
      return autoCallback();
    },
    payment: ['check', function (autoCallback) {
      paymentService.saveDepositByWechat(bidder, depositAmount, function (err) {
        return autoCallback(err);
      });
    }],
    update: ['payment', function (autoCallback) {
      bidder.deposit_amount = depositAmount;
      bidder.deposit_status = 'paid';
      bidder.save(function (err, saveBidder) {
        if (err || !saveBidder) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return autoCallback(err, saveBidder);
      });
    }],
    log: ['update', function (autoCallback, result) {
      if (!result.update || !result.update._id) {
        return autoCallback();
      }
      depositLogService.saveDeposit(result.update._id, result.update.username, result.update.wechat_profile.nickname, depositAmount, function (err) {
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    return callback(err);
  });

};
exports.extractDeposit = function (bidder, callback) {
  if (!bidder || !bidder._id) {
    return callback({err: error.business.bidder_not_exist});
  }

  async.auto({
    check: function (autoCallback) {
      if (!bidder.wechat_profile.openid) {
        return autoCallback({err: error.business.bidder_not_bind_wechat});
      }

      if (bidder.deposit_status === 'unpaid') {
        return autoCallback({err: error.business.bidder_deposit_unpaid});
      }
      if (bidder.deposit_status === 'freeze') {
        return autoCallback({err: error.business.bidder_deposit_freeze});
      }
      if (bidder.deposit_status === 'deducted') {
        return autoCallback({err: error.business.bidder_deposit_deducted});
      }
      //检查当前保证金金额数值
      if (bidder.deposit_amount !== depositAmount) {
        return autoCallback({err: error.business.bidder_deposit_amount_invalid});
      }
      return autoCallback();
    },
    payment: ['check', function (autoCallback) {
      paymentService.extractDepositByWechat(bidder, depositAmount, function (err) {
        return autoCallback(err);
      });
    }],
    update: ['payment', function (autoCallback) {
      bidder.deposit_amount = 0;
      bidder.deposit_status = 'unpaid';
      bidder.save(function (err, saveBidder) {
        if (err || !saveBidder) {
          console.log(err);
          err = {err: error.system.db_error};
        }
        return autoCallback(err, saveBidder);
      });
    }],
    log: ['update', function (autoCallback, result) {
      if (!result.update || !result.update._id) {
        return autoCallback();
      }

      depositLogService.extractDeposit(result.update._id,
        result.update.username,
        result.update.wechat_profile.nickname,
        depositAmount, function (err) {
          return autoCallback(err);
        });
    }]
  }, function (err, result) {
    return callback(err);
  });

};

/*
 * 中介违约
 * bidderTenders: [{bidderId: '', tenders: [{_id: '', order_number: ''}]}]
 * breachType[违约类型]: 提货违约，交货违约
 * */
exports.breach = function (bidderTenders, breachType, callback) {
  if (!bidderTenders || bidderTenders.length === 0) {
    return callback({err: error.params.invalid});
  }

  async.each(bidderTenders, function (bidderTenderItem, eachCallback) {
    async.auto({
      updateBidder: function (autoCallback) {
        getOneByCondition({_id: bidderTenderItem.bidderId}, function (err, bidder) {
          if (err) {
            return autoCallback(err);
          }
          if (!bidder) {
            return autoCallback({err: error.business.bidder_not_exist});
          }
          //只有已缴纳的状态才可以重置违约, 因为只有在已缴纳状态才可以中标
          if (bidder.deposit_status !== 'paid') {
            return autoCallback(null, {bidder: bidder, tenders: bidderTenderItem.tenders});
          }
          else {
            bidder.deposit_status = 'freeze';
            bidder.save(function (err, saveBidder) {
              if (err || !saveBidder) {
                err = {err: error.system.db_error};
              }
              return autoCallback(err, {bidder: saveBidder, tenders: bidderTenderItem.tenders});
            });
          }
        });
      },
      log: ['updateBidder', function (autoCallback, result) {
        if (result.updateBidder && result.updateBidder.bidder) {
          depositLogService.freezeBreach(result.updateBidder.bidder._id,
            result.updateBidder.bidder.username,
            result.updateBidder.bidder.wechat_profile.nickname,
            result.updateBidder.tenders,
            breachType, function (err) {
              return autoCallback(err);
            }
          );
        }
        else {
          return autoCallback();
        }
      }]

    }, function (err, result) {
      return eachCallback(err);
    });

  }, function (err) {
    return callback(err);
  });
};

exports.queryPlatformBidderCount = function (callback) {
  Bidder.count({'wechat_profile.openid': {$exists: true}}, function (err, count) {
    if (err) {
      err = {err: error.system.db_error};
    }
    return callback(err, count);
  });
};

exports.queryPlatformBidders = function (condition, callback) {
  //保证金状态
  //中介名称
  //时间排序
  var query = {$and: []};
  query.$and.push({'wechat_profile.openid': {$exists: true}});

  if (condition.depositStatus) {
    if (condition.depositStatus === 'unpaid') {
      query.$and.push({$or: [{deposit_status: condition.depositStatus}, {deposit_status: {$exists: false}}]});
    }
    else {
      query.$and.push({deposit_status: condition.depositStatus});
    }
  }
  if (condition.searchText) {
    query.$and.push({
      $or: [
        {username: {$regex: condition.searchText, $options: 'i'}},
        {'wechat_profile.nickname': {$regex: condition.searchText, $options: 'i'}}
      ]
    });
  }
  if (condition.startTime) {
    query.$and.push({created: {$gte: condition.startTime}});
  }
  if (condition.endTime) {
    query.$and.push({created: {$lte: condition.endTime}});
  }

  var sortObject = {created: -1};
  if (condition.sortName && condition.sortName === 'create_time') {
    sortObject.created = (parseInt(condition.sortValue) === 1 ? 1 : -1);
  }

  async.auto({
    count: function (autoCallback) {
      Bidder.count(query, function (err, count) {
        if (err) {
          err = {err: error.system.db_error};
        }
        return autoCallback(err, count);
      });
    },
    list: function (autoCallback) {
      Bidder.find(query)
        .sort(sortObject)
        .skip((condition.currentPage - 1) * condition.limit)
        .limit(condition.limit)
        .exec(function (err, bidderList) {
          if (err) {
            err = {err: error.system.db_error};
          }
          return autoCallback(err, bidderList);
        });
    }
  }, function (err, result) {

    if (err) {
      return callback(err);
    }

    return callback(null, {
      pagination: {
        currentPage: condition.currentPage,
        limit: condition.limit,
        count: result.count
      },
      list: result.list
    });

  });
};

exports.removeBreach = function (userId, bidder, breachTenders, callback) {
  if (bidder.deposit_status !== 'freeze') {
    return callback({err: error.business.bidder_deposit_status_invalid});
  }
  if (bidder.deposit_amount !== depositAmount) {
    return callback({err: error.business.bidder_deposit_amount_invalid});
  }

  async.auto({
    updateBidder: function (autoCallback) {
      bidder.deposit_status = 'paid';
      bidder.save(function (err, saveBidder) {
        if (err || !saveBidder) {
          err = {err: error.system.db_error};
        }
        return autoCallback(err, saveBidder);
      });
    },
    log: ['updateBidder', function (autoCallback, result) {
      if (result.updateBidder && result.updateBidder) {
        depositLogService.removeBreach(result.updateBidder._id,
          result.updateBidder.username,
          result.updateBidder.wechat_profile.nickname,
          breachTenders,
          userId, function (err) {
            return autoCallback(err);
          }
        );
      }
      else {
        return autoCallback();
      }
    }]

  }, function (err, result) {
    return callback(err);
  });
};

exports.deductBreach = function (userId, bidder, breachTenders, callback) {
  if (bidder.deposit_status !== 'freeze') {
    return callback({err: error.business.bidder_deposit_status_invalid});
  }

  if (bidder.deposit_amount !== depositAmount) {
    return callback({err: error.business.bidder_deposit_amount_invalid});
  }

  async.auto({
    updateBidder: function (autoCallback) {
      bidder.deposit_status = 'deducted';
      bidder.deposit_amount = 0;
      bidder.save(function (err, saveBidder) {
        if (err || !saveBidder) {
          err = {err: error.system.db_error};
        }
        return autoCallback(err, saveBidder);
      });
    },
    log: ['updateBidder', function (autoCallback, result) {
      if (result.updateBidder && result.updateBidder) {
        depositLogService.deductBreach(result.updateBidder._id,
          result.updateBidder.username,
          result.updateBidder.wechat_profile.nickname,
          breachTenders,
          userId, function (err) {
            return autoCallback(err);
          }
        );
      }
      else {
        return autoCallback();
      }
    }]

  }, function (err, result) {
    return callback(err);
  });
};

exports.removeCompanyBidder = function(username, companyId, callback){
  Bidder.findOneAndUpdate({username: username}, {$pull : {cooperate_companies : companyId.toString()}}, function(err){
    if(err){
      return callback(err);
    }else{
      return callback(null);
    }
  });
};

//TODO 需要删除 测试专用，只针对开发环境和测试环境
exports.insertBidder = function () {

  Bidder.findOne({}, function (err, findBidder) {
    if (err) {
      return;
    }
    if (!findBidder) {

      var bidderArray = [
        {
          username: '13918429709',
          location: [131.00, 22.00],
          wechat_profile: {
            "unionid": "oulzjslRVVVpTZn69bdm3sY4Na9Y",
            "privilege": [],
            "headimgurl": "http://wx.qlogo.cn/mmopen/JvvcUm1qIPbicBKs1eoscI2bJmNkCAVzs4rnAHxKsng0qoDsGeB8ICibJIBEIhPoROznmdsojyHhVASk3RVtnge53XsFDjJNAX/0",
            "country": "中国",
            "province": "上海",
            "city": "宝山",
            "language": "zh_CN",
            "sex": 1,
            "nickname": "梅志威",
            "openid": "ooIh5sx8HybmkUw3y3fycoml0a0A"
          }
        },
        {
          username: '13472423583',
          location: [131.00, 22.00],
          wechat_profile: {
            "unionid": "oulzjsp_Ilsl5u7ILbt1M2-OluLI",
            "privilege": [],
            "headimgurl": "http://wx.qlogo.cn/mmopen/JvvcUm1qIPbicBKs1eoscI8D3vicKoiaRnEGWdXfAOT8qtia85VNSWk8ibOcRWYXP9kyRHejibP9FMXB5ZZ6QQTOEsfCpweQVcAkgp/0",
            "country": "中国",
            "province": "上海",
            "city": "浦东新区",
            "language": "zh_CN",
            "sex": 1,
            "nickname": "鸿、",
            "openid": "ooIh5s1dUG9VU2spuAoR6TOrKwV8"
          }
        }
      ];

      async.each(bidderArray, function (bidderItem, itemCallback) {
        var bidder = new Bidder({
          username: bidderItem.username,
          location: bidderItem.location,
          wechat_profile: bidderItem.wechat_profile,
          bind_time: new Date()
        });
        bidder.save(function (err, saveBidder) {
          return itemCallback()
        });
      }, function (err) {
        console.log('create two bidder success');
      });

    }
  });


};