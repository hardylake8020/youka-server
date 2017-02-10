/**
 * Created by Wayne on 16/3/22.
 */

/* 自动运行的程序*/

'use strict';

var orderTimer = require('../app/timer/order');
var tenderTimer = require('../app/timer/tender');
module.exports = function () {
  tenderTimer.checkTenderStart();
  // orderTimer.startPickupDeferredClock();
  // orderTimer.startDeliveryEarlyClock();
  //orderTimer.startCheckOrderConfirmClock();
};