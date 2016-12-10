angular.module('zhuzhuqs').controller('OrderOperationController',
  ['$scope', '$stateParams', '$state', '$timeout', 'CompanyService', 'OrderService', 'SalesmanService', 'OrderError', 'GroupError', 'GlobalEvent', 'UserProfileService',
    function ($scope, $stateParams, $state, $timeout, CompanyService, OrderService, SalesmanService, OrderError, GroupError, GlobalEvent, UserProfileService) {

      $scope.isCurrentLabel = function (label) {
        return window.location.hash.indexOf(label) > -1;
      };

      $scope.changeLabel = function (state) {
        $state.go(state);
      };


      $scope.orderCount = {
        assign: 0,
        onway: 0
      };

      var timer = null;

      function getOrderOperationCount(callback) {
        OrderService.getOperationOrderCount().then(function (data) {
          console.log(data);

          if (!data || data.err) {
            return callback();
          }

          if (data.assignCount >= 0) {
            $scope.orderCount.assign = data.assignCount;
            $scope.orderCount.onway = data.onwayCount;
          }

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
      getOrderOperationCount(function(){});
      //定时获取
      updateOrderOperationCount();


      $scope.$on("$destroy", function () {
        if (timer) {
          $timeout.cancel(timer);
        }
      });

    }]);
