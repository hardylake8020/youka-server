angular.module('zhuzhuqs').controller('AlertController',
    ['$rootScope', '$scope', 'GlobalEvent', '$element', '$attrs', '$transclude',
        function ($rootScope, $scope, GlobalEvent, $element, $attrs, $transclude) {
            $scope.alertConfig = {
                show: false,
                type: 'alert',
                title: '消息',
                content: '',
                cancel: '好的',
                callback: null
            };
            $rootScope.$on(GlobalEvent.onShowAlert, function (event, info, callback) {
                $scope.alertConfig.content = info;
                $scope.alertConfig.show = true;
                if (callback) {
                  $scope.alertConfig.callback = callback;
                }
            });
            $scope.cancel = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';

                if ($scope.alertConfig.callback) {
                  var callback = $scope.alertConfig.callback;
                  callback();

                  $scope.alertConfig.callback = null;

                  return;
                }
            };
        }]);
