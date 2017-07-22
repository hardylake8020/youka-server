/**
 * Created by wayne on 2016/12/22.
 */

'use strict';

zhuzhuqs.directive('fixListHeader', [function () {
  return {
    restrict: 'A',
    scope:{},
    controller: function ($scope, $element) {
      $element.scroll(function () {
        var that = $(this);
        that.find('.fix-list-header').css({'top': that.scrollTop()+'px'});
      });
    }
  };

}]);
