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
        assignCount: 0,
        onwayCount: 0,
        searchKey: '',
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
        },
        changeMenu: function (menu) {
          if (this.currentMenu !== menu) {
            this.currentMenu = menu;

            this.pagination.currentPage = 1;
            getOrderList();
          }
        },
        searchOrder: function () {
          this.pagination.currentPage = 1;
          getOrderList();
        },
        getSearchKeys: function () {
          var searchKeys = [], statusArray;
          if (this.searchKey) {
            searchKeys.push({key: 'order_number', value: this.searchKey});
          }
          if (this.currentMenu === 'on_way') {
            statusArray = ['assigning', 'unPickupSigned', 'unPickuped', 'unDeliverySigned', 'unDeliveried'];
          }
          else {
            statusArray = ['completed'];
          }
          searchKeys.push({key: 'order_status', value: statusArray});

          return searchKeys;
        },
        clickOrder: function (order, event) {
          $state.go('order_detail.info', {order_id: order.order_id});
        }
      };

      $scope.pageConfig = pageConfig;


      function getDriverInfo(driver) {
        return (driver.nickname || '未知') + '(' + [driver.truck_number || '未知', driver.username].join('/') + ')';
      }

      function getOrderList() {
        pageConfig.orderList = [];

        OrderService.getAllOrders(pageConfig.pagination.currentPage,
          pageConfig.pagination.limit, '', '', pageConfig.getSearchKeys()).then(function (data) {
          pageConfig.orderList = [];

          console.log(data);

          if (data.totalCount >= 0) {
            pageConfig.pagination.currentPage = parseInt(data.currentPage);
            pageConfig.pagination.limit = parseInt(data.limit);
            pageConfig.pagination.totalCount = parseInt(data.totalCount);
            pageConfig.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
            pageConfig.pagination.skipCount = (pageConfig.pagination.currentPage - 1) * pageConfig.pagination.limit;
            pageConfig.pagination.render();

            data.orders.forEach(function (orderItem) {
              var newOrder = {
                order_number: orderItem.tender.order_number,
                refer_order_number: orderItem.tender.refer_order_number || '',
                goods_name: OrderHelper.getGoodsNameString(orderItem.tender),
                driver_winner: orderItem.tender.driver_winner, //承运商
                driver_info: getDriverInfo(orderItem.tender.execute_driver),
                delivery_name: orderItem.tender.delivery_name || '',
                status: orderItem.status,
                status_string: OrderHelper.getStatusString(orderItem.status),
                order_id: orderItem._id,
                tender_id: orderItem.tender._id
              };

              pageConfig.orderList.push(newOrder);
            });
          }
        });
      }

      $timeout(function () {
        getOrderList();
      }, 500);


      var timer = null;

      function getOrderOperationCount(callback) {
        OrderService.getOperationOrderCount().then(function (data) {
          console.log(data);

          if (!data || data.err) {
            return callback();
          }
          pageConfig.assignCount = data.assignCount;
          pageConfig.onwayCount = data.onwayCount;

          return callback();
        }, function (err) {
          return callback();
        });
      }

      function updateOrderOperationCount() {
        timer = $timeout(function () {
          getOrderOperationCount(function () {
            updateOrderOperationCount();
          });
        }, 1000 * 10);
      }

      //第一次获取
      getOrderOperationCount(function () {
      });
      //定时获取
      updateOrderOperationCount();

      $scope.$on("$destroy", function () {
        if (timer) {
          $timeout.cancel(timer);
        }
      });

    }
  ]);
