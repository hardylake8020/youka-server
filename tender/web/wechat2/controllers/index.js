/**
 * Created by zenghong on 2017/4/26.
 */

var baseUrl = 'http://' + window.location.host;
$(function () {
  $('.list-item-wrapper').click(function () {
    window.location = '/wechat2_detial';
  });

  var unVerifiedBtn = $('.un-verify');
  var verifiedBtn = $('.verified');
  unVerifiedBtn.click(function () {
    if (!unVerifiedBtn.hasClass('select')) {
      getTenders('unpayment');
      unVerifiedBtn.addClass('select');
      verifiedBtn.removeClass('select');
    }
  });
  verifiedBtn.click(function () {
    if (!verifiedBtn.hasClass('select')) {
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
      },
      error: function () {

      }
    });
  }

  function appendTenderItem() {

  }
});