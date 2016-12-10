tender.directive('zzCustomizeDialog', function () {
    return {
        restrict: 'EA',
        template: '<div class="mask" ng-show="pageConfig.show">' +
        '<div class="zz-custom-dialog">' +
        '<div class="zz-dialog-title"> <span>{{pageConfig.title}}</span>' +
        '<div class="zz-dialog-close" ng-click="closed()"><img ng-src="images/icon/ic_close_24px.svg"/></div></div>' +
        '<div class="zz-dialog-content">' +
        '</div>' +
        '<div class="zz-dialog-handle">' +
        '<div class="zz-dialog-btn-new zz-dialog-btn" ng-click="closed()">{{pageConfig.okLabel}}</div>' +
        ' </div></div></div>',
        replace: true,
        scope: {
            pageConfig: '='
        },
        link: function (scope, element, attributes) {
            if (!scope.pageConfig) {
                scope.pageConfig = {
                    title: '自定义消息框',
                    content: '自定义内容',
                    okLabel: "确定",
                    show: false
                };
            }
            var _el = element.find('.zz-dialog-content');
            _el.append(scope.pageConfig.content);
            scope.closed = function () {
                scope.pageConfig.show = false;
            };
        }
    }
});