angular.module('zhuzhuqs').controller('HeaderController',
  ['$location', '$rootScope', '$scope', '$state', 'GlobalEvent', 'HomeService', 'Auth', 'config',
    function ($location, $rootScope, $scope, $state, GlobalEvent, HomeService, Auth, config) {
      $scope.headerNav = {
        currentnav: null,
        subnav: null,
        subList: []
      };

      $scope.searchHandle = function (str) {
        alert("暂未开放");
      };

      $scope.curUser = Auth.getUser() || {};
      $scope.curCompany = Auth.getCompany() || {};

      Auth.onUserUpdatedCallback(function () {
        $scope.curUser = Auth.getUser() || {};
        $scope.curCompany = Auth.getCompany() || {};
      }, 'HeaderController');

      $rootScope.$on(GlobalEvent.onChangeMenu, function (event, tar) {
        //var tar = HomeService.getObjByHandelUrl($location.path());
        //

      });

      $scope.signout = function () {
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要退出吗？", goLogin);
        return;

      };

      function goLogin() {
        window.location = config.login;
      }

      $scope.btnClickHandle = function (tar) {
        $state.go(tar);
      };

      $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        //var _path = $location.path();
        $scope.headerNav.subnav = null;
        $rootScope.viewSubHandle = [];
        $scope.headerNav.subList = [];
        //var nav_list = toState.name.split('.');
        $scope.headerNav.subList = HomeService.getCurrentNavList(toState.name);
        var _current = $scope.headerNav.subList[$scope.headerNav.subList.length - 1];
        if (!_current || _current.url === "/") {
          $scope.headerNav.currentnav = null;
        }
        else {
          $scope.headerNav.currentnav = _current;
          if (toParams && toParams.title) {
            $scope.headerNav.currentnav.label = toParams.title;
          }
        }
        if ($scope.headerNav.currentnav && $scope.headerNav.currentnav.viewSubHandle && $scope.headerNav.currentnav.viewSubHandle.length > 0) {
          $scope.headerNav.currentnav.viewSubHandle.forEach(function (sub) {
            if (sub.url === $location.path()) {
              $scope.headerNav.subnav = sub;
            }
          });
        }
      });
    }]);