/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

tender.directive('zzplacehold', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ctrl) {

      var value;

      var placehold = function () {
        element.val(attr.zzplacehold)
      };
      var unplacehold = function () {
        element.val('');
      };

      scope.$watch(attr.ngModel, function (val) {
        value = val || '';

      });

      element.bind('focus', function () {
        if(value == '') unplacehold();
      });

      element.bind('blur', function () {
        if (element.val() == '') placehold();
      });

      ctrl.$formatters.unshift(function (val) {
        if (!val) {
          placehold();
          value = '';
          return attr.zzplacehold;
        }
        return val;
      });
    }
  };
});