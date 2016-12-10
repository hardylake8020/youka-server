/**
 * Created by Wayne on 15/9/8.
 */

zhuzhuqs.directive('zzAlertConfirmStyleDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show">' +
    '<div class="zz-alert confirm-style">' +
      '<div class="zz-alert-title">' +
        '<span>{{alertConfig.title}}</span>' +
      '</div>' +
      '<div class="zz-alert-content">' +
        '<p class="floor-one" ng-show="alertConfig.content_one !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_one}}</span></p>' +
        '<p class="floor-two" ng-show="alertConfig.content_two !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_two}}</span></p>' +
        '<p class="floor-three" ng-show="alertConfig.content_three !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_three}}</span></p>' +
      '</div>' +
      '<div class="row zz-alert-confirm-handle">' +
        '<div class="col-xs-6">' +
          '<div class="zz-btn-primary zz-alert-btn" ng-click="sure()">{{alertConfig.sure}}</div>' +
        '</div>' +
        '<div class="col-xs-6">' +
          '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div> ' +
        '</div> ' +
      '</div> ' +
    '</div>' +
    '</div>',
    replace: true,
    scope: {},
    controller: 'AlertConfirmStyleController'
  }
});