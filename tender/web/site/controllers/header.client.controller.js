tender.controller('HeaderController',
  ['$location', '$rootScope', '$scope', '$state', 'GlobalEvent', 'Auth', 'config',
    function ($location, $rootScope, $scope, $state, GlobalEvent, Auth, config) {
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

      $scope.signout = function () {
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要退出吗？", goLogin);
        return;

      };

      $scope.goLogin = function () {
        window.location = 'tender/login_page';
      };

      $scope.goZzqs= function () {
        window.location = '/back_home_page';
      };

      $scope.btnClickHandle = function (tar) {
        $state.go(tar);
      };
    }]);