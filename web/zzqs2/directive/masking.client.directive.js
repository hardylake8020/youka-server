angular.module('zhuzhuqs').directive('zzMasking', function () {
  return {
    restrict: 'A',
    template: '<div class="zz-masking-layer" ng-if="showMasking"></div>',
    replace: true
  }
});