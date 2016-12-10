/**
 * Created by Wayne on 15/8/6.
 */

angular.module('zhuzhuqs').controller('AlertPromptController',
  ['$rootScope', '$scope', 'GlobalEvent',
    function ($rootScope, $scope, GlobalEvent) {
      $scope.alertConfig = {
        show: false,
        title: '消息',
        tipText: '请设置',
        placeholderText: '请输入',
        sure: '好的',
        inputContent: '',
        callback: null
      };
      $rootScope.$on(GlobalEvent.onShowAlertPrompt, function (event, info, callback) {
        if (info.tipText)
          $scope.alertConfig.tipText = info.tipText;
        if (info.placeholderText)
          $scope.alertConfig.placeholderText = info.placeholderText;
        if (info.sure)
          $scope.alertConfig.sure = info.sure;

        $scope.alertConfig.show = true;
        if (callback) {
          $scope.alertConfig.callback = callback;
        }
      });
      $scope.sure = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.tipText = '请设置';
        $scope.alertConfig.placeholderText = '请输入';
        $scope.alertConfig.sure = '好的';

        if ($scope.alertConfig.callback) {
          var callback = $scope.alertConfig.callback;
          var inputContent = $scope.alertConfig.inputContent;
          callback(inputContent);
        }

        $scope.alertConfig.inputContent = '';
        $scope.alertConfig.callback = null;
        return;
      };

      $scope.cancel = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.tipText = '请设置';
        $scope.alertConfig.placeholderText = '请输入';
        $scope.alertConfig.sure = '好的';
        $scope.alertConfig.inputContent = '';
        $scope.alertConfig.callback = null;
        return;
      };
    }]);

