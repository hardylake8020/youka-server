zhuzhuqs.directive('zzValidation', function ($parse) {
  var _isMobile = /^\d{11}$/;
  var _integer = /\D/g;
  var _number = /[^\d{1}\.\d{1}|\d{1}]/g;
  var _result = '';
  return {
    require: '?ngModel',
    restrict: 'A',
    link: function (scope, element, attrs, modelCtrl) {
      if (!modelCtrl) {
        return;
      }
      _result = '';
      scope.$watch(attrs.ngModel, function () {
        var _regx = '';
        switch (attrs.zzValidationType) {
          case 'mobile':
            _regx = new RegExp(_isMobile);
            interceptionStr(_regx);
            break;
          case 'telephone':
            telephoneStr();
            break;
          case 'mail':
            mailStr();
            break;
          case 'integer':
            _regx = new RegExp(_integer);
            replaceStr(_regx);
            break;
          case 'number':
            _regx = _number;
            replaceStr(_regx);
            break;
          default:
            break;
        }
        modelCtrl.$setViewValue(_result);
        modelCtrl.$render();
      });
      element.bind('change', function () {
        var _regx = '';
        switch (attrs.zzValidationType) {
          case 'telephone':
            _regx = new RegExp(/\d{3}-\d{7,8}|\d{4}-\{7,8}/);
            if (!_regx.test(modelCtrl.$viewValue)) {
              modelCtrl.$setValidity('unique', false);
            }
            else {
              modelCtrl.$setValidity('unique', true);
            }
            break;
          case 'mail':
            _regx = new RegExp(/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/);
            if (!_regx.test(modelCtrl.$viewValue)) {
              modelCtrl.$setValidity('unique', false);
            }
            else {
              modelCtrl.$setValidity('unique', true);
            }
            break;
        }
      });

      var replaceStr = function (regx) {
        _result = modelCtrl.$viewValue.replace(regx, '');
        if (attrs.zzValidationType == 'number') {
          if (_result.indexOf('.') == 0) {
            _result = '';
          }
          else if(_result.indexOf('.')<_result.lastIndexOf('.')){
            _result = _result.substr(0, _result.length-1);
          }
        }
      };

      var interceptionStr = function (regx) {
        _result = modelCtrl.$viewValue.replace(_integer, '');
        if (!regx.test(modelCtrl.$viewValue)) {
          _result = _result.substr(0, 11);
        }
      };

      var telephoneStr = function () {
        _result = modelCtrl.$viewValue.replace(/[^-\d]/g, '');
        if (_result.indexOf('-') == 0) {
          _result = '';
        }
        else if(_result.indexOf('-')<_result.lastIndexOf('-')){
          _result = _result.substr(0, _result.length-1);
        }

      };

      var mailStr = function () {
        _result = modelCtrl.$viewValue.replace(/[^\w\d\.|\-|_|\@]/g, '');
      };
    }
  }
});

//正实数（包括整数，小数，分数）
zhuzhuqs.directive('inputRealNumber', ['$timeout', function ($timeout) {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, $element) {
      $element.keyup(function (e) {
        var inputNumber = $(this).val();
        if (!inputNumber) {
          return;
        }
        if (/^([0-9]+)\.{0,1}([0-9]{0,})$/.test(inputNumber)) {
          return;
        }

        var numberRegex = /[^\d{1}\.\d{1}|\d{1}]/g;
        inputNumber = inputNumber.toString().replace(numberRegex, '');

        if (inputNumber.indexOf('.') == 0) {
          inputNumber = '';
        }
        else if (inputNumber.indexOf('.') < inputNumber.lastIndexOf('.')) {
          inputNumber = inputNumber.slice(0, inputNumber.lastIndexOf('.'));
        }

        $(this).val(inputNumber);
        $(this).change(); //触发变化，才能绑定数据成功
      });
    }
  };
}]);