/**
 * Created by Wayne on 16/1/29.
 */
function ZZTenderDetail(detailInformHandle) {
  var self = this;

  this.element = $('\
  <div class="zz-tender-detail">\
    <div class="sm-header">\
      <img class="left detail-back" src="/wechat/bidder/images/nav_back.png">\
      <div class="center"></div>\
    </div>\
    <div class="detail">\
      <div class="result-tip">\
        <p class="text"></p>\
      </div>\
      <div class="address">\
        <div class="pickup">\
          <p class="province"></p>\
          <p class="region"></p>\
        </div>\
        <div class="to">至</div>\
        <div class="delivery">\
          <p class="province"></p>\
          <p class="region"></p>\
        </div>\
      </div>\
      <div class="info-container">\
        <div class="title">\
          <div class="key">要求车辆</div>\
          <div class="value truck">\
            <p class="type"></p>\
            <p class="count"></p>\
          </div>\
        </div>\
        <div class="item-container">\
          <div class="item">\
            <div class="key">运单号</div>\
            <div class="value order-number"></div>\
          </div>\
          <div class="item">\
            <div class="key">参考单号</div>\
            <div class="value refer-order-number"></div>\
          </div>\
          <div class="item">\
            <div class="key">货物</div>\
            <div class="value goods">\
            </div>\
          </div>\
          <div class="item">\
            <div class="key">注意事项</div>\
            <div class="value remark"></div>\
          </div>\
          <div class="item">\
            <div class="key"></div>\
            <div class="value hasvalue remark-button">展开</div>\
          </div>\
        </div>\
        <div class="title">\
          <div class="key">提货时间</div>\
          <div class="value pickup-time"></div>\
        </div>\
        <div class="item-container">\
          <div class="item">\
            <div class="key">提货地址</div>\
            <div class="value pickup-address"></div>\
          </div>\
          <div class="item">\
            <div class="key">提货联系人</div>\
            <div class="value pickup-name"></div>\
          </div>\
          <div class="item">\
            <div class="key">手机</div>\
            <a class="value pickup-mobile-phone phone"></a>\
          </div>\
          <div class="item">\
            <div class="key">固话</div>\
            <a class="value pickup-tel-phone phone"></a>\
          </div>\
        </div>\
        <div class="title">\
          <div class="key">交货时间</div>\
          <div class="value delivery-time"></div>\
        </div>\
        <div class="item-container">\
          <div class="item">\
            <div class="key">交货地址</div>\
            <div class="value delivery-address"></div>\
          </div>\
          <div class="item">\
            <div class="key">交货联系人</div>\
            <div class="value delivery-name"></div>\
          </div>\
          <div class="item">\
            <div class="key">手机</div>\
            <a class="value delivery-mobile-phone phone"></a>\
          </div>\
          <div class="item">\
            <div class="key">固话</div>\
            <a class="value delivery-tel-phone phone"></a>\
          </div>\
        </div>\
        <div class="title">\
          <div class="key">支付方式</div>\
          <div class="value hasvalue">首付＋尾款＋回单</div>\
        </div>\
        <div class="item-container">\
          <div class="item">\
            <div class="key">首付</div>\
            <div class="value top-rate">\
              <p class="text1 column"></p>\
              <p class="text2 column">\
                <span class="left">现金</span>\
                <span class="right"></span>\
              </p>\
              <p class="text3 column">\
                <span class="left">油卡</span>\
                <span class="right"></span>\
              </p>\
            </div>\
          </div>\
          <div class="item">\
            <div class="key">尾款</div>\
            <div class="value tail-rate">\
              <p class="text1 column"></p>\
              <p class="column">\
                <span class="left">现金支付</span>\
              </p>\
            </div>\
          </div>\
          \
          <div class="item">\
            <div class="key">回单</div>\
            <div class="value last-rate">\
              <p class="text1 column"></p>\
              <p class="column">\
                <span class="left">现金支付</span>\
              </p>\
            </div>\
          </div>\
          \
        </div>\
      </div>\
      <div class="driver-container">\
      </div>\
    </div>\
    <div class="price-box">\
    </div>\
    <div class="apply-driver">\
    </div>\
  </div>');

  this.element.find('.detail-back').click(function () {
    self.hide();
  });

  this.element.find('.info-container .item-container .item .remark-button').click(function () {
    var element = $(this);
    var remarkElement = self.element.find('.info-container .item-container .item .remark');
    //已经展开则收起
    if (element.hasClass('expand')) {
      remarkElement.removeClass('expand');
      element.text('展开');
      element.removeClass('expand');
    }
    else {
      remarkElement.addClass('expand');
      element.text('收起');
      element.addClass('expand');
    }

  });


  var curBidRecord = null;
  this.show = function (bidRecord) {
    curBidRecord = bidRecord;
    this.element.removeClass();
    this.element.addClass('zz-tender-detail');
    this.element.addClass(bidRecord.status);

    setBidResult();

    setValue('address .pickup .province', bidRecord.tender.pickup_city);
    setValue('address .pickup .region', bidRecord.tender.pickup_region);
    setValue('address .delivery .province', bidRecord.tender.delivery_city);
    setValue('address .delivery .region', bidRecord.tender.delivery_region);

    setValue('center', getPageTitle(bidRecord));
    setValue('order-number', bidRecord.tender.order_number);
    setValue('refer-order-number', bidRecord.tender.refer_order_number);
    setValue('truck .type', bidRecord.tender.truck_type);
    setValue('truck .count', bidRecord.tender.truck_count + ' 辆');
    setValue('remark', bidRecord.tender.remark);
    insertGoods(bidRecord.tender.goods);

    setValue('pickup-time', window.zzCommon.getPeriodTimeString(bidRecord.tender.pickup_start_time, bidRecord.tender.pickup_end_time));
    setValue('pickup-address', bidRecord.tender.pickup_address);
    setValue('pickup-name', bidRecord.tender.pickup_name);
    setValue('pickup-mobile-phone', bidRecord.tender.pickup_mobile_phone);
    setValue('pickup-tel-phone', bidRecord.tender.pickup_tel_phone);

    highlightElement('.pickup-mobile-phone', bidRecord.tender.pickup_mobile_phone);
    highlightElement('.pickup-tel-phone', bidRecord.tender.pickup_tel_phone);

    setValue('delivery-time', window.zzCommon.getPeriodTimeString(bidRecord.tender.delivery_start_time, bidRecord.tender.delivery_end_time));
    setValue('delivery-address', bidRecord.tender.delivery_address);
    setValue('delivery-name', bidRecord.tender.delivery_name);
    setValue('delivery-mobile-phone', bidRecord.tender.delivery_mobile_phone);
    setValue('delivery-tel-phone', bidRecord.tender.delivery_tel_phone);

    highlightElement('.delivery-mobile-phone', bidRecord.tender.delivery_mobile_phone);
    highlightElement('.delivery-tel-phone', bidRecord.tender.delivery_tel_phone);

    setValue('top-rate .text1', bidRecord.tender.payment_top_rate + '%');
    setValue('top-rate .text2 .right', bidRecord.tender.payment_top_cash_rate + '%');
    setValue('top-rate .text3 .right', bidRecord.tender.payment_top_card_rate + '%');

    setValue('tail-rate .text1', bidRecord.tender.payment_tail_rate + '%');
    setValue('tail-rate .text2 .right', bidRecord.tender.payment_tail_cash_rate + '%');
    setValue('tail-rate .text3 .right', bidRecord.tender.payment_tail_card_rate + '%');

    setValue('last-rate .text1', bidRecord.tender.payment_last_rate + '%');
    setValue('last-rate .text2 .right', bidRecord.tender.payment_last_cash_rate + '%');
    setValue('last-rate .text3 .right', bidRecord.tender.payment_last_card_rate + '%');


    self.element.find('.price-box').empty();
    self.element.find('.driver-container').empty();
    self.element.find('.apply-driver').empty();

    if (bidRecord.status === 'success') {
      insertDriverBox(bidRecord);
    }
    else {
      insertQuoteBox(bidRecord);
    }

    if (!bidRecord.has_preview) {
      recordPreviewTender();
    }

    self.element.addClass('show');
  };
  this.hide = function () {
    self.element.removeClass('show');
  };
  this.hideBack = function () {
    this.element.find('.detail-back').hide();
  };
  this.update = function (params) {
  };

  function highlightElement(className, value) {
    var element = self.element.find(className);
    if (value) {
      element.attr('href', 'tel:' + value);
      element.addClass('highlight');
    }
    else {
      element.removeAttr('href');
      element.removeClass('highlight');
    }
  }

  function setValue(className, value) {
    var item = self.element.find('.' + className);
    if (value) {
      item.addClass('hasvalue');
    }
    else {
      item.removeClass('hasvalue');
    }
    item.text(value || '未填');
  }

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
      return [{name: '未填', count: ''}];
    }
    var result = [];
    if (goods) {
      goods.forEach(function (good) {
        result.push({name: (good.name || '未填'), count: getOrderGoodsSingleCountDetail(good)});
      });
    }
    return result;
  }

  function insertGoods(goods) {
    var goodsContainer = self.element.find('.goods');
    goodsContainer.empty();

    goods = getGoodsInfo(goods);
    goods.forEach(function (item) {
      var goodItem = $('<p class="text">\
                          <span class="name"></span>\
                          <span class="count"></span>\
                        </p>');
      goodItem.find('.name').text(item.name);
      if (item.name || item.name !== '未填') {
        goodItem.find('.name').addClass('hasvalue');
      }
      goodItem.find('.count').text(item.count);
      if (item.count || item.count !== '未知数量') {
        goodItem.find('.count').addClass('hasvalue');
      }
      goodsContainer.append(goodItem);
    });
  }

  function insertQuoteBox(bidRecord) {
    var quoteContainer = self.element.find('.price-box');
    quoteContainer.empty();

    var quoteItem = $('<div class="input-price">\
                        <p class="tip"></p>\
                        <input class="text" placeholder="请输入金额">\
                       </div>\
                       <p class="submit"></p>');

    switch (bidRecord.status) {
      case 'unQuoted':
        quoteItem.find('.tip').text('我的报价');
        quoteItem.find('.text').bind('input propertychange', function () {
          var inputItem = $(this);
          var text = inputItem.val();
          inputItem.val(limitNumber(text));
        });
        quoteItem.siblings('.submit').text('立即报价');
        quoteItem.siblings('.submit').click(function () {
          quoteTender(quoteItem.find('.text').val());
        });
        break;
      case 'quoted':
        quoteItem.find('.tip').text('我的报价');
        quoteItem.find('.text').attr('readonly', 'readonly');
        quoteItem.find('.text').val(bidRecord.current_price.toFixed(2));
        quoteItem.siblings('.submit').text('已报价');
        break;
      case 'failed':
        quoteItem.find('.tip').text('我的报价');
        quoteItem.find('.text').attr('readonly', 'readonly');
        quoteItem.find('.text').val(bidRecord.current_price.toFixed(2));
        quoteItem.siblings('.submit').text('未中标');
        break;
      default:
        break;
    }

    quoteContainer.append(quoteItem);
  }

  function insertDriverBox(bidRecord) {
    var applyDriverContainer = self.element.find('.apply-driver');
    applyDriverContainer.empty();
    var driverContainer = self.element.find('.driver-container');
    driverContainer.empty();

    if (!bidRecord.tender.order) {
      for (var i = 0; i < bidRecord.tender.truck_count; i++) {
        var driverItem = $('\
                            <div class="driver-item">\
                              <p class="tip"></p>\
                              <input class="text" placeholder="请输入司机手机号">\
                            </div>');

        driverItem.find('.text').bind('input propertychange', function () {
          var inputItem = $(this);
          var text = inputItem.val();
          inputItem.val(limitMobilePhone(text));
        });

        driverItem.find('.tip').text('司机' + (i + 1));
        driverContainer.append(driverItem);
      }

      var applyButton = $('<p class="text">立即分配</p>');

      applyButton.click(function () {
        var detailElement = self.element.find('.detail');
        detailElement.animate({scrollTop: detailElement[0].scrollHeight}, 500);

        var phone = self.element.find('.driver-container .driver-item .text');
        var phoneArray = [];
        phone.each(function () {
          var item = $(this).val();
          if (item.testPhone()) {
            phoneArray.push(item);
          }

        });
        applyDrivers(phoneArray);
      });
      applyDriverContainer.append(applyButton);
    }
    else {
      for (var i = 0; i < bidRecord.tender.carry_drivers.length; i++) {
        var driverItem = $('\
                            <div class="driver-item">\
                              <p class="tip"></p>\
                              <input class="text" readonly>\
                            </div>');

        driverItem.find('.tip').text('司机' + (i + 1));
        driverItem.find('.text').val(bidRecord.tender.carry_drivers[i].username);
        driverContainer.append(driverItem);
      }

      var applyButton = $('<p class="text">分配成功</p>');
      var orderDetailButton = $('<p class="order-detail-button">查看运单</p>');
      orderDetailButton.click(function () {
        visitOrderDetailPage();
      });

      applyDriverContainer.append(applyButton);
      applyDriverContainer.append(orderDetailButton);
    }
  }

  function setBidResult() {
    var resultTextElement = self.element.find('.result-tip .text');
    resultTextElement.children().remove();

    if (curBidRecord.status === 'success') {
      var tipElement = $('\
        <span>您中标了  中标价 </span>\
        <span class="price"></span>\
        <span>元</span>\
        <span>选标原因：</span>\
        <span class="reason"></span>\
        ');
      resultTextElement.append(tipElement);
      resultTextElement.find('.price').text(curBidRecord.current_price);
      resultTextElement.find('.reason').text(curBidRecord.tender.winner_reason || '无');
    }
    else if (curBidRecord.status === 'failed') {
      if (curBidRecord.tender.winner_price > 0) {
        var tipElement = $('\
          <span>很遗憾，您未中标。中标价：</span>\
          <span class="price"></span>\
          <span>元</span>\
          <span> 中标人：</span>\
          <span class="phone"></span>\
          <span>选标原因：</span>\
          <span class="reason"></span>\
          ');
        resultTextElement.append(tipElement);
        resultTextElement.find('.price').text(curBidRecord.tender.winner_price);

        var currentWinner = curBidRecord.tender.all_bidders.filter(function (item) {
          return item._id === curBidRecord.tender.bidder_winner;
        })[0];
        resultTextElement.find('.phone').text(getSecurityPhone(currentWinner ? currentWinner.username : ''));

        resultTextElement.find('.reason').text(curBidRecord.tender.winner_reason || '无');
      }
      else {
        var tipElement = $('\
          <span>很遗憾，您未中标，标书已过期。</span>')
        resultTextElement.append(tipElement);
      }

    }
    else if (curBidRecord.status === 'obsolete') {
      var tipElement = $('\
          <span>很遗憾，您未中标，标书已过期。</span>')
      resultTextElement.append(tipElement);
    }
  }

  function getSecurityPhone(phone) {
    if (!phone || !phone.testPhone()) {
      return '未知号码';
    }
    return [phone.substring(0, 3), '****', phone.substring(7, 11)].join('');
  }

  function getPageTitle(bidRecord) {
    var title = '待报价';

    switch (bidRecord.status) {
      case 'unQuoted':
        title = '待报价';
        break;
      case 'quoted':
        title = '竞标中';
        break;
      case 'success':
        if (bidRecord.tender.order) {
          title = '已中标';
        }
        else {
          title = '已中标（分配司机）';
        }
        break;
      case 'failed':
        title = '未中标';
        break;
      case 'obsolete':
        title = '已过期';
        break;
      default:
        break;
    }
    return title;
  }

  var numberRegex = /[^\d{1}\.\d{1}|\d{1}]/g;

  function limitNumber(numberString) {
    var result = numberString.replace(numberRegex, '');
    if (result.indexOf('.') == 0) {
      result = '';
    }
    else if (result.indexOf('.') < result.lastIndexOf('.')) {
      result = result.substr(0, result.length - 1);
    }
    return result;
  }

  var phoneRegex = /[^\d{1}]/g;

  function limitMobilePhone(phoneString) {
    var result = phoneString.replace(phoneRegex, '');
    result = result.substr(0, 11);

    return result;
  }


  function recordPreviewTender() {
    window.zzLoading.show();
    $.ajax({
      url: '/wechat/preview_tender',
      method: 'get',
      data: {
        bidder_id: curBidRecord.bidder,
        bid_record_id: curBidRecord._id
      },
      success: function (data) {
        window.zzLoading.hide();
        console.log(data);

        if (data.success) {
          curBidRecord.has_preview = true;
        }
      },
      error: function (err) {
        window.zzLoading.hide();
        console.log(err);
      }
    });
  }

  function quoteTender(price) {
    if (!curBidRecord || !curBidRecord.tender._id || !curBidRecord.bidder) {
      return window.zzAlert.show('竞标纪录不存在');
    }
    if (curBidRecord.status !== 'unQuoted') {
      return window.zzAlert.show('当前不能报价');
    }
    if (!price) {
      return window.zzAlert.show('请输入金额');
    }
    price = parseFloat(price) || 0;
    if (!price || !isFinite(price)) {
      return window.zzAlert.show('金额不正确');
    }

    window.zzLoading.show();
    $.ajax({
      url: '/wechat/quote',
      method: 'post',
      data: {
        tender_id: curBidRecord.tender._id,
        bidder_id: curBidRecord.bidder,
        price: price
      },
      success: function (data) {
        window.zzLoading.hide();
        console.log(data);
        if (data.err) {
          if (detailInformHandle) {
            detailInformHandle({type: data.err.type});
          }

          return window.zzAlert.show(data.err.zh_message);
        }

        //通知
        if (detailInformHandle) {
          detailInformHandle({type: 'quote_success'});
        }
        window.zzAlert.show('报价成功');
        window.location.reload();
      },
      error: function (err) {
        window.zzLoading.hide();
        return window.zzAlert.show('报价失败');
      }
    });
  }

  function applyDrivers(drivers) {
    if (!curBidRecord || !curBidRecord.tender._id || !curBidRecord.bidder) {
      return window.zzAlert.show('竞标纪录不存在');
    }
    if (curBidRecord.status !== 'success' || curBidRecord.tender.status !== 'completed') {
      return window.zzAlert.show('当前不能分配司机');
    }
    if (!drivers || drivers.length < curBidRecord.tender.truck_count) {
      return window.zzAlert.show('请填写完整所有待分配司机手机号');
    }

    window.zzLoading.show();
    $.ajax({
      url: '/wechat/apply_driver',
      method: 'post',
      data: {
        tender_id: curBidRecord.tender._id,
        bidder_id: curBidRecord.bidder,
        drivers: drivers
      },
      success: function (data) {
        window.zzLoading.hide();
        console.log(data);
        if (data.err) {
          if (detailInformHandle) {
            detailInformHandle({type: data.err.type});
          }
          return window.zzAlert.show(data.err.zh_message);
        }

        //通知
        if (detailInformHandle) {
          detailInformHandle({type: 'apply_driver_success'});
        }
        window.zzAlert.show('分配成功');
        window.location.reload();
      },
      error: function (err) {
        window.zzLoading.hide();
        return window.zzAlert.show('分配失败');
      }
    });
  }

  function visitOrderDetailPage() {
    if (!curBidRecord || !curBidRecord.tender._id || !curBidRecord.bidder) {
      return window.zzAlert.show('竞标纪录不存在');
    }
    if (!curBidRecord.tender.order) {
      return window.zzAlert.show('请先分配运单');
    }

    window.location.href = '/wechat/single_order_page?bidder_id=' + curBidRecord.bidder + '&tender_id=' + curBidRecord.tender._id;
  }

}