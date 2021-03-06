/**
 * Created by zenghong on 2017/4/26.
 */

var baseUrl = 'https://' + window.location.host;
var tenders = [];
window.localStorage.setItem('tender_id', this.id);

$(function () {
  $('.list-item-wrapper').click(function () {
    window.location = '/wechat2_detial';
  });

  var unVerifiedBtn = $('.un-verify');
  var verifiedBtn = $('.verified');
  var list = $('.view-list');

  unVerifiedBtn.click(function () {
    if (!unVerifiedBtn.hasClass('select')) {
      list.children().remove();
      getTenders('unpayment');
      unVerifiedBtn.addClass('select');
      verifiedBtn.removeClass('select');
    }
  });
  verifiedBtn.click(function () {
    if (!verifiedBtn.hasClass('select')) {
      list.children().remove();
      getTenders('payment');
      verifiedBtn.addClass('select');
      unVerifiedBtn.removeClass('select');
    }
  });

  unVerifiedBtn.click();


  function getTenders(type) {
    $.ajax({
      url: baseUrl + '/tender/user/getPaymentTenderList',
      method: 'post',
      data: {
        type: type
      },
      success: function (data) {
        console.log(data);
        if (!data.err) {
          appendTenderItem(data);
        }
      },
      error: function () {

      }
    });
  }

  function appendTenderItem(items) {
    items.forEach(function (item) {
      var title = '';
      if (item.mobile_goods && item.mobile_goods.length > 0) {
        item.mobile_goods.forEach(function (good) {
          title += good.name + ' ' + good.count + good.unit + ', '
        });
      }

      var jq = $(
        '<div id="' + item._id + '" class="list-item-wrapper">' +
        '<div class="list-item">' +
        '<div class="item-head">' +
        item.order_number +
        '</div>' +
        '<div class="item-body">' +
        '<div class="body-title">' + title + '</div>' +
        '<div class="body-content">' +
        '<div class="content-item">' +
        '起 ： ' + item.pickup_address +
        '</div>' +
        '<div class="content-item">' +
        '到 ： ' + item.delivery_address +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
      );

      jq.click(function () {
        window.localStorage.setItem('tender_id', this.id);
        window.location = '/wechat2_detial?tender_id=' + this.id;
      });

      list.append(jq);
    });


  }
});