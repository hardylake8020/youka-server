/**
 * Created by Wayne on 15/10/9.
 */

'use strict';

tender.controller('TenderFollowNewController', ['$rootScope', '$scope', '$state', '$interval', 'config', '$timeout', 'HttpTender',
  function ($rootScope, $scope, $state, $interval, config, $timeout, HttpTender) {

    var pageConfig = {
      currentMenu: 'processing',
      assignCount: 0,
      onwayCount: 0,
      searchKey: '',
      tenderList: [],
      pagination: {
        currentPage: 1,
        currentLimit: 10,
        limit: 10,
        totalCount: 0,
        pageCount: 0,
        pageNavigationCount: 5,
        canSeekPage: true,
        limitArray: [10, 20, 30, 40, 100],
        pageList: [1],
        skipCount: 0,
        onCurrentPageChanged: function () {
          if (pageConfig.pagination.currentLimit !== pageConfig.pagination.limit) {
            pageConfig.pagination.currentLimit = pageConfig.pagination.limit;
            // onSaveMaxPageCount('max_page_count_follow', pageConfig.pagination.limit);
          }
          getTenderList();
        }
      },
      changeMenu: function (menu) {
        if (this.currentMenu !== menu) {
          this.currentMenu = menu;

          this.pagination.currentPage = 1;
          getTenderList();
        }
      },
      searchOrder: function () {
        this.pagination.currentPage = 1;
        getTenderList();
      },
      clickOrder: function (tender, event) {
        $state.go('order_detail.info', {tender_id: tender._id});
      }
    };

    $scope.pageConfig = pageConfig;

    function getSearchCondition() {
      var result = {
        currentPage: pageConfig.pagination.currentPage || 1,
        limit: pageConfig.pagination.currentLimit || 10,
        sortName: '',
        sortValue: '',
        startTime: '',
        endTime: ''
      };

      var searchArray = [];
      searchArray.push({
        key: 'status',
        value: pageConfig.currentMenu === 'processing' ? ['unStarted', 'comparing', 'compareEnd', 'unAssigned', 'inProgress', 'stop'] : ['completed']
      });
      result.searchArray = searchArray;
      return result;
    }

    function getTenderList() {
      pageConfig.tenderList = [];
      HttpTender.getTenders($scope, getSearchCondition(), function (err, data) {
        console.log(data);
        if (data.tenders) {
          pageConfig.pagination.currentPage = parseInt(data.currentPage);
          pageConfig.pagination.limit = parseInt(data.limit);
          pageConfig.pagination.totalCount = parseInt(data.totalCount);
          pageConfig.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
          pageConfig.pagination.skipCount = (pageConfig.pagination.currentPage - 1) * pageConfig.pagination.limit;
          pageConfig.pagination.render();

          data.tenders.forEach(function (tender) {
            var newOrder = {
              order_number: tender.order_number,
              ref_order_number: tender.refer_order_number || '',
              goods_name: getOrderGoodsName(tender),
              driver_winner: [tender.driver_winner.nickname || '未知', tender.driver_winner.username].join('/'), //承运商
              driver_info: [tender.execute_driver.truck_number || '未知', tender.execute_driver.username].join('/'),
              delivery_name: tender.delivery_name || '',
              status: status,
              status_string: getStatusString(tender),
              _id: tender._id
            };

            pageConfig.tenderList.push(newOrder);
          });
        }
      });
    }


    $timeout(function () {
      getTenderList();
    }, 500);

    function getOrderGoodsName(tender) {
      var goodsName = '';
      if (tender.goods && tender.goods.length > 0) {
        tender.goods.forEach(function (item) {
          goodsName += ((item.name || '未知') + ',');
        });
        goodsName = goodsName.substr(0, goodsName.length - 1);
      }
      else {
        goodsName = tender.goods_name || '未知';
      }
      return goodsName;
    }

    function getStatusString(tender) {
      var results = '未知';
      switch (tender.status) {
        case 'unStarted':
          results = '未开始';
          break;
        case 'comparing':
          results = '比价中';
          break;
        case 'compareEnd':
          results = '比价结束';
          break;
        case 'unAssigned':
          results = '未分配司机';
          break;
        case 'inProgress':
          results = '进行中';
          break;
        case 'stop':
          results = '已停止';
          break;
        case 'completed':
          results = '已完成';
          break;
      }

      return results;
    }
  }]);