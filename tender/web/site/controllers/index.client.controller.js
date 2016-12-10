/**
 * Created by Wayne on 15/10/9.
 */
tender.controller('IndexController', ['$rootScope', '$scope', '$state', 'GlobalEvent', 'Auth', 'Navigation', function ($rootScope, $scope, $state, GlobalEvent, Auth, Navigation) {
  var mainConfig = {
    navList: [],
    logout: '',
    clickBody: '',
    currentUser: {},
    currentNavState: ''
  };

  $scope.mainConfig = mainConfig;

  function init() {
    mainConfig.navList = Navigation.getList();
    mainConfig.currentUser = Auth.getUser();

    mainConfig.logout = function () {
      Auth.setUser(null);
      Auth.setToken(null);
      $state.go('login');
    };

    mainConfig.clickBody = function () {
      $rootScope.$broadcast(GlobalEvent.onBodyClick);
    };
  }

  //$scope.$on(GlobalEvent.onStateChanged, function (event, state) {
  //  mainConfig.currentNavState = state;
  //});
  //
  //$scope.$on(GlobalEvent.onUserLogin, function (event) {
  //  init();
  //});
  ////登录页面成功后发送过来的
  //$rootScope.$on(GlobalEvent.onUserLogin, function (event) {
  //  init();
  //});
  //
  //$rootScope.$on(GlobalEvent.onShowLoading, function (event, isShow) {
  //  $rootScope.showLoading = isShow;
  //});

  init();
}]);