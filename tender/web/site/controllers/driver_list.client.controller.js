/**
 * Created by Wayne on 16/3/12.
 */

tender.controller('DriverlistController', ['$rootScope', '$scope', '$stateParams', '$state', '$timeout',
  'GlobalEvent', 'HttpTender', 'StoreHelper', 'CommonHelper', 'config',
  function ($rootScope, $scope, $stateParams, $state, $timeout, GlobalEvent, HttpTender, StoreHelper, CommonHelper, config) {
    $scope.info = {
      driverList: []
    };
    $scope.getAllDrivers = function (status) {
      HttpTender.getAllDrivers($scope, {verify_status: status || 'unVerifyPassed'}, function (err, results) {
        $scope.info.driverList = results || [];
      }, function () {

      });
    };
    $scope.getPhotos = function (path) {
      return config.qiniuServerAddress + path;
    };

    function init() {
      $scope.getAllDrivers();
    }
    init();
  }]);
