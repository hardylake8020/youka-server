/**
 * Created by Wayne on 16/1/14.
 */

zhuzhuqs.directive('adjustFee', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/adjust_fee/adjust_fee.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {

    }
  };
}]);
