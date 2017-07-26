'use strict';

var tender = angular.module('tender', [
  'ngAnimate',
  'ui.router',
  // 'ngMessages',
  'pasvaz.bindonce',
  'angularytics',
  'LocalStorageModule',
  'ui.bootstrap.datetimepicker',
  'vr.directives.slider',
  'daterangepicker',
  'ngMaterial'
]);

tender.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('tender_follow', {
      url: '/tender_follow',
      templateUrl: 'templates/tender.follow.client.view.html',
      controller: 'TenderFollowController'
    })
    .state('tender_follow_new', {
      url: '/tender_follow_new',
      templateUrl: 'templates/tender.follow_new.client.view.html',
      controller: 'TenderFollowNewController'
    })
    .state('order_detail', {
      url: '/order_detail/:tender_id',
      templateUrl: 'templates/order_detail.client.view.html',
      controller: "OrderDetailController"
    })
    .state('order_detail.info', {
      url: '/order_detail_info/:tender_id',
      templateUrl: 'templates/order_detail_info.client.view.html',
      controller: "OrderDetailInfoController"
    })
    .state('order_detail.timeline', {
      url: '/order_detail_timeline/:tender_id',
      templateUrl: 'templates/order_detail_timeline.client.view.html',
      controller: "OrderDetailTimelineController"
    })
    .state('order_detail.map', {
      url: '/order_detail_map/:tender_id',
      templateUrl: 'templates/order_detail_map.client.view.html',
      controller: "OrderDetailMapController"
    })
    .state('order_detail.adjustment', {
      url: '/order_detail_adjustment/:tender_id',
      templateUrl: 'templates/order_detail_adjustment.client.view.html',
      controller: "OrderDetailAdjustmentController"
    })
    .state('order_detail.confirm', {
      url: '/order_detail_confirm/:order_id',
      templateUrl: 'templates/order_detail_confirm.client.view.html',
      controller: "OrderDetailConfirmController"
    })
    .state('driver_list', {
      url: '/driver_list',
      templateUrl: 'templates/driver_list.client.view.html',
      controller: 'DriverlistController'
    })
    .state('tender_create', {
      url: '/tender_create/:tender_id',
      templateUrl: 'templates/tender.create.client.view.html',
      controller: 'TenderCreateController'
    });

  $urlRouterProvider.otherwise('/tender_follow');
}]);

tender.config(['AngularyticsProvider', function (AngularyticsProvider) {
  AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
}]);

tender.config(['localStorageServiceProvider', function (localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('zz');
}]);

tender.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('PublicInterceptor');

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */
  var param = function (obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
    for (name in obj) {
      value = obj[name];

      if (value instanceof Array) {
        for (i = 0; i < value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if (value instanceof Object) {
        for (subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if (value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function (data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
}]);

tender.run(
  ['$rootScope', '$state', '$location', 'GlobalEvent', 'Auth', 'User', 'StoreHelper', 'config', '$window', function ($rootScope, $state, $location, GlobalEvent, Auth, User, StoreHelper, config, $window) {
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      //$rootScope.$broadcast(GlobalEvent.onStateChanged, toState.name);
      //return;
    });

    var token = document.getElementById('error3').getAttribute('data-value');
    if (token) {
      Auth.setToken(token);
    }

    var windowElement = angular.element($window);
    windowElement.on('beforeunload', function (event) {
      Auth.setLatestUrl($state.current.name, $state.params.params);
      StoreHelper.reset();
    });
  }]
);

tender.config(function () {
  //为了解决IE9下，console对象为空的问题。
  // 此时浏览器没有log输出，如果打开了调试器，则console对象存在，可正常输出log，不过需要刷新。
  if (!window.console) {
    window.console = {
      log: function () {
      }
    };
  }

});

tender.filter('replace', function () {
  return function (input, target, replacement, attributes) {
    if (input) {
      var pattern = new RegExp(target, attributes);
      return input.replace(pattern, replacement);
    }
  };
});