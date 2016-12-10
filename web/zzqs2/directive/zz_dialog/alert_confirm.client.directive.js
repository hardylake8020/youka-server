zhuzhuqs.directive('zzAlertConfirmDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show">' +
    '<div class="zz-alert">' +
    '<div class="zz-alert-title"> <span>{{alertConfig.title}}</span></div>' +
    '<div class="zz-alert-content"> <span>{{alertConfig.content}}</span></div>' +
    '<div class="row zz-alert-confirm-handle">' +
    '<div class="col-xs-6">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="sure()">{{alertConfig.sure}}</div>' +
    '</div>' +
    '<div class="col-xs-6">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div> ' +
    '</div> </div> </div></div>',
    replace: true,
    scope:{},
    controller: 'AlertConfirmController'
  }
});