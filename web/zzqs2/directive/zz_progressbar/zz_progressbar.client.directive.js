  zhuzhuqs.controller('ProgressBarController', ['$scope', '$attrs', function($scope, $attrs) {
    var self = this,
      animate = angular.isDefined($attrs.animate) ? $scope.$parent.$eval($attrs.animate) : true;

    this.bars = [];
    $scope.max = angular.isDefined($scope.max) ? $scope.max : 100;

    this.addBar = function(bar, element, attrs) {
      if (!animate) {
        element.css({'transition': 'none'});
      }

      this.bars.push(bar);

      bar.max = $scope.max;
      bar.title = attrs && angular.isDefined(attrs.title) ? attrs.title : 'progressbar';

      bar.$watch('value', function(value) {
        bar.recalculatePercentage();
      });

      bar.recalculatePercentage = function() {
        var totalPercentage = self.bars.reduce(function(total, bar) {
          bar.percent = +(100 * bar.value / bar.max).toFixed(2);
          return total + bar.percent;
        }, 0);

        if (totalPercentage > 100) {
          bar.percent -= totalPercentage - 100;
        }
      };

      bar.$on('$destroy', function() {
        element = null;
        self.removeBar(bar);
      });
    };

    this.removeBar = function(bar) {
      this.bars.splice(this.bars.indexOf(bar), 1);
      this.bars.forEach(function (bar) {
        bar.recalculatePercentage();
      });
    };

    $scope.$watch('max', function(max) {
      self.bars.forEach(function(bar) {
        bar.max = $scope.max;
        bar.recalculatePercentage();
      });
    });
  }])
  .directive('progressbar', function() {
    return {
      replace: true,
      transclude: true,
      controller: 'ProgressBarController',
      scope: {
        value: '=',
        max: '=?',
        type: '@'
      },
      templateUrl: 'directive/zz_progressbar/zz_progressbar.client.directive.view.html',
      link: function(scope, element, attrs, progressCtrl) {
        progressCtrl.addBar(scope, angular.element(element.children()[0]), {title: attrs.title});
      }
    };
  });
