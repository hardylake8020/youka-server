/**
 * Created by Wayne on 16/1/28.
 */
$(function () {

  /*
  * tender: {}, bidder: id, current_price
  * */

  var order = document.getElementById('error3').getAttribute('data-value');
  try {
    order = JSON.parse(order);
  }
  catch (e) {
    order = null;
  }

  if (!order) {
    return alert('parse order failed');
  }

  var bodyElement = $('body');

  var zzAlert = new ZZAlert();
  bodyElement.append(zzAlert.element);
  window.zzAlert = zzAlert;

  var zzLoading = new ZZLoading();
  bodyElement.append(zzLoading.element);
  window.zzLoading = zzLoading;

  var zzCommon = new ZZCommon();
  window.zzCommon = zzCommon;

  var zzOrderDetail = new ZZOrderDetail(function () {
    window.history.back();
  });
  bodyElement.append(zzOrderDetail.element);

  zzOrderDetail.show(order);

});