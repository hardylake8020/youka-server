tender.controller('AlertConfirmController',
    ['$rootScope', '$scope', 'GlobalEvent', '$element', '$attrs', '$transclude',
        function ($rootScope, $scope, GlobalEvent, $element, $attrs, $transclude) {
            $scope.alertConfig = {
                show: false,
                title: '消息',
                content: '',
                cancel: '取消',
                sure: '确认',
                func: null,
                param: null
            };
            $rootScope.$on(GlobalEvent.onShowAlertConfirm, function (event, info, func, param, cfg) {
                if (cfg) {
                    $scope.alertConfig.title = cfg.title ? cfg.title : '消息';
                    $scope.alertConfig.sure = cfg.sureLabel ? cfg.sureLabel : '确认';
                    $scope.alertConfig.cancel = cfg.cancelLabel ? cfg.cancelLabel : '取消';
                }
                else {
                    $scope.alertConfig.title = "消息";
                    $scope.alertConfig.sure = "确认";
                    $scope.alertConfig.cancel = "取消";
                }
                $scope.alertConfig.content = info;
                $scope.alertConfig.show = true;
                $scope.alertConfig.func = func;
                $scope.alertConfig.param = param;

            });
            $scope.cancel = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';
            };
            $scope.sure = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';
                if ($scope.alertConfig.func) {
                    $scope.alertConfig.func($scope.alertConfig.param);
                }

            };
        }]);
