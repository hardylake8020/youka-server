angular.module('zhuzhuqs').directive('zzButton', function () {
  return {
    restrict: 'A',
    scope: {},
    link: function (scope, elem, attrs) {
      if (!attrs.defaultButton || attrs.defaultButton == "true") {
        elem.bind('click', function() {
          elem.css('color', 'red');
        });
        elem.bind('mouseover', function() {
          elem.css('cursor', 'pointer');
          elem.css('color', 'blue');
        });
        elem.bind('mouseout', function() {
          elem.css('color', 'yellow');
        });
      }
    }
  }
});