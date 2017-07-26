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
      scope.pageConfig = {
        isShowOption: false,
        options: [
          {
            type: 'increase',
            text: '付款'
          },
          {
            type: 'decrease',
            text: '扣款'
          }
        ],
        selectOption: {},
        showOption: function (isShow) {
          if (!scope.config.disabled) {
            this.isShowOption = isShow;
          }
        },
        clickOption: function (item) {
          if (scope.config.disabled) {
            return;
          }

          if (scope.config.type !== item.type) {
            this.selectOption = item;
            scope.config.type = item.type;
            scope.config.changePrice();
          }
          this.showOption(false);
        },
        init: function () {
          for (var i = 0; i < this.options.length; i++) {
            if (this.options[i].type === scope.config.type) {
              this.selectOption = this.options[i];
              break;
            }
          }
        }
      };

      scope.pageConfig.init();
    }
  };
}]);
