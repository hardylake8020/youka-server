/**
 * Created by Wayne on 15/8/6.
 */

tender.directive('zzAlertPromptDialog', function () {
  return {
    restrict: 'A',
    template:
    '<div class="mask" ng-show="alertConfig.show">' +
      '<div class="zz-alert">' +
        '<div class="zz-alert-title"><span>{{alertConfig.title}}</span> <span class="cancel" ng-click="cancel()"></span></div>' +
        '<div class="zz-alert-prompt-tip"><span>{{alertConfig.tipText}}</span></div>' +
        '<div class="zz-alert-prompt-input"><input class="text" ng-class="{\'not-empty\': alertConfig.inputContent !==\'\'}" placeholder="{{alertConfig.placeholderText}}" ng-model="alertConfig.inputContent" /></div>' +
        '<div class="zz-alert-prompt-handle">' +
          '<div class="zz-btn-primary zz-alert-btn" ng-click="sure()">{{alertConfig.sure}}</div>' +
        '</div>' +
      '</div>' +
    '</div>',
    replace: true,
    scope:{},
    controller: 'AlertPromptController'
  }
});