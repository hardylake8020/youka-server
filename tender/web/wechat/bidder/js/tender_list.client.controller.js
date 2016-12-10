/**
 * Created by Wayne on 16/1/28.
 */

function TenderList(type, orderClickHandle) {
  var self = this;

  this.element = $('\
  <div class="zz-order-list">\
    <div class="zz-tip"></div>\
  </div>\
  ');

  this.element.attr('type', type);
  this.type = type;

  self.isLoading = false;
  var hasLoaded = false;
  var limit = 5;
  var currentPage = 0;
  var statuses = {
    inProgress: ['unQuoted', 'quoted'],
    success: ['success'],
    failed: ['failed']
  };
  var tipElement = self.element.children('.zz-tip');

  function init() {
    hasLoaded = false;
    currentPage = 0;
    self.element.children('.zz-tender-item').remove();
  }

  function showTip(message) {
    tipElement.text(message);
    tipElement.show();
  }

  function hideTip() {
    tipElement.text('');
    tipElement.hide();
  }

  function hasOrderItem() {
    return self.element.children('.zz-tender-item').length > 0;
  }

  this.refresh = function (callback) {
    if (!self.isLoading) {
      self.isLoading = true;
      init();
      loadOrders(callback);
    }
    else {
      return callback(false);
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
      url: '/wechat/tender_list',
      method: 'post',
      data: {
        bidder_id: window.bidder_id,
        skip: limit * currentPage,
        limit: limit,
        statuses: statuses[self.type]
      },
      success: function (data) {
        hideTip();
        console.log(data);
        if (!data.err) {
          if (data.length > 0) {
            appendOrderItem(data);
            currentPage += 1;
          }
          else {
            if (!hasOrderItem()) {
              showTip('当前没有标书');
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

  function appendOrderItem(bidRecordArray) {
    for (var i = 0; i < bidRecordArray.length; i++) {
      appendOrder(bidRecordArray[i], i);
    }
  }

  function appendOrder(bidRecord, i) {
    setTimeout(function () {
      var orderItem = new TenderItem(bidRecord, orderClickHandle);
      self.element.append(orderItem.element);
      orderItem.element.addClass('bounceInLeft');
      setTimeout(function () {
        orderItem.element.removeClass('bounceInLeft');
      }, 1000);
    }, i * 200);
  }
}

function TenderItem(bidRecord, orderClicked) {
  var self = this;

  this.element = $('\
  <div class="zz-tender-item animated bounceInLeft">\
    <div class="content">\
      <div class="address">\
        <p class="text">\
          <span class="pickup"></span>\
          <span class="line">—</span>\
          <span class="delivery"></span>\
        </p>\
        <p class="price">\
          <span class="text"></span>\
          <span class="unit">元</span>\
        </p>\
      </div>\
      <div class="time">\
        <p class="tip">装货时间</p>\
        <p class="text"></p>\
      </div>\
      <div class="truck">\
        <p class="tip">普通货车</p>\
        <p class="text">\
          <span class="type"></span>\
          <span class="count"></span>\
        </p>\
        <p class="status">\
          <span class="text"></span>\
        </p>\
      </div>\
    </div>\
  </div>');

  this.element.addClass(bidRecord.status);
  this.element.find('.content .address .text .pickup').text(bidRecord.tender.pickup_city);
  this.element.find('.content .address .text .delivery').text(bidRecord.tender.delivery_city);
  this.element.find('.content .address .price .text').text(bidRecord.current_price.toFixed(2));

  this.element.find('.content .time .text').text(window.zzCommon.getPeriodTimeString(bidRecord.tender.pickup_start_time, bidRecord.tender.pickup_end_time));

  this.element.find('.content .truck .text .type').text(bidRecord.tender.truck_type);
  this.element.find('.content .truck .text .count').text(bidRecord.tender.truck_count + '辆');

  var statusText = this.element.find('.content .truck .status .text');
  switch(bidRecord.status) {
    case 'unQuoted':
      statusText.text('剩余' + window.zzCommon.formatRemainTime(new Date(bidRecord.tender.end_time).getTime() - Date.now()));
      break;
    case 'quoted':
      statusText.text('已报价');
      break;
    case 'success':
      statusText.text('已中标');
      break;
    case 'failed':
      statusText.text('未中标');
      break;
    default:
      break;
  }

  this.element.click(function () {
    orderClicked(bidRecord);
  });

}