/**
 * Created by zenghong on 2017/4/26.
 */
$(function () {
  $('.list-item-wrapper').click(function () {
    window.location = '/wechat2_detial';
  });

  var unVerifiedBtn = $('.un-verify');
  var verifiedBtn = $('.verified');
  unVerifiedBtn.click(function () {
    unVerifiedBtn.addClass('select');
    verifiedBtn.removeClass('select');

  });
  verifiedBtn.click(function () {
    verifiedBtn.addClass('select');
    unVerifiedBtn.removeClass('select');
  });

  function getTenders(type) {
    $.ajax({
      url: '',
      data: {
        type: type
      },
      success: function () {

      },
      error: function () {

      }
    });
  }
});