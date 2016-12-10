'use strict';

var path = require('path'),
  async = require('async'),
  tenderService = require('../services/tender'),
  depositLogService = require('../services/deposit_log'),
  bidderService = require('../services/bidder'),
  smsLib = require('../sms'),
  jsxlsxUtil = require('../jsxlsx_util');

var error = require('../../errors/all');

exports.getCompanyBidderDetail = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  bidderService.getCompanyBidderDetail(company._id, function (err, bidders) {
    return res.send(err || bidders);
  });
};

exports.exportCompanyBidder = function(req, res, next){
  var currentUser = req.user || {};
  var company = currentUser.company || {};

  bidderService.getCompanyBidderDetail(company._id, function (err, bidders) {
    if(err){
      next(bidders);
    }
    var wb = jsxlsxUtil.Workbook();

    //合作司机
    var rows = [['手机号', '姓名']];
    for(var i = 0, len = bidders.length; i < len; i++){
      var d = bidders[i];
      var row = [];
      row.push(d.username);
      if(d.real_names){
        row.push(d.real_names[company._id.toString()]);
      }else{
        row.push(null);
      }
      rows.push(row);
    }
    var ws = jsxlsxUtil.sheet_from_array_of_arrays(rows);
    var ws_name = '合作中介';
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;

    var data = jsxlsxUtil.write(wb, {type: 'buffer'});
    res.setHeader('Content-disposition', 'attachment; filename=bidders.xlsx');
    return res.send(new Buffer(data));
  });
};

exports.createCompanyBidder = function (req, res, next) {
  var currentUser = req.user || {};
  var company = currentUser.company || {};
  var username = req.body.username || '';
  var real_name = req.body.real_name || '';

  if (!username || !username.testPhone()) {
    return res.send({err: error.business.bidder_username_invalid});
  }
  if(!real_name){
    return res.send({err: error.business.bidder_real_name_invalid});
  }

  async.auto({
    getBidder: function (autoCallback) {
      bidderService.getByUsername(username, function(err, bidder) {
        if (err) {
          return autoCallback(err);
        }
        if (!bidder) {
          return autoCallback({err: error.business.bidder_not_exist});
        }

        if (!bidder.wechat_profile || !bidder.wechat_profile.openid) {
          var phone = bidder.username;
          if(phone){
            smsLib.sendBidderForWechat(phone);
          }
        }
        return autoCallback(null, bidder);
      });
    },
    isCooperate: ['getBidder', function (autoCallback, result) {
      if (!real_name && result.getBidder.cooperate_companies.indexOf(company._id.toString()) > -1) {
        return autoCallback({err: error.business.bidder_company_exist});
      }
      return autoCallback();
    }],
    createCooperate: ['getBidder', 'isCooperate', function (autoCallback, result) {
      bidderService.addCooperateCompany2(result.getBidder._id, company._id, real_name, function (err) {
        return autoCallback(err);
      });
    }]
  }, function (err, result) {
    if (err) {
      return res.send(err);
    }
    var json = {};
    if(result.getBidder.cooperate_companies.indexOf(company._id.toString()) != -1){
      json.update_success = true;
    }else{
      json.add_success = true;
    }
    return res.send(json);
  });
};

exports.getPlatformBidderCount = function (req, res, next) {

  bidderService.queryPlatformBidderCount(function (err, count) {
    return res.send(err || {count: count});
  });
};

exports.getPlatformBidderList = function (req, res, next) {
  ////var user = req.user;
  //var currentPage = parseInt(req.query.current_page) || 1;
  //var limitCount = parseInt(req.query.limit) || 10;
  //var depositStatus = req.query.deposit_status || '';
  //var name = req.query.name || '';
  //var sort = req.query.sort || {};
  //
  //bidderService.queryPlatformBidders({
  //  deposit_status: depositStatus,
  //  name: name
  //}, currentPage, limitCount, sort, function (err, result) {
  //  return res.send(err || result);
  //});

  var searchCondition = {
    searchText: req.query.search_text || '',
    depositStatus: req.query.deposit_status || '',
    startTime: req.query.start_time || '',
    endTime: req.query.end_time || '',
    sortName: req.query.sort_name || '',
    sortValue: parseInt(req.query.sort_value) || -1,
    currentPage: parseInt(req.query.current_page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  if (searchCondition.startTime) {
    searchCondition.startTime = new Date(searchCondition.startTime);
    if (!searchCondition.startTime.getTime()) {
      searchCondition.startTime = '';
    }
  }
  if (searchCondition.endTime) {
    searchCondition.endTime = new Date(searchCondition.endTime);
    if (!searchCondition.endTime.getTime()) {
      searchCondition.endTime = '';
    }
  }

  bidderService.queryPlatformBidders(searchCondition, function (err, result) {
    if (err) {
      return res.send(err);
    }
    return res.send(result);
  });

};

exports.getDepositLog = function (req, res, next) {
  var bidderId = req.query.bidder_id;
  if (!bidderId) {
    return res.send({err: error.params.invalid});
  }
  depositLogService.getListByBidderId(bidderId, null, null, function (err, list) {
    return res.send(err || list);
  });
};

exports.removeBreach = function (req, res, next) {
  var user = req.user;
  var bidder = req.bidder;

  if (bidder.deposit_status !== 'freeze') {
    return res.send({err: error.business.bidder_deposit_status_invalid});
  }

  async.auto({
    updateTenders: function (autoCallback) {
      tenderService.removeBreach(bidder._id, function (err, tenders) {
        return autoCallback(err, tenders);
      });
    },
    updateBidder: ['updateTenders', function (autoCallback, result) {
      var tenders = result.updateTenders || [];

      bidderService.removeBreach(user._id, bidder, tenders, function (err) {
        return autoCallback(err);
      });
    }]

  }, function (err, result) {
    return res.send(err || {success: true});
  });
};

exports.deductBreach = function (req, res, next) {
  var user = req.user;
  var bidder = req.bidder;

  if (bidder.deposit_status !== 'freeze') {
    return res.send({err: error.business.bidder_deposit_status_invalid});
  }

  async.auto({
    updateTenders: function (autoCallback) {
      tenderService.deductBreach(bidder._id, function (err, tenders) {
        return autoCallback(err, tenders);
      });
    },
    updateBidder: ['updateTenders', function (autoCallback, result) {
      var tenders = result.updateTenders || [];

      bidderService.deductBreach(user._id, bidder, tenders, function (err) {
        return autoCallback(err);
      });
    }]

  }, function (err, result) {
    return res.send(err || {success: true});
  });
};

exports.removeCompanyBidder = function(req, res, next){
  var currentUser = req.user || {};
  var company = currentUser.company || {};
  var username = req.body.username || '';

  if (!username || !username.testPhone()) {
    return res.send({err: error.business.bidder_username_invalid});
  }

  bidderService.removeCompanyBidder(username, company._id, function(err) {
    if (err) {
      console.log(err);
      return res.send({status: 'error', err: err});
    } else {
      return res.send({status: 'success'});
    }
  });
};