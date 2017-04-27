/**
 * Created by zenghong on 2017/4/26.
 */
var baseUrl = 'http://' + window.location.host;

$(function () {
  $('.detail-back').click(function () {
    window.history.back();
  });
  
  var list = $('.list-item');


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
          var str =
            '<div class="item-row">' +
            '<div class="row-item title-col">' +
            '首款金额' +
            '</div>' +
            '<div class="row-item price-col">' +
            data.real_pay_top_cash +
            '</div>' +
            '<div class="row-item tiaozhang-col">' +
            getTiaozhangStr(data.real_pay_top_tiaozhangs) +
            '</div>' +
            '<div class="verify-btn">' +
            '通过' +
            '</div>' +
            '<div class="verify-btn pass">' +
            '通过' +
            '</div>' +
            '</div>';

          list.append(str);

          var str =
            '<div class="item-row">' +
            '<div class="row-item title-col">' +
            '尾款金额' +
            '</div>' +
            '<div class="row-item price-col">' +
            data.real_pay_tail_cash +
            '</div>' +
            '<div class="row-item tiaozhang-col">' +
            getTiaozhangStr(data.real_pay_tail_tiaozhangs) +
            '</div>' +
            '<div class="verify-btn">' +
            '通过' +
            '</div>' +
            '<div class="verify-btn pass">' +
            '通过' +
            '</div>' +
            '</div>';

          list.append(str);

          var str =
            '<div class="item-row">' +
            '<div class="row-item title-col">' +
            '回单金额' +
            '</div>' +
            '<div class="row-item price-col">' +
            data.real_pay_last_cash +
            '</div>' +
            '<div class="row-item tiaozhang-col">' +
            getTiaozhangStr(data.real_pay_last_tiaozhangs) +
            '</div>' +
            '<div class="verify-btn">' +
            '通过' +
            '</div>' +
            '<div class="verify-btn pass">' +
            '通过' +
            '</div>' +
            '</div>';

          list.append(str);

          var str =
            '<div class="item-row">' +
            '<div class="row-item title-col">' +
            '押金金额' +
            '</div>' +
            '<div class="row-item price-col">' +
            data.real_pay_ya_jin_cash +
            '</div>' +
            '<div class="row-item tiaozhang-col">' +
            getTiaozhangStr(data.real_pay_ya_jin_tiaozhangs) +
            '</div>' +
            '<div class="verify-btn">' +
            '通过' +
            '</div>' +
            '<div class="verify-btn pass">' +
            '通过' +
            '</div>' +
            '</div>';

          list.append(str);
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
    return str;
  }
});