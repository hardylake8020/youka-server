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

    $scope.verifyDriver = function (driver, status) {
      HttpTender.verifyDriver($scope, {
        verify_status: status || 'unVerifyPassed',
        driver_id: driver._id
      }, function (err, results) {
        $scope.info.driverList = results || [];
        if (!err) {
          $scope.$emit(GlobalEvent.onShowAlert, '操作成功', function () {
            $state.go('driver_list', {}, {reload: true});
          });
        }
      }, function () {

      });
    };

    $scope.curPhotoList = [];
    $scope.photoConfig = {
      curPhotoList: [],
      showPhotoScan: false,
      imgIndex: 0
    };

    $scope.showPhotos = function (path) {
      $scope.photoConfig.curPhotoList = [{
        url: $scope.getPhotos(path)
      }];
      $scope.photoConfig.showPhotoScan = true;
    };

    function init() {
      $scope.getAllDrivers();
    }

    init();
  }]);
