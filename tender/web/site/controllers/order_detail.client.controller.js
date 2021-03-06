/**
 * Created by Wayne on 15/6/1.
 */
tender.controller('OrderDetailController',
  ['$state', '$scope', '$stateParams', '$timeout', 
    function ($state, $scope, $stateParams, $timeout) {

      var pageConfig = {
        menuList: [],
        resetMenuList: function (order) {
          this.menuList = [];
          this.menuList.push({
            state: 'order_detail.info',
            url: 'order_detail_info',
            text: '运单详情'
          });
          this.menuList.push({
            state: 'order_detail.timeline',
            url: 'order_detail_timeline',
            text: '时间轴'
          });
          // this.menuList.push({
          //   state: 'order_detail.map',
          //   url: 'order_detail_map',
          //   text: '地图'
          // });
          // this.menuList.push({
          //   state: 'order_detail.adjustment',
          //   url: 'order_detail_adjustment',
          //   text: '调帐'
          // });
          this.menuList.push({
            state: 'order_detail.confirm',
            url: 'order_detail_confirm',
            text: '财务确认'
          });

        },
        isMenuSelected: function (url) {
          return window.location.href.indexOf(url) !== -1;
        },
        changeMenu: function (state) {
          console.log($stateParams);
          $state.go(state, {order_id: $stateParams.tender_id});
        },
        goBack: function () {
          $state.go('tender_follow_new');
        }
      };

      $scope.pageConfig = pageConfig;

      console.log($stateParams);

      pageConfig.resetMenuList({});
    }
  ]);
