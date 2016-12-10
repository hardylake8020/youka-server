/**
 * Created by Wayne on 16/4/12.
 */

'use strict';

function ZZDepositDetail() {

  var self = this;

  this.element = $('\
  <div class="zz-deposit-detail">\
    <div class="basic-info">\
      <div class="status">\
        <p class="title">保证金</p>\
        <p class="icon"></p>\
        <p class="text"></p>\
      </div>\
      <div class="operation">\
      </div>\
    </div>\
    \
    <div class="log-list-view"></div>\
  </div>\
  ');

  var currentDeposit = {};

  this.show = function (depositStatus) {
    currentDeposit = {status: depositStatus, amount: 200};
    self.element.removeClass();
    self.element.addClass('zz-deposit-detail');
    self.element.addClass('show');
    self.element.addClass(depositStatus);
    self.element.find('.status .text').text(getStatusText(depositStatus));

    var operationContainer = self.element.find('.operation');
    operationContainer.empty();
    operationContainer.append($('<a class="text"></a>'));
    var operationButton = operationContainer.find('.text');

    var action = getActionByStatus(depositStatus);
    operationButton.text(action.text);
    if (action.phone) {
      operationButton.attr('href', 'tel:' + action.phone);
    }
    if (action.handle) {
      operationButton.click(action.handle);
    }

  };
  this.hide = function (deposit) {
    self.element.addClass('show');
  };

  this.handleAbnormalDeposit = function (errorType) {
    if (statusObject[errorType]) {
      statusObject[errorType].handle();
    }
  };
  var statusObject = {
    bidder_deposit_unpaid: {
      handle: function () {
        statusObject.handle('unpaid');
      }
    },
    bidder_deposit_paid: {
      handle: function () {
        statusObject.handle('paid');
      }
    },
    bidder_deposit_freeze: {
      handle: function () {
        statusObject.handle('freeze');
      }
    },
    bidder_deposit_deducted: {
      handle: function () {
        statusObject.handle('deducted');
      }
    },
    success: {
      handle: function (status) {
        statusObject.handle(status);

        dataList.refresh();
      }
    },
    handle: function (status) {
      window.deposit_status = status;
      self.show(status);
    }
  };


  function extractDeposit() {
    window.zzLoading.show();
    $.ajax({
      url: '/wechat/bidder_extract_deposit',
      method: 'post',
      data: {
        bidder_id: window.bidder_id
      },
      success: function (data) {
        window.zzLoading.hide();

        console.log(data);

        if (data.err) {
          if (statusObject[data.err.type]) {
            statusObject[data.err.type].handle();
          }
          window.zzAlert.show(data.err.zh_message);
        }

        if (data.success) {
          statusObject.success.handle('unpaid');
        }
      },
      error: function (err) {
        window.zzAlert.show('服务器错误');
      }
    });

  }
  function saveDeposit() {

    window.zzLoading.show();
    $.ajax({
      url: '/wechat/bidder_save_deposit',
      method: 'post',
      data: {
        bidder_id: window.bidder_id
      },
      success: function (data) {
        window.zzLoading.hide();

        console.log(data);

        if (data.err) {
          if (statusObject[data.err.type]) {
            statusObject[data.err.type].handle();
          }
          window.zzAlert.show(data.err.zh_message);
        }

        if (data.success) {
          statusObject.success.handle('paid');
        }
      },
      error: function (err) {
        window.zzAlert.show('服务器错误');
      }
    });
  }

  function getStatusText(status) {
    var statusObject = {
      paid: '已缴纳',
      unpaid: '未缴纳',
      freeze: '已冻结',
      deducted: '已扣除'
    };
    return statusObject[status] || '未知';
  }

  function getActionByStatus(status) {
    var actionObject = {
      paid: {
        text: '提取保证金 ¥ ' + currentDeposit.amount,
        handle: function () {
          extractDeposit();
        }
      },
      unpaid: {
        text: '缴纳保证金 ¥ ' + currentDeposit.amount,
        handle: function () {
          saveDeposit();
        }
      },
      freeze: {
        text: '拨打客服电话',
        phone: '400-886-9256'
      },
      deducted: {
        text: '缴纳保证金 ¥ ' + currentDeposit.amount,
        handle: function () {
          saveDeposit();
        }
      }
    };

    return actionObject[status];
  }

  var dataList = new ZZDepositLogList();
  this.element.find('.log-list-view').append(dataList.element);

  var dropload = this.element.find('.log-list-view').dropload({
    domUp: {
      domClass: 'dropload-up',
      domRefresh: '<div class="dropload-refresh">↓下拉刷新</div>',
      domUpdate: '<div class="dropload-update">↑释放更新</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span></div>'
    },
    domDown: {
      domClass: 'dropload-down',
      domRefresh: '<div class="dropload-refresh">↑上拉加载更多</div>',
      domUpdate: '<div class="dropload-update">↓释放加载</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span></div>'
    },
    loadUpFn: function (me) {
      if (dataList.isLoading) {
        return me.resetload();
      }
      dataList.refresh(function (result) {
        if (result)
          me.resetload();
      });
    },
    loadDownFn: function (me) {
      if (dataList.isLoading) {
        return me.resetload();
      }
      dataList.loadMore(function (result) {
        if (result)
          me.resetload();
      });
    }
  });

  dataList.load();
}