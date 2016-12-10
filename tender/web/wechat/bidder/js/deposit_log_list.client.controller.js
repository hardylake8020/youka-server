/**
 * Created by Wayne on 16/4/12.
 */

'use strict';

/**
 * Created by Wayne on 16/1/28.
 */

function ZZDepositLogList() {
  var self = this;

  this.element = $('\
  <div class="zz-deposit-log-list zz-order-list">\
    <div class="zz-tip"></div>\
  </div>\
  ');

  self.isLoading = false;
  var hasLoaded = false;
  var limit = 5;
  var currentPage = 0;
  var tipElement = self.element.children('.zz-tip');

  function init() {
    hasLoaded = false;
    currentPage = 0;
    self.element.children('.zz-deposit-log-item').remove();
  }

  function showTip(message) {
    tipElement.text(message);
    tipElement.show();
  }

  function hideTip() {
    tipElement.text('');
    tipElement.hide();
  }

  function hasDepositLogItem() {
    return self.element.children('.zz-deposit-log-item').length > 0;
  }

  this.refresh = function (callback) {
    if (!self.isLoading) {
      self.isLoading = true;
      init();
      loadOrders(callback);
    }
    else {
      if (callback)
        callback(false);
    }
  };
  this.loadMore = function (callback) {
    if (!self.isLoading) {
      self.isLoading = true;
      loadOrders(callback);
    }
    else {
      return callback(false);
    }
  };
  this.load = function (callback) {
    if (hasLoaded) {
      return callback(false);
    }

    if (!self.isLoading) {
      self.isLoading = true;
      loadOrders(callback);
    }
    else {
      return callback(false);
    }
  };

  function loadOrders(callback) {
    showTip('加载中...');
    $.ajax({
      url: '/wechat/bidder_deposit_log_list',
      method: 'post',
      data: {
        bidder_id: window.bidder_id,
        skip: limit * currentPage,
        limit: limit
      },
      success: function (data) {
        hideTip();
        console.log(data);
        if (!data.err) {
          if (data.length > 0) {
            appendDepositLogItem(data);
            currentPage += 1;
          }
          else {
            if (!hasDepositLogItem()) {
              showTip('当前没有纪录');
            }
          }
        }

        //防止短时间内重复刷行
        setTimeout(function () {
          self.isLoading = false;
        }, 2000);

        hasLoaded = true;

        if (callback) {
          return callback(true);
        }
      },
      error: function (err) {
        hideTip();
        self.isLoading = false;

        alert(JSON.stringify(err));
        if (callback) {
          return callback(true);
        }
      }
    });
  }

  function appendDepositLogItem(logArray) {
    for (var i = 0; i < logArray.length; i++) {
      appendLog(logArray[i], i);
    }
  }

  function appendLog(log, i) {
    setTimeout(function () {
      var logItem = new ZZDepositLogItem(log);
      self.element.append(logItem.element);
      logItem.element.addClass('bounceInLeft');
      setTimeout(function () {
        logItem.element.removeClass('bounceInLeft');
      }, 1000);
    }, i * 200);
  }
}

function ZZDepositLogItem(log) {
  this.element = $('\
  <div class="zz-deposit-log-item animated bounceInLeft">\
    <div class="content">\
      <p class="icon">●</p>\
      <div class="detail">\
        <p class="title">\
          <span class="text description"></span>\
          <span class="text amount"></span>\
        </p>\
        <p class="subtitle"></p>\
      </div>\
      <p class="time"></p>\
    </div>\
  </div>');

  this.element.addClass(log.type);
  this.element.find('.detail .title .description').text(getTypeText(log.type));
  if (log.amount) {
    this.element.find('.detail .title .amount').text(' ¥ ' + log.amount);
  }
  this.element.find('.detail .subtitle').text(getAnnotationText(log));
  this.element.find('.time').text(new Date(log.created).Format('yyyy-M-d'));

  function getBreachTypeText(breachType) {
    var textObject = {
      '': '未知',
      pickup: '未按约定时间提货',
      delivery: '未按约定时间交货'
    }
    return textObject[breachType];
  }

  function getAnnotationText(log) {
    var annotationObject = {
      save: '开启报价权限',
      extract: '取消报价权限',
      breachFreeze: getBreachTypeText(log.breach_type),
      breachRemoved: '开启报价权限',
      breachDeducted: '取消报价权限'
    };

    return annotationObject[log.type];
  }

  function getTypeText(type) {
    var typeObject = {
      save: '存入保证金',
      extract: '提取保证金',
      breachFreeze: '违约待确认',
      breachRemoved: '违约被解除',
      breachDeducted: '保证金被扣除'
    };

    return typeObject[type];
  }

}