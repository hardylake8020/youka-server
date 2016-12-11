/**
 * Created by Wayne on 16/3/22.
 */

/* 自动运行的程序*/

'use strict';


var tenderService = require('../../libraries/services/tender');
var bidderService = require('../../libraries/services/bidder');
module.exports = function () {
  // tenderService.startTenderClock();  //启动检查标书已到开始时间的定时器
  // tenderService.endTenderClock();  //启动检查标书已到结束时间的定时器
  //tenderService.startPickupBreachClock();  //启动检查标书提货违约
  //tenderService.startDeliveryBreachClock();  //启动检查标书交货违约



  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production-test') {
    bidderService.insertBidder();
  }
};