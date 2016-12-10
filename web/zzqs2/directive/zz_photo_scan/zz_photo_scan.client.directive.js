/**
 * 货物照片预览
 * author: louisha
 * 参数：数组
 * 数组成员：图片对象
 * {
 *     order:'订单号'
 *     title:'照片信息 例：提货货物照片',
 *     warning:'需要突出显示的信息,字体会变成红色',
 *     url:'图片url地址',
 *     remark:'图片备注'}
 */

zhuzhuqs.directive('zzPhotoScan', ['$document', function ($document) {
    return {
        restrict: 'EA',
        template: '<div class="zz-photo-scan-mask" ng-show="show">' +
        '<div class="zz-photo-scan-top">' +
        '<span>{{photoShow.currentPhoto.order}}</span>' +
        '<span>{{photoShow.currentPhoto.title}}</span>' +
        '<span class="warning">{{photoShow.currentPhoto.warning}}</span>' +
        '</div>' +
        '<div class="row zz-photo-scan-wrap">' +
        '<div class="col-xs-12 col-sm-10 col-sm-offset-1 container" ng-mouseover="showRemark(true)" ng-mouseleave="showRemark(false)">' +
        '<img ng-src="{{photoShow.currentPhoto.url}}" class="photo-info"/>' +
        '<div class="zz-photo-scan-remark" ng-show="photoShow.showRemark">' +
        '<div class="remark-info">{{photoShow.currentPhoto.remark}}</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="zz-photo-scan-close"  ng-click="close()">' +
        '<img src="images/global/close_white.png" />' +
        '</div>' +
        '<div class="zz-photo-scan-arrow-left-warp">' +
        '<div class="zz-photo-scan-arrow-left"  ng-class="{\'disable\':!photoShow.pre_enable}" ng-click="preClick()">' +
        '<img src="images/global/arrow_left.png" />' +
        '</div>' +
        '<div class="btn-mask" ng-show="!photoShow.pre_enable"></div>' +
        '</div>' +
        '<div class="zz-photo-scan-arrow-right-warp">' +
        '<div class="zz-photo-scan-arrow-right" ng-class="{\'disable\':!photoShow.next_enable}" ng-click="nextClick()">' +
        '<img src="images/global/arrow_right.png" />' +
        '</div> ' +
        '<div class="btn-mask" ng-show="!photoShow.next_enable"></div>' +
        '</div>' +
        '</div>',
        replace: true,
        scope: {
            photos: '=',
            show: '=',
            startIndex: '='
        },
        link: function (scope, element, attributes) {

            //$document.bind("keypress", function(event) {
            //    $scope.$apply(function (){
            //        if(event.keyCode == 38){
            //            $scope.selectNum--;
            //        }
            //        if(event.keyCode == 40){
            //            $scope.selectNum++;
            //        }
            //    })
            //});

            //$document.on("keypress", function (event) {
            //    switch (event.keyCode) {
            //        default:
            //            console.log(event.keyCode);
            //    }
            //
            //});
            if (!scope.photos) {
                scope.photos = [];
            }
            if (!scope.show) {
                scope.show = false;
            }
            if (!scope.startIndex) {
                scope.startIndex = 0;
            }
            scope.photoShow = {
                currentPhoto: scope.photos.length > 0 ? scope.photos[scope.startIndex] : null,
                current_index: scope.startIndex,
                next_enable: true,
                pre_enable: false,
                showRemark: false
            };
            scope.preClick = function () {
                if (scope.photoShow.current_index == 0 || scope.photos.length == 0) {
                    return;
                }
                scope.photoShow.current_index--;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };
            scope.nextClick = function () {
                if (scope.photos.length == 0 || scope.photoShow.current_index == scope.photos.length - 1) {
                    return;
                }
                scope.photoShow.current_index++;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };
            scope.close = function () {
                scope.show = false;
            };

            scope.initShow = function () {
                scope.photoShow.current_index = scope.startIndex;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };

            scope.showRemark = function (bo) {
                if (!scope.photoShow.currentPhoto.remark || scope.photoShow.currentPhoto.remark == '') {
                    return;
                }
                scope.photoShow.showRemark = bo;
            };

            function initNavState() {
                scope.photoShow.pre_enable = scope.photoShow.current_index <= 0 ? false : true;
                scope.photoShow.next_enable = scope.photoShow.current_index >= scope.photos.length - 1 ? false : true
            }

            scope.$watch('show', function (newVal, oldVal) {
                scope.initShow();
            });
        }
    }
}]);