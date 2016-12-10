/**
 * Created by Wayne on 16/1/28.
 */
$(function () {

  /*
  * tender: {}, bidder: id, current_price
  * */

  var bidRecord = document.getElementById('error3').getAttribute('data-value');
  try {
    bidRecord = JSON.parse(bidRecord);
  }
  catch (e) {
    bidRecord = null;
  }

  if (!bidRecord) {
    return alert('parse bidder failed');
  }
  window.bidder_id = bidRecord.bidder;

  var bodyElement = $('body');

  var zzAlert = new ZZAlert();
  bodyElement.append(zzAlert.element);
  window.zzAlert = zzAlert;

  var zzLoading = new ZZLoading();
  bodyElement.append(zzLoading.element);
  window.zzLoading = zzLoading;

  var zzCommon = new ZZCommon();
  window.zzCommon = zzCommon;

  var zzTenderDetail = new ZZTenderDetail(detailInformHandle);
  bodyElement.append(zzTenderDetail.element);

  zzTenderDetail.hideBack();

  zzTenderDetail.show(bidRecord);

  function detailInformHandle(params) {
    switch (params.type) {
      case 'quote_success':
      case 'apply_driver_success':
        window.location.reload(true);
      default:
        break;
    }
  }
});