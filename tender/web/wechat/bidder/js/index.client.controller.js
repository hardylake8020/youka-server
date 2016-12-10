/**
 * Created by Wayne on 16/1/28.
 */
$(function () {
    var bidder = document.getElementById('error3').getAttribute('data-value');
    try {
      bidder = JSON.parse(bidder);
    }
    catch (e) {
      bidder = null;
    }

    if (!bidder) {
      return alert('parse bidder failed');
    }
    window.bidder_id = bidder._id;
    window.deposit_status = bidder.deposit_status;


    var bodyElement = $('body');

    var zzAlert = new ZZAlert();
    bodyElement.append(zzAlert.element);
    window.zzAlert = zzAlert;

    var zzLoading = new ZZLoading();
    bodyElement.append(zzLoading.element);
    window.zzLoading = zzLoading;
    zzLoading.show();

    var zzCommon = new ZZCommon();
    window.zzCommon = zzCommon;

    function checkDepositStatus(errorType) {
      var abnormalObject = {
        bidder_deposit_unpaid: 'bidder_deposit_unpaid',
        bidder_deposit_paid: 'bidder_deposit_paid',
        bidder_deposit_freeze: 'bidder_deposit_freeze',
        bidder_deposit_deducted: 'bidder_deposit_deducted'
      };

      if (abnormalObject[errorType]) {
        bodyElement.find('.zz-footer .deposit').click();
        zzDepositDetail.handleAbnormalDeposit(errorType);
      }
    }

    function loadTenderInfo() {
      zzLoading.hide();

      var statuses = [{name: '竞标中', type: 'inProgress'}, {name: '已中标', type: 'success'}, {name: '未中标', type: 'failed'}];
      var tabsElement = $('.zz-tender-view .wechat-header .tabs');
      var zzTabs = new ZZTabs(tabStatusChanged);
      zzTabs.update(statuses);
      tabsElement.append(zzTabs.element);

      var tabViewsElement = $('.zz-tender-view .wechat-body');
      var zzTabViews = new ZZTabViews(orderItemClickHandle, 'TenderList');
      zzTabViews.update(statuses);
      tabViewsElement.append(zzTabViews.element);

      var zzTenderDetail = new ZZTenderDetail(detailInformHandle);
      $('.zz-tender-view').append(zzTenderDetail.element);

      function tabStatusChanged(tabType) {
        zzTabViews.showTabView(tabType);
      }

      function orderItemClickHandle(bidRecord) {
        console.log('tender click, order_number: ', bidRecord.tender.order_number);

        zzTenderDetail.show(bidRecord);
      }

      function detailInformHandle(params) {
        checkDepositStatus(params.type);
        switch (params.type) {
          case 'quote_success':
            zzTenderDetail.hide();
            zzTabViews.refresh('inProgress');
            break;
          case 'apply_driver_success':
            zzTenderDetail.hide();
            zzTabViews.refresh('success');
          default:
            break;
        }
      }

      function init() {
        zzTabs.showTab(statuses[0].type);
      }

      init();
    }

    function loadOrderInfo() {
      zzLoading.hide();

      var statuses = [{name: '未提货', type: 'unPickup'}, {name: '进行中', type: 'unDelivery'}, {
        name: '已完成',
        type: 'completed'
      }];
      var tabsElement = $('.zz-order-view .wechat-header .tabs');
      var zzTabs = new ZZTabs(tabStatusChanged);
      zzTabs.update(statuses);
      tabsElement.append(zzTabs.element);

      var tabViewsElement = $('.zz-order-view .wechat-body');
      var zzTabViews = new ZZTabViews(orderItemClickHandle, 'OrderList');
      zzTabViews.update(statuses);
      tabViewsElement.append(zzTabViews.element);

      var zzOrderDetail = new ZZOrderDetail();
      bodyElement.append(zzOrderDetail.element);

      function tabStatusChanged(tabType) {
        zzTabViews.showTabView(tabType);
      }

      function orderItemClickHandle(order) {
        console.log('order click, order_number: ', order.order_details.order_number);
        zzOrderDetail.show(order);
      }

      function init() {
        zzTabs.showTab(statuses[0].type);
      }

      init();
    }

    var zzDepositDetail;
    function loadDepositInfo() {
      zzLoading.hide();

      var depositViewElement = $('.zz-deposit-view');
       zzDepositDetail = new ZZDepositDetail();
      depositViewElement.find('.deposit-body').append(zzDepositDetail.element);

      zzDepositDetail.show(window.deposit_status);
    }

    function showTender(isShow) {
      showFooterButton('tender', isShow);
    }

    function showOrder(isShow) {
      showFooterButton('order', isShow);
    }

    function showDeposit(isShow) {
      showFooterButton('deposit', isShow);
    }

    function showFooterButton(name, isShow) {
      var view = bodyElement.find('.zz-' + name + '-view');
      var button = bodyElement.find('.zz-footer .' + name);
      if (isShow) {
        view.show();
        button.addClass('selected');
      }
      else {
        view.hide();
        button.removeClass('selected');
      }
    }

    bodyElement.find('.wechat-header .title .menu').click(function () {
      bodyElement.find('.wechat-footer').addClass('show');
    });
    bodyElement.find('.wechat-footer').click(function () {
      bodyElement.find('.wechat-footer').removeClass('show');
    });
    bodyElement.find('.wechat-footer .unbind').click(function (e) {
      $.ajax({
        data: {
          bidder_id: bidder._id
        },
        type: 'get',
        url: '/wechat/unbind',
        dataType: 'json'
      }).done(function (data) {
        if (data.success) {
          return wx.closeWindow();
        }
        zzAlert.show('操作失败');
      }).fail(function (err) {
        zzAlert.show('操作失败');
      });

      stopBubble(e);
    });

    bodyElement.find('.zz-footer .item').click(function (e) {
      var button = $(this);
      if (!button.hasClass('selected')) {
        if (button.hasClass('tender')) {
          showTender(true);
          showOrder(false);
          showDeposit(false);
        }
        else if (button.hasClass('order')) {
          showTender(false);
          showOrder(true);
          showDeposit(false);
        }
        else {
          showTender(false);
          showOrder(false);
          showDeposit(true);
        }
      }
    });

    loadTenderInfo();
    loadOrderInfo();
    loadDepositInfo();

    bodyElement.find('.zz-footer .tender').click();
  }
)
;