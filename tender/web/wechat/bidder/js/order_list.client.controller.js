/**
 * Created by Wayne on 16/1/28.
 */

function OrderList(type, orderClickHandle) {
  var self = this;

  this.element = $('\
    <div class="zz-order-list">\
      <div class="zz-tip"></div>\
    </div>');

  this.element.attr('type', type);
  this.type = type;

  self.isLoading = false;
  var hasLoaded = false;
  var limit = 5;
  var currentPage = 0;
  var statuses = {
    unPickup: ['unPickupSigned', 'unPickuped'],
    unDelivery: ['unDeliverySigned', 'unDeliveried'],
    completed: ['completed']
  };
  var tipElement = self.element.children('.zz-tip');

  function init() {
    hasLoaded = false;
    currentPage = 0;
    self.element.children('.zz-order-item').remove();
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
    return self.element.children('.zz-order-item').length > 0;
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
      url: '/wechat/order_list',
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
              showTip('当前没有运单');
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

  function appendOrderItem(orderArray) {
    for (var i = 0; i < orderArray.length; i++) {
      appendOrder(orderArray[i], i);
    }
  }

  function appendOrder(order, i) {
    setTimeout(function () {
      var orderItem = new OrderItem(order, orderClickHandle);
      self.element.append(orderItem.element);
      orderItem.element.addClass('bounceInLeft');
      setTimeout(function () {
        orderItem.element.removeClass('bounceInLeft');
      }, 1000);
    }, i * 200);
  }
}

function OrderItem(order, orderClicked) {
  var self = this;

  this.element = $(
    '<div class="zz-order-item animated bounceInLeft">'
    + '<div class="item-header">'
    + '<div class="order-number">' + order.order_details.order_number + '</div>'
    + '<div class="receiver">' + (order.receiver_name || '') + '</div>'
    + '</div>'
    + '<div class="item-body">'
    + '<div class="goods-info">' + getGoodsInfo(order.order_details.goods) + '</div>'
    + '<div class="address-container">'
    + '<div class="address-item">' + (order.pickup_contacts.address || '提货地址未填写 ') + '</div>'
    + '<div class="address-item">' + (order.delivery_contacts.address || '交货地址未填写 ') + '</div>'
    + '</div>'
    + '</div>'
    + '<img class="item-icon" src="/wechat/bidder/images/location.png">'
    + '</div>');

  this.element.click(function () {
    orderClicked(order);
  });

  function getOrderGoodsSingleCountDetail(goodsItem) {
    if (!goodsItem) {
      return '未知数量';
    }

    var itemDetail = '';
    itemDetail += (goodsItem.count ? (goodsItem.count + goodsItem.unit) : '');
    itemDetail += (goodsItem.count2 ? ('/' + goodsItem.count2 + goodsItem.unit2) : '');
    itemDetail += (goodsItem.count3 ? ('/' + goodsItem.count3 + goodsItem.unit3) : '');
    itemDetail = itemDetail || '未知数量';

    if (itemDetail.indexOf('/') === 0) {
      itemDetail = itemDetail.substring(1);
    }

    return itemDetail;
  }
  function getGoodsInfo(goods) {
    if (!goods || goods.length === 0) {
      return '货物名称未填写';
    }
    var result = [];
    if (goods) {
      goods.forEach(function (good) {
        result.push((good.name || '未填货物') + ' ' + getOrderGoodsSingleCountDetail(good));
      });
    }

    return result.join(', ');
  }
}