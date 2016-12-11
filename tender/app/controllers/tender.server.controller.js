/**
 * Created by Wayne on 16/3/11.
 */
'use strict';

var tenderService = require('../../../libraries/services/new_tender'),
  bidRecordService = require('../../../libraries/services/bid_record'),
  Promise = require('promise'),
  fs = require('fs');

exports.create = function (req, res, next) {
  var currentUser = req.user;
  var tenderInfo = req.body.tender_info;

  tenderService.create(currentUser, tenderInfo, function (err) {
    if (err) {
      return res.send(err);
    }

    return res.send({success: true});
  });
};

exports.getListByDriver = function (req, res, next) {
  var currentDriver = req.driver || {};
  var currentPage = parseInt(req.query.currentPage || req.body.currentPage) || 1;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;

  var condition = {
    currentPage: currentPage,
    limit: limit,
    sort: {created: -1}
  };

  tenderService.getListByDriver(currentDriver, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};

exports.getListByUser = function (req, res, next) {
  var currentUser = req.user || {};
  var currentPage = parseInt(req.query.currentPage || req.body.currentPage) || 1;
  var limit = parseInt(req.query.limit || req.body.limit) || 10;
  var sort = {
    name: req.query.sortName || req.body.sortName || '',
    value: parseInt(req.query.sortValue || req.body.sortValue) || -1
  };
  var searchArray = req.body.searchArray || req.query.searchArray || [];
  if (!Array.isArray(searchArray)) {
    searchArray = [];
  }
  var startTime = req.body.startTime || req.query.startTime;
  var endTime = req.body.endTime || req.query.endTime;
  var condition = {
    currentPage: currentPage,
    limit: limit,
    sort: sort,
    searchArray: searchArray
  };

  if (startTime) {
    condition.created = condition.created || {};
    condition.created.$gte = new Date(startTime);
  }

  if (endTime) {
    condition.created = condition.created || {};
    condition.created.$lte = new Date(endTime);
  }

  tenderService.getListByUser(currentUser, condition, function (err, result) {
    console.log('condition ', condition);
    return res.send(err || result);
  });
};
exports.getOneByUser = function (req, res, next) {
  var tenderId = req.query.tender_id;

  tenderService.getOneByUser(tenderId, function (err, result) {
    return res.send(err || result);
  });
};
exports.deleteByUser = function (req, res, next) {
  var tenderId = req.query.tender_id || '';

  tenderService.deleteByUser(tenderId, function (err, data) {
    return res.send(err || data);
  });
};

exports.getAllBidRecord = function (req, res, next) {
  var tenderId = req.query.tender_id || '';

  bidRecordService.getRecordByTenderId(tenderId, function (err, records) {
    return res.send(err || records);
  });
};

//获取前几名已报价纪录
exports.getTopQuotedRecord = function (req, res, next) {
  var tenderId = req.query.tender_id || '';

  bidRecordService.getAllQuotedRecordByTenderId(tenderId, function (err, records) {
    return res.send(err || records);
  });
};
//获取中标人纪录
exports.getWinnerRecord = function (req, res, next) {
  var tenderId = req.query.tender_id || '';

  bidRecordService.getWinnerRecordByTenderId(tenderId, function (err, records) {
    return res.send(err || records);
  });
};

//确定竞标人
exports.applyBidder = function (req, res, next) {
  var tenderId = req.body.tender_id || '';
  var bidderId = req.body.bidder_id || '';
  var bidRecordId = req.body.bid_record_id || '';
  var price = parseFloat(req.body.price) || 0;
  var reason = req.body.reason || '';

  tenderService.applyBidder({
    tenderId: tenderId,
    bidderId: bidderId,
    bidRecordId: bidRecordId,
    price: price,
    reason: reason
  }, function (err, data) {

    return res.send(err || data);
  });
};

function createCondition(req) {
  var and = [{create_user: req.user._id}];

  var startTime = req.body.startTime || req.query.startTime;
  var endTime = req.body.endTime || req.query.endTime;

  if (startTime || endTime) {
    var created = {};
    and.push({created: created});
    if (startTime) {
      created.$gte = new Date(startTime);
    }

    if (endTime) {
      created.$lte = new Date(endTime);
    }
  }

  var searchArray = req.body.searchArray || req.query.searchArray || [];
  if (!Array.isArray(searchArray)) {
    searchArray = [];
  }
  var isSetStatus = false;
  searchArray.forEach(function (searchItem) {
    switch (searchItem.key) {
      case 'order_number':
        if (searchItem.value) {
          and.push({
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
          and.push({'status': {$in: searchItem.value}});
        }
        break;
      default:
        break;
    }
  });

  if (!isSetStatus) {
    and.push({status: {$nin: ['deleted', 'obsolete']}});
  }

  return Promise.resolve({$and: and});
}

exports.exportTenders = function (req, res, next) {
  createCondition(req).then(function (filter) {
    var columns = [
      {header: '运单号', key: '运单号', width: 15},
      {header: '公司', key: '公司', width: 20},
      {header: '用户', key: '用户', width: 20},
      {header: '开始时间', key: '开始时间', width: 10},
      {header: '截止时间', key: '截止时间', width: 10},
      {header: '创建时间', key: '创建时间', width: 10},
      {header: '车辆要求', key: '车辆要求', width: 10},
      {header: '商品明细', key: '商品明细', width: 20},
      // { header: '件数', key: '件数', width: 10},
      // { header: '件数单位', key: '件数单位', width: 10},
      // { header: '重量', key: '重量', width: 10},
      // { header: '重量单位', key: '重量单位', width: 10},
      // { header: '体积', key: '体积', width: 10},
      // { header: '体积单位', key: '体积单位', width: 10},
      {header: '提货地址', key: '提货地址', width: 40},
      {header: '收货地址', key: '收货地址', width: 40},
      {header: '投标人', key: '投标人', width: 15},
      {header: '投标状态', key: '投标状态', width: 10},
      {header: '当前报价', key: '当前报价', width: 10}
    ];

    tenderService.exportTenders(filter, columns).then(function (xlsx) {
      var options = {
        root: xlsx.root
      };
      var mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      var filePath = xlsx.filePath;
      var filename = xlsx.filename;
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', mimetype);
      res.sendFile(filePath, options, function (err) {
        fs.unlink(filePath);
        if (err) {
          console.log(new Date().toISOString(), err);
          res.status(err.status).end();
        }
        else {
          console.log('Sent:', filename);
        }
      });
    }, function (reason) {
      console.log('export failed', reason);
      return next(reason);
    });
  }, function (err) {
    return next(err);
  });
};