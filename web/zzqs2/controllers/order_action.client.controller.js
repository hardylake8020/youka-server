/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderActionController',
  ['$state', '$scope', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer', 'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper) {

      var pageConfig = {
        currentMenu: 'on_way',
        changeMenu: function (menu) {
          if (this.currentMenu !== menu) {
            this.currentMenu = menu;
          }
        }
      };

      $scope.pageConfig = pageConfig;

    }
  ]);
