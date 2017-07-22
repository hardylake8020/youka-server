/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderActionController',
  ['$state', '$scope', '$timeout', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer',
    'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, $timeout, OrderService, BMapService, GlobalEvent, config, AudioPlayer,
              OrderError, UserProfileService, Auth, OrderHelper) {

      var pageConfig = {
        currentMenu: 'on_way',
        changeMenu: function (menu) {
          if (this.currentMenu !== menu) {
            this.currentMenu = menu;
          }
        },
        orderList: [],
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
            getOrderList();
          }
        }
      };

      $scope.pageConfig = pageConfig;


      function getOrderList() {
        pageConfig.orderList = [];

        var data = {
          currentPage: 1,
          limit: 10,
          totalCount: 100
        };

        for (var i = 0; i < data.limit; i++) {
          pageConfig.orderList.push(i);
        }

        pageConfig.pagination.currentPage = parseInt(data.currentPage);
        pageConfig.pagination.limit = parseInt(data.limit);
        pageConfig.pagination.totalCount = parseInt(data.totalCount);
        pageConfig.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
        pageConfig.pagination.render();
      }

      $timeout(function () {
        getOrderList();
      }, 500);
    }
  ]);
