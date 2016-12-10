tender.directive('zzAlertDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show"><div class="zz-alert">' +
    '<div class="zz-alert-title"> <span>{{alertConfig.title}}</span></div>' +
    '<div class="zz-alert-content"> <span>{{alertConfig.content}}</span></div>' +
    '<div class="zz-alert-handle">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div>' +
    ' </div></div></div>',
    replace: true,
    scope:{},
    controller: 'AlertController'
  }
});