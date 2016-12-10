/**
 * Created by elinaguo on 15/5/24.
 */
/**

 html页面:
 <zz-select config="data"></zz-select>

 controller:
 scope.data = {
    current = null,
    defaultContent = '请选择仓库管理员',
    assignInfo.options = [{key: 123, value: 'displayName',group_type: 'warehouse'}  //作为可选项
                          ,{key: null, value: 'tagName', group_type: 'tag_type'}  //作为标签项
                          ,{...}]
 };
 //收起
 scope.closeSelect();

 */

angular.module('tender').directive('zzSelect', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'E',
    replace: true,
    template: '<div class="zz-select" ng-class="{\'disabled\': !config.enableEdit}">'

    + '<div class="zz-select-current">'
    + '<input class="zz-select-current-text" ng-class="{\'not-empty\': config.currentText}" ng-disabled="!config.enableEdit" ng-blur="onLeaveInputBox();" ng-model="config.currentText" zzplacehold="{{config.defaultContent}}" ng-readonly="!config.enableEdit" />'
    + '<div class="zz-select-current-icon" ng-class="isExpand? \'expand\':\'\'" ng-click="toggleExpand($event);"></div>'
    + '</div>'

    + '<div class="zz-select-options" ng-show="isExpand">'
    + '<div class="zz-select-option" ng-repeat="option in config.options | filter: config.currentText" ng-value="option.key" ng-class="{\'option-tag\': option.key == null || option.key == \'\' || option.unable, \'selected\': config.currentChoice.key === option.key}" ng-click="changeValue(option);" >' +
    '<span class="text" title={{option.value}} ' +
    'ng-class="{authed: option.group_type===\'company\' && option.authed, ' +
    'gold: option.group_type===\'driver\' && option.goodEvaluation >=80, ' +
    'silver: option.group_type===\'driver\' && option.goodEvaluation < 80 && option.goodEvaluation >= 60 ,' +
    'bronze: option.group_type===\'driver\' && option.goodEvaluation < 60 ,' +
    'wechat: option.is_wechat' +
    '}"' +
    '>{{option.value}}</span>'
    + '</div>'
    + '</div>'

    + '</div>',
    scope: {config: '='},
    link: function (scope, elem, attrs) {

      //外界可以直接，进行收起操作
      scope.config.closeSelect = function () {
        scope.isExpand = false;
      };

      scope.isExpand = false;
      scope.toggleExpand = function (event) {
        if (scope.config.enableEdit) {
          scope.isExpand = !scope.isExpand
        }
        event.stopPropagation();
      };

      scope.changeValue = function (option) {
        if (!option) {
          return;
        }

        if (option.unable) {
          return;
        }
        //选择标签内容不做选择
        if (option.key == null || option.key == '') {
          return;
        }

        if (scope.config.currentChoice && option.key === scope.config.currentChoice.key) {
          scope.config.currentText = scope.config.currentChoice.value;
          return;
        }

        scope.config.currentChoice = option;
        scope.config.currentText = scope.config.currentChoice.value;

        scope.isExpand = false;
        if (scope.config.onSelected) {
          scope.config.onSelected(option);
        }
      };

      initConfig();
      function initConfig() {
        if (!scope.config.currentText) {
          if (scope.config.currentChoice && scope.config.currentChoice.value) {
            scope.config.currentText = scope.config.currentChoice.value;
          }
          else {
            scope.config.currentText = '';
          }
        }

        if (scope.config.enableEdit !== false && scope.config.enableEdit !== 'false') {
          scope.config.enableEdit = true;
        }

        if (!scope.config.options) {
          scope.options = [];
        }

        if (!scope.config.defaultContent) {
          scope.config.defaultContent = '请选择';
        }
      };

      scope.onLeaveInputBox = function () {
        var clearSelected = false;

        if (!scope.config.currentChoice) {
          clearSelected = true;
        }
        else {
          if (scope.config.currentChoice.value !== scope.config.currentText) {
            clearSelected = true;
          }
        }

        if (clearSelected) {
          scope.config.currentChoice = null;

          if (scope.config.onSelected) {
            scope.config.onSelected(null);
          }
        }

      };

      scope.$on(GlobalEvent.onBodyClick, function () {
        if (scope.isExpand)
          scope.isExpand = false;
      });

      scope.$watch(function () {
        return scope.config.currentText;
      }, function () {
        if (scope.config.currentText === scope.config.currentChoice) {
          return;
        }
        if (scope.config.currentChoice && (scope.config.currentText === scope.config.currentChoice.value)) {
          return;
        }
        else {
          if (scope.config.enableEdit) {
            scope.isExpand = true;
          }
        }

      });

    }
  };
}]);
