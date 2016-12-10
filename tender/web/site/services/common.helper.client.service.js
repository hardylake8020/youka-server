/**
 * Created by Wayne on 16/3/17.
 */

'use strict';

tender.factory('CommonHelper', ['GlobalEvent', function (GlobalEvent) {

  var commonHelper = {
    showAlert: function (scope, info) {
      return scope.$emit(GlobalEvent.onShowAlert, info);
    }
  };

  return commonHelper;
}]);