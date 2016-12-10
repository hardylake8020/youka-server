tender.directive('zzLoading', function () {
  return {
    restrict: 'A',
    template: '<div class="zz-loading-layer" ng-if="showLoading">' +
    '<div class="zz-loading-info"> ' +
    '<img ng-src="images/global/load.gif"/>' +
    ' </div> </div>',
    replace: true
  }
});