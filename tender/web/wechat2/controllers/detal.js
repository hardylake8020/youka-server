/**
 * Created by zenghong on 2017/4/26.
 */
var baseUrl = 'https://' + window.location.host;

$(function () {
  $('.detail-back').click(function () {
    window.history.back();
  });

  var list = $('.list-item');
  var tender = {};


  console.log(window.localStorage.getItem('tender_id'));
  var tenderId = window.localStorage.getItem('tender_id');
  getTenderDetail();
  function getTenderDetail() {
    $.ajax({
      url: baseUrl + '/tender/user/getTenderByTenderId',
      method: 'post',
      data: {tender_id: tenderId},
      success: function (data) {
        console.log(data);
        if (!data.err) {
          tender = data;
          var top =
            $('<div class="item-row">' +
              '<div class="row-item title-col">' +
              '首款金额' +
              '</div>' +
              '<div class="row-item price-col">' +
              data.real_pay_top_cash +
              '</div>' +
              '<div class="row-item tiaozhang-col">' +
              getTiaozhangStr(data.real_pay_top_tiaozhangs) +
              '</div>' +
              '<div class="verify-btn pass">' +
              '已通过' +
              '</div>' +
              '</div>');

          if (!data.real_pay_top_cash_time) {
            top.find('.verify-btn').removeClass('pass').text('通过');
            top.find('.verify-btn').click(function () {
                payment('real_pay_top_cash');
            });
          }

          if (tender.can_pay_top)
            list.append(top);

          var tail =
            $('<div class="item-row">' +
              '<div class="row-item title-col">' +
              '尾款金额' +
              '</div>' +
              '<div class="row-item price-col">' +
              data.real_pay_tail_cash +
              '</div>' +
              '<div class="row-item tiaozhang-col">' +
              getTiaozhangStr(data.real_pay_tail_tiaozhangs) +
              '</div>' +
              '<div class="verify-btn pass">' +
              '已通过' +
              '</div>' +
              '</div>');

          if (!data.real_pay_tail_cash_time) {
            tail.find('.verify-btn').removeClass('pass').text('通过');
            tail.find('.verify-btn').click(function () {
                payment('real_pay_tail_cash');
            });
          }

          if (tender.can_pay_tail)
            list.append(tail);

          var last =
            $('<div class="item-row">' +
              '<div class="row-item title-col">' +
              '回单金额' +
              '</div>' +
              '<div class="row-item price-col">' +
              data.real_pay_last_cash +
              '</div>' +
              '<div class="row-item tiaozhang-col">' +
              getTiaozhangStr(data.real_pay_last_tiaozhangs) +
              '</div>' +
              '<div class="verify-btn pass">' +
              '已通过' +
              '</div>' +
              '</div>');

          if (!data.real_pay_last_cash_time) {
            last.find('.verify-btn').removeClass('pass').text('通过');
            last.find('.verify-btn').click(function () {
                payment('real_pay_last_cash');
            });
          }

          if (tender.can_pay_last)
            list.append(last);

          var ya_jin =
            $('<div class="item-row">' +
              '<div class="row-item title-col">' +
              '押金金额' +
              '</div>' +
              '<div class="row-item price-col">' +
              data.real_pay_ya_jin +
              '</div>' +
              '<div class="row-item tiaozhang-col">' +
              getTiaozhangStr(data.real_pay_ya_jin_tiaozhangs) +
              '</div>' +
              '<div class="verify-btn pass">' +
              '已通过' +
              '</div>' +
              '</div>');

          if (!data.real_pay_ya_jin_time) {
            ya_jin.find('.verify-btn').removeClass('pass').text('通过');
            ya_jin.find('.verify-btn').click(function () {
              payment('real_pay_ya_jin');
            });
          }
          if (tender.can_pay_ya_jin)
            list.append(ya_jin);
        }
      }
    });
  }

  function payment(type) {

    $.ajax({
      url: baseUrl + '/tender/user/newPayment',
      data: {
        type: type,
        tender_id: tenderId
      },
      method: 'post',
      success: function (data) {
        if (!data.err) {
          alert('操作成功！');
          window.location = window.location;
        }
        else {
          alert(data.err.type);
        }
      }

    });
  }

  function getTiaozhangStr(items) {
    str = '';

    items = items || [];
    items.forEach(function (item) {
      str +=
        '<div class="tiaozhang-row">' +
        '<div class="price">' +
        item.price +
        '</div>' +
        '<div class="description">' +
        item.reason +
        '</div>' +
        '</div>';
    });

    if (!str) {
      str = '<div class="tiaozhang-row">' +
        '<div class="price">' +
        '无' +
        '</div>' +
        '<div class="description">' +
        '无' +
        '</div>' +
        '</div>';
    }
    return str;
  }
});