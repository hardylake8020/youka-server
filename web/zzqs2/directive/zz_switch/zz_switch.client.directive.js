/**
 * Created by Wayne on 16/1/14.
 */

zhuzhuqs.directive('zzSwitch', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_switch/zz_switch.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      scope.config.switchHandle = function () {
        scope.config.isOpen = !scope.config.isOpen;
      };
      function initConfig() {
        scope.config.isOpen = scope.config.isOpen || false;
        scope.config.openText = scope.config.openText || '是';
        scope.config.closeText = scope.config.closeText || '否';
      };

      initConfig();
    }
  };
}]);
