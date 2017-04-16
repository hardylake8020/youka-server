'use strict';

var zhuzhuqs = angular.module('zhuzhuqs', [
  'ngAnimate',
  'ui.router',
  'ngMessages',
  'pasvaz.bindonce',
  'angularytics',
  'LocalStorageModule',
  'daterangepicker',
  //'highcharts-ng',
  'ng-echarts',
  'ae-datetimepicker'
]);

zhuzhuqs.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'templates/home.client.view.html',
      controller: "HomeController"
    })
    .state('order_assign', {
      url: '/order_assign',
      templateUrl: 'templates/order_assign.client.view.html',
      controller: "OrderAssignController"
    })
    .state('order_create', {
      url: '/order_create/:order/:modify_type/:title',
      templateUrl: 'templates/order_create.client.view.html',
      controller: "OrderCreateController"
    })
    .state('order_batch_create', {
      url: '/order_batch_create',
      templateUrl: 'templates/order_batch_create.client.view.html',
      controller: "OrderBatchCreateController"
    })
    .state('order_configuration', {
      url: '/order_configuration',
      templateUrl: 'templates/order_configuration.client.view.html',
      controller: "OrderConfigurationController"
    })
    .state('order_follow', {
      url: '/order_follow',
      templateUrl: 'templates/order_follow.client.view.html',
      controller: "OrderFollowController"
    })
    .state('map_for_order_trace', {
      url: '/mapForOrderTrace',
      templateUrl: 'templates/map_for_order_trace.client.view.html',
      controller: 'MapForOrderTraceController'
    })
    .state('order_operation', {
      url: '/order_operation',
      templateUrl: 'templates/order_operation.client.view.html',
      controller: "OrderOperationController"
    })
    .state('order_operation.assign', {
      url: '/order_operation_assign',
      templateUrl: 'templates/order_assign.client.view.html',
      controller: "OrderAssignController"
    })
    .state('order_operation.follow_onway', {
      url: '/order_operation_follow_onway',
      templateUrl: 'templates/order_follow.client.view.html',
      controller: "OrderOperationFollowOnWayController"
    })
    .state('order_operation.follow_completed', {
      url: '/order_operation_follow_completed',
      templateUrl: 'templates/order_follow.client.view.html',
      controller: "OrderOperationFollowCompletedController"
    });

  $urlRouterProvider.otherwise('/');
}]);

zhuzhuqs.config(['AngularyticsProvider', function (AngularyticsProvider) {
  AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
}]);

zhuzhuqs.config(['localStorageServiceProvider', function (localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('zz');
}]);

zhuzhuqs.config(['$httpProvider', function ($httpProvider) {
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


zhuzhuqs.run(
  ['$rootScope', '$state', '$location', 'Auth', 'User', 'config', 'GlobalEvent', '$window', 'dateRangePickerConfig',
    function ($rootScope, $state, $location, Auth, User, config, GlobalEvent, $window, dateRangePickerConfig) {
      dateRangePickerConfig.separator = ' ~ ';
      dateRangePickerConfig.format = 'YY/MM/DD HH:mm';

      $rootScope.showLoading = false;
      $rootScope.showMasking = false;
      $rootScope.$on(GlobalEvent.onShowLoading, function (event, bo) {
        $rootScope.showLoading = bo;
      });
      $rootScope.$on(GlobalEvent.onShowMasking, function (event, bo) {
        $rootScope.showMasking = bo;
      });
      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        var to = document.getElementById('error3').getAttribute('data-value');
        if (to != ""){
          Auth.setToken(to);
        }
        else {
          if (Auth.getToken() == "") {
            event.preventDefault();
            window.location = config.login;
          }
        }
        //判断用户数据是否存在
        if (!Auth.isLoggedIn()) {
          event.preventDefault();
          //没有用户数据，需要重新获取用户，页面可能需要被重定向
          User.getMe(Auth.getToken())
            .then(function (data) {
              if (data.err) {
                return window.location = config.login;
              }
              Auth.setUser(data);
              var obj = Auth.getLatestUrl();
              var state = 'home';
              var params = '';
              if (obj && obj != '^' && obj.state) {
                state = obj.state;
                params = obj.params;
              }
              return $state.go(state, params);
            },
            function (err) {
              alert('系统错误' + JSON.stringify(err));
            });
        }
      });
      var windowElement = angular.element($window);
      windowElement.on('beforeunload', function (event) {
        Auth.setLatestUrl($state.current.name, $state.params);
      });
    }]);

zhuzhuqs.config(function () {
  //为了解决IE9下，console对象为空的问题。
  // 此时浏览器没有log输出，如果打开了调试器，则console对象存在，可正常输出log，不过需要刷新。
  if (!window.console) {
    window.console = {
      log: function () {
      }
    };
  }

});

//zhuzhuqs.run(['Angularytics', '$rootScope', '$timeout', function (Angularytics, $rootScope, $timeout) {
//  Angularytics.init();
//}]);

//ga.js
//(function (i, s, o, g, r, a, m) {
//  i['GoogleAnalyticsObject'] = r;
//  i[r] = i[r] || function () {
//    (i[r].q = i[r].q || []).push(arguments)
//  }, i[r].l = 1 * new Date();
//  a = s.createElement(o),
//    m = s.getElementsByTagName(o)[0];
//  a.async = 1;
//  a.src = g;
//  m.parentNode.insertBefore(a, m)
//})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
//
//ga('create', 'UA-8594346-14', 'auto');
//ga('send', 'pageview');
//

zhuzhuqs.constant('config', {
  serverAddress: 'http://' + window.location.host,
  serverWebAddress: 'http://' + window.location.host + "/zzqs2",
  pushServerAddress:document.getElementById('error4').getAttribute('data-value'),
  login: 'http://' + window.location.host + "/signin",
  qiniuServerAddress: 'http://7xiwrb.com1.z0.glb.clouddn.com/@',
  maxAddressOffset: 1000
});

/**
 * Created by elinaguo on 15/5/25.
 */
//日期时间格式化
Date.prototype.Format = function (fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};

//根据对象的属性值名对去获取指定的值名对集合。
//仅限于value为基本类型，引用类型不适合.
Array.prototype.zzGetByAttribute = function (attrName, attrValue) {
  var records = [];
  for (var i = 0; i < this.length; i++) {
    if (attrValue === this[i][attrName]) {
      records.push(this[i]);
    }
  }

  return records;
};

angular.module('zhuzhuqs').factory('PublicInterceptor', ['Auth', function (Auth) {
  return {
    'request': function (req) {
      req.data = req.data ? req.data : {};
      req.data.access_token = Auth.getToken();
      req.params = req.params ? req.params : {};
      req.params.access_token = Auth.getToken();
      req.params.no_cache =new Date().getTime();
      return req;
    },
    'response': function (resp) {
      return resp;
    },
    'requestError': function (rejection) {
      return rejection;
    },
    'responseError': function (rejection) {
      return rejection;
    }
  }
}]);


/**
 * Created by Wayne on 15/11/20.
 */
zhuzhuqs.factory('InformService',
  ['config', 'InformEnum', 'CommonSocketService', 'UserConfigSocketService', 'AbnormalOrderSocketService',
    function (config, InformEnum, CommonSocketService, UserConfigSocketService, AbnormalOrderSocketService) {
      var socket = null;
      var otherServices = [UserConfigSocketService, AbnormalOrderSocketService];

      var socketConfig = {};
      socketConfig.addCallback = function (name, value) {
        socketConfig[name] = value;
      };
      socketConfig.addCallback(InformEnum.onAddUser, function (data) {
        //更新所有通知
        socketConfig.getAbnormalInforms();
      });
      function configOtherRoute() {
        if (!socket) {
          return;
        }
        otherServices.forEach(function (item) {
          item.init(socket, socketConfig);
        });
      }
      function combineOtherService() {
        otherServices.forEach(function (serviceItem) {
          for (var name in serviceItem) {
            if (name !== 'init') {
              if (typeof serviceItem[name] === 'function') {
                socketConfig[name] = serviceItem[name];
              }
            }
          }
        });
      }
      function configSelfRoute() {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_socket_connection_success, function (data) {
          socketConfig.addUser();
        });
      }

      // socketConfig.connect = function () {
      //   socket = io.connect(config.pushServerAddress);
      //   if (socket) {
      //     //配置别人的路由,
      //     configOtherRoute();
      //     //合并别人的方法
      //     combineOtherService();
      //     //调用自己的路由
      //     configSelfRoute();
      //   }
      //   else {
      //     console.log('socket io connect to' + config.pushServerAddress + 'failed');
      //   }
      // };

      return socketConfig;
    }]);
/**
 * Created by Wayne on 15/11/22.
 */

zhuzhuqs.factory('AbnormalOrderSocketService',
  ['Auth', 'CommonSocketService', 'InformEnum',
    function (Auth, CommonSocketService, InformEnum) {
      var socket = null;

      function configRoute(parentObject) {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_single, parentObject[InformEnum.onSingleAbnormalOrder]);
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_batch, parentObject[InformEnum.onBatchAbnormalOrder]);
        CommonSocketService.receive(socket, InformEnum.web_abnormal_order_clear, parentObject[InformEnum.onClearAbnormalOrder]);
      }

      return {
        init: function(currentSocket, parentObject) {
          socket = currentSocket;
          configRoute(parentObject);
        },
        getAbnormalInforms: function () {
          var companyId = Auth.getUser().company._id;
          var groupIds = Auth.getGroups();
          var userId = Auth.getUser()._id;
          CommonSocketService.send(socket, InformEnum.web_abnormal_order_batch, {company_id: companyId,group_ids: groupIds, user_id: userId});
        },
        clearAbnormalInforms: function () {
          var companyId = Auth.getUser().company._id;
          var groupIds = Auth.getGroups();
          var userId = Auth.getUser()._id;
          CommonSocketService.send(socket, InformEnum.web_abnormal_order_clear, {company_id: companyId,group_ids: groupIds, user_id: userId});
        }
      };

    }]);
/**
 * Created by Wayne on 15/11/20.
 */
zhuzhuqs.factory('CommonSocketService', function () {

  return {
    receive: function (socket, route, callback) {
      // socket.on(route, function (data) {
      //   console.log('socket receive ', route, data);
      //   if (callback) {
      //     callback(data);
      //   }
      // });
    },
    send: function (socket, route, data) {
      console.log('socket send ', route, data);
      // socket.emit(route, data);
    }
  };

});
/**
 * Created by Wayne on 15/11/20.
 */

zhuzhuqs.factory('UserConfigSocketService',
  ['$timeout', 'InformEnum', 'Auth', 'CommonSocketService',
    function ($timeout, InformEnum, Auth, CommonSocketService) {
      var socket;
      var company;
      var updateUserCount = 0;

      function getUserCompany() {
        if (!company) {
          company = Auth.getUser().company;
        }
        return company;
      }

      function configRoute(parentObject) {
        if (!socket) {
          return;
        }
        CommonSocketService.receive(socket, InformEnum.web_add_user, parentObject[InformEnum.onAddUser]);
      }

      return {
        init: function (currentSocket, parentObject) {
          socket = currentSocket;
          configRoute(parentObject);
        },
        addUser: function () {
          console.log('updateUserCount ',++updateUserCount);

          var that = this;
          $timeout(function () {
            var company = getUserCompany();
            var groupIds = Auth.getGroups();

            if (socket && company) {
              CommonSocketService.send(socket, InformEnum.web_add_user, {company_id: company._id, group_ids: groupIds});
            }
            else {
              that.addUser();
            }
          }, 2000);
        }
      };

    }]);
/**
 * Created by Wayne on 15/5/26.
 */
'use strict';

zhuzhuqs.service('AudioPlayer', ['$q', function ($q) {
  return function (audioPath, callback) {
    var audioStatus = {
      unknown: 'unknown',
      loaded: 'loaded',
      playing: 'playing',
      stoped: 'stoped',
      error: 'error'
    };

    this.duration = 0;
    this.currentTime = 0;
    this.status = audioStatus.unknown;
    var mirrorThis = this; //this对象的镜像，用于函数类的赋值，防止闭包。

    var audio = null;

    if (window.Audio) {
      audio = new Audio();

      audio.addEventListener('error', function() {
        mirrorThis.status = audioStatus.error;

        if (callback)
          callback('error', mirrorThis.status);
      });

      audio.addEventListener('canplaythrough', function() { //可以完整播放时，所有帧下载完毕
        mirrorThis.status = audioStatus.loaded;
        if (audio.duration)
          mirrorThis.duration = Math.ceil(audio.duration); //向上取整

        if (callback)
          callback('loaded', mirrorThis.status);
      });

      audio.addEventListener('ended', function() {
        audio.currentTime = 0;
        mirrorThis.status = audioStatus.stoped;
        if (callback)
          callback('ended', mirrorThis.status);
      });
    }
    else {
      mirrorThis.status = audioStatus.error;
      if (callback)
        callback('error', mirrorThis.status);
    }
    this.setVolume = function (volume) {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (volume < 0) {
          volume = 0;
        }
        if (volume > 1) {
          volume = 1;
        }

        audio.volume = volume;
      }
    };

    this.play = function () {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (mirrorThis.status !== audioStatus.playing) {
          audio.play();
        }
        mirrorThis.status = audioStatus.playing;
        callback('playing', audioStatus.playing);
      }
    };

    this.stop = function () {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (mirrorThis.status !== audioStatus.stoped) {
          audio.pause();
          audio.currentTime = 0;
        }

        mirrorThis.status = audioStatus.stoped;
      }
    };

    this.close = function () {
      if (audio) {
        audio.pause();
        audio = null;
        mirrorThis.status = audioStatus.unknown;
      }
    };

    //bug fix for chrome;
    setTimeout(function () {
      if (audio)
        audio.src = audioPath;
    }, 1);

  };
}]);
zhuzhuqs.factory('Auth', ['localStorageService', '$rootScope', 'GlobalEvent', function (localStorageService, $rootScope, GlobalEvent) {
  var _user = null;
  var _cmp = null;
  var _groups = [];
  var token = "";
  var userUpdatedCallbacks = [];
  return {
    isAuthorized: function (lvl) {
      var _pass = false;
      for (var i = 0; i < _user.roles.length; i++) {
        if (_user.roles[i] >= lvl) {
          _pass = true;
          break;
        }
      }
      return _pass;
    },
    isLoggedIn: function () {
      return _user ? true : false;
    },
    getUser: function () {
      return _user;
    },
    setUser: function (u) {
      _user = u;
      $rootScope.$broadcast(GlobalEvent.onUserReseted);
    },
    getCompany: function () {
      return _cmp;
    },
    setCompany: function (cmp) {
      if (!_user.company)
        _user.company = cmp;
      _cmp = cmp;
    },
    getGroups: function () {
      if (_groups.length === 0) {
        if (_user && _user.executeGroups) {
          _groups = _user.executeGroups.map(function (item) {
            return item.group._id;
          });
        }
      }
      return _groups;
    },
    getToken: function () {
      if (token == "") {
        var local = localStorageService.get('token');
        if (!local || local == "" || local == "<%=  test %>") {
          localStorageService.set('token', "");
          token = "";
        }
        else {
          token = local;
        }
      }
      return token;
    },
    setToken: function (t) {
      token = t;
      localStorageService.set('token', token);
    },
    getLatestUrl: function () {
      return localStorageService.get(_user.username + 'state') || '';
    },
    setLatestUrl: function (state, params) {
      if (_user) {
        localStorageService.set(_user.username + 'state', {'state': state, 'params': params});
      }
    },
    logout: function () {
      $rootScope.user = null;
      _user = null;
    },
    onUserUpdatedCallback: function (callback, state) {
      for (var i = 0; i < userUpdatedCallbacks.length; i++) {
        if (userUpdatedCallbacks[i].state === state) {
          return;
        }
      }
      userUpdatedCallbacks.push({callback: callback, state: state});
    },
    userUpdatedCallback: function () {
      userUpdatedCallbacks.forEach(function (item) {
        item.callback(_user);
      });
    }
  }
}
]);
/**
 * Created by Wayne on 15/12/7.
 */

zhuzhuqs.factory('BidderService', ['config','HttpService', function (config, HttpService) {
  return {
    getDetailList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/bidder/list/all/detail');
    },
    inviteBidderByPhone: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/bidder/invite', params);
    },
    removeCompanyBidder: function(params){
      return HttpService.postDataToServer(config.serverAddress + '/bidder/remove-company-bidder', params)
    }
  };
}]);
zhuzhuqs.factory('BMapService', ['$http', '$q', 'config', function ($http, $q, config) {

  return {
    create: function (mapLayoutId, currentCity, degree, enableScrollWheelZoom) {
      var map = new BMap.Map(mapLayoutId);
      map.centerAndZoom(currentCity, degree);  // 初始化地图,设置中心点坐标和地图级别
      map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
      map.enableScrollWheelZoom(enableScrollWheelZoom);     //开启鼠标滚轮缩放
      console.log(map);
      return map;
    },
    drawLine: function (map, traces, latestPoint, onlyGps) {
      var points = [];
      var gpsPoints = [];

      traces.forEach(function (trace) {
        //TODO 之后优化 时间紧急
        if (trace.location[0] != Number.MIN_VALUE && trace.location[1] != Number.MIN_VALUE) {
          var traceTime = new Date(trace.time);
          if (latestPoint.time < traceTime) {
            latestPoint.trace = trace;
            latestPoint.time = traceTime;
          }
          if (trace.location[0] != 0 && trace.location[1] != 0) {
            if (trace.type == 'gps') {
              gpsPoints.push(new BMap.Point(trace.location[0], trace.location[1]));
            }
            points.push(new BMap.Point(trace.location[0], trace.location[1]));
          }
        }
      });

      var polyline;
      if (onlyGps) {
        polyline = new BMap.Polyline(gpsPoints, {strokeColor: "blue", strokeWeight: 2, strokeOpacity: 0.5});   //创建折线
      }
      else {
        polyline = new BMap.Polyline(points, {strokeColor: "blue", strokeWeight: 2, strokeOpacity: 0.5});   //创建折线
      }
      map.addOverlay(polyline);

      return {points: points, gpsCount: gpsPoints.length, ungpsCount: points.length - gpsPoints.length};
    },
    drawDriverEvent: function (map, event, tipContent) {
      if (event.type === 'confirm') {
        return;
      }

      console.log(event, 'event===========');

      var myIcon = {};
      var iconSize = new BMap.Size(42, 33);
      var iconAnchorSize = new BMap.Size(14, 33);
      switch (event.type) {
        case 'pickup':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_pickup.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'delivery':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_delivery.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'pickupSign':
        case 'deliverySign':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_sign.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'halfway':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_halfway.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
      }

      if (event.location[0] && event.location[1]) {
        var marker = new BMap.Marker(new BMap.Point(event.location[0], event.location[1]), {icon: myIcon});

        map.addOverlay(marker);

        console.log(marker, 'marker=======');

        var infoWindow = new BMap.InfoWindow(tipContent);  // 创建信息窗口对象
        marker.addEventListener("click", function () {
          this.openInfoWindow(infoWindow);
        });
      }
    },
    drawCircle: function (map, locations) {
      var pointArray = [];
      if (locations && locations.length > 0) {

        locations.forEach(function (location) {
          var mapPoint = new BMap.Point(location.point[1], location.point[0]);
          var circle = new BMap.Circle(mapPoint, config.maxAddressOffset, {
            fillColor: "#ffa81a",
            strokeColor: "#265f00",
            strokeWeight: 2,
            fillOpacity: 0.6,
            strokeOpacity: 1
          });
          map.addOverlay(circle);

          var marker = new BMap.Marker(mapPoint);
          map.addOverlay(marker);

          var labelText = ((location.type === 'pickup' ? '提货' : '交货') + '地址范围') + '(' + location.address + ')';
          var label = new BMap.Label(labelText, {offset:new BMap.Size(20,-10)});
          label.setStyle({whiteSpace: 'normal', maxWidth: 'none', width: '160px', opacity: 0.9});
          marker.setLabel(label);

          pointArray.push(mapPoint);
        });

        return pointArray;
      }
    }
  }
}]);

/**
 * Created by ZhangXuedong on 2016/8/25.
 */
zhuzhuqs.factory('ChartsService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getChart1Data: function(params){
      return $q(function(resolve, reject){
        $http.get(config.serverAddress + '/charts/chart1-data', {params : params})
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    },
    getChart2Data : function(params){
      return $q(function(resolve, reject){
        $http.get(config.serverAddress + '/charts/chart2-data', {params : params})
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    },
    getChart3Data : function(params){
      return $q(function(resolve, reject){
        $http.get(config.serverAddress + '/charts/chart3-data', {params : params})
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    },
    getChart4Data: function (params) {
      return $q(function (resolve, reject) {
        $http.post(config.serverAddress + '/charts/chart4-data', params)
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    }
  };
}]);
zhuzhuqs.factory('CompanyService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    createCompany: function (obj) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company', obj)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    createGroup: function (company_id, name) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group', {
        company_id: company_id,
        name: name
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getViewGroupList: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getExecuteGroupList: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group/execute')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getUsersOfGroup: function (group_id) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/group/employees', {
        params: {
          group_id: group_id
        }
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    addUserToGroup: function (group_id, company_id, email) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/invite/employee', {
        group_id: group_id,
        company_id: company_id,
        email: email
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    addUsersToGroup: function (usernames, company_id, group_id) {
      var params = {
        usernames: usernames,
        company_id: company_id,
        group_id: group_id
      };
      return this.postDataToServer('/group/invite/multiemployee', params);
    },
    getPartners: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/partners')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getPartnerCompanys: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/company')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getPartnerDrivers: function () {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/driver')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getCompanyCustomers: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/customer_contact/user')
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getCompanyCustomersByFilter: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/customer_contact/filter', {
        params: data
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    getContactsByFilter: function (data) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/company/contact/keyword', {
        params: data
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    batchInviteCompany: function (companyInfos) {
      return this.postDataToServer(config.serverAddress + '/company/invite/batch', {
        company_infos: companyInfos
      });
    },
    inviteCompanyByName: function (name) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/invitebycompanyname', {
        company_name: name
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteCompanyByEmail: function (email) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/invitebyusername', {
        username: email
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteDriverByPhone: function (phone) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/driver/invite', {
        username: phone
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    inviteDriverByPhone1: function (phone) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/driver/invite1', {
        username: phone
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    getMatchCompanies: function (companyNameSegment) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/company/matchname', {
        companyNameSegment: companyNameSegment
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    deleteGroup: function (groupId) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/delete/user_group', {
        group_id: groupId
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    deleteUserFromGroup: function (groupId, userId) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/group/delete/group_user', {
        group_id: groupId,
        group_user_id: userId
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },

    deleteInviteDriver: function (driverPhone) {
      return this.postDataToServer(config.serverAddress + '/company/invite_driver/delete', {
        driver_phone: driverPhone
      });
    },
    deleteCorporateDriver: function (driverId) {
      return this.postDataToServer(config.serverAddress + '/company/corporate_driver/delete', {
        driver_id: driverId
      });
    },
    deleteInviteCompanyById: function (inviteId) {
      return this.postDataToServer(config.serverAddress + '/company/invite_company/delete/id', {
        invite_id: inviteId
      });
    },
    deleteCorporateCompany: function (partnerId) {
      return this.postDataToServer(config.serverAddress + '/company/corporate_company/delete', {
        partner_id: partnerId
      });
    },
    updateCompanyInfo: function (info) {
      return this.postDataToServer(config.serverAddress + '/company/update', {
        address: info.address,
        type: info.type,
        name: info.name,
        employees: info.employees,
        contact_name: info.contact_name,
        contact_phone: info.contact_phone,
        business_license: info.business_license
      });
    },

    removeAddressById: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/address/remove/id', params);
    },
    getAddressList: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/address/list', params);
    },
    batchCreateAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/create/batch', params);
    },
    createAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/create/single', params);
    },
    updateAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/update', params);
    },
    captureAddress: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/address/capture', params);
    },
    removeVehicleById: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/vehicle/remove/id', params);
    },
    getVehicleList: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/vehicle/list', params);
    },
    batchCreateVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/create/batch', params);
    },
    createVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/create/single', params);
    },
    updateVehicle: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/vehicle/update', params);
    },

    getConfiguration: function (params) {
      return this.getDataFromServer(config.serverAddress + '/company/configuration/read', params);
    },
    updateOrderConfiguration: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/configuration/order/update', params);
    },
    updatePushConfiguration: function (params) {
      return this.postDataToServer(config.serverAddress + '/company/configuration/push/update', params);
    },
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      $http.get(url, {params: params})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err)
        });
      return q.promise;
    },
    postDataToServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    },
    findDriverEvaluations: function(params){
      return $q(function(resolve, reject){
        $http.get(config.serverAddress + '/company/find-driver-evaluations', {params : params})
        .success(function (data) {
          resolve(data);
        })
        .error(function (err) {
          reject(err);
        });
      });
    }
  };
}]);

zhuzhuqs.factory('DashboardService', ['$http', '$q', 'config', 'HttpService', function ($http, $q, config, HttpService) {
  return {
    sortByOrderCount: function (days, myRole, viewRole, viewRoleCompanyName) {
      return HttpService.getDataFromServer(config.serverAddress + '/dashboard/sortbyordercount', {
        days: days,
        my_role: myRole,
        view_role: viewRole,
        view_role_company_name: viewRoleCompanyName
      });
    },
    getOrderRate: function (days, myRole, viewRole, viewRoleCompanyName) {
      return HttpService.getDataFromServer(config.serverAddress + '/dashboard/perfectratebycompany', {
        days: days,
        my_role: myRole,
        view_role: viewRole,
        view_role_company_name: viewRoleCompanyName
      });
    }
  }
}]);
/**
 * Created by Wayne on 15/12/7.
 */

'use strict';
zhuzhuqs.factory('ExcelReaderService', function () {

  var activeXReader = {
    getWorkSheet: function (element, callback) {
      var fileObject = document.getElementById('filename');
      fileObject.select();
      fileObject.blur();

      var filePath = document.selection.createRange().text;
      var suffix = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();

      if (suffix !== 'xls' && suffix != 'xlsx') {
        return callback({type: 'file_type_error', message: '选择的文件不是Excel文件'});
      }

      var excel = new ActiveXObject('Excel.Application');
      var excel_file = excel.Workbooks.open(filePath);
      var excelSheet = excel.Worksheets('Sheet1');

      console.log(excelSheet.UsedRange.Rows.Count);
      console.log(excelSheet.UsedRange.Columns.Count);

      return callback(null, excelSheet);
    },
    checkHeader: function (excelSheet, headers, callback) {
      if (!excelSheet) {
        return callback(false);
      }

      for (var column = 0; column < headers.length; column++) {
        if (excelSheet.Cells(1, column + 1).Value !== headers[column].value) {
          return callback(false);
        }
      }
      return callback(true);
    },
    isHeaderNameExist: function (excelSheet, headerColumn) {
      if (!excelSheet) {
        return false;
      }
      if (excelSheet.Cells(1, headerColumn.index + 1).Value !== headerColumn.value) {
        return false;
      }
      return true;
    },
    getSheetData: function (excelSheet, headers, callback) {
      var dataArray = [];
      var columnCount = excelSheet.UsedRange.Columns.Count;
      var data, hasValue;
      for (var row = 2; row < columnCount; row++) {
        data = {};
        hasValue = false;
        for (var column = 0; column < headers.length; column++) {
          if (excelSheet.Cells(row, column + 1).Value != undefined) {
            data[headers[column]] = excelSheet.Cells(row, column + 1).Value;
            hasValue = true;
          }
        }
        if (hasValue) {
          dataArray.push(data);
        }
      }
      //var jsonResultString = JSON.stringify(dataArray);

      if (dataArray.length === 0) {
        return callback({type: 'file_content_empty', message: '表格中没有数据'});
      }
      return callback(null, dataArray);
    }
  };

  var otherReader = {
    getWorkSheet: function (element, callback) {
      var file = element.files[0];
      var suffix = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
      if (suffix !== 'xls' && suffix !== 'xlsx') {
        return callback({type: 'file_type_error', message: '选择的文件不是Excel文件'});
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        var workbook;
        var isError = false;
        try {
          var binary = '';

          if (reader.readAsBinaryString) {
            binary = e.target.result;
          }
          else {
            var bytes = new Uint8Array(e.target.result);
            var length = bytes.byteLength;

            for (var i = 0; i < length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
          }

          workbook = XLSX.read(binary, {type: 'binary'});
          if (workbook.SheetNames.length <= 0) {
            return callback({type: 'file_content_empty', message: '表格中没有数据'});
          }
        }
        catch (ex) {
          isError = true;
        }
        if (isError) {
          return callback({type: 'file_parse_error', message: 'Excel文件解析失败'});
        }
        return callback(null, workbook);
      };

      if (reader.readAsBinaryString) {
        reader.readAsBinaryString(file);
      }
      else {
        reader.readAsArrayBuffer(file);
      }
    },
    checkHeader: function (workbook, headers, callback) {
      var excelSheet = workbook.Sheets.Sheet1;
      if (!excelSheet) {
        return callback(false);
      }
      for (var index = 0; index < headers.length; index++) {
        var column = 'excelSheet.' + headers[index].key;

        if (eval(column)) {
          var columnName = column + '.v';
          if (eval(columnName) !== headers[index].value) {
            return callback(false);
          }
        }
        else {
          return callback(false);
        }
      }
      return callback(true);
    },
    isHeaderNameExist: function (workbook, headerColumn) {
      var excelSheet = workbook.Sheets.Sheet1;
      if (!excelSheet) {
        return false;
      }
      var column = 'excelSheet.' + headerColumn.key;
      if (eval(column)) {
        var columnName = column + '.v';
        if (eval(columnName) === headerColumn.value) {
          return true;
        }
      }
      return false;
    },
    getSheetData: function (workbook, headers, callback) {
      //目前只取第一个sheet的内容
      var sheet1Name = workbook.SheetNames[0];
      var xlsSheetArray = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet1Name]);
      //var jsonResultString = JSON.stringify(xlsSheetArray);

      if (!xlsSheetArray || xlsSheetArray.length <= 0) {
        return callback({type: 'file_content_empty', message: '表格中没有数据'});
      }
      return callback(null, xlsSheetArray);
    }
  };

  return {
    getReader: function () {
      if (typeof FileReader == 'undefined') {
        return activeXReader;
      }
      return otherReader;
    },
    splitArray: function (dataArray, splitSize) {
      var newArray = [];
      var i = 0;
      while (i < dataArray.length) {
        var sliceArray = dataArray.slice(i, i + splitSize);
        newArray.push(sliceArray);
        i = i + splitSize;
      }

      return newArray;
    }
  };

});
zhuzhuqs.factory('HomeService', ['Auth', 'OrderService', function (Auth, OrderService) {
  var viewSubHandle = [];

  function updateAbnormalOrderTopTip() {
    var that = this;
    OrderService.getAbnormalOrderCount().then(function (result) {
      if (!result || result.err) {
        console.log('get abnormal order count failed ' + result);
      } else {
        that.topTip = result.count;
      }
    }, function (err) {
      console.log('get abnormal order count failed ' + err);
    });
  }

  var panelItems = [
    // {
    //   "title": "运单创建",
    //   "subtitle": "批量或单个创建您的运单",
    //   "logo": "images/icon/icon_new.png",
    //   "role": 'user',
    //   "handle": [
    //     [
    //       {
    //         "label": "创建运单",
    //         "type": "link",//按钮标题
    //         "state": "order_create",
    //         "url": "/order_create"
    //       },
    //       {
    //         "label": "批量创建",
    //         "type": "link",
    //         "state": "order_batch_create",
    //         "url": "/order_batch_create"
    //       }
    //     ]
    //   ]
    // },
    {
      "title": "任务分配",
      "subtitle": "正在等待分配的运单数量",
      "logo": "images/icon/icon_distribution.png",
      "role": 'user',
      "handle": [
        [
          {
            "label": "运单操作",
            "type": "link",//按钮标题
            "state": "order_operation",
            "url": "/order_operation"
          }//,
          // {
          //   "label": "分配运单",
          //   "type": "link",//按钮标题
          //   "state": "order_assign",
          //   "url": "/order_assign"
          // },
          // {
          //   "label": "异常运单",
          //   "type": "link",
          //   "state": "abnormal_orders",
          //   "url": "/abnormal_orders",
          //   "topTip": 0,
          //   "updateTopTip": updateAbnormalOrderTopTip
          // }
        ]
      ]
    },
    {
      "title": "招标平台",
      "subtitle": "招标平台",
      "logo": "images/icon/icon_business.png",
      "role": "user",
      "handle": [
        [
          {
            "label": "创建标书",
            "type": "external_link",
            "server": "tender",
            "port": 3006,
            "state": "tender_create/",
            "url": "/tender_create"
          },
          {
            "label": "招标信息",
            "type": "external_link",
            "server": "tender",
            "port": 3006,
            "state": "tender_follow",
            "url": "/tender_follow"
          }
        ]
      ]
    },
    {
      "title": "司机信息",
      "subtitle": "司机信息",
      "logo": "images/icon/icon_business.png",
      "role": "user",
      "handle": [
        [
          {
            "label": "司机审核",
            "type": "external_link",
            "server": "tender",
            "port": 3006,
            "state": "driver_list",
            "url": "/driver_list"
          }
        ]
      ]
    }

  ];

  function getObjByHandelUrl(sta) {
    var each = true;
    var obj = null;
    if (sta != 'home') {
      panelItems.forEach(function (item) {
        for (var i = 0, len = item.handle.length; i < len; i++) {
          for (var j = 0, a = item.handle[i], l = a.length; j < l; j++) {
            var hd = a[j];
            if (each) {
              if (hd.state === sta) {
                each = false;
                obj = hd;
              }
            }
          }
        }
      });

    }
    return obj;
  }

  function getCurrentNavList(liststr) {
    //返回前几级列表
    var navlist = [];
    var _tmp = liststr.split('.');//计算.符号次数
    var state_level_str = '';
    for (var i = 0; i < _tmp.length; i++) {
      if (i === 0) {
        //顶级菜单
        state_level_str = _tmp[i];
        var tar = getObjByHandelUrl(state_level_str);
        if (tar) {
          navlist.push(deepCopyByObject(tar));
        }
      }
      else {
        if (i < _tmp.length - 1) {
          state_level_str += '.' + _tmp[i];
          navlist[i - 1].viewSubHandle.forEach(function (item) {
            if (item.state === state_level_str) {
              navlist.push(deepCopyByObject(item));
            }
          });
        }
      }
    }
    return navlist;
  }

  // 对象深拷贝
  function deepCopyByObject(source) {
    var result = {};
    for (var key in source) {
      result[key] = (typeof source[key]) === 'object' ? deepCopyByObject(source[key]) : source[key];
    }
    return result;
  }

  return {
    updatePanelItemsFromLocal: function (state) {
      panelItems.forEach(function (panelItem) {
        for (var i = 0, len = panelItem.handle.length; i < len; i++) {
          for (var j = 0, a = panelItem.handle[i], l = a.length; j < l; j++) {
            var labelItem = a[j];
            if (labelItem.state === state && labelItem.topTip && labelItem.topTip > 0) {
              labelItem.topTip--;
            }
          }
        }
      });
    },
    updatePanelItemsFromServer: function () {
      panelItems.forEach(function (panelItem) {
        for (var i = 0, len = panelItem.handle.length; i < len; i++) {
          for (var j = 0, a = panelItem.handle[i], l = a.length; j < l; j++) {
            var labelItem = a[j];
            if (labelItem.updateTopTip) {
              labelItem.updateTopTip();
            }
          }
        }
      });
    },
    getPanelItems: function () {
      return panelItems;
    },
    setviewSubHandle: function (hd) {
      viewSubHandle = hd;
    },
    getviewSubHandle: function () {
      var _arr = [];
      if (viewSubHandle.length > 0) {
        _arr = viewSubHandle;
      }
      else {
        var obj = Auth.getLatestUrl();
        var nav_list = [];
        if (obj && obj.state) {
          nav_list = getCurrentNavList(obj.state) ? getCurrentNavList(obj.state) : [];
        }
        var _current = nav_list[nav_list.length - 1];
        if (_current && _current.viewSubHandle) {
          _arr = _current.viewSubHandle;
        }
      }
      return _arr;
    },
    getObjByHandelUrl: getObjByHandelUrl,
    getCurrentNavList: getCurrentNavList
  }
}]);

/**
 * Created by Wayne on 15/11/24.
 */
zhuzhuqs.factory('HttpService', ['$http', '$q', function ($http, $q) {

  return {
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      $http.get(url, {params: params})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err)
        });
      return q.promise;
    },
    postDataToServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    }
  };
}]);
/**
 * Created by Wayne on 15/10/26.
 */

zhuzhuqs.factory('InsuranceService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    sendReportEmail: function (params) {
      return this.getDataFromServer(config.serverAddress + '/insurance/report_email', params);
    },
    getInsuranceOrders: function (params) {
      return this.postDataFromServer(config.serverAddress + '/insurance', params);
    },
    ensureInsurance: function (order_id, sender_name, goods_name, count, weight, volume, count_unit, weight_unit, volume_unit, buy_count, pickup_address, delivery_address) {
      return this.postDataFromServer(config.serverAddress + '/insurance/ensure', {
        sender_name: sender_name,
        goods_name: goods_name,
        count: count,
        weight: weight,
        volume: volume,
        count_unit: count_unit,
        weight_unit: weight_unit,
        volume_unit: volume_unit,
        buy_count: buy_count,
        pickup_address: pickup_address,
        delivery_address: delivery_address,
        order_id: order_id
      });
    },
    cancelInsurance: function (order_id) {
      return this.postDataFromServer(config.serverAddress + '/insurance/cancel', {
        order_id: order_id
      });
    },
    getUnpayInsurancePrice: function () {
      return this.getDataFromServer(config.serverAddress + '/insurance/unpay/info');
    },
    buyInsuranceFromPayment: function (order_ids, buy_count, coverage_total, price_total) {
      return this.postDataFromServer(config.serverAddress + '/insurance/buy',{
        order_ids:order_ids,
        buy_count:buy_count,
        coverage_total:coverage_total,
        price_total:price_total
      });
    },
    getUnpayInsuranceOrders: function () {
      return this.getDataFromServer(config.serverAddress + '/insurance/unpay/orders');
    },
    getInsurancePaymentHistory:function(){
      return this.getDataFromServer(config.serverAddress + '/insurance/buy/history');
    },
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      $http.get(url, {
        params: params
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err)
        });
      return q.promise;
    },
    postDataFromServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    }
  }
}]);
zhuzhuqs.factory('OnlineReportConfigService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getReportConfig: function() {
      var q = $q.defer();
      $http.post(config.serverAddress + '/report/config/getReportConfig', null)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      var promise = q.promise;
      return promise;
    },
      getOrderExportReportConfig: function() {
          var q = $q.defer();
          $http.post(config.serverAddress + '/report/config/getOrderExportReportConfig', null)
              .success(function (data) {
                  q.resolve(data);
              })
              .error(function (err) {
                  q.reject(err);
              });
          var promise = q.promise;
          return promise;
      },
    saveOrUpdate: function (obj) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/report/config/update', {config: obj})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      var promise = q.promise;
      return promise;
    },
      saveOrUpdateOrderExportFields: function (obj) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/report/config/updateExportFields', {config: obj})
              .success(function (data) {
                  q.resolve(data);
              })
              .error(function (err) {
                  q.reject(err);
              });
          var promise = q.promise;
          return promise;
      }
  };
}]);

/**
 * Created by Wayne on 15/12/11.
 */
zhuzhuqs.factory('OrderHelper',
  ['config', function (config) {

    function getOrderGoodsName(order) {
      var goodsName = '';
      if (order.goods && order.goods.length > 0) {
        order.goods.forEach(function (item) {
          goodsName += ((item.name || '未知') + ',');
        });
        goodsName = goodsName.substr(0, goodsName.length - 1);
      }
      else {
        goodsName = order.goods_name || '未知';
      }
      return goodsName;
    }

    function getOrderCountVolumeWeight(orderDetail) {
      var sText = '';
      sText += (orderDetail.count ? orderDetail.count : '未填') + '/';//(orderDetail.count_unit ? orderDetail.count_unit : '件') + '/';
      sText += (orderDetail.weight ? orderDetail.weight : '未填') + '/';//(orderDetail.weight_unit ? orderDetail.weight_unit : '吨') + '/';
      sText += (orderDetail.volume ? orderDetail.volume : '未填');// + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方');

      return sText;
    }

    function getOrderCountDetail(order) {
      var countDetail = '';
      if (order.goods && order.goods.length > 0) {
        order.goods.forEach(function (item) {
          countDetail += (getOrderGoodsSingleCountDetail(item) + ',');
        });
        countDetail = countDetail.substr(0, countDetail.length - 1);
      }
      else {
        countDetail = getOrderCountVolumeWeight(order);
      }
      return countDetail;
    }

    function getOrderGoodsSingleCountDetail(goodsItem) {
      if (!goodsItem) {
        return '未知数量';
      }

      var itemDetail = '';
      if(goodsItem.count){
        itemDetail += myFixed(goodsItem.count) + goodsItem.unit;
      }
      if(goodsItem.count2){
        itemDetail += '/';
        itemDetail += myFixed(goodsItem.count2) + goodsItem.unit2;
      }
      if(goodsItem.count3){
        itemDetail += '/';
        itemDetail += myFixed(goodsItem.count3) + goodsItem.unit3;
      }
      // itemDetail += (goodsItem.count ? (goodsItem.count + goodsItem.unit) : '');
      // itemDetail += (goodsItem.count2 ? ('/' + goodsItem.count2 + goodsItem.unit2) : '');
      // itemDetail += (goodsItem.count3 ? ('/' + goodsItem.count3 + goodsItem.unit3) : '');
      itemDetail = itemDetail || '未知数量';

      if (itemDetail.indexOf('/') === 0) {
        itemDetail = itemDetail.substring(1);
      }

      return itemDetail;
    }

    function getCompanyAssignOption(companyPartner) {
      return {
        key: companyPartner.partner._id ? companyPartner.partner._id : companyPartner.company._id,
        value: companyPartner.partner.name ? companyPartner.partner.name : companyPartner.company.name,
        authed: companyPartner.partner.auth_status ? (companyPartner.partner.auth_status === 'authed') : (companyPartner.company.auth_status === 'authed'),
        group_type: 'company'
      };
    }

    function getDriverNickname(driver, defaultName) {
      return driver.nickname || (driver.wechat_profile ? driver.wechat_profile.nickname : '') || defaultName;
    }

    function getDriverAssignOption(driver, type) {
      return {
        key: driver._id,
        value: (getDriverNickname(driver, '匿名') + '(' + driver.all_count.orderCount + '单)') + '/'
        + (driver.plate_numbers.length > 0 ? driver.plate_numbers[0] : '未知车牌') + '/'
        + driver.username,
        goodEvaluation: driver.goodEvaluation,
        group_type: type
      }
    }

    function getWechatDriverAssignOption(driver, type) {
      var option = getDriverAssignOption(driver, type);
      delete option.goodEvaluation;
      option.value = '(微信)' + option.value;
      option.is_wechat = true;
      return option;
    }

    return {
      getGoodsNameString: getOrderGoodsName,
      getCountDetail: getOrderCountDetail,
      getSingleCountDetail: getOrderGoodsSingleCountDetail,
      getOrderCountVolumeWeight: getOrderCountVolumeWeight,
      getCompanyAssignOption: getCompanyAssignOption,
      getDriverAssignOption: getDriverAssignOption,
      getWechatDriverAssignOption: getWechatDriverAssignOption
    };
  }]);
zhuzhuqs.factory('OrderService',
  ['$http', '$q', 'config', 'HttpService',
    function ($http, $q, config, HttpService) {
      return {
        verifyOrder: function (param) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/verifyOrder', param)
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },

        createOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order', {
              order: order,
              group_id: groupId
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateUnAssignedOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/update', {
              order: order,
              group_id: groupId
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        deleteUnAssignedOrder: function (order_id) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/delete', {
              order_id: order_id
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateAssignedOrder: function (order, groupId) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/assignedorder/update', {
              order: order,
              group_id: groupId
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        deleteAssignedOrder: function (order_id) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/assignedorder/delete', {
              order_id: order_id
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;

        },
        batchDeleteOrders: function (order_ids) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/batchdelete', {
              order_ids: order_ids
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        batchCreate: function (infos, groupId) {
          return HttpService.postDataToServer(config.serverAddress + '/order/batchcreate', {
            infos: infos,
            group_id: groupId
          });
        },
        exportOrderPdf: function (orderId) {
          window.open(config.serverAddress + '/resources/pdf_templates/pdf?order_id=' + orderId);
        },
        exportOrder: function (filter) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/export', {
              params: filter
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        assignOrder: function (info) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/multiassign', info)
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        batchAssign: function (assignInfo) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/batchassign', {assignInfo: assignInfo})
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        continueAssignOrder: function (info) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/continueassign', info)
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getUnsignedOrder: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/unassigned', {
              currentPage: currentPage,
              limit: limit,
              sortName: sortName,
              sortValue: sortValue,
              searchArray: searchArray
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAllOrders: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/all', {
              currentPage: currentPage,
              limit: limit,
              sortName: sortName,
              sortValue: sortValue,
              searchArray: searchArray
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAbnormalOrders: function (currentPage, limit, sortName, sortValue, searchArray) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/abnormal', {
              currentPage: currentPage,
              limit: limit,
              sortName: sortName,
              sortValue: sortValue,
              searchArray: searchArray
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAbnormalOrderCount: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/abnormal/count')
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOrders: function (currentPage, limit, sortName, sortValue, searchName, searchValue) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order', {
              params: {
                currentPage: currentPage,
                limit: limit,
                sortName: sortName,
                sortValue: sortValue,
                searchName: searchName,
                searchValue: searchValue
              }
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getAssignedOrderDetail: function (id, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/assignedOrderDetail', {
            params: {
              order_id: id,
              viewer: viewer
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOrderById: function (id) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/detail', {
            params: {
              order_id: id
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getEventsByOrderId: function (orderId, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/transport_event', {
            params: {
              order_id: orderId,
              viewer: viewer
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getTracesByOrderId: function (orderId, viewer) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/trace', {
            params: {
              order_id: orderId,
              viewer: viewer
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        shareOrders: function (orderIds, allRecipients, isInputEmail) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/share', {
            order_ids: orderIds,
            recipients: allRecipients,
            isInputEmail: isInputEmail
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getCooperateCompanys: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/company/partnercompanystaff').success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getRemainOrderCreateCount: function () {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/remainOrderCreateCount').success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getDriverOrders: function (driverNumber) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/map/alldriverorders', {
              params: {
                showNumber: driverNumber
              }
            })
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getStatusString: function (status) {
          var statusString = '';

          switch (status) {
            case 'unAssigned':
              statusString = '未分配';
              break;
            case 'assigning':
              statusString = '分配中';
              break;
            case 'unPickupSigned':
            case 'unPickuped':
              statusString = '未提货';
              break;
            case 'unDeliverySigned':
            case 'unDeliveried':
              statusString = '未交货';
              break;
            case 'pickupSign':
              statusString = '提货签到';
              break;
            case 'pickup':
              statusString = '提货';
              break;
            case 'deliverySign':
              statusString = '交货签到';
              break;
            case 'delivery':
              statusString = '交货';
              break;
            case 'halfway':
              statusString = '中途事件';
              break;
            case 'completed':
              statusString = '已完成';
              break;
            default:
              break;
          }
          return statusString;
        },
        //获取被分享运单列表
        getSharedOrders: function (currentPage, limit) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/sharedorderlist', {params: {currentPage: currentPage, limit: limit}})
            .success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        //获取被分享运单的事件信息
        getSharedOrderEventById: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/transport_event/sharedorderevent', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getSharedOrderAssignInfo: function (id) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/sharedorderassigninfo', {
            params: {
              order_id: id
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getSharedOrderTracesByOrderId: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/trace/sharedOrderTrace', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        updateOrderAssign: function (orderId, assignInfos) {
          var q = $q.defer();
          $http.post(config.serverAddress + '/order/update/assigninfo', {
            'order_id': orderId,
            'assign_infos': assignInfos
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        handleAbnormalOrder: function (orderId) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/abnormal/handle', {
            params: {
              order_id: orderId
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        },
        getOperationOrderCount: function () {
          return HttpService.getDataFromServer(config.serverAddress + '/order/operation/count');
        },
        getSenderPickupAddressList: function (senderName, inputAddress) {
          var q = $q.defer();
          $http.get(config.serverAddress + '/order/pickup_address/get', {
            params: {
              sender_name: senderName,
              pickup_address: inputAddress
            }
          }).success(function (data) {
              q.resolve(data);
            })
            .error(function (err) {
              q.reject(err);
            });
          return q.promise;
        }
      }
    }]);

zhuzhuqs.factory('PhotoSearchService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getPhotos: function (obj) {
      var q = $q.defer();
      $http.get(config.serverAddress + '/photoSearch', {
        params: {
          filter: obj
        }
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (data) {
          q.reject(err);
        })
      return q.promise;
    }
  }
}]);
/**
 * Created by Wayne on 15/12/7.
 */

zhuzhuqs.factory('SalesmanService', ['config','HttpService', function (config, HttpService) {
  return {
    getDetailList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/salesman/list/all/detail');
    },
    getBasicList: function () {
      return HttpService.getDataFromServer(config.serverAddress + '/salesman/list/all/basic');
    },
    removeSalesmanCompanyById: function (salesmanCompanyId) {
      var params = {salesman_company_id: salesmanCompanyId};
      return HttpService.getDataFromServer(config.serverAddress + '/salesman_company/remove/id', params);
    },
    removeSalesmanCompanyByUsername: function (username) {
      var params = {username: username};
      return HttpService.getDataFromServer(config.serverAddress + '/salesman_company/remove/username', params);
    },
    create: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/create', params);
    },
    batchCreate: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/batchcreate', params);
    },
    update: function (params) {
      return HttpService.postDataToServer(config.serverAddress + '/salesman/update', params);
    }
  };
}]);
zhuzhuqs.factory('User', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getMe: function () {
      var q = $q.defer();
      $http({
        method: 'POST',
        url: config.serverAddress + '/user/me',
        params: {}
      })
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (data) {
          q.reject(data);
        });
      return q.promise;
    },
    updateProfile: function (profile) {
      var q = $q.defer();
      $http.post(config.serverAddress + '/user/profile', {profile: profile})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    }
  };
}]);

/**
 * Created by Wayne on 15/7/10.
 */

'use strict';

zhuzhuqs.factory('UserProfileService', ['$http', '$q', 'config', function ($http, $q, config) {
  return {
    getUserProfile: function () {
      return this.getDataFromServer('/userprofile');
    },
    setFollowCustomizeColumns: function (columns) {
      return this.postDataToServer('/customizecolumnsfollow', {customize_columns_follow: columns});
    },
    setAssignCustomizeColumns: function (columns) {
      return this.postDataToServer('/customizecolumnsassign', {customize_columns_assign: columns});
    },
    setMaxPageCount: function (params) {
      return this.getDataFromServer('/userprofile/max_page_count', params);
    },
    getDataFromServer: function (url, params) {
      var q = $q.defer();
      if (!params) {
        $http.get(url)
          .success(function (data) {
            q.resolve(data);
          })
          .error(function (err) {
            q.reject(err)
          });
      }
      else {
        $http.get(url, {
          params: params
        })
          .success(function (data) {
            q.resolve(data);
          })
          .error(function (err) {
            q.reject(err)
          });
      }

      return q.promise;
    },
    postDataToServer: function (url, params) {
      var q = $q.defer();
      $http.post(url, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });
      return q.promise;
    }
  };

}]);
/**
 * Created by Wayne on 15/11/20.
 */
'use strict';

/*
* 前后端统一，每增加一种类型的消息，都需要添加两条枚举。
*
*/

zhuzhuqs.constant('InformEnum',
  {
    web_socket_connection_success: '/socket/web/connection/success',
    web_abnormal_order_single: '/socket/web/abnormal_order/single',
    web_add_user: '/socket/web/user/add',
    web_abnormal_order_batch: '/socket/web/abnormal_order/batch',
    web_abnormal_order_clear: '/socket/web/abnormal_order/clear',

    onAddUser: 'onAddUser',
    onSingleAbnormalOrder: 'onSingleAbnormalOrder',
    onBatchAbnormalOrder: 'onBatchAbnormalOrder'
  }
);
zhuzhuqs.constant('CompanyError',
  {
    only_one_company: "公司名称必须唯一",
    company_name_exists: "公司名称已存在",
    name_null: "icon/icon_new.png",
    internal_system_error: "系统错误",
    company_not_exist: "公司名不存在",
    company_name_invalid: "公司名非法",
    has_been_partner: "已经是合作伙伴",
    invited_user_not_exist: "对方不存在",
    company_invite_itself: "不能邀请自己成合作伙伴",
    invalid_email: '邮箱格式错误，正确格式 xx@xx.com',
    email_sent_failed: '邮件发送失败',
    user_not_in_company:'当前用户不存在公司',
    vehicle_exist:'该车牌车辆已经存在',
    vehicle_not_exist:'该车牌车辆不存在',
    address_not_exist: '该地址不存在'
  }
);

zhuzhuqs.constant('DriverError',
  {
    account_not_exist: "司机账户不存在",
    account_exist: "司机已存在",
    account_not_match: "账户不匹配",
    internal_system_error: '系统错误',
    invalid_phone: '手机号格式错误 必须是11位数字',
    invalid_password: '密码错误',
    email_failed: '邮箱错误',
    invite_user_not_exist: '邀请的账户不存在',
    invalid_verify_code: '验证码错误',
    sms_send_error: '邮件发送失败',
    sms_send_limit_error: '短信发送已受限制',
    partner_not_exist: '伙伴不存在',
    inviting_company_not_exist: '公司不存在',
    has_been_invited:'不能重复邀请',
    has_been_partner: '已经是合作司机',
    salesman_has_existed: '关注人已经存在',
    invite_sms_error: '邮件发送错误'
  }
);

zhuzhuqs.constant('DriverPartnerError',
  {
    internal_system_error:'系统错误',
    driver_has_accepted_partner:'已接受',
    driver_has_confused_partner: '已拒绝',
    uninvited_partner: 'uninvited_partner',
    has_been_done: 'has_been_done'
  }
);

zhuzhuqs.constant('GroupError',
  {
    name_null: "用户为空",
    invalid_company_id: "公司ID错误",
    group_not_exist: "组不存在",
    internal_system_error: "系统错误！请联系管理员",
    group_exist: "您新输入的组名已存在，换个新的吧",
    user_not_exist: "用户不存在",
    not_in_company: "用户不在该公司",
    invalid_email: "邮箱格式错误，例:xx@xx.com",
    user_in_other_company: "对不起，该同事已被加入到别的公司",
    user_exist_in_group: "对不起，该同事已存在该组",
    user_not_exist_in_group:'用户不在该组中',
    post_data_empty: '上传的数据为空',
    params_null: '方法的参数为空',
    forbid_delete_default_group: '默认组不能删除'
  }
);

zhuzhuqs.constant('OrderError',
  {
    internal_system_error: "系统错误",
    order_not_exist: "订单不存在",
    order_number_null_error: "订单号为空",
    order_number_unique_error: "订单号不唯一",
    incomplete_pickup_contact_info:"",
    incomplete_delivery_contact_info: "",
    group_id_null:"组ID为空",
    driver_not_exist: "司机不存在",
    company_not_exist: "公司不存在",
    order_has_assigned: "订单已分配",
    order_not_assigning: "order_not_assigning",
    order_not_visible:"订单不可见",
    assign_infos_null: '分配信息为空',
    order_info_null: '订单信息为空',
    orders_to_share_null: '没有指定分享订单',
    recipients_to_share_null: '没有指定分享收件人',
    recipients_to_share_invalid: '分享收件人不合法',
    must_self_company_order: '只能操作自己公司的订单',
    params_null: '服务端参数为空',
    post_data_empty: '上传的数据有空值',
    assign_info_can_not_modify: '订单分配信息不能修改',
    user_not_in_company:'当前用户不存在公司'
  }
);

zhuzhuqs.constant('TransportError',
  {
    internal_system_error:'系统错误，请联系管理员',
    order_not_exist:'订单不存在',
    original_order:'original_order',
    original_order_not_exist: '',
    order_driver_not_match: '订单跟司机不匹配',
    can_not_execute_pickupSign: '',
    can_not_execute_pickup: '',
    can_not_execute_deliverySign: '',
    can_not_execute_delivery: '',
    order_has_been_complete: '',
    parent_order_not_exist: '',
    uncompleted: ''
  }
);
zhuzhuqs.constant('UserError',
  {
    account_not_exist:'账户不存在',
    account_exist: '账户已存在',
    account_not_match: '账户不匹配',
    account_not_activate: '账户未激活',
    internal_system_error: '系统错误，请联系管理员',
    invalid_email: '邮箱格式错误，正确格式 xx@xx.com',
    invalid_password:'错误的密码',
    invalid_access_token:'错误的token',
    email_failed:'邮箱错误',
    invite_user_not_exist:'对方账户不存在',
    user_not_exist:'用户不存在',
    external_company_user:'external_company_user',
    internal_group_user:'internal_group_user'
  }
);

zhuzhuqs.constant('GlobalEvent',
  {
    onShowLoading: "onShowLoading",
    onShowMasking: "onShowMasking",
    onChangeMenu: "onChangeMenu",
    onShowAlert: "onShowAlert",
    onShowAlertConfirm: "onShowAlertConfirm",
    onShowAlertConfirmStyle: "onShowAlertConfirmStyle",
    onShowAlertPrompt: "onShowAlertPrompt",
    onShowDevelopmentTips: "onShowDevelopmentTips",
    onShowExportDialog:'onShowExportDialog',
    onBodyClick:'onBodyClick',
    onUpdatePanelLabel: 'onUpdatePanelLabel',
    onUserReseted:'onUserReseted'
  }
);
//zhuzhuqs.filter('sortByDateReverse', function() {
//  return function sortArrayByDate(a, b) {
//    var value1 = new Date(a.create_time);
//    var value2 = new Date(b.create_time);
//    if (value1 < value2) {
//      return 1;
//    }
//    else if (value1 > value2) {
//      return -1;
//    }
//    else {
//      return 0;
//    }
//  }
//});
angular.module('zhuzhuqs').controller('AlertController',
    ['$rootScope', '$scope', 'GlobalEvent', '$element', '$attrs', '$transclude',
        function ($rootScope, $scope, GlobalEvent, $element, $attrs, $transclude) {
            $scope.alertConfig = {
                show: false,
                type: 'alert',
                title: '消息',
                content: '',
                cancel: '好的',
                callback: null
            };
            $rootScope.$on(GlobalEvent.onShowAlert, function (event, info, callback) {
                $scope.alertConfig.content = info;
                $scope.alertConfig.show = true;
                if (callback) {
                  $scope.alertConfig.callback = callback;
                }
            });
            $scope.cancel = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';

                if ($scope.alertConfig.callback) {
                  var callback = $scope.alertConfig.callback;
                  callback();

                  $scope.alertConfig.callback = null;

                  return;
                }
            };
        }]);

angular.module('zhuzhuqs').controller('AlertConfirmController',
    ['$rootScope', '$scope', 'GlobalEvent', '$element', '$attrs', '$transclude',
        function ($rootScope, $scope, GlobalEvent, $element, $attrs, $transclude) {
            $scope.alertConfig = {
                show: false,
                title: '消息',
                content: '',
                cancel: '取消',
                sure: '确认',
                func: null,
                param: null
            };
            $rootScope.$on(GlobalEvent.onShowAlertConfirm, function (event, info, func, param, cfg) {
                if (cfg) {
                    $scope.alertConfig.title = cfg.title ? cfg.title : '消息';
                    $scope.alertConfig.sure = cfg.sureLabel ? cfg.sureLabel : '确认';
                    $scope.alertConfig.cancel = cfg.cancelLabel ? cfg.cancelLabel : '取消';
                }
                else {
                    $scope.alertConfig.title = "消息";
                    $scope.alertConfig.sure = "确认";
                    $scope.alertConfig.cancel = "取消";
                }
                $scope.alertConfig.content = info;
                $scope.alertConfig.show = true;
                $scope.alertConfig.func = func;
                $scope.alertConfig.param = param;

            });
            $scope.cancel = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';
            };
            $scope.sure = function () {
                $scope.alertConfig.show = false;
                $scope.alertConfig.content = '';
                if ($scope.alertConfig.func) {
                    $scope.alertConfig.func($scope.alertConfig.param);
                }

            };
        }]);

/**
 * Created by Wayne on 15/9/8.
 */
angular.module('zhuzhuqs').controller('AlertConfirmStyleController',
  ['$rootScope', '$scope', 'GlobalEvent', '$element', '$attrs', '$transclude',
    function ($rootScope, $scope, GlobalEvent, $element, $attrs, $transclude) {
      $scope.alertConfig = {
        show: false,
        title: '消息',
        content: '',
        content_one: '',
        content_two: '',
        content_three: '',
        cancel: '取消',
        sure: '确认',
        func: null,
        param: null
      };
      $rootScope.$on(GlobalEvent.onShowAlertConfirmStyle, function (event, infoObject, func, param, cfg) {
        if (cfg) {
          $scope.alertConfig.title = cfg.title ? cfg.title : '消息';
          $scope.alertConfig.sure = cfg.sureLabel ? cfg.sureLabel : '确认';
          $scope.alertConfig.cancel = cfg.cancelLabel ? cfg.cancelLabel : '取消';
        }
        else {
          $scope.alertConfig.title = "消息";
          $scope.alertConfig.sure = "确认";
          $scope.alertConfig.cancel = "取消";
        }
        $scope.alertConfig.content_one = infoObject.content_one || '';
        $scope.alertConfig.content_two = infoObject.content_two || '';
        $scope.alertConfig.content_three = infoObject.content_three || '';
        $scope.alertConfig.show = true;
        $scope.alertConfig.func = func;
        $scope.alertConfig.param = param;

      });
      $scope.cancel = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.content = '';
      };
      $scope.sure = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.content = '';
        if ($scope.alertConfig.func) {
          $scope.alertConfig.func($scope.alertConfig.param);
        }

      };
    }]);

/**
 * Created by Wayne on 15/8/6.
 */

angular.module('zhuzhuqs').controller('AlertPromptController',
  ['$rootScope', '$scope', 'GlobalEvent',
    function ($rootScope, $scope, GlobalEvent) {
      $scope.alertConfig = {
        show: false,
        title: '消息',
        tipText: '请设置',
        placeholderText: '请输入',
        sure: '好的',
        inputContent: '',
        callback: null
      };
      $rootScope.$on(GlobalEvent.onShowAlertPrompt, function (event, info, callback) {
        if (info.tipText)
          $scope.alertConfig.tipText = info.tipText;
        if (info.placeholderText)
          $scope.alertConfig.placeholderText = info.placeholderText;
        if (info.sure)
          $scope.alertConfig.sure = info.sure;

        $scope.alertConfig.show = true;
        if (callback) {
          $scope.alertConfig.callback = callback;
        }
      });
      $scope.sure = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.tipText = '请设置';
        $scope.alertConfig.placeholderText = '请输入';
        $scope.alertConfig.sure = '好的';

        if ($scope.alertConfig.callback) {
          var callback = $scope.alertConfig.callback;
          var inputContent = $scope.alertConfig.inputContent;
          callback(inputContent);
        }

        $scope.alertConfig.inputContent = '';
        $scope.alertConfig.callback = null;
        return;
      };

      $scope.cancel = function () {
        $scope.alertConfig.show = false;
        $scope.alertConfig.tipText = '请设置';
        $scope.alertConfig.placeholderText = '请输入';
        $scope.alertConfig.sure = '好的';
        $scope.alertConfig.inputContent = '';
        $scope.alertConfig.callback = null;
        return;
      };
    }]);


angular.module('zhuzhuqs').controller('BussnessController',
  ['$scope', '$stateParams', '$timeout', 'config', 'CompanyService', 'SalesmanService', 'BidderService',
    'ExcelReaderService', 'CompanyError', 'DriverError', 'GlobalEvent', 'Auth',
    function ($scope, $stateParams, $timeout, config, CompanyService, SalesmanService, BidderService,
              ExcelReaderService, CompanyError, DriverError, GlobalEvent, Auth) {
      $scope.partnersInfo = {
        drivers: {
          driverCompanys: [],
          inviteDrivers: []
        },
        company: {
          partnerCompanies: [],
          inviteCompanies: [],
          handleFile: function () {
          }
        },
        salesman: [],
        bidders: [],
        curSelect: $stateParams.params || 'company',
        deleteInviteDriver: '',
        deleteCorporateDriver: '',
        deleteInviteCompany: '',
        deleteCorporateCompany: '',
        showDetailPanel: ''
      };
      $scope.maskInfo = {
        isShow: false
      };
      $scope.newInfo = {
        username: '',
        showDriverDialog: false,
        openDialog: function () {
        },
        submit: function () {
        }
      };
      $scope.rightHeader = {
        company: {
          name: '合作公司',
          count: 0,
          columns: [
            {
              name: '公司名称',
              length: 4
            },
            {
              name: '公司类型',
              length: 2
            },
            {
              name: '公司地址',
              length: 3
            }
          ]
        },
        driver: {
          name: '合作司机',
          count: 0,
          columns: [
            {
              name: '姓名',
              length: 2
            },
            {
              name: '好评率',
              length: 1
            },
            {
              name: '运单数',
              length: 1
            },
            {
              name: '拒单数',
              length: 1
            },
            {
              name: '电话',
              length: 2
            },
            {
              name: '车牌',
              length: 2
            },
            {
              name: '绑定微信',
              length: 2
            },
            {
              name: '评价',
              length: 1
            }
          ]
        },
        salesman: {
          name: '关注人',
          count: 0,
          columns: [
            {
              name: '手机号',
              length: 3
            },
            {
              name: '姓名',
              length: 2
            },
            {
              name: '邮箱',
              length: 3
            },
            {
              name: '绑定时间',
              length: 2
            }
          ]
        },
        bidder: {
          name: '合作中介',
          count: 0,
          columns: [
            {
              name: '手机号',
              length: 3
            },
            {
              name: '姓名',
              length: 2
            },
            {
              name: '昵称',
              length: 2
            },
            {
              name: '中标次数',
              length: 2
            },
            {
              name: '绑定时间',
              length: 2
            }
          ]
        },
        current: {},
        update: function (type) {
          this.current = this[type];
        },
        updateCount: function (type, count) {
          this[type].count = count;
        }
      };
      $scope.singleSalesman = {
        isModify: false,
        username: '',
        nickname: '',
        email: '',
        showDialog: false,
        usernameError: '必填项',
        nicknameError: '必填项',
        isEmailError: false,
        isPhoneError: false,
        blurUsername: function () {
        },
        blurEmail: function () {
        },
        submit: function () {
        },
        remove: function () {
        },
        modify: function (salesman) {
          this.showDialog = true;
          this.isModify = true;
          this.usernameError = '';
          this.copy(salesman);
        },
        create: function () {
          this.showDialog = true;
          this.isModify = false;
          this.clear();
        },
        clear: function () {
          this.username = '';
          this.nickname = '';
          this.email = '';
          this.usernameError = '必填项';
          this.nicknameError = '必填项';
        },
        copy: function (item) {
          this.username = item.username;
          this.nickname = item.nickname;
          this.email = item.email;
        },
        handleFile: function () {
        }
      };

      var driverEvaluationsConfig = {
        pagination: {
          currentPage: 1,
          limit: 10,
          totalCount: 0,
          pageCount: 0,
          pageNavigationCount: 5,
          canSeekPage: true,
          limitArray: [10, 20, 30, 40, 100],
          pageList: [1],
          onCurrentPageChanged: function (callback) {
            findDriverEvaluations();
          }
        },
        isShowPagination: true,
        isOptional: false,
        isFieldSetting: false,
        rows: [],
        fields: [
          {
            name: '运单号',
            value: 'order_number',
            isSort: false,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '公司名称',
            value: 'company_name',
            isSort: false,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
            curSort: '',
            keyword: ''
          },
          {
            name: '评价',
            value: 'content_text',
            isSearch: false,
            curSort: '',
            keyword: ''
          },
          {
            name: '等级',
            value: 'level',
            isSort: true,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          },
          {
            name: '评价时间',
            value: 'update_time_format',
            isSort: true,
            isSearch: false,
            sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
          }
        ],
        driverId: null,
        show : false
      };

      $scope.driverEvaluationsConfig = driverEvaluationsConfig;

      getPartnerCompanys();
      getPartnerDrivers();
      getSalesmanList();
      getBidderList();

      function findDriverEvaluations(){
        var parameters = {
          driverId : driverEvaluationsConfig.driverId,
          currentPage : driverEvaluationsConfig.pagination.currentPage,
          limit : driverEvaluationsConfig.pagination.limit
        };
        CompanyService.findDriverEvaluations(parameters).then(function (response) {
          if(response && response.status && response.status == 'success' && response.data){
            var rows = [];
            driverEvaluationsConfig.rows = rows;
            response.data.forEach(function(e){
              var rowData = {
                content_text : e.content_text,
                update_time_format : e.update_time_format
              };
              if(e.order && e.order.order_details){
                rowData.order_number = e.order.order_details.order_number;
              }
              if(e.user && e.user.company){
                rowData.company_name = e.user.company.name;
              }
              if(e.level){
                switch (e.level + ''){
                  case '1' :
                    rowData.level = '好评';
                    break;
                  case '2' :
                    rowData.level = '中评';
                    break;
                  case '3' :
                    rowData.level = '差评';
                    break;
                  default :
                }
              }
              rows.push({
                columns: rowData,
                rowConfig: {
                  notOptional: true,
                  isShowUpdateButton: false,
                  isShowDeleteButton: false,
                  isShowExportButton: false
                }
              });
            });

            renderPagination(response.pagination);
            if(driverEvaluationsConfig.reLoad) {
              driverEvaluationsConfig.reLoad();
            }
            driverEvaluationsConfig.show = true;
          }
        }, function(err){
          console.log(err);
        });
      }

      function renderPagination(data) {
        if (!data) {
          return;
        }
        driverEvaluationsConfig.pagination.currentPage = parseInt(data.currentPage || 1);
        driverEvaluationsConfig.pagination.limit = parseInt(data.limit || 10);
        driverEvaluationsConfig.pagination.totalCount = parseInt(data.total || 0);
        driverEvaluationsConfig.pagination.pageCount = Math.ceil( parseInt(data.total || 0) / parseInt(data.limit || 10));
        if(driverEvaluationsConfig.pagination.render){
          driverEvaluationsConfig.pagination.render();
        }
      }

      $scope.showDriver = function(driverCompany){
        if(driverCompany.driver.all_count.evaluationCount){
          driverEvaluationsConfig.driverId = driverCompany.driver._id;
          findDriverEvaluations();
        }
      };

      $scope.exportData = function(){

          var types = {
              company:"/company/export",
              salesman:"/salesman/export",
              driver : '/company/export-company-driver',
              bidder : '/bidder/export-company-bidder'
          };
          var type = $scope.partnersInfo.curSelect;
          if(types[type]){
              var url = types[type] +"?access_token=" + Auth.getToken();
              window.open(url);
          }
      };

      $scope.generatePhoto = function (photo) {
        if (!photo) {
          return '';
        }
        return config.qiniuServerAddress + photo;
      };
      $scope.rightHeader.update($scope.partnersInfo.curSelect);
      $scope.partnersInfo.deleteInviteDriver = function (driver_phone) {
        if (!driver_phone) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作司机');
        }
        //手机号验证(11位数字)
        var phoneRegex = /\d{11}/;
        if (!phoneRegex.test(driver_phone)) {
          console.log(driver_phone, 'driver phone format is not right');
          return $scope.$emit(GlobalEvent.onShowAlert, '司机用户名不合法');
        }

        var alertContent = '确定删除合作司机' + driver_phone + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (driverPhone) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteInviteDriver(driverPhone).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerDrivers();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, driver_phone, {title: '删除'});
      };
      $scope.partnersInfo.deleteCorporateDriver = function (driver) {
        if (!driver) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作司机');
        }

        var alertContent = '确定删除合作司机' + (driver.nickname ? driver.nickname : driver.username) + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (driverId) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteCorporateDriver(driverId).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerDrivers();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, driver._id, {title: '删除'});
      };
      $scope.partnersInfo.deleteInviteCompany = function (inviteCompany) {
        if (!inviteCompany || !inviteCompany._id) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作公司');
        }

        var alertContent = '确定删除合作公司' + (inviteCompany.name || inviteCompany.username) + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteInviteCompanyById(inviteCompany._id).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerCompanys();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, null, {title: '删除'});
      };
      $scope.partnersInfo.deleteCorporateCompany = function (partnerCompany) {
        if (!partnerCompany) {
          return $scope.$emit(GlobalEvent.onShowAlert, '请指定要删除的合作公司');
        }

        var alertContent = '确定删除合作公司' + partnerCompany.name + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function (companyId) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          CompanyService.deleteCorporateCompany(companyId).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return console.log(data.err);
            }

            getPartnerCompanys();
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');

          }, function (err) {
            return $scope.$emit(GlobalEvent.onShowLoading, false);
          });

        }, partnerCompany._id, {title: '删除'});
      };
      $scope.partnersInfo.showDetailPanel = function (panel) {
        panel = panel || 'company';
        if ($scope.partnersInfo.curSelect !== panel) {
          $scope.partnersInfo.curSelect = panel;
          $scope.rightHeader.update(panel);
          switch (panel) {
            case 'company':
              getPartnerCompanys();
              break;
            case 'driver':
              getPartnerDrivers();
              break;
            case 'salesman':
              getSalesmanList();
              break;
            case 'bidder':
              getBidderList();
              break;
            default:
              break;
          }
        }
      };

      //batch create partner company start
      var companyDataHeaders = ['公司名称', '电子邮箱'];

      function checkCompanyExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }

        var companyNameArray = []; //防重复
        var emailArray = []; //防重复

        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //因为获取到每行的数据不一定每一列都存在值，所以每一行的列数是不固定的
          //因此那一列有问题，用固定值。
          if (!rowData[companyDataHeaders[0]]) {
            return callback({row: rowIndex + 2, column: 'A', message: companyDataHeaders[0] + '不能为空'});  //第一行是表头，所以+2
          }
          if (companyNameArray.indexOf(rowData[companyDataHeaders[0]]) > -1) {
            return callback({row: rowIndex + 2, column: 'A', message: companyDataHeaders[0] + '不能重复'});
          }
          companyNameArray.push(rowData[companyDataHeaders[0]]);

          if (rowData[companyDataHeaders[1]]) {
            if (!rowData[companyDataHeaders[1]].testMail()) {
              return callback({row: rowIndex + 2, column: 'B', message: companyDataHeaders[1] + '必须为邮箱格式'});
            }
            if (emailArray.indexOf(rowData[companyDataHeaders[1]]) > -1) {
              return callback({row: rowIndex + 2, column: 'B', message: companyDataHeaders[1] + '不能重复'});
            }

            emailArray.push(rowData[companyDataHeaders[1]]);
          }
        }
        return callback();
      }

      function generateCompanyData(sheetData) {
        var companyArray = [];
        if (!sheetData) {
          return companyArray;
        }
        var headerKeyValue = {
          '公司名称': 'companyName',
          '电子邮箱': 'email'
        };

        var rowData;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var company = {};
          rowData = sheetData[rowIndex];
          for (var columnData in rowData) {
            company[headerKeyValue[columnData]] = rowData[columnData];
          }
          companyArray.push(company);
        }
        return companyArray;
      }

      $scope.partnersInfo.company.handleFile = function (element) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        $scope.$apply();

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('company-filename').outerHTML = document.getElementById('company-filename').outerHTML;
          document.getElementById('company-filename').value = '';
          if (err) {
            return handleReadError(err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '公司名称'},
            {key: 'B1', value: '电子邮箱'}
          ];

          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return handleReadError('请选择系统提供的模版填写合作公司数据');
            }
            excelReader.getSheetData(excelSheet, companyDataHeaders, function (err, sheetData) {
              if (err) {
                return handleReadError(err.message);
              }

              checkCompanyExcelFormat(sheetData, function (err) {
                if (err) {
                  return handleReadError('第' + err.row + '行第' + err.column + '列' + err.message);
                }

                var companyArray = generateCompanyData(sheetData);
                var sliceArray = ExcelReaderService.splitArray(companyArray, 30);
                var totalCount = companyArray.length;
                var successCount = 0, failedCount = 0;

                for (var index = 0; index < sliceArray.length; index++) {
                  CompanyService.batchInviteCompany(sliceArray[index]).then(function (data) {
                    $scope.$emit(GlobalEvent.onShowLoading, false);
                    console.log(data);
                    if (data.err) {
                      return $scope.$emit(GlobalEvent.onShowAlert, '上传失败');
                    }

                    successCount += data.success.length;
                    failedCount += data.faileds.length;

                    //全部完成
                    if (totalCount === (successCount + failedCount)) {
                      var showText = '成功上传' + successCount + '个公司';
                      if (failedCount > 0) {
                        showText += '，剩余' + failedCount + '个上传失败';
                      }
                      $scope.$emit(GlobalEvent.onShowAlert, showText);

                      getPartnerCompanys();
                    }
                  });
                }
              });
            });

          });

        });
      };

      //batch create partner company end

      function handleErrorByDriver(errType) {
        if (DriverError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, DriverError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function calculateEvaluation(companyDrivers) {
        if (!companyDrivers || companyDrivers.length <= 0) {
          return;
        }
        companyDrivers.forEach(function (companyDriver) {
          var evaluation = companyDriver.driver.all_count.evaluationCount;
          var totalCount = evaluation.good + evaluation.general + evaluation.bad;
          if (totalCount < 10) {
            companyDriver.driver.goodEvaluation = 0;
            return;
          }
          companyDriver.driver.goodEvaluation = Math.ceil(evaluation.good * 100 / totalCount);
        });
      }

      function getPartnerDrivers() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerDrivers().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleErrorByDriver(data.err.type);
          }

          calculateEvaluation(data.driverCompanys);

          $scope.partnersInfo.drivers.driverCompanys = data.driverCompanys;
          $scope.partnersInfo.drivers.inviteDrivers = data.inviteDrivers;

          $scope.rightHeader.updateCount('driver', $scope.partnersInfo.drivers.driverCompanys.length + $scope.partnersInfo.drivers.inviteDrivers.length);

        }, function (err) {
          console.log(data);
          handleErrorByDriver('error');
        });
      }

      $scope.newInfo.submit = function () {
        if (!this.username) {
          return;
        }
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.inviteDriverByPhone1($scope.newInfo.username).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.newInfo.openDialog(false);
          getPartnerDrivers();
        }, function (err) {
          console.log(err);
          return handleErrorByDriver('error');
        });
      };
      $scope.newInfo.openDialog = function (isOpen) {
        this.username = '';
        this.showDriverDialog = isOpen;
        $scope.maskInfo.isShow = isOpen;
      };

      //salesman-code start
      $scope.singleSalesman.blurUsername = function () {
        if (!this.username) {
          return this.usernameError = '必填项';
        }
        if (!this.username.testPhone()) {
          return this.usernameError = '格式不正确';
        }
        return this.usernameError = '';
      };
      $scope.singleSalesman.blurNickname = function () {
        if (!this.nickname) {
          return this.nicknameError = '必填项';
        }
        return this.nicknameError = '';
      };
      $scope.singleSalesman.blurEmail = function () {
        this.isEmailError = this.email && !this.email.testMail();
      };
      $scope.singleSalesman.submit = function () {
        if (this.usernameError) {
          return;
        }
        if (this.nicknameError) {
          return;
        }
        if (this.email && !this.email.testMail()) {
          return this.isEmailError = true;
        }

        var userInfo = {
          username: this.username,
          nickname: this.nickname || '',
          email: this.email || ''
        };
        this.clear();
        this.showDialog = false;
        if (this.isModify) {
          modifySalesman(userInfo);
        } else {
          createSalesman(userInfo);
        }
      };
      $scope.singleSalesman.remove = function (salesman) {
        if (!salesman) {
          return;
        }

        var alertContent = '确定删除关注人' + salesman.username + '吗？';
        $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
          $scope.$emit(GlobalEvent.onShowLoading, true);
          SalesmanService.removeSalesmanCompanyByUsername(salesman.username).then(function (result) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(result);
            if (result.err) {
              return handleErrorByDriver(result.err.type);
            }
            $scope.$emit(GlobalEvent.onShowAlert, '删除成功');
            getSalesmanList();
          }, function (err) {
            console.log(err);
            $scope.$emit(GlobalEvent.onShowLoading, false);
            handleErrorByDriver('error');
          });

        });
      };
      function getSalesmanList() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        SalesmanService.getDetailList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          if (data.length > 0) {
            data.sort(function (a, b) {
              if (!a && !b) {
                return false;
              }
              return a.nickname.localeCompare(b.nickname);
            });
          }
          $scope.partnersInfo.salesman = data;
          $scope.rightHeader.updateCount('salesman', $scope.partnersInfo.salesman.length);

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      function createSalesman(userInfo) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        SalesmanService.create({user_info: userInfo}).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.$emit(GlobalEvent.onShowAlert, '创建成功');
          getSalesmanList();
        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      function modifySalesman(userInfo) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        SalesmanService.update({user_info: userInfo}).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.$emit(GlobalEvent.onShowAlert, '修改成功');
          getSalesmanList();
        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });
      }

      var salesmanDataHeaders = ['手机号码', '姓名', '电子邮箱'];

      function checkExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }

        var usernameArray = []; //防重复
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //因为获取到每行的数据不一定每一列都存在值，所以每一行的列数是不固定的
          //因此那一列有问题，用固定值。
          if (!rowData[salesmanDataHeaders[0]]) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '不能为空'});  //第一行是表头，所以+2
          }
          if (rowData.length < 2 || !rowData[salesmanDataHeaders[1]]) {
            return callback({row: rowIndex + 2, column: 'B', message: salesmanDataHeaders[1] + '不能为空'});  //第一行是表头，所以+2
          }
          if (!rowData[salesmanDataHeaders[0]].testPhone()) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '必须为手机号码'});  //第一行是表头，所以+2
          }
          if (usernameArray.indexOf(rowData[salesmanDataHeaders[0]]) > -1) {
            return callback({row: rowIndex + 2, column: 'A', message: salesmanDataHeaders[0] + '不能重复'});
          }
          usernameArray.push(rowData[salesmanDataHeaders[0]]);

          for (var value in rowData) {
            switch (value) {
              case salesmanDataHeaders[2]:
                if (rowData[value] && !rowData[value].testMail()) {
                  return callback({row: rowIndex + 2, column: 'C', message: salesmanDataHeaders[2] + '必须为邮箱格式'});
                }
                break;
              default:
                break;
            }
          }
        }
        return callback();
      }

      function generateSalesmanData(sheetData) {
        var salesmanArray = [];
        if (!sheetData) {
          return salesmanArray;
        }
        var headerKeyValue = {
          '手机号码': 'username',
          '姓名': 'nickname',
          '电子邮箱': 'email'
        };

        var rowData;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var salesman = {};
          rowData = sheetData[rowIndex];
          for (var columnData in rowData) {
            salesman[headerKeyValue[columnData]] = rowData[columnData];
          }
          salesmanArray.push(salesman);
        }
        return salesmanArray;
      }

      function handleReadError(message) {
        $scope.$emit(GlobalEvent.onShowAlert, message);
        $scope.$emit(GlobalEvent.onShowLoading, false);
        return $scope.$apply();
      }

      $scope.singleSalesman.handleFile = function (element) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        $scope.$apply();

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('salesman-filename').outerHTML = document.getElementById('salesman-filename').outerHTML;
          document.getElementById('salesman-filename').value = '';
          if (err) {
            return handleReadError(err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '手机号码'},
            {key: 'B1', value: '姓名'},
            {key: 'C1', value: '电子邮箱'}
          ];

          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return handleReadError('请选择系统提供的模版填写关注人数据');
            }
            excelReader.getSheetData(excelSheet, salesmanDataHeaders, function (err, sheetData) {
              if (err) {
                return handleReadError(err.message);
              }

              checkExcelFormat(sheetData, function (err) {
                if (err) {
                  return handleReadError('第' + err.row + '行第' + err.column + '列' + err.message);
                }

                var salesmanArray = generateSalesmanData(sheetData);
                var sliceArray = ExcelReaderService.splitArray(salesmanArray, 30);
                var totalCount = salesmanArray.length;
                var successCount = 0, failedCount = 0;

                for (var index = 0; index < sliceArray.length; index++) {
                  SalesmanService.batchCreate({user_infos: sliceArray[index]}).then(function (data) {
                    successCount += data.success.length;
                    failedCount += data.faileds.length;

                    //全部完成
                    if (totalCount === (successCount + failedCount)) {
                      var showText = '成功上传' + successCount + '名关注人';
                      if (failedCount > 0) {
                        showText += '，剩余' + failedCount + '名上传失败';
                      }
                      $scope.$emit(GlobalEvent.onShowLoading, false);
                      $scope.$emit(GlobalEvent.onShowAlert, showText);

                      getSalesmanList();
                    }
                  });
                }
              });
            });

          });

        });
      };
      //salesman-code end

      function handleErrorByCompany(errType) {
        if (CompanyError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, CompanyError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function afterInviteSuccessEvent(data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        if (data.err) {
          handleErrorByCompany(data.err.type);
        }
        else {
          $scope.newCompanyInfo.isFinished = true;
        }
      }

      function afterInviteErrorEvent(err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        handleErrorByCompany('error'); //未知错误
      }

      function getPartnerCompanys() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleErrorByCompany(data.err.type);
          }
          if (data.partnerCompany)
            $scope.partnersInfo.company.partnerCompanies = data.partnerCompany;
          if (data.inviteCompany)
            $scope.partnersInfo.company.inviteCompanies = data.inviteCompany;

          $scope.rightHeader.updateCount('company', $scope.partnersInfo.company.partnerCompanies.length + $scope.partnersInfo.company.inviteCompanies.length);
        }, function (err) {
          handleErrorByCompany('error');
        });
      }

      $scope.newCompanyInfo = {
        isShowDialog: false,
        inputValue: '',
        matchCompanys: [],
        isFinished: false,
        isShowDrop: false,
        isAllowQuery: true,
        timerPromise: '',
        finishText: '',
        clickClosePage: '',
        clickCompanyItem: '',
        clickConfirm: '',
        clickFinish: '',
        emailReg: /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/,
        openDialog: function () {
        }
      };
      $scope.newCompanyInfo.openDialog = function () {
        this.isShowDialog = true;
        $scope.maskInfo.isShow = true;
      }
      $scope.newCompanyInfo.clickClosePage = function () {
        this.isShowDialog = false;
        this.inputValue = '';
        this.matchCompanys = [];
        this.isFinished = false;
        this.isShowDialog = false;
        this.isAllowQuery = true;
        this.timerPromise = '';
        this.finishText = '';
        $scope.maskInfo.isShow = false;
      };
      $scope.newCompanyInfo.clickFinish = function () {
        $scope.newCompanyInfo.clickClosePage();

        getPartnerCompanys();
      }
      $scope.newCompanyInfo.clickCompanyItem = function (selectedCompany) {
        $scope.newCompanyInfo.matchCompanys.forEach(function (companyItem) {
          companyItem.isSelected = false;
        });

        selectedCompany.isSelected = true;
        $scope.newCompanyInfo.inputValue = selectedCompany.name;
        $scope.newCompanyInfo.isShowDrop = false;

        //推迟执行，让$watch执行完再执行。去除最后一次查找，因为已完全匹配
        $timeout(function () {
          if ($scope.newCompanyInfo.timerPromise) {
            $timeout.cancel($scope.newCompanyInfo.timerPromise);
            $scope.newCompanyInfo.isAllowQuery = true;
          }
        }, 200);
      }
      $scope.newCompanyInfo.clickConfirm = function () {
        if (!$scope.newCompanyInfo.inputValue) {
          return;
        }
        var isExistCompany = false;
        if ($scope.newCompanyInfo.matchCompanys.length > 0) {
          //判断是否有选中的
          $scope.newCompanyInfo.matchCompanys.every(function (companyItem, index, arr) {
            if (companyItem.name === $scope.newCompanyInfo.inputValue) {
              isExistCompany = true;
              return false;
            }
            return true;
          });

          if (!isExistCompany) {
            $scope.$emit(GlobalEvent.onShowAlert, "公司名不存在或邮箱不合法");
            return;
          }
        }
        else {
          //检查是否匹配有效邮箱
          if (!$scope.newCompanyInfo.emailReg.test($scope.newCompanyInfo.inputValue)) {
            $scope.$emit(GlobalEvent.onShowAlert, "公司名不存在或邮箱不合法");
            return;
          }
        }

        if (isExistCompany) {
          $scope.newCompanyInfo.finishText = '恭喜您，您已经成功添加了' + $scope.newCompanyInfo.inputValue + '，该公司将出现在您的合作公司列表中。';
        } else {
          $scope.newCompanyInfo.finishText = '恭喜您，您已经成功邀请了' + $scope.newCompanyInfo.inputValue + '，该公司注册后将出现在您的合作公司列表中。';
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        if (isExistCompany) {
          CompanyService.inviteCompanyByName($scope.newCompanyInfo.inputValue).then(function (data) {
            afterInviteSuccessEvent(data);
          }, function (err) {
            afterInviteErrorEvent(err);
          });
        }
        else {
          CompanyService.inviteCompanyByEmail($scope.newCompanyInfo.inputValue).then(function (data) {
            afterInviteSuccessEvent(data);
          }, function (err) {
            afterInviteErrorEvent(err);
          });
        }
      };
      $scope.$watch(function () {
        return $scope.newCompanyInfo.inputValue;
      }, function () {
        if ($scope.newCompanyInfo.isAllowQuery) {
          $scope.newCompanyInfo.isAllowQuery = false;
          $scope.newCompanyInfo.timerPromise = $timeout(function () {
            if ($scope.newCompanyInfo.inputValue) {
              if ($scope.newCompanyInfo.emailReg.test($scope.newCompanyInfo.inputValue)) {
                $scope.newCompanyInfo.isShowDrop = false;
              }
              else {
                CompanyService.getMatchCompanies($scope.newCompanyInfo.inputValue).then(function (data) {
                  if (!data) {
                    console.log('get match companies empty');
                  }
                  else if (data.err) {
                    console.log(data.err);
                  }
                  else {
                    $scope.newCompanyInfo.matchCompanys = data;
                  }
                }, function (err) {
                  console.log('get match companies error: ' + err);
                });

                $scope.newCompanyInfo.isShowDrop = true;
              }
            }
            else {
              $scope.newCompanyInfo.isShowDrop = false;
            }

            $scope.newCompanyInfo.isAllowQuery = true;

          }, 500);
        }
      });



      $scope.newBidderInfo = {
        username: '',
        real_name: '',
        showBidderDialog: false,
        username_readonly: false,
        modify: function(bidder){
          this.username = bidder.username;
          this.real_name = bidder.real_name;
          this.showBidderDialog = true;
          this.username_readonly = true;
          $scope.maskInfo.isShow = true;
        },
        remove: function(bidder){
          if (!bidder) {
            return;
          }

          var alertContent = '确定删除合作中介吗' + bidder.username + '吗？';
          $scope.$emit(GlobalEvent.onShowAlertConfirm, alertContent, function () {
            $scope.$emit(GlobalEvent.onShowLoading, true);
            BidderService.removeCompanyBidder({username: bidder.username}).then(function (result) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              if (result.err) {
                return handleErrorByDriver(result.err.type);
              }
              $scope.$emit(GlobalEvent.onShowAlert, '删除成功');
              getBidderList();
            }, function (err) {
              console.log(err);
              $scope.$emit(GlobalEvent.onShowLoading, false);
              handleErrorByDriver('error');
            });

          });
        },
        openDialog: function (isOpen) {
          this.username = '';
          this.showBidderDialog = isOpen;
          this.username_readonly = false;
          $scope.maskInfo.isShow = isOpen;
        },
        submit: function () {
          if (!this.username) {
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入手机号码');
          }
          if (!this.username.testPhone()) {
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入正确的手机号码');
          }
          if(!this.real_name){
            return $scope.$emit(GlobalEvent.onShowAlert, '请输入中介姓名');
          }

          var that = this;

          $scope.$emit(GlobalEvent.onShowLoading, true);

          BidderService.inviteBidderByPhone({username: this.username, real_name: this.real_name}).then(function (data) {

            $scope.$emit(GlobalEvent.onShowLoading, false);

            if (data.err) {
              return $scope.$emit(GlobalEvent.onShowAlert, data.err.zh_message || '操作出错');
            }

            getBidderList();
            that.openDialog(false);

            if(data.update_success){
              $scope.$emit(GlobalEvent.onShowAlert, '修改成功');
            }else if(data.add_success){
              $scope.$emit(GlobalEvent.onShowAlert, '添加成功');
            }

          }, function (err) {
            console.log(err);
            return handleErrorByDriver('error');
          });
        }
      };

      function getBidderList() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        BidderService.getDetailList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          if (data.err) {
            return handleErrorByDriver(data.err.type);
          }
          $scope.partnersInfo.bidders = data;
          $scope.rightHeader.updateCount('bidder', $scope.partnersInfo.bidders.length);

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleErrorByDriver('error');
        });

      }
    }]);

angular.module('zhuzhuqs').controller('HeaderController',
  ['$location', '$rootScope', '$scope', '$state', 'GlobalEvent', 'HomeService', 'Auth', 'config',
    function ($location, $rootScope, $scope, $state, GlobalEvent, HomeService, Auth, config) {
      $scope.headerNav = {
        currentnav: null,
        subnav: null,
        subList: []
      };

      $scope.searchHandle = function (str) {
        alert("暂未开放");
      };

      $scope.curUser = Auth.getUser() || {};
      $scope.curCompany = Auth.getCompany() || {};

      Auth.onUserUpdatedCallback(function () {
        $scope.curUser = Auth.getUser() || {};
        $scope.curCompany = Auth.getCompany() || {};
      }, 'HeaderController');

      $rootScope.$on(GlobalEvent.onChangeMenu, function (event, tar) {
        //var tar = HomeService.getObjByHandelUrl($location.path());
        //

      });

      $scope.signout = function () {
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要退出吗？", goLogin);
        return;

      };

      function goLogin() {
        window.location = config.login;
      }

      $scope.btnClickHandle = function (tar) {
        $state.go(tar);
      };

      $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        //var _path = $location.path();
        $scope.headerNav.subnav = null;
        $rootScope.viewSubHandle = [];
        $scope.headerNav.subList = [];
        //var nav_list = toState.name.split('.');
        $scope.headerNav.subList = HomeService.getCurrentNavList(toState.name);
        var _current = $scope.headerNav.subList[$scope.headerNav.subList.length - 1];
        if (!_current || _current.url === "/") {
          $scope.headerNav.currentnav = null;
        }
        else {
          $scope.headerNav.currentnav = _current;
          if (toParams && toParams.title) {
            $scope.headerNav.currentnav.label = toParams.title;
          }
        }
        if ($scope.headerNav.currentnav && $scope.headerNav.currentnav.viewSubHandle && $scope.headerNav.currentnav.viewSubHandle.length > 0) {
          $scope.headerNav.currentnav.viewSubHandle.forEach(function (sub) {
            if (sub.url === $location.path()) {
              $scope.headerNav.subnav = sub;
            }
          });
        }
      });
    }]);
angular.module('zhuzhuqs').controller('HomeController',
  ['$rootScope', '$scope', '$state', 'HomeService', 'GlobalEvent', 'Auth',
    function ($rootScope, $scope, $state, HomeService, GlobalEvent, Auth) {

      var panelItems = HomeService.getPanelItems();
      var user = Auth.getUser();

      if (!user) {
        console.log('user is empty, need signin');
        return;
      }

      panelItems.forEach(function (item) {
        var hasPermission = false;
        user.roles.forEach(function (role) {
          if (role == 'admin' || role == item.role)
            hasPermission = true;
        });

        item.visible = hasPermission;
      });


      $scope.items = panelItems;
      $scope.onMenu = function (btn) {
        //$scope.$emit(GlobalEvent.onChangeMenu, btn);
        HomeService.setviewSubHandle(btn.viewSubHandle ? btn.viewSubHandle : []);
        if (btn.params) {
          $state.go(btn.state, {params: btn.params});
        }
        else {
          if (btn.type === 'external_link') {
            goExternalLink(btn);
            return;
          }
          if (btn.state == 'home') {
            $scope.$emit(GlobalEvent.onShowDevelopmentTips, btn.label);
            return;
          }
          if (btn.state == 'export') {
            $scope.$emit(GlobalEvent.onShowExportDialog, btn.label);
            return;
          }
          $state.go(btn.state);
        }

      };

      function goExternalLink(btn) {
        if (btn.type !== 'external_link') {
          return;
        }

        return window.location.href = '/tender/entrance_page?state=' + btn.state + '&access_token=' + Auth.getToken();
      }
    }]);
angular.module('zhuzhuqs').controller('IndexController',
  ['$rootScope', '$scope', '$state', 'GlobalEvent', 'InformService', 'InformEnum', 'HomeService', 'Auth', 'CompanyService', 'SalesmanService',
    function ($rootScope, $scope, $state, GlobalEvent, InformService, InformEnum, HomeService, Auth, CompanyService, SalesmanService) {
      $scope.pageShow = {
        dialogConfig: {
          title: '消息',
          content: '<div class="dialog-img"><img src="images/global/tips.png"/></div><div class="dialog-bottom">给力开发中...敬请期待!</div>',
          okLabel: "确定",
          show: false
        }
      };
      $rootScope.$on(GlobalEvent.onShowDevelopmentTips, function (event, title) {
        $scope.pageShow.dialogConfig.title = title;
        $scope.pageShow.dialogConfig.show = true;
      });
      $scope.$on(GlobalEvent.onUpdatePanelLabel, function (event, state) {
        HomeService.updatePanelItemsFromLocal(state);
      });

      $scope.$on(GlobalEvent.onUserReseted, function (event, state) {
        Auth.userUpdatedCallback();
        HomeService.updatePanelItemsFromServer();
      });
      $scope.clickBody = function () {
        $rootScope.$broadcast(GlobalEvent.onBodyClick);
      };
      $scope.informConfig = {
        timeShow: {
          today: new Date(),
          getDateFormat: function (time) {
            time = new Date(time);
            if (time.getYear() !== this.today.getYear()) {
              return 'yyyy-MM-dd';
            }
            if (time.getMonth() !== this.today.getMonth()) {
              return 'MM-dd';
            }
            if (time.getDate() !== this.today.getDate()) {
              return 'MM-dd';
            }
            return 'HH:mm';
          }
        },
        pushInfo: [],
        pushInfoWindow: {
          text: '',
          isShow: false
        },
        showPushWindow: function () {
          if (this.pushInfo.length > 0) {
            var lastPush = this.pushInfo[this.pushInfo.length - 1];
            this.pushInfoWindow.text = lastPush.title + lastPush.text;
            this.pushInfoWindow.isShow = true;
          }
        },
        hidePushWindow: function (event) {
          this.pushInfoWindow.text = '';
          this.pushInfoWindow.isShow = false;

          if (event) {
            stopBubble(event);
          }
        },
        goAbnormalPage: function () {
          if (this.pushInfo.length > 0) {
            InformService.clearAbnormalInforms();
          }
          this.clearPushInfo();
          $state.go('abnormal_orders', {}, {reload: true});
        },
        clearPushInfo: function () {
          this.pushInfo = [];
          this.hidePushWindow();
        },
        addPushInfo: function (info) {
          this.pushInfo.push(info);
          this.showPushWindow();
        },
        initPushInfo: function (infoArray) {
          this.pushInfo = infoArray;
        }
      };

      InformService.addCallback(InformEnum.onSingleAbnormalOrder, function (data) {
        HomeService.updatePanelItemsFromServer();
        $scope.$apply(function () {
          $scope.informConfig.addPushInfo(data);
        });
      });
      InformService.addCallback(InformEnum.onBatchAbnormalOrder, function (data) {
        if (!data || data.length === 0) {
          return;
        }
        var informArray = data.map(function (item) {
          return item.context;
        });
        $scope.$apply(function () {
          $scope.informConfig.initPushInfo(informArray);
        })
      });
      //InformService.connect();

      $scope.initNotificationList = [];

     
    }]);
angular.module('zhuzhuqs').controller('MapForOrderTraceController',
  ['$scope', 'BMapService', 'OrderService', 'GlobalEvent', 'config',
    function ($scope, BMapService, OrderService, GlobalEvent, config) {

      var map = new BMap.Map('mapForOrderTrace');
      map.centerAndZoom(new BMap.Point(116.404, 39.915), 11);  // 初始化地图,设置中心点坐标和地图级别
      map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
      map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
      var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
      var top_left_navigation = new BMap.NavigationControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        type: BMAP_NAVIGATION_CONTROL_SMALL
      });  //左上角，添加默认缩放平移控件
      map.addControl(top_left_control);
      map.addControl(top_left_navigation);

      $scope.mapInit = {
        showDriverNumber: 50,
        gpsCount: 0,
        ungpsCount: 0,
        icon: '/images/icon/map/driver.png',
        iconSize: new BMap.Size(42, 33),
        iconAnchorSize: new BMap.Size(14, 33),//offset
        myIcon: '',
        windowOpts: {
          width: 290,     // 信息窗口宽度
          enableMessage: true//设置允许信息窗发送短息
        },
        showPhotoScan: false,
        displayPhotos: [],
        currentPhotos: [],
        imgIndex: 0

      };
      $scope.mapInit.myIcon = new BMap.Icon(config.serverWebAddress + $scope.mapInit.icon, $scope.mapInit.iconSize);

      $scope.filterDriverNumber = function () {
        getDriverData();
      };
      $scope.showPhotos = function (photo) {
        $scope.mapInit.imgIndex = 0;
        $scope.mapInit.showPhotoScan = true;
        $scope.$apply();
      };

      function makeOldDataFromNewData(data) {
        var newData = [];

        if (data.drivers && data.drivers.length > 0 && data.allDriverOrders) {
          data.drivers.forEach(function (eachDriver) {
            if (data.allDriverOrders[eachDriver._id] && data.allDriverOrders[eachDriver._id].length > 0) {
              var newItem = {
                _id: eachDriver._id,
                address: '',
                driver: eachDriver,
                driver_id: eachDriver._id,
                location: eachDriver.current_location,
                orders: data.allDriverOrders[eachDriver._id]
              }
              if (data.allDriverOrders[eachDriver._id][0].pickup_events && data.allDriverOrders[eachDriver._id][0].pickup_events.length > 0) {
                newItem.events = data.allDriverOrders[eachDriver._id][0].pickup_events[0];
              }
              else {
                newItem.events = null;
              }

              newData.push(newItem);
            }
            else {
              console.log('can not find driver order');
            }

          });
        }

        return newData;
      }

      function getDriverData() {

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.getDriverOrders($scope.mapInit.showDriverNumber).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleError(data.err.type);
          }
          else {
            data = makeOldDataFromNewData(data);

            var allDriverPoints = [];
            clearMap();
            clearMapPoints();
            data.forEach(function (trace) {
              var bmapPoint = new BMap.Point(trace.location[0], trace.location[1]);
              if (bmapPoint) {
                allDriverPoints.push(bmapPoint);
                var marker = new BMap.Marker(bmapPoint, {icon: $scope.mapInit.myIcon});
                map.addOverlay(marker);
                marker.addEventListener("click", function (e) {
                  getAddressByPoint(trace);
                });
              }
            });
            map.setViewport(allDriverPoints);
          }
        }, function (err) {
          console.log(err);
        });


      }

      function handleError(errType) {
        $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
      }

      function clearMap() {
        map.clearOverlays();
      }

      function clearMapPoints() {
        $scope.mapInit.gpsCount = 0;
        $scope.mapInit.ungpsCount = 0;
      }

      function getAddressByPoint(trace) {
        var location = '';
        if (!trace.location || trace.location.length <= 0) {
          location = '未知';
          var _html = generateTipHtml(trace, location);
          var infoWindow = new BMap.InfoWindow(_html, $scope.mapInit.windowOpts);  // 创建信息窗口对象
          map.openInfoWindow(infoWindow, point); //开启信息窗口
        }
        else {
          var point = new BMap.Point(trace.location[0], trace.location[1]);
          var geoc = new BMap.Geocoder();
          geoc.getLocation(point, function (rs) {
            var addComp = rs.addressComponents;
            location = addComp.province + ", " + addComp.city + ", " + addComp.district + ", " + addComp.street + ", " + addComp.streetNumber;
            var _html = generateTipHtml(trace, location);
            var infoWindow = new BMap.InfoWindow(_html, $scope.mapInit.windowOpts);  // 创建信息窗口对象
            map.openInfoWindow(infoWindow, point); //开启信息窗口
          });
        }
      }

      function generateTipHtml(trace, location) {
        var html = generateDriverInforHtml(trace.driver)
          + generateOrderInforHtml(trace, location)
          + generatePhotoHtml(trace.events);
        return html;
      }

      function generateDriverInforHtml(driver) {
        var html = '<div class=" driver-info">';
        html += '<div class="content"><div class="avatar">';
        if (driver.photo) {
          html += '<img ng-src="' + generatePhotoUrl(driver.photo) + '" /></div>';
        }
        else {
          html += '</div>'
        }
        html += '<div class="info">' +
        '<div class="top"><span>' +
        (driver.nickname ? driver.nickname : '匿名司机') + '</span>' +
        '<span>(' + (driver.plate_numbers.length > 0 ? driver.plate_numbers[0] : '未知车牌') + ')</span>' +
        '</div>' +
        '<div class="bottom">' + driver.username + '</div>' +
        '</div>';

        html += '</div></div>';
        return html;

      }

      function generateOrderInforHtml(trace, location) {

        var html = '<div class="event-tip">';
        html += '<div class="content">';
        var orders = trace.orders;
        if (orders.length == 1) {
          var order = orders[0];
          html += '<div class="item">';
          html += '<div class="left">';
          html += '运单号：</div>';
          html += '<div class="right">';
          html += order.order_details.order_number + '</div></div>';
          html += '<div class="item">';
          html += '<div class="left">';
          html += '货物名称：</div>';
          html += '<div class="right">';
          html += (order.order_details.goods_name ? order.order_details.goods_name : '未知') + '</div></div>';
          html += '<div class="item">';
          html += '<div class="left">';
          html += '件重体：</div>';
          html += '<div class="right">';
          if (!order.order_details.weight && !order.order_details.count && !order.order_details.volume) {
            html += '未知</div></div>'
          }
          else {
            html += (order.order_details.count ? (order.order_details.count + order.order_details.count_unit) : '')
            + (order.order_details.weight ? ('|' + order.order_details.weight + order.order_details.weight_unit) : '')
            + (order.order_details.volume ? ('|' + order.order_details.volume + order.order_details.volume_unit) : '') + '</div></div>'
          }
          html += '<div class="item">';
          html += '<div class="left">';
          html += '货损状况：</div>';
          html += '<div class="right">';
          html += (order.damaged ? '有货损' : '无货损') + '</div></div>';

        }
        else {
          html += '<div class="item">';
          html += '<div class="left">';
          html += '运单号：</div>';
          html += '<div class="right">';
          html += getOrderList(trace.orders) + '共' + trace.orders.length + '张运单</div></div>';
        }
        html += '<div class="item">';
        html += '<div class="left">';
        html += '当前位置：</div>';
        html += '<div class="right">';
        html += location + '</div></div>';
        html += '</div></div>';

        return html;

      }

      function generatePhotoHtml(event) {
        if (!event) {
          return '';
        }
        $scope.mapInit.displayPhotos = [];
        $scope.mapInit.currentPhotos = [];
        if (event.goods_photos && event.goods_photos.length > 0) {
          $scope.mapInit.displayPhotos.push(event.goods_photos[0]);
          var scan_obj = {
            order: '',
            title: '',
            warning: '',
            url: generatePhotoUrl(event.goods_photos[0]),
            remark: ''
          };
          $scope.mapInit.currentPhotos.push(scan_obj);
        }
        if (event.credential_photos && event.credential_photos.length > 0) {
          $scope.mapInit.displayPhotos.push(event.credential_photos[0]);
          var scan_obj = {
            order: '',
            title: '',
            warning: '',
            url: generatePhotoUrl(event.credential_photos[0]),
            remark: ''
          };
          $scope.mapInit.currentPhotos.push(scan_obj);
        }

        var result = '';
        if ($scope.mapInit.displayPhotos.length > 0) {
          result += '<div id="' + event._id + '" class="photos">';
          for (var i = 0; i < $scope.mapInit.displayPhotos.length; i++) {
            var photo = $scope.mapInit.displayPhotos[i];
            if (i === 0) {
              result += ('<div class="photo" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
              '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
            }
            else {
              result += ('<div class="photo-right" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
              '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
            }

          }
          result += '</div>';

        }
        return result;
      }

      function getOrderList(orders) {
        var _list = orders[0].order_details.order_number;
        if (orders.length > 1) {
          var _length = orders.length > 5 ? 5 : orders.length;
          for (var i = 1; i < _length; i++) {
            _list += ',' + orders[i].order_details.order_number;
          }
          _list += '...';
        }
        return _list;
      }

      function generatePhotoUrl(photoName) {
        return config.qiniuServerAddress + photoName;
      }

      getDriverData();
    }])
;
angular.module('zhuzhuqs').controller('OnlineReportConfigController',
  ['$scope', '$stateParams', '$timeout', 'OnlineReportConfigService', 'CompanyError', 'GlobalEvent',
    function ($scope, $stateParams, $timeout, OnlineReportConfigService, CompanyError, GlobalEvent) {

      $scope.time = {
        queryLogTimeRange: {startDate: moment().add(-1, 'day').format('YYYY-MM-DD HH'), endDate: moment().format('YYYY-MM-DD HH')},
        /*queryLogMinTime: moment(),*/
        dateOptions: {
          locale: {
            fromLabel: "起始",
            toLabel: "结束",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          singleDatePicker: true,
          timePicker: true,
          showDropdowns: true,
          timePicker12Hour: false,
          timePickerIncrement: 60,
          separator: "",
          format: 'YYYY-MM-DD HH:mm'
        }
      };

      $scope.reportConfig = {
        emails: '',
        start_send_time: $scope.time.queryLogTimeRange.startDate,
        interval: 7,
        submit_name: '保存设置'
      };
      $scope.reportOrderConfig = {
          fields: ['公司', '发货方', '收货方', '运单号', '创建时间', '分配时间', '提货进场时间', '交货进场时间', '中途事件', '参考单号', '品名', '运费', '状态', '司机姓名', '司机手机', '司机车牌', '承运商', '件数', '件数单位', '重量', '重量单位', '体积', '体积单位', '实际提货时间', '实际交货时间', '计划提货时间', '计划交货时间', '提货联系人', '提货联系手机', '提货联系固话', '提货地址', '交货联系人', '交货联系手机', '交货联系固话', '交货地址', '关注人', '备注', '提货进场拍照', '提货拍照', '交货进场拍照', '交货拍照', '中途事件拍照', '实收货物', '实收数量','货缺', '货损']
      };
      $scope.currentReportType = "default";
      $scope.rightHeader = {
        config: {
          name: '在线报表配置',
          count: 0,
          columns: [
            {
              name: '在线报表配置',
              length: 4
            }
          ]
        }
      };
      $scope.submitOrderExportConfig = function(){
          var fields = [];
          jQuery('.body.order input[name=order_fields]').each(function(){
             var input = this;
              if(input.checked){
                  fields.push(this.value);
              }
          });
          if(!fields || fields.length<1){
              $scope.$emit(GlobalEvent.onShowAlert, '请选择导出项');
              return;
          }
          OnlineReportConfigService.saveOrUpdateOrderExportFields({fields:fields.join(",")}).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                  $scope.$emit(GlobalEvent.onShowAlert, data.err.message);
                  return;
              }
              else {
                  $scope.$emit(GlobalEvent.onShowAlert, "保存成功");

              }
          }, function (err) {

          });
      };
      $scope.submitConfig = function() {
        if (!$scope.reportConfig.emails) {
          $scope.$emit(GlobalEvent.onShowAlert, '请输入目标邮箱！');
          return;
        }

        console.log($scope.reportConfig.start_send_time);
        $scope.reportConfig.start_send_time = $('.start_send_time').val();
        console.log($scope.reportConfig.start_send_time);

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OnlineReportConfigService.saveOrUpdate($scope.reportConfig).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            $scope.$emit(GlobalEvent.onShowAlert, data.err.message);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, "保存成功");

          }
        }, function (err) {

        });
      };

      var init = function() {
        OnlineReportConfigService.getReportConfig().then(function(data){
          console.log(data);
          if(data && data != '') {
            $scope.reportConfig.emails = data.emails;
            $scope.reportConfig.start_send_time = data.start_send_time;
            $scope.reportConfig.interval = data.interval;
            $scope.time.queryLogTimeRange.startDate = data.start_send_time;//moment(data.start_send_time, 'YYYY-MM-DD hh:mm').locale("cn").toDate();
            $scope.time.queryLogTimeRange.endDate = $scope.time.queryLogTimeRange.startDate;
          }
        });
        OnlineReportConfigService.getOrderExportReportConfig().then(function(data){
            if(data && data.fields){
                var fields = data.fields.split(',');
                console.log(fields);
                for(var i= 0,ilen=fields.length;i<ilen;i++){
                    var field = fields[i];
                    jQuery('.body.order input[name=order_fields][value='+field+']').attr('checked', 'checked');
                }
            }
        });
      };

      init();
}]);

angular.module('zhuzhuqs').controller('OrderAssignController',
  ['$rootScope', '$scope', '$state', 'OrderService', 'CompanyService', 'OrderError', 'GlobalEvent', 'CompanyError', 'UserProfileService', 'OrderHelper',
    function ($rootScope, $scope, $state, OrderService, CompanyService, OrderError, GlobalEvent, CompanyError, UserProfileService, OrderHelper) {
      $scope.orders = {
        config: {
          selectOptions: [
            {
              key: '运单号',
              value: {
                name: '运单号',
                value: 'order_number',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '参考单号',
              value: {
                name: '参考单号',
                value: 'ref_number',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '订单号',
              value: {
                name: '订单号',
                value: 'original_order_number',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: '',
                keyword: ''
              },
              isSelected: false
            }
            , {
              key: '货物名称',
              value: {
                name: '货物名称',
                value: 'goods_name',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: true
            }, {
              key: '件重体',
              value: {
                name: '件/重/体',
                value: 'count_weight_volume',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '提货时间',
              value: {
                name: '提货时间',
                value: 'pickup_start_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '交货时间',
              value: {
                name: '交货时间',
                value: 'delivery_start_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
                curSort: {},
                keyword: ''
              },
              isSelected: true
            },
            {
              key: '发货方',
              value: {
                name: '发货方',
                value: 'sender_name',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            },
            {
              key: '收货方',
              value: {
                name: '收货方',
                value: 'receiver_name',
                isSort: false,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }, {
              key: '备注',
              value: {
                name: '备注',
                value: 'description',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }, {
              key: '状态',
              value: {
                name: '状态',
                value: 'status',
                isSort: false,
                isSearch: false,
                columnWidth: 1
              },
              isSelected: true
            }, {
              key: '分配时间',
              value: {
                name: '分配时间',
                value: 'assign_time',
                isSort: true,
                isSearch: false,
                columnWidth: 1,
                sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
              },
              isSelected: false
            }],
          rowExpand: {
            enable: true,
            expandText: '分配',
            cancelText: '取消',
            selfCloseButton: true
          },
          selectionOption: {
            columnWidth: 1
          },
          handleOption: {
            columnWidth: 2
          },
          fields: [],
          fields_length: 7,
          isShowPagination: true,
          pagination: {
            currentPage: 1,
            currentLimit: 10,
            limit: 10,
            totalCount: 0,
            pageCount: 0,
            pageNavigationCount: 5,
            canSeekPage: true,
            limitArray: [10, 20, 30, 40, 100],
            pageList: [1],
            sortName: '',
            sortValue: '',
            searchName: '',
            searchValue: '',
            onCurrentPageChanged: function (callback) {
              if ($scope.orders.config.pagination.currentLimit !== $scope.orders.config.pagination.limit) {
                $scope.orders.config.pagination.currentLimit = $scope.orders.config.pagination.limit;
                onSaveMaxPageCount('max_page_count_assign', $scope.orders.config.pagination.limit);
              }

              loadOrders(callback($scope.orders.config.pagination));
            }
          },
          rows: [],
          events: {
            selectedHandler: [onSelected],
            rowClickHandler: [onRowClick],
            rowDeleteHandler: [onRowDelete],
            rowInfoEditHandler: [onRowInfoEdit],
            headerSortChangedHandler: [onHeaderSortChanged],
            headerKeywordsChangedHandler: [onHeaderKeywordsChanged],
            updateDisplayFields: [onUpdateDisplayFields],
            saveDisplayFields: [onSaveDisplayFields]
          },
          extendData: {
            partnerCompanies: [],
            partnerDrivers: [],
            rangeTimePanel: null,
            onRowSubmit: function (order) {
              orderAssign(order);
            }
          }
        },
        isShowBatchAssign: false,
        isShowBatchDelete: false,
        currentOrderList: []
      };

      $scope.patchAssignInfo = {
        count: 0,
        partnerType: '',
        partnerId: '',
        partnerName: '',
        is_wechat: false,
        enableEdit: false,
        selectedOrders: [],
        isWarehouse: false,
        isRoadOrder: false,
        driverOptions: [],
        selectOptions: [],
        warehouseOptions: [],
        defaultContent: '搜索合作公司或司机',
        options: [],
        onSelected: selectPatchAssignPartner
      };

      function getUserProfile(callback) {
        UserProfileService.getUserProfile().then(function (data) {
          if (!data) {
            console.log('get user profile failed');
            return callback();
          }
          if (data.err) {
            console.log(data.err);
            return callback();
          }

          if (!data.user_profile) {
            console.log('customer do not has user profile content');
            return callback();
          }

          if (!data.user_profile.customize_columns_assign || data.user_profile.customize_columns_assign.length <= 0) {
            console.log('customer did not create customer profile until now');
          }
          else {
            var currentOption, i;
            for (i = 0; i < $scope.orders.config.selectOptions.length; i++) {
              currentOption = $scope.orders.config.selectOptions[i];
              currentOption.isSelected = false;
            }

            data.user_profile.customize_columns_assign.forEach(function (columnName) {
              for (i = 0; i < $scope.orders.config.selectOptions.length; i++) {
                currentOption = $scope.orders.config.selectOptions[i];

                if (currentOption.key === columnName) {
                  currentOption.isSelected = true;
                  break;
                }
              }
            });
          }

          if (data.user_profile.max_page_count_assign) {
            $scope.orders.config.pagination.limit = parseInt(data.user_profile.max_page_count_assign) || $scope.orders.config.pagination.limit;
            $scope.orders.config.pagination.currentLimit = $scope.orders.config.pagination.limit;
          }

          return callback();
        }, function (err) {
          console.log(err);
          return callback();
        });
      }

      function fillDisplayFields() {
        if (!$scope.orders.config.selectOptions || $scope.orders.config.selectOptions.length <= 0) {
          return;
        }

        $scope.orders.config.fields = [];
        $scope.orders.config.selectOptions.forEach(function (optionItem) {
          if (optionItem.isSelected) {
            $scope.orders.config.fields.push(optionItem.value);
          }
        });

        if ($scope.orders.config.fields.length > $scope.orders.config.fields_length) {
          $scope.orders.config.fields = $scope.orders.config.fields.slice(0, $scope.orders.config.fields_length);
        }
      }

      function generateFieldsColumn(currentOrder) {
        var rowData = {};

        $scope.orders.config.fields.forEach(function (fieldItem) {
          switch (fieldItem.value) {
            case 'order_number':
              rowData.order_number = currentOrder.order_number;
              break;
            case 'ref_number':
              rowData.ref_number = currentOrder.refer_order_number ? currentOrder.refer_order_number : '未填';
              break;
            case 'original_order_number':
              rowData.original_order_number = currentOrder.original_order_number ? currentOrder.original_order_number : '未填';
              break;
            case 'goods_name':
              rowData.goods_name = OrderHelper.getGoodsNameString(currentOrder);
              break;
            case 'count_weight_volume':
              rowData.count_weight_volume = OrderHelper.getCountDetail(currentOrder);
              break;
            case 'pickup_start_time':
              rowData.pickup_start_time = currentOrder.pickup_start_time ? new Date(currentOrder.pickup_start_time).Format('yy/MM/dd hh:mm') : '未填';
              break;
            case 'delivery_start_time':
              rowData.delivery_start_time = currentOrder.delivery_start_time ? new Date(currentOrder.delivery_start_time).Format('yy/MM/dd hh:mm') : '未填';
              break;
            case 'sender_name':
              rowData.sender_name = currentOrder.sender_name ? currentOrder.sender_name : '未填';
              break;
            case 'receiver_name':
              rowData.receiver_name = currentOrder.receiver_name ? currentOrder.receiver_name : '未填';
              break;
            case 'description':
              rowData.description = currentOrder.description ? currentOrder.description : '未填';
              break;
            case 'status':
              rowData.status = generateOrderStatus(currentOrder.status, currentOrder.delete_status);
              break;
            case 'assign_time':
              rowData.assign_time = (currentOrder.assign_time ? new Date(currentOrder.assign_time).Format('yyyy-MM-dd hh:mm:ss') : '无');
              break;
            default:
              break;
          }
        });

        return rowData;
      }

      function onUpdateDisplayFields() {
        fillDisplayFields();

        if ($scope.orders.currentOrderList && $scope.orders.currentOrderList.length > 0) {
          renderOrderListRows($scope.orders.currentOrderList);
        }
      }

      function onSaveDisplayFields() {
        var columnFields = [];
        var currentOption;
        for (var i = 0; i < $scope.orders.config.selectOptions.length; i++) {
          currentOption = $scope.orders.config.selectOptions[i];

          if (currentOption.isSelected) {
            columnFields.push(currentOption.key);
          }
        }

        if (columnFields.length > 0) {
          UserProfileService.setAssignCustomizeColumns(columnFields).then(function (data) {
            if (!data) {
              console.log('set customize columns failed');
              return;
            }
            if (data.err) {
              console.log(data.err);
              return;
            }

          }, function (err) {
            console.log(err);
          });
        }
      }

      function onSaveMaxPageCount(columnName, pageCount) {
        UserProfileService.setMaxPageCount({column_name: columnName, max_page_count: pageCount}).then(function (data) {
          if (!data || data.err) {
            return console.log('set assign page max count failed');
          }

          console.log('set assign page max count success');
        }, function (err) {
          return console.log('set assign page max count failed');
        });
      }

      function generateOrderStatus(status, isDelete) {
        if (isDelete) {
          return '已撤销';
        }

        var statusText = getStatusString(status);
        return statusText ? statusText : '已完成';
      };
      function getStatusString(status) {
        var statusString = '';

        switch (status) {
          case 'unAssigned':
            statusString = '未分配';
            break;
          case 'assigning':
            statusString = '分配中';
            break;
          case 'unPickupSigned':
          case 'unPickuped':
            statusString = '未提货';
            break;
          case 'unDeliverySigned':
          case 'unDeliveried':
            statusString = '未交货';
            break;
          case 'pickupSign':
            statusString = '提货签到';
            break;
          case 'pickup':
            statusString = '提货';
            break;
          case 'deliverySign':
            statusString = '交货签到';
            break;
          case 'delivery':
            statusString = '交货';
            break;
          case 'halfway':
            statusString = '中途事件';
            break;
          case 'completed':
            statusString = '已完成';
            break;
          default:
            break;
        }

        return statusString;
      }

      $scope.changePartnerType = function () {
        if (!$scope.patchAssignInfo.enableEdit) {
          return;
        }
        if ($scope.patchAssignInfo.isRoadOrder) {
          return;
        }

        $scope.patchAssignInfo.isWarehouse = !$scope.patchAssignInfo.isWarehouse;

        if ($scope.patchAssignInfo.isWarehouse) {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.warehouseOptions;
          $scope.patchAssignInfo.partnerType = 'warehouse';
          $scope.patchAssignInfo.defaultContent = '搜索仓库管理员';
        }
        else {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机';
        }

      };
      $scope.changeRoadOrder = function () {
        if (!$scope.patchAssignInfo.enableEdit) {
          return;
        }
        if ($scope.patchAssignInfo.isWarehouse) {
          return;
        }

        $scope.patchAssignInfo.isRoadOrder = !$scope.patchAssignInfo.isRoadOrder;

        if ($scope.patchAssignInfo.isRoadOrder) {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.driverOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作司机';
        }
        else {
          $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
          $scope.patchAssignInfo.partnerType = 'driver';
          $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机';
        }

      };

      function selectPatchAssignPartner(option) {
        if (!option) {
          option = {
            key: '',
            value: ''
          };
        }
        $scope.patchAssignInfo.partnerId = option.key;
        $scope.patchAssignInfo.partnerName = option.value;
        $scope.patchAssignInfo.partnerType = option.group_type;
        $scope.patchAssignInfo.is_wechat = option.is_wechat || false;
      }

      function generateSelectData(partners, driverCompanies) {
        var executeDriverData = [];
        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {
          var currentPartner = partners[i];
          executeSelectData.push(OrderHelper.getCompanyAssignOption(currentPartner));
        }

        //提供给路单使用
        executeDriverData.push({key: null, value: '合作司机'});
        //合作公司和合作司机
        executeSelectData.push({key: null, value: '合作司机'});
        //仓储运单使用
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < driverCompanies.length; i++) {
          if (driverCompanies[i].driver && driverCompanies[i].driver.is_signup) {//邀请司机的时候直接建立了关联，此时司机不存在，不应该加进去
            executeDriverData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'driver'));
            executeSelectData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getDriverAssignOption(driverCompanies[i].driver, 'warehouse'));
          }
        }

        //executeDriverData.push({key: null, value: '微信司机'});
        //executeSelectData.push({key: null, value: '微信司机'});
        //executeWarehouseSelectData.push({key: null, value: '微信仓库管理员'});
        //for (var i = 0; i < driverCompanies.length; i++) {
        //  //如果绑定了微信
        //  if (driverCompanies[i].driver && driverCompanies[i].driver.wechat_profile && driverCompanies[i].driver.wechat_profile.openid) {
        //    executeDriverData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'driver'));
        //    executeSelectData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'driver'));
        //    executeWarehouseSelectData.push(OrderHelper.getWechatDriverAssignOption(driverCompanies[i].driver, 'warehouse'));
        //  }
        //}

        return {
          executeDriverData: executeDriverData,
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };
      }

      $scope.orderBatchDelete = function () {
        if (!$scope.orders.isShowBatchDelete) {
          return;
        }
        if ($scope.patchAssignInfo.selectedOrders.length <= 0) {
          return;
        }

        $scope.$emit(GlobalEvent.onShowAlertConfirm, '确认要删除这' + $scope.patchAssignInfo.selectedOrders.length + '项运单吗？', function (param) {
          $scope.$emit(GlobalEvent.onShowLoading, true);

          var order_ids = [];
          for (var index = 0; index < $scope.patchAssignInfo.selectedOrders.length; index++) {
            var currentOrder = $scope.patchAssignInfo.selectedOrders[index];
            order_ids.push(currentOrder._id);
          }

          OrderService.batchDeleteOrders(order_ids).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);

            if (!data) {
              return handleOrderError('');
            }
            if (data.err) {
              return handleOrderError(data.err.type);
            }

            var showTip = '删除成功';
            if (data.failedOrders && data.failedOrders.length > 0) {
              showTip = '操作完成，失败' + data.failedOrders.length + '个';
            }
            $scope.$emit(GlobalEvent.onShowAlert, showTip, function () {
              $state.go('order_assign', {}, {reload: true});
            });

          }, function (err) {
            $scope.$emit(GlobalEvent.onShowLoading, false);

            console.log(err);
          });

        }, null);
      };

      $scope.orderPatchAssign = function () {
        if ($scope.patchAssignInfo.selectedOrders.length <= 0) {
          return;
        }

        if (!$scope.patchAssignInfo.partnerId || $scope.patchAssignInfo.partnerId === '') {
          return;
        }

        if (!$scope.patchAssignInfo.partnerType || $scope.patchAssignInfo.partnerType === '') {
          return;
        }

        if ($scope.patchAssignInfo.isRoadOrder) {
          $scope.$emit(GlobalEvent.onShowAlertPrompt, {
            tipText: '设置路单号：',
            placeholderText: '输入您要设置的路单号（选填）',
            sure: '开始分配'
          }, function (inputContent) {
            orderPatchAssign(inputContent);
          });
        }
        else {
          orderPatchAssign();
        }
      };

      function orderPatchAssign(inputContent) {
        var assignInfo = {
          type: $scope.patchAssignInfo.partnerType,
          partner_name: $scope.patchAssignInfo.partnerName,
          is_wechat: $scope.patchAssignInfo.is_wechat,
          order_ids: [],
          road_order_name: inputContent
        };

        if (assignInfo.type === 'company') {
          assignInfo.company_id = $scope.patchAssignInfo.partnerId;
        }
        else {
          assignInfo.driver_id = $scope.patchAssignInfo.partnerId;
        }

        for (var i = 0; i < $scope.patchAssignInfo.selectedOrders.length; i++) {
          assignInfo.order_ids.push($scope.patchAssignInfo.selectedOrders[i]._id);
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.batchAssign(assignInfo).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            console.log(data.err);
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, '分配成功');
            $state.go('order_assign', {}, {reload: true});
          }
        }, function (err) {
          console.log(err);
        });
      }

      function orderAssign(order) {
        var order_id = order._id;
        var new_order_number = order.new_order_number;

        var assign_infos = order.extendData.assignInfos;

        var isValid = true;
        for (var i = 0; i < assign_infos.length; i++) {
          var currentAssignInfo = assign_infos[i];
          if (submitValid(currentAssignInfo) == false) {
            isValid = false;
            break;
          }

          currentAssignInfo.pickupTimeRange = '';
          currentAssignInfo.deliveryTimeRange = '';
          if (currentAssignInfo.pickup_start_time && currentAssignInfo.pickup_start_time.toISOString) {
            currentAssignInfo.pickup_start_time = currentAssignInfo.pickup_start_time.toISOString();
          }
          if (currentAssignInfo.pickup_end_time && currentAssignInfo.pickup_end_time.toISOString) {
            currentAssignInfo.pickup_end_time = currentAssignInfo.pickup_end_time.toISOString();
          }

          if (currentAssignInfo.delivery_start_time && currentAssignInfo.delivery_start_time.toISOString) {
            currentAssignInfo.delivery_start_time = currentAssignInfo.delivery_start_time.toISOString();
          }
          if (currentAssignInfo.delivery_end_time && currentAssignInfo.delivery_end_time.toISOString) {
            currentAssignInfo.delivery_end_time = currentAssignInfo.delivery_end_time.toISOString();
          }

          delete currentAssignInfo.$$hashKey;
          delete currentAssignInfo.currentChoice;
          delete currentAssignInfo.options;
        }

        if (!isValid) {
          $scope.$emit(GlobalEvent.onShowAlert, "分配信息有误，请分配给司机或供应商或者仓库管理员");
          return;
        }

        if (order.extendData.assign_status == 'assigning') {
          continueAssign(order_id, assign_infos);
        }
        else {
          firstAssign(order_id, new_order_number, assign_infos);
        }
      };

      function onRowClick(row) {
        console.log('onRowClick');
        console.log(row);
      }

      function onSelected(selectedOrders) {
        $scope.patchAssignInfo.count = selectedOrders.length;
        $scope.patchAssignInfo.selectedOrders = selectedOrders;
        if (selectedOrders && selectedOrders.length > 0) {
          $scope.orders.isShowBatchAssign = true;
          $scope.patchAssignInfo.enableEdit = true;
          $scope.orders.isShowBatchDelete = true;

          for (var index = 0; index < selectedOrders.length; index++) {
            var currentOrder = selectedOrders[index];
            if (currentOrder.rowConfig.unEdited) {
              $scope.orders.isShowBatchDelete = false;
              break;
            }
          }
        }
        else {
          $scope.orders.isShowBatchAssign = false;
          $scope.patchAssignInfo.enableEdit = false;
          $scope.orders.isShowBatchDelete = false;
        }

        console.log(selectedOrders);
      }

      function onRowInfoEdit(row) {
        console.log('on row info edit');

        var modifyOrder = {
          order_id: row._id,
          order_number: row.columns.order_number,
          refer_order_number: row.extendData.detail.refer_order_number,
          original_order_number: row.extendData.detail.original_order_number,
          goods_name: (row.columns.goods_name === '未填' ? '' : row.columns.goods_name),

          count: row.extendData.detail.count,
          weight: row.extendData.detail.weight,
          volume: row.extendData.detail.volume,

          count_unit: row.extendData.detail.count_unit,
          weight_unit: row.extendData.detail.weight_unit,
          volume_unit: row.extendData.detail.volume_unit,
          freight_charge: row.extendData.detail.freight_charge,


          customer_name: row.extendData.detail.customer_name,
          pickup_start_time: row.extendData.detail.pickup_start_time,
          delivery_start_time: row.extendData.detail.delivery_start_time,
          pickup_end_time: row.extendData.detail.pickup_end_time,
          delivery_end_time: row.extendData.detail.delivery_end_time,
          description: row.extendData.detail.description,
          group_id: row.extendData.detail.execute_group,

          //contacts
          pickup_contact_name: row.extendData.detail.pickup_contact_name,
          pickup_contact_phone: row.extendData.detail.pickup_contact_phone,
          pickup_contact_mobile_phone: row.extendData.detail.pickup_contact_mobile_phone,
          pickup_contact_address: row.extendData.detail.pickup_contact_address,
          pickup_contact_email: '',

          delivery_contact_name: row.extendData.detail.delivery_contact_name,
          delivery_contact_phone: row.extendData.detail.delivery_contact_phone,
          delivery_contact_mobile_phone: row.extendData.detail.delivery_contact_mobile_phone,
          delivery_contact_address: row.extendData.detail.delivery_contact_address,
          delivery_contact_email: '',

          sender_name: row.extendData.detail.sender_name,
          receiver_name: row.extendData.detail.receiver_name,
          receiver_company: row.extendData.detail.receiver_company,
          sender_company: row.extendData.detail.sender_company

        };
        console.log(modifyOrder);
        $state.go('order_create', {order: JSON.stringify(modifyOrder), modify_type: 'normal', title: '修改运单'});
      }

      function onRowDelete(row) {
        console.log('on row delete');
        $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要删除吗？", function (param) {
          OrderService.deleteUnAssignedOrder(param._id).then(function (data) {
            console.log(data);
            $state.go('order_assign', {}, {reload: true});
          }, function (err) {
            console.log(err);
          })
        }, row);
        console.log(row);
      }

      function onHeaderKeywordsChanged(field) {
        $scope.orders.config.pagination.searchName = field.value;
        $scope.orders.config.pagination.searchValue = field.keyword;
        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      }

      function onHeaderSortChanged(field) {
        $scope.orders.config.pagination.sortName = field.value;
        $scope.orders.config.pagination.sortValue = field.curSort.value;
        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      }

      var phoneRegex = /\d{11}/;

      function submitValid(currentAssignInfo) {
        if (!currentAssignInfo)
          return false;

        if (currentAssignInfo.type === 'driver' || currentAssignInfo.type === 'warehouse') {
          if (currentAssignInfo.driver_id) {
            return true;
          }
          else if (currentAssignInfo.currentText && phoneRegex.test(currentAssignInfo.currentText)) {
            currentAssignInfo.driver_username = currentAssignInfo.currentText;
            return true;
          }
          else {
            return false;
          }
        }
        else {
          if (!currentAssignInfo.company_id && currentAssignInfo.currentText && phoneRegex.test(currentAssignInfo.currentText)) {
            currentAssignInfo.type = 'driver';
            currentAssignInfo.driver_username = currentAssignInfo.currentText;
          }
          return true;
        }
      }

      $scope.orderInfo = {
        curOrder: {},
        curPath: [],
        showAssignDialog: false,
        partnerCompanys: [],
        partnerDrivers: [],
        selectedPartner: null,
        PickUpMinTime: '',
        deliveryMinTime: '',
        dateOptions: {
          locale: {
            fromLabel: "起始",
            toLabel: "结束",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePickerIncrement: 1,
          timePicker12Hour: false,
          separator: "~",
          format: 'YYYY-MM-DD HH:mm:ss',
          opens: 'right'
        }
      };

      $scope.clickPartner = function () {
        console.log($scope.orderInfo.selectedPartner);
        var obj = null;
        if ($scope.orderInfo.selectedPartner) {
          obj = JSON.parse($scope.orderInfo.selectedPartner)
        }
        if (obj) {
          var path = $scope.orderInfo.curPath;
          if (obj['driver']) {
            path.driver_id = obj.driver._id;
            path.partner_name = obj.driver.username;
            path.type = 'driver';
          }
          else {
            path.company_id = obj.company._id ? obj.company._id : obj.partner._id;
            path.partner_name = obj.company._id ? obj.company.name : obj.partner.name;
            path.type = 'company';
          }
        }
      };

      function loadPageData() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        loadPartners(function (partners) {
          loadDrivers(function (drivers) {
            var options = generateSelectData(partners, drivers);
            $scope.patchAssignInfo.driverOptions = options.executeDriverData;
            $scope.patchAssignInfo.selectOptions = options.executeSelectData;
            $scope.patchAssignInfo.warehouseOptions = options.executeWarehouseSelectData;
            $scope.patchAssignInfo.options = $scope.patchAssignInfo.selectOptions;
            $scope.patchAssignInfo.partnerType = 'driver';
            $scope.patchAssignInfo.defaultContent = '搜索合作公司或司机 ';
            $scope.changePartnerType();

            loadOrders(function () {
              $scope.$emit(GlobalEvent.onShowLoading, false);
            });
          });
        });
      };

      function sortPartnerCompanies(companyA, companyB) {
        var a = companyA.partner._id ? companyA.partner : companyA.company;

        if (a.auth_status && a.auth_status === 'authed') {
          return false;
        }

        return true;
      }

      function loadPartners(callback) {
        CompanyService.getPartnerCompanys().then(function (data) {
          if (data.err) {
            handleCompanyError(data.err.type);
          }
          else {
            data.partnerCompany.sort(sortPartnerCompanies);
            $scope.orderInfo.partnerCompanys = data.partnerCompany;
            $scope.orders.config.extendData.partnerCompanies = data.partnerCompany;
          }

          if (callback)
            return callback(data.partnerCompany);

          return;
        }, function (err) {
        });
      };
      //计算好评率和等级
      function calculateEvaluation(companyDrivers) {
        if (!companyDrivers || companyDrivers.length <= 0) {
          return;
        }
        companyDrivers.forEach(function (companyDriver) {
          var evaluation = companyDriver.driver.all_count.evaluationCount;
          var totalCount = evaluation.good + evaluation.general + evaluation.bad;
          if (totalCount < 10) {
            companyDriver.driver.goodEvaluation = 0;
          }
          else {
            companyDriver.driver.goodEvaluation = Math.ceil(evaluation.good * 100 / totalCount);
          }

          if (companyDriver.driver.goodEvaluation >= 80) {
            companyDriver.driver.evaluationLevel = 3;
          }
          else if (companyDriver.driver.goodEvaluation >= 60 && companyDriver.driver.goodEvaluation < 80) {
            companyDriver.driver.evaluationLevel = 2;
          }
          else {
            companyDriver.driver.evaluationLevel = 1;
          }

        });
      }

      function sortPartnerDrivers(driverA, driverB) {
        if (driverA.driver.evaluationLevel > driverB.driver.evaluationLevel) {
          return false;
        }
        else if (driverA.driver.evaluationLevel === driverB.driver.evaluationLevel) {
          if (driverA.driver.all_count.orderCount > driverB.driver.all_count.orderCount) {
            return false;
          }
          return true;
        }
        else {
          return true;
        }

      }

      function loadDrivers(callback) {
        CompanyService.getPartnerDrivers().then(function (data) {
          console.log(data);
          if (data.err) {
            handleCompanyError(data.err.type);
          }
          else {
            calculateEvaluation(data.driverCompanys);
            data.driverCompanys.sort(sortPartnerDrivers);
            $scope.orderInfo.partnerDrivers = data.driverCompanys;
            $scope.orders.config.extendData.partnerDrivers = data.driverCompanys;
          }

          if (callback)
            return callback(data.driverCompanys);

          return;
        }, function (err) {

        });
      }

      function loadOrders(callback) {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        var searchArray = getSearchCondition();
        OrderService.getUnsignedOrder(
          $scope.orders.config.pagination.currentPage,
          $scope.orders.config.pagination.limit,
          $scope.orders.config.pagination.sortName,
          $scope.orders.config.pagination.sortValue,
          searchArray
          //$scope.orders.config.pagination.searchName,
          //$scope.orders.config.pagination.searchValue

          )
          .then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);
            if (data.err) {
              handleOrderError(data.err.type);
              return;
            }
            else {
              $scope.orders.currentOrderList = data.orders;
              renderOrderListRows(data.orders);

              $scope.orders.config.pagination.limit = parseInt(data.limit);
              $scope.orders.config.pagination.totalCount = data.totalCount;
              $scope.orders.config.pagination.currentPage = parseInt(data.currentPage);
              $scope.orders.config.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
              $scope.orders.config.pagination.render();
              $scope.orders.config.extendData.rangeTimePanel = $scope.zzRangeDatePicker;

              if (callback)
                return callback();

              return;
            }
          }, function (err) {

          });
      }

      function renderOrderListRows(orders) {
        $scope.orders.config.rows.splice(0, $scope.orders.config.rows.length);
        if (orders.length === 0) {
          return;
        }

        for (var i = 0; i < orders.length; i++) {
          var currentOrder = orders[i];
          $scope.orders.config.rows.push({
            _id: currentOrder._id,
            columns: generateFieldsColumn(currentOrder),
            extendData: {
              status: currentOrder.status,
              assign_status: currentOrder.assign_status,
              assignInfos: currentOrder.assigned_infos,
              detail: {
                parent_order: currentOrder.parent_order,
                order_number: currentOrder.order_number,
                refer_order_number: currentOrder.refer_order_number,
                original_order_number: currentOrder.original_order_number,
                goods_name: currentOrder.goods_name,
                pickup_contact_name: currentOrder.pickup_contacts.name,
                pickup_contact_phone: currentOrder.pickup_contacts.phone,
                pickup_contact_mobile_phone: currentOrder.pickup_contacts.mobile_phone,
                pickup_contact_address: currentOrder.pickup_contacts.address,
                delivery_contact_name: currentOrder.delivery_contacts.name,
                delivery_contact_phone: currentOrder.delivery_contacts.phone,
                delivery_contact_mobile_phone: currentOrder.delivery_contacts.mobile_phone,
                delivery_contact_address: currentOrder.delivery_contacts.address,
                pickup_start_time: currentOrder.pickup_start_time,
                pickup_end_time: currentOrder.pickup_end_time,
                delivery_start_time: currentOrder.delivery_start_time,
                delivery_end_time: currentOrder.delivery_end_time,
                customer_name: currentOrder.customer_name,
                create_user: currentOrder.create_user,
                create_group: currentOrder.create_group,
                execute_group: currentOrder.execute_group,
                description: currentOrder.description,
                count: currentOrder.count,
                weight: currentOrder.weight,
                volume: currentOrder.volume,
                count_unit: currentOrder.count_unit,
                weight_unit: currentOrder.weight_unit,
                volume_unit: currentOrder.volume_unit,
                freight_charge: currentOrder.freight_charge,
                details: currentOrder.details,
                receiver_name: currentOrder.receiver_name,
                sender_name: currentOrder.sender_name,
                receiver_company: currentOrder.receiver_company,
                sender_company: currentOrder.sender_company
              }
            },
            rowConfig: {
              notOptional: (currentOrder.status !== 'unAssigned'),
              unEdited: true,//(currentOrder.create_company._id !== currentOrder.execute_company) || currentOrder.status !== 'unAssigned',
              expand: true,
              expandText: currentOrder.assign_status === 'assigning' ? '继续分配' : '分配'
            }
          });
        }
        ;
        $scope.orders.config.load();
      };

      function firstAssign(order_id, new_order_number, assign_infos) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.assignOrder({
          order_id: order_id,
          assign_infos: assign_infos,
          new_order_number: new_order_number
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, '分配成功');
            //$state.go('order_assign', {}, {reload: true});
            $scope.searchModule.searchHandle();
          }
        }, function (err) {
          console.log(err);
        });
      }

      function continueAssign(order_id, assign_infos) {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.continueAssignOrder({
          order_id: order_id,
          assign_infos: assign_infos
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          else {
            $scope.$emit(GlobalEvent.onShowAlert, " 分配成功");
            //$state.go('order_assign', {}, {reload: true});
            $scope.searchModule.searchHandle();
          }
        }, function (err) {
          console.log(err);
        });
      }

      function handleCompanyError(errType) {

        if (CompanyError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, CompanyError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");

        }

      }

      function handleOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");

        }
      }


      //搜素模块
      $scope.searchModule = {
        isShowHighSearch: false,
        showHighSearchHandle: '',
        hideHighSearchHandle: '',
        receiver: '',
        goods_name: '',
        sender: '',
        description: '',
        order_number: '',
        searchHandle: '',

        createTimeRange: '',
        pickUpTimeRange: '',
        deliveryTimeRange: '',
        cleanDeliveryTime: '',
        cleanPickupTime: '',

        dateOptions: {
          locale: {
            fromLabel: "起始时间",
            toLabel: "结束时间",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: " ~ ",
          format: 'YY/MM/DD HH:mm'
        }
      };

      $scope.searchModule.showHighSearchHandle = function () {
        $scope.searchModule.isShowHighSearch = true;
      };
      $scope.searchModule.hideHighSearchHandle = function () {
        $scope.searchModule.isShowHighSearch = false;
      };

      $scope.searchModule.searchHandle = function () {
        $scope.orders.config.pagination.currentPage = 1;

        loadOrders(function () {
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });
      };

      function getSearchCondition() {
        if (!$scope.searchModule)
          return;

        var searchArray = [];

        if ($scope.searchModule.createTimeRange) {

          searchArray.push({
            key: 'createTimeStart',
            value: moment($scope.searchModule.createTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'createTimeEnd',
            value: moment($scope.searchModule.createTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.deliveryTimeRange) {

          searchArray.push({
            key: 'planDeliveryTimeStart',
            value: moment($scope.searchModule.deliveryTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'planDeliveryTimeEnd',
            value: moment($scope.searchModule.deliveryTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.receiver) {
          searchArray.push({
            key: 'receiver',
            value: $scope.searchModule.receiver
          });
        }
        if ($scope.searchModule.goods_name) {
          searchArray.push({
            key: 'goods_name',
            value: $scope.searchModule.goods_name
          });
        }
        if ($scope.searchModule.damaged && $scope.searchModule.damaged !== '不限') {
          searchArray.push({
            key: 'damaged',
            value: $scope.searchModule.damaged === '有' ? true : false
          });
        }
        if ($scope.searchModule.pickUpTimeRange) {
          searchArray.push({
            key: 'planPickupTimeStart',
            value: moment($scope.searchModule.pickUpTimeRange.startDate).toISOString()
          });
          searchArray.push({
            key: 'planPickupTimeEnd',
            value: moment($scope.searchModule.pickUpTimeRange.endDate).toISOString()
          });
        }

        if ($scope.searchModule.sender) {
          searchArray.push({
            key: 'sender',
            value: $scope.searchModule.sender
          });
        }
        if ($scope.searchModule.description) {
          searchArray.push({
            key: 'description',
            value: $scope.searchModule.description
          });
        }

        if ($scope.searchModule.order_number) {
          searchArray.push({
            key: 'order_number',
            value: $scope.searchModule.order_number
          });
        }

        return searchArray;
      };

      getUserProfile(function () {
        fillDisplayFields();
        loadPageData();
      });

    }]);

angular.module('zhuzhuqs').controller('OrderBatchCreateController',
  ['$scope', '$state', 'OrderService', 'CompanyService', 'ExcelReaderService', 'config', 'GlobalEvent', 'UserProfileService',
    function ($scope, $state, OrderService, CompanyService, ExcelReaderService, config, GlobalEvent, UserProfileService) {
      var uploadBlockSize = 10;
      var templateVersion = 0; //当前模版版本

      $scope.data = {
        executeGroups: [],
        currentGroup: {},
        isUploading: false,
        file: {
          resultType: 'normal', //normal, success, error
          message: '等待上传Excel文件',
          current_filename: ''
        },
        formatOrders: [],
        result: {
          success: true,
          totalCount: 0,
          successCount: 0,
          invalidReceiverCount: 0,
          invalidSenderCount: 0,
          successAssignCount: 0
        },
        pickup_entrance_force: false,
        pickup_photo_force: false,
        delivery_entrance_force: false,
        delivery_photo_force: true,
        isOrderMultiAssign: false,  //相同运单号是否作为多段处理
        abnormal_push: {
          isOpen: false
        },
        pickup_push: {
          isOpen: false
        },
        create_push: {
          isOpen: false
        },
        delivery_sign_push: {
          isOpen: false
        },
        delivery_push: {
          isOpen: false
        },

        pickup_deferred_duration: 0,
        delivery_early_duration: 0
      };
      function initUploadData() {
        $scope.data.result.totalCount = 0;
        $scope.data.result.successCount = 0;
        $scope.data.result.invalidReceiverCount = 0;
        $scope.data.result.invalidSenderCount = 0;
        $scope.data.result.successAssignCount = 0;
        $scope.data.result.success = true;
      }

      function getUserProfile() {
        UserProfileService.getUserProfile().then(function (data) {
          console.log(data);

          if (data.err) {
            return console.log(data.err);
          }

          if (data.user_profile) {
            $scope.data.pickup_entrance_force = data.user_profile.pickup_entrance_force;
            $scope.data.pickup_photo_force = data.user_profile.pickup_photo_force;
            $scope.data.delivery_entrance_force = data.user_profile.delivery_entrance_force;
            $scope.data.delivery_photo_force = data.user_profile.delivery_photo_force;

            //记忆选中的组
            if (data.user_profile.order_execute_group && $scope.data.executeGroups.length > 0) {
              for (var i = 0; i < $scope.data.executeGroups.length; i++) {
                if ($scope.data.executeGroups[i]._id.toString() === data.user_profile.order_execute_group) {
                  $scope.clickGroup($scope.data.executeGroups[i]);
                  break;
                }
              }
            }
          }
          else {
            $scope.data.pickup_entrance_force = false;
            $scope.data.pickup_photo_force = false;
            $scope.data.delivery_entrance_force = false;
            $scope.data.delivery_photo_force = true;
          }

        }, function (err) {
          console.log(err);
        });

        CompanyService.getConfiguration().then(function (data) {
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          if (data && data.push_option) {
            $scope.data.abnormal_push.isOpen = data.push_option.abnormal_push;
            $scope.data.pickup_push.isOpen = data.push_option.pickup_push;

            $scope.data.create_push.isOpen = data.push_option.create_push;
            $scope.data.delivery_sign_push.isOpen = data.push_option.delivery_sign_push;
            $scope.data.delivery_push.isOpen = data.push_option.delivery_push;

            $scope.data.pickup_deferred_duration = data.push_option.pickup_deferred_duration;
            $scope.data.delivery_early_duration = data.push_option.delivery_early_duration;
          }

        }, function (err) {
          console.log(err);
        });

      }
      function getGroupList(callback) {
        CompanyService.getExecuteGroupList().then(function (data) {
          if (data.err) {
            $scope.$emit(GlobalEvent.onShowAlert, '获取公司组失败！');
          }
          else {
            $scope.data.executeGroups = data;
            if ($scope.data.executeGroups.length > 0) {
              $scope.clickGroup($scope.data.executeGroups[0]);
            }
          }

          return callback();
        }, function (err) {
          $scope.$emit(GlobalEvent.onShowAlert, '获取公司组失败！');
          return callback();
        });
      }
      function setUserProfileToOrder(formatOrders) {
        if (!formatOrders|| formatOrders.length <= 0) {
          return;
        }
        formatOrders.forEach(function (item) {
          item.createInfo.pickup_entrance_force = $scope.data.pickup_entrance_force;
          item.createInfo.pickup_photo_force = $scope.data.pickup_photo_force;
          item.createInfo.delivery_entrance_force = $scope.data.delivery_entrance_force;
          item.createInfo.delivery_photo_force = $scope.data.delivery_photo_force;

          item.createInfo.pickup_push = $scope.data.pickup_push.isOpen;
          item.createInfo.abnormal_push = $scope.data.abnormal_push.isOpen;

          item.createInfo.create_push = $scope.data.create_push.isOpen;
          item.createInfo.delivery_sign_push = $scope.data.delivery_sign_push.isOpen;
          item.createInfo.delivery_push = $scope.data.delivery_push.isOpen;

          item.createInfo.pickup_deferred_duration = $scope.data.pickup_deferred_duration;
          item.createInfo.delivery_early_duration = $scope.data.delivery_early_duration;

        });
      }
      getGroupList(getUserProfile);

      function goOrderAssign() {
        $state.go('order_assign');
      }

      //只校验这些表头来判断是否为
      var data1Headers = ['客户', '发货方', '收货方', '运单号', '参考单号',
        '承运司机', '运费', '提货时间', '提货联系人', '提货地址',
        '提货联系手机', '提货联系固话', '收货时间', '收货联系人', '收货地址',
        '收货联系手机', '收货联系固话', '品名', '件数', '件数单位',
        '重量', '重量单位', '体积', '体积单位', '备注'];
      var data2Headers = ['客户', '发货方', '收货方', '运单号', '参考单号',
        '承运司机', '运费', '提货时间', '提货联系人', '提货地址',
        '提货联系手机', '提货联系固话', '收货时间', '收货联系人', '收货地址',
        '收货联系手机', '收货联系固话', '备注', '关注人1', '关注人2',
        '关注人3', '品名1', '数量1', '单位1', '品名2',
        '数量2', '单位2', '品名3', '数量3', '单位3',
        '订单号'];
      var columnKeyValue = {
        1: 'A',
        2: 'B',
        3: 'C',
        4: 'D',
        5: 'E',
        6: 'F',
        7: 'G',
        8: 'H',
        9: 'I',
        10: 'J',
        11: 'K',
        12: 'L',
        13: 'M',
        14: 'N',
        15: 'O',
        16: 'P',
        17: 'Q',
        18: 'R',
        19: 'S',
        20: 'T',
        21: 'U',
        22: 'V',
        23: 'W',
        24: 'X',
        25: 'Y',
        26: 'Z',
        27: 'AA',
        28: 'AB',
        29: 'AC',
        30: 'AD',
        31: 'AE',
        32: 'AF',
        33: 'AG',
        34: 'AH',
        35: 'AI',
        36: 'AJ'
      };

      function getOrderCreateInfo(orderItem, columnArray) {
        var result = {};
        columnArray.forEach(function (item) {
          result[item] = orderItem[item];
        });
        return result;
      }
      function getOrderAssignInfo(orderItem, columnArray) {
        var result = {};
        columnArray.forEach(function (item) {
          result[item] = orderItem[item];
        });
        return result;
      }
      function formatOrderWithMultiAssignInfo(orderArray) {
        var formatOrderArray = formatOrderWithAssignInfo(orderArray, true);

        var newOrders = {};
        formatOrderArray.forEach(function (item) {
          if (!newOrders[item.createInfo.order_number]) {
            newOrders[item.createInfo.order_number] = {
              createInfo: item.createInfo,
              assignInfos: []
            };
          }
          newOrders[item.createInfo.order_number].assignInfos = newOrders[item.createInfo.order_number].assignInfos.concat(item.assignInfos);
        });

        var multiAssignArray = [];
        for (var item in newOrders) {
          //只有一段的运单，如果没填承运司机，则不分配
          if (newOrders[item].assignInfos.length === 1 && !newOrders[item].assignInfos[0].driver_username) {
            newOrders[item].assignInfos = [];
          }
          multiAssignArray.push(newOrders[item]);
        }
        return multiAssignArray;
      }
      function formatOrderWithAssignInfo(orderArray, isSaveAssign) {
        if (!orderArray || orderArray.length === 0) {
          return [];
        }
        var createColumnArray = ['customer_name', 'sender_name', 'receiver_name', 'order_number', 'refer_order_number', 'freight_charge',
          'pickup_start_time', 'pickup_end_time', 'pickup_contact_name', 'pickup_contact_address', 'pickup_contact_mobile_phone', 'pickup_contact_phone',
          'delivery_start_time', 'delivery_end_time', 'delivery_contact_name', 'delivery_contact_address', 'delivery_contact_mobile_phone', 'delivery_contact_phone',
          'goods_name', 'count', 'count_unit', 'weight', 'weight_unit', 'volume', 'volume_unit', 'description', 'goods', 'salesmen', 'original_order_number'];
        var assignColumnArray = ['driver_username',
          'pickup_start_time', 'pickup_end_time', 'pickup_contact_name', 'pickup_contact_address', 'pickup_contact_mobile_phone', 'pickup_contact_phone',
          'delivery_start_time', 'delivery_end_time', 'delivery_contact_name', 'delivery_contact_address', 'delivery_contact_mobile_phone', 'delivery_contact_phone'];

        var formatOrders = [];
        orderArray.forEach(function (item) {
          var newOrder = {
            createInfo: getOrderCreateInfo(item, createColumnArray),
            assignInfos: []
          };
          var assignInfo = getOrderAssignInfo(item, assignColumnArray);
          if (assignInfo.driver_username || isSaveAssign) {
            newOrder.assignInfos.push(assignInfo);
          }

          formatOrders.push(newOrder);
        });

        return formatOrders;
      }

      function checkIsNumber(columnValue) {
        if (!columnValue) {
          return true;
        }
        if (isNaN(parseFloat(columnValue))) {
          return false;
        }
        return true;
      }
      function checkIsDate(columnValue) {
        if (!columnValue) {
          return true;
        }
        if (isNaN(Date.parse(columnValue))) {
          return false;
        }
        return true;
      }
      function combineGoodsToOrder(orderItem) {
        var goodsArray = [];
        for (var index = 1; index < 4; index++) {
          if (orderItem['goods' + index]) {
            goodsArray.push({
              name: orderItem['goods' + index],
              count: orderItem['count' + index] || '',
              unit: orderItem['unit' + index] || '箱'
            });
          }
        }
        if (goodsArray.length === 0) {
          goodsArray.push({
            name: '',
            count: '',
            unit: '箱'
          });
        }
        orderItem.goods = goodsArray;
        orderItem.goods_name = goodsArray[0].name;
        orderItem.count = goodsArray[0].count;
        orderItem.count_unit = goodsArray[0].unit;
        orderItem.weight = '';
        orderItem.weight_unit = '吨';
        orderItem.volume = '';
        orderItem.volume_unit = '立方';

      }
      function combineSalesmanToOrder(orderItem) {
        var salesmanArray = [];
        for (var index = 1; index < 4; index++) {
          if (orderItem['salesman' + index]) {
            salesmanArray.push(orderItem['salesman' + index]);
          }
        }
        if (salesmanArray.length > 0) {
          salesmanArray = salesmanArray.zzDistinct();
        }
        if (salesmanArray.length > 0) {
          orderItem.salesmen = salesmanArray;
        }
      }

      function goCompanyConfiguration() {
        $state.go('order_configuration');
      }
      $scope.pickupEntranceHandle = function () {
        //$scope.data.pickup_entrance_force = !$scope.data.pickup_entrance_force;
        goCompanyConfiguration();
      };
      $scope.pickupPhotoHandle = function () {
        //$scope.data.pickup_photo_force = !$scope.data.pickup_photo_force;
        goCompanyConfiguration();
      };
      $scope.deliveryEntranceHandle = function () {
        //$scope.data.delivery_entrance_force = !$scope.data.delivery_entrance_force;
        goCompanyConfiguration();
      };
      $scope.deliveryPhotoHandle = function () {
        //$scope.data.delivery_photo_force = !$scope.data.delivery_photo_force;
        goCompanyConfiguration();
      };

      $scope.multiAssignHandle = function () {
        $scope.data.isOrderMultiAssign = !$scope.data.isOrderMultiAssign;
      };
      $scope.clickGroup = function (userGroup) {
        $scope.data.currentGroup = userGroup;
      };

      $scope.progressBar = {
        max: 0,
        dynamic: 0,
        show: function (max) {
          this.max = max;
          this.dynamic = 0;
        },
        hide: function () {
          this.max = 0;
          this.dynamic = 0;
        },
        change: function (dynamic) {
          this.dynamic = dynamic;
        }
      };

      var importOrder = {
        main: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          data: [],
          handleFile: function () {},
          combineOther: function () {}
        },
        detail: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          rowCount: 0,
          data: {},
          isVersion2: false,
          handleFile: function () {},
          matchOrder: function () {}
        },
        salesman: {
          changeCount: 0,
          buttonText: '从本地上传',
          resultType: '',
          message: '',
          rowCount: 0,
          data: {},
          handleFile: function () {},
          matchOrder: function () {}
        },
        init: function () {
          this.main.changeCount = 0;
          this.main.buttonText = '从本地上传',
          this.main.data = [];
          this.main.resultType = '';
          this.main.message = '上传运单列表';

          this.detail.changeCount = 0;
          this.detail.buttonText = '从本地上传',
          this.detail.data = {};
          this.detail.resultType = '';
          this.detail.message = '添加货物明细表';
          this.detail.rowCount = 0;
          this.detail.disabled = true;
          this.detail.isVersion2 = false;

          this.salesman.changeCount = 0;
          this.salesman.buttonText = '从本地上传',
          this.salesman.data = {};
          this.salesman.resultType = '';
          this.salesman.message = '添加关注人列表';
          this.salesman.rowCount = 0;
          this.salesman.disabled = true;
        },
        reload: function () {
          this.main.data = [];
          this.main.resultType = '';
          this.main.message = '上传运单列表';

          this.detail.data = {};
          this.detail.resultType = '';
          this.detail.message = '添加货物明细表';
          this.detail.rowCount = 0;
          this.detail.disabled = true;

          this.salesman.data = {};
          this.salesman.resultType = '';
          this.salesman.message = '添加关注人列表';
          this.salesman.rowCount = 0;
          this.salesman.disabled = true;
        },
        showResult: function (attribute, resultType, message) {
          this[attribute].resultType = resultType;
          this[attribute].message = message;
          $scope.$apply();
        },
        getMatchInfo: function (rowCount, matchRowCount, matchOrderCount) {
          return '成功读取' + rowCount + '条信息，匹配' + matchRowCount + '条'; //，匹配运单' + matchOrderCount + '条';
        },
        changeFile: function (attribute) {
          this[attribute].changeCount++;
          this[attribute].buttonText = '重新上传';
          if (attribute === 'main') {
            this.detail.changeCount = 0;
            this.detail.buttonText = '从本地上传';
            this.salesman.changeCount = 0;
            this.salesman.buttonText = '从本地上传';
          }
        }
      };
      importOrder.init();
      $scope.importOrder = importOrder;

      function checkExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        var columnIndex;
        var columnName;
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData[data1Headers[3]]) {
            return callback({row: rowIndex + 2, column: columnKeyValue[3 + 1], message: data1Headers[3] + '不能为空'});  //第一行是表头，所以+2
          }

          for (var value in rowData) {
            switch (value) {
              case data1Headers[7]:
              case data1Headers[12]:
                if (!checkIsDate(rowData[value])) {
                  columnIndex = data1Headers.indexOf(value);
                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: data1Headers[columnIndex] + '必须为时间格式'
                  });
                }
                break;
              case data1Headers[5]:
              case data1Headers[10]:
              case data1Headers[15]:
              case data2Headers[18]:
              case data2Headers[19]:
              case data2Headers[20]:
                if (rowData[value] && !rowData[value].toString().testPhone() && rowIndex !== 0) {
                  columnIndex = data1Headers.indexOf(value);
                  if (columnIndex === -1) {
                    columnIndex = data2Headers.indexOf(value);
                    columnName = data2Headers[columnIndex];
                  }
                  else {
                    columnName = data1Headers[columnIndex];
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: columnName + '必须为11位手机号格式'
                  });
                }
                break;
              case data1Headers[6]:
              case data1Headers[18]:
              case data1Headers[20]:
              case data1Headers[22]:
              case data2Headers[22]:
              case data2Headers[25]:
              case data2Headers[28]:
                if (!checkIsNumber(rowData[value])) {
                  columnIndex = data1Headers.indexOf(value);
                  if (columnIndex === -1) {
                    columnIndex = data2Headers.indexOf(value);
                    columnName = data2Headers[columnIndex];
                  }
                  else {
                    columnName = data1Headers[columnIndex];
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: columnName + '必须为数字格式'
                  });
                }
                break;
              default:
                break;
            }
          }
        }
        return callback();
      }
      function generateOrderInfo(sheetData) {
        if (!sheetData) {
          return [];
        }
        var headerKeyValue = {
          '客户': 'customer_name',
          '发货方': 'sender_name',
          '收货方': 'receiver_name',
          '运单号': 'order_number',
          '参考单号': 'refer_order_number',
          '承运司机': 'driver_username',
          '运费': 'freight_charge',
          '提货时间': 'pickup_start_time',
          '提货联系人': 'pickup_contact_name',
          '提货地址': 'pickup_contact_address',
          '提货联系手机': 'pickup_contact_mobile_phone',
          '提货联系固话': 'pickup_contact_phone',
          '收货时间': 'delivery_start_time',
          '收货联系人': 'delivery_contact_name',
          '收货地址': 'delivery_contact_address',
          '收货联系手机': 'delivery_contact_mobile_phone',
          '收货联系固话': 'delivery_contact_phone',
          '品名': 'goods_name',
          '件数': 'count',
          '件数单位': 'count_unit',
          '重量': 'weight',
          '重量单位': 'weight_unit',
          '体积': 'volume',
          '体积单位': 'volume_unit',
          '备注': 'description',
          '关注人1': 'salesman1',
          '关注人2': 'salesman2',
          '关注人3': 'salesman3',
          '品名1': 'goods1',
          '数量1': 'count1',
          '单位1': 'unit1',
          '品名2': 'goods2',
          '数量2': 'count2',
          '单位2': 'unit2',
          '品名3': 'goods3',
          '数量3': 'count3',
          '单位3': 'unit3',
          '订单号': 'original_order_number'
        };

        var orderArray = [];
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          if (rowData['客户'] && rowData['客户'].indexOf('本行请保留') > -1) {
            continue;
          }

          var orderItem = {};
          for (var column in rowData) {
            orderItem[headerKeyValue[column]] = rowData[column];
          }
          orderItem.pickup_end_time = orderItem.pickup_start_time;
          orderItem.delivery_end_time = orderItem.delivery_start_time;

          if (templateVersion === 2) {
            //业务员 salesmen
            combineSalesmanToOrder(orderItem);
            //多货物 goods
            combineGoodsToOrder(orderItem);
          }

          orderArray.push(orderItem);
        }

        return orderArray;
      }
      importOrder.main.handleFile = function (element) {
        importOrder.changeFile('main');
        importOrder.reload();
        importOrder.showResult('main', '', '正在校验Excel文件...');
        initUploadData();

        importOrder.main.data = [];

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          $scope.data.file.current_filename = document.getElementById('main-file-name').value;
          document.getElementById('main-file-name').outerHTML = document.getElementById('main-file-name').outerHTML;
          document.getElementById('main-file-name').value = '';
          if (err) {
            return importOrder.showResult('main', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '客户'},
            {key: 'B1', value: '发货方'},
            {key: 'C1', value: '收货方'},
            {key: 'D1', value: '运单号'},
            {key: 'E1', value: '参考单号'},
            {key: 'F1', value: '承运司机'},
            {key: 'G1', value: '运费'},
            {key: 'H1', value: '提货时间'},
            {key: 'I1', value: '提货联系人'},
            {key: 'J1', value: '提货地址'},
            {key: 'K1', value: '提货联系手机'},
            {key: 'L1', value: '提货联系固话'},
            {key: 'M1', value: '收货时间'},
            {key: 'N1', value: '收货联系人'},
            {key: 'O1', value: '收货地址'},
            {key: 'P1', value: '收货联系手机'},
            {key: 'Q1', value: '收货联系固话'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('main', 'error', '请选择系统提供的模版填写运单数据');
            }
            //得到版本
            var isVersion2 = excelReader.isHeaderNameExist(excelSheet, {key: 'S1', value: '关注人1', index: 18});
            var isVersion1 = excelReader.isHeaderNameExist(excelSheet, {key: 'R1', value: '品名', index: 17});
            if (!isVersion1 && !isVersion2) {
              return importOrder.showResult('main', 'error', '请选择系统提供的模版填写运单数据');
            }

            var currentDataHeaders = isVersion2 ? data2Headers : data1Headers;
            templateVersion = isVersion2 ? 2 : 1;

            excelReader.getSheetData(excelSheet, currentDataHeaders, function (err, sheetData) {
              if (err) {
                return importOrder.showResult('main', 'error', err.message);
              }

              checkExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('main', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.main.data = generateOrderInfo(sheetData);
                importOrder.showResult('main', 'success', '成功读取' + importOrder.main.data.length + '条运单信息');
                importOrder.detail.matchOrder();
                importOrder.salesman.matchOrder();
              });
            });

          });
        });
      };
      importOrder.main.combineOther = function () {
        if (this.data.length === 0) {
          return;
        }
        var details = importOrder.detail.data;
        var salesmen = importOrder.salesman.data;

        if (!getObjectLength(details) && !getObjectLength(salesmen)) {
          return;
        }
        this.data.forEach(function (orderItem) {
          if (details[orderItem.order_number] && details[orderItem.order_number].length > 0) {
            orderItem.goods = details[orderItem.order_number];
          }
          if (salesmen[orderItem.order_number] && salesmen[orderItem.order_number].length > 0) {
            orderItem.salesmen = salesmen[orderItem.order_number];
          }
        });
      }


      var detailDataHeader1 = ['运单号','品名','数量','单位', '单价', '总额'];
      var detailDataHeader2 = ['运单号','品名','数量','单位', '数量2','单位2','数量3','单位3', '单价', '总额'];
      function checkDetailExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData['运单号']) {
            return callback({row: rowIndex + 2, column: columnKeyValue[1], message: '运单号不能为空'});  //第一行是表头，所以+2
          }

          var columnIndex;
          for (var rowValue in rowData) {
            switch(rowValue) {
              case detailDataHeader2[2]:
              case detailDataHeader2[4]:
              case detailDataHeader2[6]:
                if (!checkIsNumber(rowData[rowValue])) {
                  columnIndex = detailDataHeader1.indexOf(rowValue);
                  if (columnIndex === -1) {
                    columnIndex = detailDataHeader2.indexOf(rowValue);
                  }

                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: rowValue + '必须为数字格式'
                  });
                }
                break;
              case detailDataHeader1[4]:
                if (!checkIsNumber(rowData[rowValue])) {
                  if (importOrder.detail.isVersion2) {
                    columnIndex = detailDataHeader2.indexOf(rowValue);
                  }
                  else {
                    columnIndex = detailDataHeader1.indexOf(rowValue);
                  }
                  return callback({
                    row: rowIndex + 2,
                    column: columnKeyValue[columnIndex + 1],
                    message: rowValue + '必须为数字格式'
                  });
                }
                break;
            }
          }
        }
        return callback();
      }
      function generateDetailInfo(sheetData) {
        if (!sheetData) {
          return {};
        }

        var headerKeyValue = {
          '品名': 'name',
          '数量': 'count',
          '单位': 'unit',
          '数量2': 'count2',
          '单位2': 'unit2',
          '数量3': 'count3',
          '单位3': 'unit3',
          '单价': 'price'
        };

        var details = {};
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //没有货物名称，则直接跳过
          if (!rowData['品名']) {
            continue;
          }

          if (!details[rowData['运单号']]) {
            details[rowData['运单号']] = [];
          }

          var rowDetail = {};
          for (var column in rowData) {
            if (column !== '运单号') {
              rowDetail[headerKeyValue[column]] = rowData[column];
            }
          }
          rowDetail.unit = rowDetail.unit || '箱';
          rowDetail.unit2 = rowDetail.unit2 || '吨';
          rowDetail.unit3 = rowDetail.unit3 || '立方';

          details[rowData['运单号']].push(rowDetail);
          importOrder.detail.rowCount++;
        }

        return details;
      }
      importOrder.detail.handleFile = function (element) {
        importOrder.changeFile('detail');
        importOrder.showResult('detail', '', '正在校验Excel文件...');
        importOrder.detail.data = [];
        importOrder.detail.rowCount = 0;

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('detail-file-name').outerHTML = document.getElementById('detail-file-name').outerHTML;
          document.getElementById('detail-file-name').value = '';
          if (err) {
            return importOrder.showResult('detail', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '运单号'},
            {key: 'B1', value: '品名'},
            {key: 'C1', value: '数量'},
            {key: 'D1', value: '单位'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('detail', 'error', '请选择系统提供的模版填写货物明细数据');
            }

            var isVersion2 = excelReader.isHeaderNameExist(excelSheet, {key: 'I1', value: '单价', index: 8});
            var isVersion1 = excelReader.isHeaderNameExist(excelSheet, {key: 'E1', value: '单价', index: 4});
            if (!isVersion1 && !isVersion2) {
              return importOrder.showResult('detail', 'error', '请选择系统提供的模版填写货物明细数据');
            }

            importOrder.detail.isVersion2 = isVersion2;
            excelReader.getSheetData(excelSheet, (isVersion2 ? detailDataHeader2 : detailDataHeader1), function (err, sheetData) {
              if (err) {
                return importOrder.showResult('detail', 'error', err.message);
              }

              checkDetailExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('detail', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.detail.data = generateDetailInfo(sheetData);
                importOrder.showResult('detail', 'success', '成功读取' + importOrder.detail.rowCount + '条信息');
                importOrder.detail.matchOrder();
              });
            });

          });
        });
      };
      importOrder.detail.matchOrder = function () {
        var mainArray = importOrder.main.data;
        if (mainArray.length === 0) {
          return;
        }
        if (!this.rowCount) {
          return;
        }
        var details = this.data;
        var matchRow = {
          totalCount: 0,
          add: function(count) {
            this.totalCount += count;
          }
        };
        var matchOrderCount = 0;
        mainArray.forEach(function (orderItem) {
          if (details[orderItem.order_number] && details[orderItem.order_number].length > 0) {
            matchOrderCount++;
            if (!matchRow[orderItem.order_number]) {
              matchRow[orderItem.order_number] = details[orderItem.order_number].length;
              matchRow.add(details[orderItem.order_number].length);
            }
          }
        });

        if (this.rowCount) {
          importOrder.showResult('detail', 'success', importOrder.getMatchInfo(this.rowCount, matchRow.totalCount, matchOrderCount));
        }
      }

      function checkSalesmanExcelFormat(sheetData, callback) {
        if (!sheetData) {
          return callback();
        }
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];
          if (!rowData['运单号']) {
            return callback({row: rowIndex + 2, column: columnKeyValue[1], message: '运单号不能为空'});  //第一行是表头，所以+2
          }

          if (rowData['关注人手机号']) {
            if (!rowData['关注人手机号'].testPhone()) {
              return callback({row: rowIndex + 2, column: columnKeyValue[2], message: '数量必须为11位手机号'});
            }
          }
        }
        return callback();
      }
      function generateSalesmanInfo(sheetData) {
        if (!sheetData) {
          return {};
        }

        var salesmanObject = {};
        for (var rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          var rowData = sheetData[rowIndex];

          //没有关注人手机号，则直接跳过
          if (!rowData['关注人手机号']) {
            continue;
          }

          if (!salesmanObject[rowData['运单号']]) {
            salesmanObject[rowData['运单号']] = [];
          }
          salesmanObject[rowData['运单号']].push(rowData['关注人手机号']);
          importOrder.salesman.rowCount++;
        }
        return salesmanObject;
      }
      importOrder.salesman.handleFile = function (element) {
        importOrder.changeFile('salesman');
        importOrder.showResult('salesman', '', '正在校验Excel文件...');
        importOrder.salesman.data = [];
        importOrder.salesman.rowCount = 0;

        var excelReader = ExcelReaderService.getReader();
        excelReader.getWorkSheet(element, function (err, excelSheet) {
          document.getElementById('salesman-file-name').outerHTML = document.getElementById('salesman-file-name').outerHTML;
          document.getElementById('salesman-file-name').value = '';
          if (err) {
            return importOrder.showResult('salesman', 'error', err.message);
          }
          var templateHeaders = [
            {key: 'A1', value: '运单号'},
            {key: 'B1', value: '关注人手机号'}
          ];
          excelReader.checkHeader(excelSheet, templateHeaders, function (isOurTemplate) {
            if (!isOurTemplate) {
              return importOrder.showResult('salesman', 'error', '请选择系统提供的模版填写运单关注人数据');
            }

            var dataHeader = ['运单号', '关注人手机号'];
            excelReader.getSheetData(excelSheet, dataHeader, function (err, sheetData) {
              if (err) {
                return importOrder.showResult('salesman', 'error', err.message);
              }

              checkSalesmanExcelFormat(sheetData, function (err) {
                if (err) {
                  return importOrder.showResult('salesman', 'error', '第' + err.row + '行第' + err.column + '列' + err.message);
                }

                importOrder.salesman.data = generateSalesmanInfo(sheetData);
                importOrder.showResult('salesman', 'success', '成功读取' + importOrder.salesman.rowCount + '条信息');
                importOrder.salesman.matchOrder();
              });
            });

          });
        });
      };
      importOrder.salesman.matchOrder = function () {
        var mainArray = importOrder.main.data;

        if (mainArray.length === 0) {
          return;
        }
        if (!this.rowCount) {
          return;
        }
        var salesmen = this.data;
        var matchRow = {
          totalCount: 0,
          add: function(count) {
            this.totalCount += count;
          }
        };
        var matchOrderCount = 0;
        mainArray.forEach(function (orderItem) {
          if (salesmen[orderItem.order_number] && salesmen[orderItem.order_number].length > 0) {
            matchOrderCount++;
            if (!matchRow[orderItem.order_number]) {
              matchRow[orderItem.order_number] = salesmen[orderItem.order_number].length;
              matchRow.add(salesmen[orderItem.order_number].length);
            }
          }
        });

        if (this.rowCount) {
          importOrder.showResult('salesman', 'success', importOrder.getMatchInfo(this.rowCount, matchRow.totalCount, matchOrderCount));
        }
      }

      function stopUpload(message) {
        $scope.data.isUploading = false;
        if (message) {
          $scope.$emit(GlobalEvent.onShowAlert, message);
        }
      }
      $scope.uploadOrders = function () {
        if ($scope.data.isUploading)  //防重入
          return;
        else {
          $scope.data.isUploading = true;
        }

        if (!$scope.data.file.current_filename) {
          return stopUpload('请选择要上传的Excel文件');
        }

        if (importOrder.main.data.length === 0) {
          return stopUpload('没有任何运单信息，请检查文件数据!');
        }
        importOrder.main.combineOther();

        if (!$scope.data.currentGroup) {
          return stopUpload('请选择操作组');
        }

        OrderService.getRemainOrderCreateCount().then(function (data) {
          if (data.err) {
            return stopUpload('获取订单数量失败');
          }

          var formatOrders;
          if ($scope.data.isOrderMultiAssign) {
            formatOrders = formatOrderWithMultiAssignInfo(importOrder.main.data);
          }
          else {
            formatOrders = formatOrderWithAssignInfo(importOrder.main.data);
          }

          if (formatOrders.length > data.remain) {
            return stopUpload('今日还能上传' + data.remain + '张订单, 当前订单数量为' + formatOrders.length + '张');
          }

          setUserProfileToOrder(formatOrders);
          var sliceOrders = ExcelReaderService.splitArray(formatOrders, uploadBlockSize);
          var startTime = new Date();

          //$scope.$emit(GlobalEvent.onShowLoading, true);

          var progressLength = 0;
          $scope.progressBar.show(formatOrders.length);

          sliceOrders.zzEachSeries(function (sliceItem, eachCallback){
            OrderService.batchCreate(sliceItem, $scope.data.currentGroup._id)
              .then(function (data) {
                if (!data || data.err) {
                  return eachCallback(data.err);
                }
                progressLength += uploadBlockSize;
                $scope.progressBar.change(progressLength);

                $scope.data.result.totalCount += data.totalCount;
                $scope.data.result.successCount += data.successCount;
                $scope.data.result.invalidReceiverCount += data.invalidReceiverCount;
                $scope.data.result.invalidSenderCount += data.invalidSenderCount;
                $scope.data.result.successAssignCount += data.successAssignCount;

                return eachCallback();

              }, function (err) {
                return eachCallback(err);
              });

          }, function (err) {
           // $scope.$emit(GlobalEvent.onShowLoading, false);
            $scope.progressBar.hide();

            if (err) {
              console.log(err);
              return stopUpload('上传订单遇到错误');
            }

            if ($scope.data.result.totalCount !== formatOrders.length) {
              console.log('total count: ', formatOrders.length, 'actual upload count: ', $scope.data.result.totalCount);
              return stopUpload('上传订单遇到错误');
            }

            console.log('-------------batch create time-------------', new Date().getTime() - startTime.getTime());

            var failedCreateCount = $scope.data.result.totalCount - $scope.data.result.successCount;
            var successAssignCount = $scope.data.result.successAssignCount;
            var senderText = ($scope.data.result.invalidSenderCount > 0 ? $scope.data.result.invalidSenderCount + '单的发货方' : '');
            var receiverText = ($scope.data.result.invalidReceiverCount > 0 ? $scope.data.result.invalidReceiverCount + '单的收货方' : '');
            var senderReceiverText = (senderText ? (senderText + '/' + receiverText) : receiverText);

            var info = {
              content_one: (($scope.data.result.successCount > 0 ? '成功上传' + $scope.data.result.successCount + '单' : '') + (failedCreateCount > 0 ? '，失败' + failedCreateCount + '单' : '')),
              content_two: ('成功自动分配' + successAssignCount + '段'),
              content_three: (senderReceiverText ? (senderReceiverText + '未注册柱柱签收') : '')
            };

            $scope.$emit(GlobalEvent.onShowAlertConfirmStyle, info, goOrderAssign, null, {
              'sureLabel': '去分配',
              'cancelLabel': '继续上传'
            });

            stopUpload();
            $state.go('order_batch_create', {}, {reload: true});
          });

        }, function (err) {
          stopUpload('获取订单数量失败');
        });
      };

    }]);
angular.module('zhuzhuqs').controller('OrderConfigurationController',
  ['$scope', '$stateParams', '$timeout', 'config', 'CompanyService', 'BMapService', 'ExcelReaderService', 'CompanyError', 'GlobalEvent',
    function ($scope, $stateParams, $timeout, config, CompanyService, BMapService, ExcelReaderService, CompanyError, GlobalEvent) {
      var _configuration;

      $scope.partnersInfo = {
        address: [],
        curSelect: 'orderConfig'
      };
      $scope.partnersInfo.showDetailPanel = function (panel) {
        panel = panel || 'orderConfig';
        if ($scope.partnersInfo.curSelect !== panel) {
          $scope.partnersInfo.curSelect = panel;
          $scope.rightHeader.update(panel);
        }
      };

      $scope.rightHeader = {
        all: [
          {
            name: '推送配置',
            en: 'pushConfig'
          },
          {
            name: '运单配置',
            en: 'orderConfig'
          }
        ],
        current: {},
        update: function (type) {
          var that = this;
          for (var i = 0; i < this.all.length; i++) {
            if (this.all[i].en === type) {
              this.current = this.all[i];
              break;
            }
          }
        }
      };
      $scope.rightHeader.update($scope.partnersInfo.curSelect);

      var orderConfig = {
        options: [
          {
            title: '提货操作',
            entrance: {
              isOpen: false,
              title: '强制进场',
              description: '司机在提货前必须执行进场操作'
            },
            entrance_photo: {
              isOpen: false,
              title: '强制进场拍照',
              description: '司机在进场时必须拍摄照片，您可以自定义进场拍照的步骤',
              isPlate: false
            },
            entrance_photo_array: [],
            take_photo: {
              isOpen: false,
              title: '强制提货拍照',
              description: '司机在提货时必须拍摄照片，您可以自定义提货拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            take_photo_array: [],
            confirm_detail: {
              isOpen: false,
              title: '强制货物明细确认',
              description: '司机在提货时，必须进行货物明细确认'
            }
          },
          {
            title: '交货操作',
            entrance: {
              isOpen: false,
              title: '强制进场',
              description: '司机在交货前必须执行进场操作'
            },
            entrance_photo: {
              isOpen: false,
              title: '强制进场拍照',
              description: '司机在进场时必须拍摄照片，您可以自定义进场拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            entrance_photo_array: [],
            take_photo: {
              isOpen: false,
              title: '强制交货拍照',
              description: '司机在交货时必须拍摄照片，您可以自定义交货拍照的步骤',
              isPlate: false //是否拍摄车牌
            },
            take_photo_array: [],
            confirm_detail: {
              isOpen: false,
              title: '强制货物明细确认',
              description: '司机在交货时，必须进行货物明细确认并上报'
            }
          },
          {
            title: '推送操作',
            abnormal_push: {
              isOpen: false
            },
            create_push: {
              isOpen: false
            },
            delivery_sign_push: {
              isOpen: false
            },
            pickup_push: {
              isOpen: false
            },
            delivery_push: {
              isOpen: false
            },
            pickup_deferred_duration_switch : false,
            delivery_early_duration_switch : false,
            pickup_deferred_duration: 0, //提货滞留报警时长
            delivery_early_duration: 0,  //交货提前通知时长
            load: function (option) {
              if (!option) {
                return;
              }
              this.abnormal_push.isOpen = (option.abnormal_push === false ? false : true);

              this.create_push.isOpen = (option.create_push === true ? true : false);
              this.delivery_sign_push.isOpen = (option.delivery_sign_push === true ? true : false);

              this.pickup_push.isOpen = option.pickup_push === true ? true : false;
              this.delivery_push.isOpen = option.delivery_push ? true : false;
              this.pickup_deferred_duration_switch = option.pickup_deferred_duration ? true : false;
              this.delivery_early_duration_switch = option.delivery_early_duration ? true : false;
              this.pickup_deferred_duration = (option.pickup_deferred_duration || 12).toString();
              this.delivery_early_duration = (option.delivery_early_duration || 12).toString();
            },
            check: function () {
              var result = {
                success: true,
                message: ''
              };
              // if (!this.pickup_deferred_duration || !parseInt(this.pickup_deferred_duration)) {
              //   result.success = false;
              //   result.message = '请设置提货滞留报警时间';
              //   return result;
              // }
              //
              // if (!this.delivery_early_duration || !parseInt(this.delivery_early_duration)) {
              //   result.success = false;
              //   result.message = '请设置到货推送提前时间';
              //   return result;
              // }
              return result;
            },
            getData: function () {
              var config = {};
              config.abnormal_push = this.abnormal_push.isOpen;

              config.create_push = this.create_push.isOpen;
              config.delivery_sign_push = this.delivery_sign_push.isOpen;

              config.pickup_push = this.pickup_push.isOpen;
              config.delivery_push = this.delivery_push.isOpen;

              if(this.pickup_deferred_duration_switch){
                config.pickup_deferred_duration = this.pickup_deferred_duration;
              }else{
                config.pickup_deferred_duration = 0;
              }
              if(this.delivery_early_duration_switch){
                config.delivery_early_duration = this.delivery_early_duration;
              }else{
                config.delivery_early_duration = 0;
              }

              return config;
            }
          }
        ],
        submitOrderConfig: function () {
        },
        submitPushConfig: function () {
        }

      };
      $scope.orderConfig = orderConfig;

      orderConfig.submitOrderConfig = function () {
        var pickupConfig = orderConfig.options[0].getData();
        var deliveryConfig = orderConfig.options[1].getData();

        if (pickupConfig.err) {
          return $scope.$emit(GlobalEvent.onShowAlert, pickupConfig.err);
        }
        if (deliveryConfig.err) {
          return $scope.$emit(GlobalEvent.onShowAlert, deliveryConfig.err);
        }

        if (!pickupConfig.isModify && !deliveryConfig.isModify) {
          return $scope.$emit(GlobalEvent.onShowAlert, '没有任何更改');
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.updateOrderConfiguration({
          pickup_option: pickupConfig.config,
          delivery_option: deliveryConfig.config
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          console.log(data);
          if (!data || data.err) {
            return console.log('update company order configuration failed');
          }
          initConfiguration(data);

          return $scope.$emit(GlobalEvent.onShowAlert, '保存成功');

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      };

      orderConfig.submitPushConfig = function () {
        var pushConfig = this.options[2];
        var checkResult = pushConfig.check();
        if (!checkResult.success) {
          return $scope.$emit(GlobalEvent.onShowAlert, checkResult.message);
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.updatePushConfiguration({
          push_option: pushConfig.getData()
        }).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          console.log(data);
          if (!data || data.err) {
            return console.log('update company push configuration failed');
          }
          initConfiguration(data);

          return $scope.$emit(GlobalEvent.onShowAlert, '保存成功');

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      };

      function initConfiguration(data) {
        _configuration = data;
        if (!data) {
          data = {};
        }
        orderConfig.options[0].load(data.pickup_option || {});
        orderConfig.options[1].load(data.delivery_option || {});
        orderConfig.options[2].load(data.push_option || {});

      }

      function getCompanyConfiguration() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getConfiguration().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          initConfiguration(data);
        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(err);
        });
      }

      getCompanyConfiguration();
    }]);
angular.module('zhuzhuqs').controller('OrderCreateController',
  ['$scope', '$stateParams', '$state', '$timeout', 'CompanyService', 'OrderService', 'SalesmanService', 'OrderError', 'GroupError', 'GlobalEvent', 'UserProfileService',
    function ($scope, $stateParams, $state, $timeout, CompanyService, OrderService, SalesmanService, OrderError, GroupError, GlobalEvent, UserProfileService) {
      console.log($state);
      console.log($stateParams);
      $scope.orderInfo = {};
      $scope.order = {
        submit_name: ''
      };

      $scope.executeGroups = [];
      $scope.newInfo = {
        showWarnning: false,
        currentGroup: {}
      };

      $scope.pageShow = {
        pickUpTimeRange: '',
        deliveryTimeRange: '',
        pickUpMinTime: moment().format('YY/MM/DD HH:mm'),
        deliveryMinTime: moment().format('YY/MM/DD HH:mm'),
        count_unit: ['箱', '托', '桶', '包', '个', '瓶', '只', 'TK', '其他'],
        weight_unit: ['吨', '公斤'],
        volume_unit: ['立方', '升', '尺', '20尺', '40尺'],
        dateOptions: {
          locale: {
            fromLabel: "起始时间",
            toLabel: "结束时间",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: " ~ ",
          singleDatePicker: true,
          autoApply: true,
          format: 'YY/MM/DD HH:mm'
        }
      };

      //发货方信息
      $scope.senderInfo = {
        enableEdit: true,
        defaultContent: '搜索发货方',
        currentText: '',
        currentChoice: '',
        options: [],
        onSelected: selectSender
      };

      //收货方信息
      $scope.receiverInfo = {
        enableEdit: true,
        defaultContent: '搜索收货方',
        currentText: '',
        currentChoice: '',
        options: [],
        onSelected: selectReceiver
      };

      $scope.pushConfig = {
        order_transport_type: 'ltl',
        abnormal_push: {
          isOpen: false
        },
        pickup_push: {
          isOpen: false
        },
        create_push: {
          isOpen: false
        },
        delivery_sign_push: {
          isOpen: false
        },
        delivery_push: {
          isOpen: false
        }
      };

      var isModify = $stateParams.order !== "";
      var modifyType = $stateParams.modify_type || 'normal';
      console.log('stateParams.order:==========');
      console.log($stateParams.order);
      if (isModify) {
        $scope.order.submit_name = '修改这张订单';
        try {
          var updateOrderInfo = JSON.parse($stateParams.order);
          console.log(updateOrderInfo);
          console.log('orderInfo:==========');
          InitUpdateViewData(updateOrderInfo);
        }
        catch (e) {
          $scope.$emit(GlobalEvent.onShowAlert, '修改参数解析错误！');
        }
      }
      else {
        $scope.order.submit_name = '创建这张订单';
        InitCreateViewData();
      }

      function InitUpdateViewData(updateOrderInfo) {
        $scope.orderInfo = {
          order_id: updateOrderInfo.order_id,
          //order detail
          order_number: updateOrderInfo.order_number,
          refer_order_number: updateOrderInfo.refer_order_number,
          original_order_number: updateOrderInfo.original_order_number,
          goods_name: updateOrderInfo.goods_name,
          count: updateOrderInfo.count || '',
          weight: updateOrderInfo.weight || '',
          volume: updateOrderInfo.volume || '',
          count_unit: updateOrderInfo.count_unit,
          weight_unit: updateOrderInfo.weight_unit,
          volume_unit: updateOrderInfo.volume_unit,
          freight_charge: updateOrderInfo.freight_charge || '',
          sender_name: updateOrderInfo.sender_name,
          sender_company_id: '',
          receiver_name: updateOrderInfo.receiver_name,
          receiver_company_id: '',
          salesmen: [],
          goods: [],

          //order
          customer_name: updateOrderInfo.customer_name,
          pickup_start_time: updateOrderInfo.pickup_start_time,
          delivery_start_time: updateOrderInfo.delivery_start_time,
          pickup_end_time: updateOrderInfo.pickup_end_time,
          delivery_end_time: updateOrderInfo.delivery_end_time,
          description: updateOrderInfo.description,
          group_id: updateOrderInfo.group_id,
          pickup_entrance_force: updateOrderInfo.pickup_entrance_force,
          pickup_photo_force: updateOrderInfo.pickup_photo_force,
          delivery_entrance_force: updateOrderInfo.delivery_entrance_force,
          delivery_photo_force: updateOrderInfo.delivery_photo_force,
          pickup_deferred_duration: updateOrderInfo.pickup_deferred_duration,
          delivery_early_duration: updateOrderInfo.delivery_early_duration,

          //contacts
          pickup_contact_name: updateOrderInfo.pickup_contact_name,
          pickup_contact_phone: updateOrderInfo.pickup_contact_phone || '',
          pickup_contact_mobile_phone: updateOrderInfo.pickup_contact_mobile_phone || '',
          pickup_contact_address: updateOrderInfo.pickup_contact_address,
          pickup_contact_email: '',

          delivery_contact_name: updateOrderInfo.delivery_contact_name,
          delivery_contact_phone: updateOrderInfo.delivery_contact_phone || '',
          delivery_contact_mobile_phone: updateOrderInfo.delivery_contact_mobile_phone || '',
          delivery_contact_address: updateOrderInfo.delivery_contact_address,
          delivery_contact_email: ''
        };

        if (updateOrderInfo.goods) {
          $scope.orderInfo.goods = updateOrderInfo.goods;
        }
        if (updateOrderInfo.salesmen) {
          //TODO 设置salesmanInfo
          $scope.orderInfo.salesmen = updateOrderInfo.salesmen;
        }
        if (updateOrderInfo.receiver_company) {
          if (updateOrderInfo.receiver_company.company_id) {
            $scope.orderInfo.receiver_company_id = updateOrderInfo.receiver_company.company_id;
          }
          if (updateOrderInfo.receiver_company.company_name) {
            $scope.receiverInfo.currentChoice = {};
            $scope.receiverInfo.currentChoice.key = updateOrderInfo.receiver_company.company_id;
            $scope.receiverInfo.currentChoice.value = updateOrderInfo.receiver_company.company_name;
            $scope.receiverInfo.currentText = updateOrderInfo.receiver_company.company_name;
          }
        }
        if (!$scope.receiverInfo.currentText && updateOrderInfo.receiver_name) {
          $scope.receiverInfo.currentText = updateOrderInfo.receiver_name; //兼容旧数据
        }

        if (updateOrderInfo.sender_company) {
          if (updateOrderInfo.sender_company.company_id) {
            $scope.orderInfo.sender_company_id = updateOrderInfo.sender_company.company_id;
          }
          if (updateOrderInfo.sender_company.company_name) {
            $scope.senderInfo.currentChoice = {};
            $scope.senderInfo.currentChoice.key = updateOrderInfo.sender_company.company_id;
            $scope.senderInfo.currentChoice.value = updateOrderInfo.sender_company.company_name;
            $scope.senderInfo.currentText = updateOrderInfo.sender_company.company_name;
          }
        }
        if (!$scope.senderInfo.currentText && updateOrderInfo.sender_name) {
          $scope.senderInfo.currentText = updateOrderInfo.sender_name; //兼容旧数据
        }

        if (!updateOrderInfo.pickup_start_time && !updateOrderInfo.pickup_end_time) {
          $scope.pageShow.pickUpTimeRange = '';
        }
        else {
          $scope.pageShow.pickUpTimeRange = {
            startDate: updateOrderInfo.pickup_start_time ? updateOrderInfo.pickup_start_time : null,
            endDate: updateOrderInfo.pickup_end_time ? updateOrderInfo.pickup_end_time : null
          };
        }

        if (!updateOrderInfo.delivery_start_time && !updateOrderInfo.delivery_end_time) {
          $scope.pageShow.deliveryTimeRange = '';
        }
        else {
          $scope.pageShow.deliveryTimeRange = {
            startDate: updateOrderInfo.delivery_start_time ? updateOrderInfo.delivery_start_time : null,
            endDate: updateOrderInfo.delivery_end_time ? updateOrderInfo.delivery_end_time : null
          };
        }


        $scope.pushConfig.order_transport_type = updateOrderInfo.order_transport_type;

        $scope.pushConfig.abnormal_push.isOpen = updateOrderInfo.abnormal_push;
        $scope.pushConfig.pickup_push.isOpen = updateOrderInfo.pickup_push;

        $scope.pushConfig.create_push.isOpen = updateOrderInfo.create_push;
        $scope.pushConfig.delivery_sign_push.isOpen = updateOrderInfo.delivery_sign_push;
        $scope.pushConfig.delivery_push.isOpen = updateOrderInfo.delivery_push;

      };

      function InitCreateViewData() {
        $scope.order.submit_name = '创建这张订单';
        $scope.orderInfo = {
          //order detail
          order_number: '',
          refer_order_number: '',
          original_order_number: '',
          goods_name: '',
          count: '',
          weight: '',
          volume: '',
          count_unit: '箱',
          weight_unit: '吨',
          volume_unit: '立方',
          freight_charge: '',
          salesmen: [],
          goods: [],

          //order
          customer_name: '',
          pickup_start_time: '',
          delivery_start_time: '',
          pickup_end_time: '',
          delivery_end_time: '',
          description: '',
          group_id: '',
          sender_name: '',
          sender_company_id: '',
          receiver_name: '',
          receiver_company_id: '',
          pickup_entrance_force: false,
          pickup_photo_force: false,
          delivery_entrance_force: false,
          delivery_photo_force: true,
          pickup_deferred_duration: 0,
          delivery_early_duration: 0,

          //contacts
          pickup_contact_name: '',
          pickup_contact_phone: '',
          pickup_contact_mobile_phone: '',
          pickup_contact_address: '',
          pickup_contact_email: '',

          delivery_contact_name: '',
          delivery_contact_phone: '',
          delivery_contact_mobile_phone: '',
          delivery_contact_address: '',
          delivery_contact_email: ''
        };
      };

      $scope.clickPage = function () {
        $scope.customerInfo.showPanel = false;
        $scope.pickupContactInfo.showPanel = false;
        $scope.deliveryContactInfo.showPanel = false;
      };

      $scope.clickCustomer = function (name) {
        $scope.orderInfo.customer_name = name;
      };

      $scope.customerInfo = {
        customers: [],
        isGetting: false,
        showPanel: false
      };

      $scope.getCustomersByKeyword = function () {
        if ($scope.customerInfo.isGetting)
          return;
        $scope.customerInfo.isGetting = true;
        $scope.customerInfo.showPanel = true;
        $timeout(function () {
          CompanyService.getCompanyCustomersByFilter({customer_name: $scope.orderInfo.customer_name}).then(function (data) {
            console.log(data);
            $scope.customerInfo.customers = data;
            $scope.customerInfo.isGetting = false;
          }, function (err) {
            console.log(err);
            $scope.customerInfo.customers = [];
            $scope.customerInfo.isGetting = false;
          });
        }, 500);
      };

      $scope.pickupContactInfo = {
        contacts: [],
        isGetting: false,
        showPanel: false
      };

      $scope.deliveryContactInfo = {
        contacts: [],
        isGetting: false,
        showPanel: false
      };

      $scope.clickContactItem = function (contact, isPickup) {
        if (isPickup) {
          //$scope.orderInfo.pickup_contact_name = contact.name;
          //$scope.orderInfo.pickup_contact_phone = contact.phone || '';
          //$scope.orderInfo.pickup_contact_mobile_phone = contact.mobile_phone || '';
          $scope.orderInfo.pickup_contact_address = contact.brief || contact.detail;
          //$scope.orderInfo.pickup_contact_email = contact.email;
        }
        else {
          //$scope.orderInfo.delivery_contact_name = contact.name;
          //$scope.orderInfo.delivery_contact_phone = contact.phone || '';
          //$scope.orderInfo.delivery_contact_mobile_phone = contact.mobile_phone || '';
          $scope.orderInfo.delivery_contact_address = contact.brief || contact.detail;
          //$scope.orderInfo.delivery_contact_email = contact.email;
        }
      };

      $scope.getContractsByKeyword = function (isPickup) {
        if ($scope.pickupContactInfo.isGetting || $scope.deliveryContactInfo.isGetting)
          return;
        var address;
        if (isPickup) {
          if (!$scope.orderInfo.pickup_contact_address) {
            $scope.pickupContactInfo.contacts = [];
            return;
          }
          $scope.pickupContactInfo.isGetting = true;
          $scope.pickupContactInfo.showPanel = true;
          address = {address: $scope.orderInfo.pickup_contact_address};
        }
        else {
          if (!$scope.orderInfo.delivery_contact_address) {
            $scope.pickupContactInfo.contacts = [];
            return;
          }
          $scope.deliveryContactInfo.isGetting = true;
          $scope.deliveryContactInfo.showPanel = true;
          address = {address: $scope.orderInfo.delivery_contact_address};
        }

        $timeout(function () {

          if (isPickup && $scope.senderInfo.currentText) {
            OrderService.getSenderPickupAddressList($scope.senderInfo.currentText, address.address).then(function (data) {
              if (data.err) {
                console.log(data.err);
                $scope.pickupContactInfo.contacts = [];
              }
              else {
                data = data.map(function (item) {
                  return {
                    detail: item
                  };
                });
                $scope.pickupContactInfo.contacts = data;
              }
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;

            }, function (err) {
              console.log(err);
              $scope.pickupContactInfo.contacts = [];
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            });
          }
          else {
            CompanyService.getContactsByFilter(address).then(function (data) {
              console.log(data);
              $scope.pickupContactInfo.contacts = data;
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            }, function (err) {
              console.log(err);
              $scope.pickupContactInfo.contacts = [];
              $scope.pickupContactInfo.isGetting = false;
              $scope.deliveryContactInfo.isGetting = false;
            });
          }

        }, 1000);
      };

      $scope.clickGroup = function (executeGroup) {
        $scope.newInfo.currentGroup = executeGroup;
      };

      $scope.submitOrder = function (form) {
        var valid = form.$valid;
        if(!$scope.validates){
          $scope.validates = {};
        }
        if (!$scope.orderInfo.receiver_name && !$scope.receiverInfo.currentText) {
          valid = false;
          // $scope.validates['receiverInfo.currentText'] = {required : true};
        }
        if (!$scope.orderInfo.sender_name && !$scope.senderInfo.currentText) {
          valid = false;
          // $scope.validates['senderInfo.currentText'] = {required : true};
        }
        if(!$scope.pageShow.pickUpTimeRange){
          valid = false;
          $scope.new_order['pageShow.pickUpTimeRange'].$setValidity('required', false);
        }
        if(!$scope.pageShow.deliveryTimeRange){
          valid = false;
          $scope.new_order['pageShow.deliveryTimeRange'].$setValidity('required', false);
        }

        if(!valid){
          $scope.submitted = true;
          return;
        }

        if (!$scope.orderInfo.receiver_name && $scope.receiverInfo.currentText) {
          $scope.orderInfo.receiver_name = $scope.receiverInfo.currentText;
        }
        if (!$scope.orderInfo.sender_name && $scope.senderInfo.currentText) {
          $scope.orderInfo.sender_name = $scope.senderInfo.currentText;
        }

        $scope.orderInfo.salesmen = [];
        if (getObjectLength($scope.salesInfo.hasSelected) > 0) {
          for (var saleKey in $scope.salesInfo.hasSelected) {
            for(var i=0, len=$scope.salesInfo.options.length; i<len; i++){
              if($scope.salesInfo.hasSelected[saleKey] === $scope.salesInfo.options[i].value){
                $scope.orderInfo.salesmen.push($scope.salesInfo.options[i].username);
                break;
              }
            }
          }
        }

        $scope.orderInfo.goods = $scope.goodsInfo.getValidGoods();
        $scope.orderInfo.goods_name = $scope.orderInfo.goods[0].name;
        $scope.orderInfo.count = $scope.orderInfo.goods[0].count;
        $scope.orderInfo.count_unit = $scope.orderInfo.goods[0].unit;
        $scope.orderInfo.volume = '';
        $scope.orderInfo.volume_unit = '立方';
        $scope.orderInfo.weight = '';
        $scope.orderInfo.weight_unit = '吨';

        if ($scope.orderInfo.pickup_contact_address
          && $scope.orderInfo.delivery_contact_address
          && ($scope.orderInfo.pickup_contact_address === $scope.orderInfo.delivery_contact_address)) {
          $scope.$emit(GlobalEvent.onShowAlert, '提货地址和交货地址不能相同！');
          return;
        }

        if ($scope.orderInfo.delivery_contact_mobile_phone) {
          if ($scope.orderInfo.delivery_contact_mobile_phone.length != 11) {
            $scope.$emit(GlobalEvent.onShowAlert, '交货手机号码必须11位！');
            return;
          }
        }
        if ($scope.orderInfo.pickup_contact_mobile_phone) {
          if ($scope.orderInfo.pickup_contact_mobile_phone.length != 11) {
            $scope.$emit(GlobalEvent.onShowAlert, '提货手机号码必须11位！');
            return;
          }
        }
        if ($scope.pageShow.pickUpTimeRange.startDate) {
          $scope.orderInfo.pickup_start_time = moment($scope.pageShow.pickUpTimeRange.startDate).toISOString();
        }
        if ($scope.pageShow.pickUpTimeRange.endDate) {
          $scope.orderInfo.pickup_end_time = moment($scope.pageShow.pickUpTimeRange.endDate).toISOString();
        }
        if ($scope.pageShow.deliveryTimeRange.startDate) {
          $scope.orderInfo.delivery_start_time = moment($scope.pageShow.deliveryTimeRange.startDate).toISOString();
        }
        if ($scope.pageShow.deliveryTimeRange.endDate) {
          $scope.orderInfo.delivery_end_time = moment($scope.pageShow.deliveryTimeRange.endDate).toISOString();
        }

        $scope.orderInfo.order_transport_type = $scope.pushConfig.order_transport_type;
        $scope.orderInfo.abnormal_push = $scope.pushConfig.abnormal_push.isOpen;
        $scope.orderInfo.pickup_push = $scope.pushConfig.pickup_push.isOpen;

        $scope.orderInfo.create_push = $scope.pushConfig.create_push.isOpen;
        $scope.orderInfo.delivery_sign_push = $scope.pushConfig.delivery_sign_push.isOpen;
        $scope.orderInfo.delivery_push = $scope.pushConfig.delivery_push.isOpen;

        createOrder();
      };

      function createOrder() {
        $scope.$emit(GlobalEvent.onShowLoading, true);

        if (isModify) {
          if (modifyType === 'normal') {
            OrderService.updateUnAssignedOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                handleCreateOrderError(data.err.type);
                return;
              }
              else {
                $scope.$emit(GlobalEvent.onShowAlert, "订单修改成功");
                $state.go('order_assign');
              }
            }, function (err) {

            });
          } else {
            OrderService.updateAssignedOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
              $scope.$emit(GlobalEvent.onShowLoading, false);
              console.log(data);
              if (data.err) {
                handleCreateOrderError(data.err.type);
                return;
              }
              else {
                $scope.$emit(GlobalEvent.onShowAlert, "订单修改成功");
                $state.go('order_follow');
              }
            }, function (err) {

            });
          }

        } else {
          OrderService.createOrder($scope.orderInfo, $scope.newInfo.currentGroup._id).then(function (data) {
            $scope.$emit(GlobalEvent.onShowLoading, false);
            console.log(data);
            if (data.err) {
              handleCreateOrderError(data.err.type);
              return;
            }
            else {
              $state.go('order_create', {}, {reload: true});
              $scope.$emit(GlobalEvent.onShowAlertConfirm, "订单创建成功", goOrderAssign, null, {
                'sureLabel': '去分配',
                'cancelLabel': '继续创建'
              });
            }
          }, function (err) {

          });
        }


      }

      function goOrderAssign() {
        $state.go('order_assign');
      }

      function getGroupList(callback) {
        CompanyService.getExecuteGroupList().then(function (data) {
          console.log(data);
          if (data.err) {
            handleGetGroupListError(data.err.type);
          }
          else {
            $scope.executeGroups = data;
            if ($scope.executeGroups.length > 0) {
              if (isModify) {
                for (var i = 0; i < $scope.executeGroups.length; i++) {
                  if ($scope.executeGroups[i]._id === updateOrderInfo.group_id) {
                    $scope.clickGroup($scope.executeGroups[i]);
                    break;
                  }
                }
              } else {
                $scope.clickGroup($scope.executeGroups[0]);
              }
            }
          }

          return callback();

        }, function (err) {
          console.log('getGroupList error:' + err);
          return callback();
        });
      }

      getGroupList(getUserProfile);

      function getUserProfile() {
        UserProfileService.getUserProfile().then(function (data) {
          console.log(data);

          if (data.err) {
            return handleCreateOrderError(data.err.type);
          }

          if (data.user_profile) {
            $scope.orderInfo.pickup_entrance_force = data.user_profile.pickup_entrance_force;
            $scope.orderInfo.pickup_photo_force = data.user_profile.pickup_photo_force;
            $scope.orderInfo.delivery_entrance_force = data.user_profile.delivery_entrance_force;
            $scope.orderInfo.delivery_photo_force = data.user_profile.delivery_photo_force;

            //记忆选中的组
            if (data.user_profile.order_execute_group && !isModify && $scope.executeGroups.length > 0) {
              for (var i = 0; i < $scope.executeGroups.length; i++) {
                if ($scope.executeGroups[i]._id.toString() === data.user_profile.order_execute_group) {
                  $scope.clickGroup($scope.executeGroups[i]);
                  break;
                }
              }
            }
          }
          else {
            $scope.orderInfo.pickup_entrance_force = false;
            $scope.orderInfo.pickup_photo_force = false;
            $scope.orderInfo.delivery_entrance_force = false;
            $scope.orderInfo.delivery_photo_force = true;
          }

        }, function (err) {
          console.log(err);
        });

        CompanyService.getConfiguration().then(function (data) {
          console.log(data);
          if (data && data.err) {
            return console.log('get company configuration error');
          }

          if (!isModify && data && data.push_option) {
            $scope.pushConfig.abnormal_push.isOpen = data.push_option.abnormal_push;
            $scope.pushConfig.pickup_push.isOpen = data.push_option.pickup_push;

            $scope.pushConfig.create_push.isOpen = data.push_option.create_push;
            $scope.pushConfig.delivery_sign_push.isOpen = data.push_option.delivery_sign_push;
            $scope.pushConfig.delivery_push.isOpen = data.push_option.delivery_push;

            $scope.orderInfo.pickup_deferred_duration = data.push_option.pickup_deferred_duration;
            $scope.orderInfo.delivery_early_duration = data.push_option.delivery_early_duration;
          }

        }, function (err) {
          console.log(err);
        });

      }

      function goCompanyConfiguration() {
        $state.go('order_configuration');
      }

      $scope.pickupEntranceHandle = function () {
        goCompanyConfiguration();
      };
      $scope.pickupPhotoHandle = function () {
        //$scope.orderInfo.pickup_photo_force = !$scope.orderInfo.pickup_photo_force;
        goCompanyConfiguration();
      };
      $scope.deliveryEntranceHandle = function () {
        //$scope.orderInfo.delivery_entrance_force = !$scope.orderInfo.delivery_entrance_force;
        goCompanyConfiguration();
      };
      $scope.deliveryPhotoHandle = function () {
        //$scope.orderInfo.delivery_photo_force = !$scope.orderInfo.delivery_photo_force;
        goCompanyConfiguration();
      };

      function handleCreateOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      function handleGetGroupListError(errType) {
        if (GroupError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, GroupError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
        }
      }

      $scope.goodsInfo = {
        goods: [],
        unitOptions: [
          {
            name: '件数',
            value: ['箱', '托', '桶', '包', '个', '瓶', '只', 'TK', '其他']
          },
          {
            name: '重量',
            value: ['吨', '公斤']
          },
          {
            name: '体积',
            value: ['立方', '升', '尺', '20尺', '40尺']
          }],
        itemTemplate: {
          name: '',
          count: 1,
          unit: '箱',
          count2: '',
          unit2: '吨',
          count3: '',
          unit3: '立方',
          price: '',
          canDelete: true,
          isShowOption: false,
          isShowOption2: false,
          isShowOption3: false,
          increaseCount1: function () {
            this.count = this.increase(this.count);
          },
          decreaseCount1: function () {
            this.count = this.decrease(this.count);
          },
          increaseCount2: function () {
            this.count2 = this.increase(this.count2);
          },
          decreaseCount2: function () {
            this.count2 = this.decrease(this.count2);
          },
          increaseCount3: function () {
            this.count3 = this.increase(this.count3);
          },
          decreaseCount3: function () {
            this.count3 = this.decrease(this.count3);
          },
          increase: function (data) {
            data = parseFloat(data) || 0;
            data++;
            return data;
          },
          decrease: function (data) {
            data = parseFloat(data) || 0;
            data--;
            if (data < 0) {
              data = 0;
            }
            return data;
          },
          changeText: function () {
            $scope.goodsInfo.updateAddStatus();
          },
          clickUnit: function (showOption, event) {
            $scope.goodsInfo.goods.forEach(function (item) {
              item.isShowOption = false;
              item.isShowOption2 = false;
              item.isShowOption3 = false;
            });

            this[showOption] = true;
            stopBubble(event);
          },
          clickUnit1: function (event) {
            this.clickUnit('isShowOption', event);
          },
          clickUnit2: function (event) {
            this.clickUnit('isShowOption2', event);
          },
          clickUnit3: function (event) {
            this.clickUnit('isShowOption3', event);
          }
        },
        canAdd: false,
        init: function () {
          this.goods = [];
          this.canAdd = false;
        },
        updateAddStatus: function () {
          this.canAdd = this.goods.filter(function (item) {
              return !item.name;
            }).length === 0;
        },
        addGoodsItem: function (item) {
          item = item || deepCopy(this.itemTemplate);
          this.goods.push(item);
        },
        addPageGoodsItem: function () {
          if (this.canAdd) {
            this.addGoodsItem();
            this.updateAddStatus();
          }
        },
        removeGoodsItem: function (index) {
          this.goods.splice(index, 1);
          this.updateAddStatus();
        },
        getValidGoods: function () {
          var validGoods = this.goods.filter(function (item) {
            return (item.name && item.name.length > 0);
          });
          if (validGoods.length === 0) {
            validGoods.push({
              name: '',
              count: '',
              unit: '箱',
              count2: '',
              unit2: '吨',
              count3: '',
              unit3: '立方',
              price: ''
            });
          }
          else {
            validGoods = validGoods.map(function (item) {
              return {
                name: item.name,
                count: item.count,
                unit: item.unit,
                count2: item.count2 || '',
                unit2: item.unit2 || '吨',
                count3: item.count3 || '',
                unit3: item.unit3 || '立方',
                price: item.price || ''
              };
            });
          }
          return validGoods;
        }
      };

      //sender包含key,value。key为company_id， value为company_name
      function selectSender(sender) {
        if (!sender) {
          $scope.orderInfo.sender_company_id = '';
          $scope.orderInfo.sender_name = '';
        }
        else {
          $scope.orderInfo.sender_company_id = sender.key;
          $scope.orderInfo.sender_name = sender.value;
        }
      }

      //receiver包含key,value。key为company_id， value为company_name
      function selectReceiver(receiver) {
        if (!receiver) {
          $scope.orderInfo.receiver_company_id = '';
          $scope.orderInfo.receiver_name = '';
        }
        else {
          $scope.orderInfo.receiver_company_id = receiver.key;
          $scope.orderInfo.receiver_name = receiver.value;
        }
      }

      function ableOldSelectSalesman(selectInfo) {
        if (selectInfo.key) {
          if ($scope.salesInfo.hasSelected[selectInfo.key]) {
            delete $scope.salesInfo.hasSelected[selectInfo.key];
          }
          $scope.salesInfo.unableOption(selectInfo.key, false);
          $scope.salesInfo.updateAddStatus();

          delete selectInfo.key;
        }
      }

      function selectSalesman(option, selectInfo) {
        selectInfo = selectInfo || this;
        //选中了
        if (selectInfo.currentChoice) {

          ableOldSelectSalesman(selectInfo);

          //为了手动删除选项的时候使用
          selectInfo.key = selectInfo.currentChoice.key;

          //记录下选中的值
          $scope.salesInfo.hasSelected[selectInfo.currentChoice.key] = selectInfo.currentChoice.value;

          //选中后其他人不能继续选择
          $scope.salesInfo.unableOption(selectInfo.currentChoice.key, true);

          //计算此时是否可以添加
          $scope.salesInfo.updateAddStatus();
        }
        else {
          ableOldSelectSalesman(selectInfo);
          //手动添加的未知关注人
          if (selectInfo.currentText && selectInfo.currentText.testPhone()) {
            selectInfo.key = selectInfo.currentText;
            $scope.salesInfo.hasSelected[selectInfo.currentText] = selectInfo.currentText;
            $scope.salesInfo.updateAddStatus();
          }
        }
      }

      //业务员信息
      $scope.salesInfo = {
        boxInfo: [],
        hasSelected: {},
        selectInfo: {
          canDelete: true,
          enableEdit: true,
          defaultContent: '搜索关注人',
          currentText: '',
          currentChoice: '',
          options: [],
          onSelected: selectSalesman
        },
        options: [],
        canAdd: false,
        init: function () {
          this.boxInfo = [];
          this.hasSelected = {};
          this.options = [];
          this.canAdd = false;
        },
        addBox: function (canDelete, value) {
          value = value || deepCopy(this.selectInfo);
          var index = this.boxInfo.push(value);
          this.boxInfo[index - 1].options = this.options;
          this.boxInfo[index - 1].canDelete = canDelete;
          this.updateAddStatus();
        },
        addPageBox: function () {
          if (this.canAdd) {
            this.addBox(true);
          }
        },
        removeBox: function (index) {
          if (index < this.boxInfo.length) {
            var removeItem = this.boxInfo.splice(index, 1)[0];
            ableOldSelectSalesman(removeItem);
            this.updateAddStatus();
          }
        },
        unableOption: function (key, isUnable) {
          if (!key) {
            return;
          }
          for (var i = 0; i < this.options.length; i++) {
            if (this.options[i].key === key) {
              this.options[i].unable = isUnable;
              break;
            }
          }
        },
        updateAddStatus: function () {
          this.canAdd = this.boxInfo.length === getObjectLength(this.hasSelected);
        }
      };

      (function getPartnerCompanies() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          if (data.err) {
            handleCreateOrderError(data.err.type);
            return;
          }

          if (data.partnerCompany && data.partnerCompany.length > 0) {
            data.partnerCompany.forEach(function (item) {
              //别人加我为合作公司
              if (item.company._id) {
                $scope.receiverInfo.options.push({
                  key: item.company._id,
                  value: item.company.name
                });
                $scope.senderInfo.options.push({
                  key: item.company._id,
                  value: item.company.name
                });
              }
              else if (item.partner._id) { //我加别人为合作公司
                $scope.receiverInfo.options.push({
                  key: item.partner._id,
                  value: item.partner.name
                });
                $scope.senderInfo.options.push({
                  key: item.partner._id,
                  value: item.partner.name
                });
              }

            });
          }

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
        });

        $scope.$emit(GlobalEvent.onShowLoading, true);
        SalesmanService.getBasicList().then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          if (data.err) {
            return handleCreateOrderError(data.err.type);
          }
          $scope.salesInfo.init();

          if (data) {
            data.forEach(function (salesman) {
              $scope.salesInfo.options.push({
                key: salesman._id,
                value: salesman.nickname ? salesman.username + '(' + salesman.nickname + ')' : salesman.username,
                username: salesman.username,
                unable: false
              });
            });
          }
          if ($scope.salesInfo.options.length > 0) {
            //处理修改运单，需要添加业务员显示
            if ($scope.orderInfo.salesmen.length > 0) {
              var findCount = 0;
              for (var i = 0; i < $scope.salesInfo.options.length; i++) {
                if ($scope.orderInfo.salesmen.indexOf($scope.salesInfo.options[i].username) > -1) {
                  var selectItem = deepCopy($scope.salesInfo.selectInfo);
                  selectItem.currentText = $scope.salesInfo.options[i].value;
                  selectItem.currentChoice = $scope.salesInfo.options[i];
                  //添加框
                  $scope.salesInfo.addBox(true, selectItem);
                  //添加选择
                  selectSalesman(null, selectItem);
                  findCount++;
                }
                if ($scope.orderInfo.salesmen.length === findCount) {
                  break;
                }
              }

              if ($scope.salesInfo.boxInfo.length > 0) {
                $scope.salesInfo.boxInfo[0].canDelete = false;
              }
            }
          }
          //如果框数为0, 默认增加一个框
          if ($scope.salesInfo.boxInfo.length <= 0) {
            $scope.salesInfo.addBox(false);
          }

        }, function (err) {
          console.log(err);
          $scope.$emit(GlobalEvent.onShowLoading, false);
          handleCreateOrderError('error');
        });


        $scope.goodsInfo.init();
        //运单修改
        if ($scope.orderInfo.goods.length > 0) {
          $scope.orderInfo.goods.forEach(function (item) {
            var insertItem = deepCopy($scope.goodsInfo.itemTemplate);
            insertItem.name = item.name || '';

            insertItem.count = item.count || '';
            insertItem.unit = item.unit || '箱';

            insertItem.count2 = item.count2 || '';
            insertItem.unit2 = item.unit2 || '吨';

            insertItem.count3 = item.count3 || '';
            insertItem.unit3 = item.unit3 || '立方';

            insertItem.price = item.price || '';
            $scope.goodsInfo.addGoodsItem(insertItem);
          });
        }
        if ($scope.goodsInfo.goods.length === 0) {
          $scope.goodsInfo.addGoodsItem();
        }
        $scope.goodsInfo.goods[0].canDelete = false;
        $scope.goodsInfo.updateAddStatus();

      })();

      $scope.$on(GlobalEvent.onBodyClick, function () {
        if ($scope.goodsInfo.goods.length > 0) {
          $scope.goodsInfo.goods.forEach(function (item) {
            item.isShowOption = false;
            item.isShowOption2 = false;
            item.isShowOption3 = false;
          });
        }
      });

    }])
;

angular.module('zhuzhuqs').controller('OrderExportController',
  ['$scope', '$rootScope', 'OrderService', 'GlobalEvent', 'CompanyService', 'OnlineReportConfigService', 'Auth',
    function ($scope, $rootScope, OrderService, GlobalEvent, CompanyService, OnlineReportConfigService, Auth) {
      $scope.exportInfo = {
        isShow: false,
        isOnTime: '',
        damaged: '',
        order_transport_type: '',
        timeOptions: [
          {val: 1, label: '一天以内'},
          {val: 3, label: '三天以内'},
          {val: 7, label: '一周以内'},
          {val: 30, label: '一月以内'}
        ],
        companyPartnerOptions: [],
        customerOptions: [],
        time: 1,
        partner: '',
        customer: '',
        showTimePanel: false,
        fields: ['发货方', '收货方', '运单号', '创建时间', '分配时间',
          '提货进场时间', '交货进场时间', '中途事件', '参考单号', '品名', '运费',
          '状态', '司机姓名', '司机手机', '司机车牌', '承运商', '件数',
          '件数单位', '重量', '重量单位', '体积', '体积单位', '实际提货时间',
          '实际交货时间', '计划提货时间', '计划交货时间', '提货联系人', '提货联系手机', '提货联系固话',
          '提货地址', '交货联系人', '交货联系手机', '交货联系固话', '交货地址', '关注人', '备注',
          '提货进场拍照', '提货拍照', '交货进场拍照', '交货拍照', '中途事件拍照', '实收货物',
          '实收数量','货缺', '货损', '类型', '问题运单推送', '创建运单通知',
          '发货通知', '到货通知', '送达通知']
      };
      $scope.time = {
        queryLogTimeRange: {startDate: new Date(moment().add(-1, 'day')), endDate: new Date(moment())},
        queryLogMaxTime: moment(),
        dateOptions: {
          locale: {
            fromLabel: "起始",
            toLabel: "结束",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: "~",
          format: 'YYYY-MM-DD HH:mm:ss'
        }
      };


      $rootScope.$on(GlobalEvent.onShowExportDialog, function (event, bo) {
        OnlineReportConfigService.getOrderExportReportConfig().then(function(data){
          var fields;
          if(data && data.fields){
            fields = data.fields.split(',');
          }
          if(!fields || fields.length == 0){
            fields = $scope.exportInfo.fields;
          }
          for(var i= 0,ilen=fields.length;i<ilen;i++){
            var field = fields[i];
            jQuery('.order-columns-config input[name=order_fields][value='+field+']').attr('checked', 'checked');
          }
        });
        $scope.showDialog();
      });

      $scope.selectOnTime = function (val) {
        $scope.exportInfo.isOnTime = val;
      };

      $scope.selectDamage = function (val) {
        $scope.exportInfo.damaged = val;
      };

      $scope.showDialog = function () {
        $scope.exportInfo.isShow = true;

        $scope.getPartner();
        $scope.getCustomer();
      };

      $scope.hideDialog = function () {
        $scope.exportInfo.isShow = false;
      };

      $scope.getPartner = function () {
        CompanyService.getPartnerCompanys().then(function (data) {
          $scope.exportInfo.companyPartnerOptions = data.partnerCompany;
          console.log(data);
        }, function (err) {
          console.log(err);
        })
      };

      $scope.getCustomer = function () {
        CompanyService.getCompanyCustomers().then(function (data) {
          $scope.exportInfo.customerOptions = data;
          console.log(data);
        }, function (err) {
          console.log(err);
        })
      };

      $scope.exportOrders = function () {
        var fields = jQuery('.order-columns-config input[name=order_fields]:checkbox:checked').map(function(){
          return $(this).val();
        }).get();
        if(!fields || fields.length<1){
          $scope.$emit(GlobalEvent.onShowAlert, '请选择导出项');
          return;
        }
        var params = {
          startDate: moment($scope.time.queryLogTimeRange.startDate).toISOString(),
          endDate: moment($scope.time.queryLogTimeRange.endDate).toISOString(),
          damaged: $scope.exportInfo.damaged,
          isOnTime: $scope.exportInfo.isOnTime,
          partner_id: $scope.exportInfo.partner,
          customer_name: $scope.exportInfo.customer,
          order_transport_type: $scope.exportInfo.order_transport_type,
          fields : fields.join(',')
        };

        $scope.hideDialog();
        var param = "";
        for (var p in params) {
          var paramData = params[p];
          if (paramData instanceof Array) {
            for (var j in paramData) {
              param += p + "=" + paramData[j] + "&";
            }
          } else {
            param += p + "=" + params[p] + "&";
          }
        }
        var url = '/order/export?' + param + "access_token=" + Auth.getToken();
        window.open(url);
        return;
        $scope.hideDialog();
      };
    }]);
/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderFollowController',
  ['$state', '$scope', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer', 'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper) {

      var configuration = {
        selectOptions: [
          {
            key: '运单号',
            value: {
              name: '运单号',
              value: 'order_number',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '参考单号',
            value: {
              name: '参考单号',
              value: 'ref_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '订单号',
            value: {
              name: '订单号',
              value: 'original_order_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: false
          },
          {
            key: '货物名称',
            value: {
              name: '货物名称',
              value: 'goods_name',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '承运商',
            value: {
              name: '承运商',
              value: 'execute_company',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '司机',
            value: {
              name: '司机',
              value: 'execute_driver',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '发货方',
            value: {
              name: '发货方',
              value: 'sender_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '收货方',
            value: {
              name: '收货方',
              value: 'receiver_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '货损信息',
            value: {
              name: '货损信息',
              value: 'damage',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '备注',
            value: {
              name: '备注',
              value: 'description',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '状态',
            value: {
              name: '状态',
              value: 'status',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '分配时间',
            value: {
              name: '分配时间',
              value: 'assign_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '进场时间',
            value: {
              name: '进场时间',
              value: 'entrance_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '中途事件',
            value: {
              name: '中途事件',
              value: 'halfway',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '司机确认',
            value: {
              name: '司机确认',
              value: 'confirm',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          }],
        getOrderList: function (currentPage, limit, sortName, sortValue, searchArray) {
          return OrderService.getAllOrders(currentPage, limit, sortName, sortValue, searchArray);
        }
      };

      new OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration);
    }

  ]);

/**
 * Created by Wayne on 15/9/9.
 */

function OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration) {
  var map = BMapService.create('orderTraceMap', '北京', 11, true);

  $scope.orders = {
    orderList: {
      selectOptions: configuration.selectOptions,

      selectionOption: {
        columnWidth: 1
      },
      handleOption: {
        columnWidth: 2
      },
      fields: [],
      fields_length: 7,
      isShowPagination: true,
      pagination: {
        currentPage: 1,
        currentLimit: 10,
        limit: 10,
        totalCount: 0,
        pageCount: 0,
        pageNavigationCount: 5,
        canSeekPage: true,
        limitArray: [10, 20, 30, 40, 100],
        pageList: [1],
        sortName: '',
        sortValue: '',
        searchName: '',
        searchValue: '',
        onCurrentPageChanged: function (callback) {
          if ($scope.orders.orderList.pagination.currentLimit !== $scope.orders.orderList.pagination.limit) {
            $scope.orders.orderList.pagination.currentLimit = $scope.orders.orderList.pagination.limit;
            onSaveMaxPageCount('max_page_count_follow', $scope.orders.orderList.pagination.limit);
          }

          getOrderList();
        }
      },
      rows: [],
      events: {
        selectedHandler: [onRowSelected],
        rowClickHandler: [onRowClick],
        headerSortChangedHandler: [onHeaderSortChanged],
        headerKeywordsChangedHandler: [onHeaderKeywordsChanged],
        updateDisplayFields: [onUpdateDisplayFields],
        saveDisplayFields: [onSaveDisplayFields]
      }
    },
    transportEvent: {
      current: '',
      clickVoice: ''
    },
    isShowBatchDelete: false,
    isShowBatchShare: false,
    currentOrderList: []
  };

  $scope.orderDetailInfo = {
    isAdmin: false,
    showDialog: false,
    imgIndex: 0,
    showOrderDetail: false,
    showPhotoScan: false,
    currentTab: 'timeline',
    currentId: '',
    currentOrderDetail: {},
    currentOrderEventInfo: {},
    curPhotoList: [],
    curPhotoItem: '',
    curPhotoIndex: 0,
    gpsCount: 0,
    ungpsCount: 0,
    currentTitle: configuration.pageTitle || '运单跟踪'
  };

  function getUserProfile(callback) {
    UserProfileService.getUserProfile().then(function (data) {
      if (!data) {
        console.log('get user profile failed');
        return callback();
      }
      if (data.err) {
        console.log(data.err);
        return callback();
      }

      if (!data.user_profile) {
        console.log('customer do not has user profile content');
        return callback();
      }

      if (!data.user_profile.customize_columns_follow || data.user_profile.customize_columns_follow.length <= 0) {
        console.log('customer did not create customer profile until now');
      }
      else {
        var currentOption, i;
        for (i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
          currentOption = $scope.orders.orderList.selectOptions[i];
          currentOption.isSelected = false;
        }

        data.user_profile.customize_columns_follow.forEach(function (columnName) {
          for (i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
            currentOption = $scope.orders.orderList.selectOptions[i];

            if (currentOption.key === columnName) {
              currentOption.isSelected = true;
              break;
            }
          }
        });
      }

      if (data.user_profile.max_page_count_follow) {
        $scope.orders.orderList.pagination.limit = parseInt(data.user_profile.max_page_count_follow) || $scope.orders.orderList.pagination.limit;
        $scope.orders.orderList.pagination.currentLimit = $scope.orders.orderList.pagination.limit;
      }
      return callback();
    }, function (err) {
      console.log(err);
      return callback();
    });
  }

  function fillDisplayFields() {
    if (!$scope.orders.orderList.selectOptions || $scope.orders.orderList.selectOptions.length <= 0) {
      return;
    }

    $scope.orders.orderList.fields = [];
    $scope.orders.orderList.selectOptions.forEach(function (optionItem) {
      if (optionItem.isSelected) {
        $scope.orders.orderList.fields.push(optionItem.value);
      }
    });

    if ($scope.orders.orderList.fields.length > $scope.orders.orderList.fields_length) {
      $scope.orders.orderList.fields = $scope.orders.orderList.fields.slice(0, $scope.orders.orderList.fields_length);
    }
  }

  function generateExecuteDriverName(driver) {
    var displayName = '';
    displayName += ((driver.nickname ? driver.nickname : '未知') + '/');
    displayName += (((driver.plate_numbers && driver.plate_numbers.length > 0) ? driver.plate_numbers[0] : '未知') + '/');
    displayName += (driver.username ? driver.username : '未知');

    return displayName;
  }

  function generateFieldsColumn(currentOrder) {
    var rowData = {};

    $scope.orders.orderList.fields.forEach(function (fieldItem) {
      switch (fieldItem.value) {
        case 'order_number':
          rowData.order_number = currentOrder.order_number;
          break;
        case 'ref_number':
          rowData.ref_number = currentOrder.refer_order_number ? currentOrder.refer_order_number : '未填';
          break;
        case 'original_order_number':
          rowData.original_order_number = currentOrder.original_order_number ? currentOrder.original_order_number : '未填';
          break;
        case 'goods_name':
          rowData.goods_name = OrderHelper.getGoodsNameString(currentOrder.goods);
          break;
        case 'execute_driver':
          rowData.execute_driver = ((currentOrder.execute_drivers && currentOrder.execute_drivers.length > 0) ? generateExecuteDriverName(currentOrder.execute_drivers[0]) : '无');
          break;
        case 'execute_company':
          rowData.execute_company = ((currentOrder.execute_companies && currentOrder.execute_companies.length > 0) ? currentOrder.execute_companies[0].name : '无');
          break;
        case 'sender_name':
          rowData.sender_name = (currentOrder.sender_name ? currentOrder.sender_name : '未填');
          break;
        case 'receiver_name':
          rowData.receiver_name = (currentOrder.receiver_name ? currentOrder.receiver_name : '未填');
          break;
        case 'damage':
          rowData.damage = (currentOrder.damaged === true || currentOrder.damaged === 'true') ? '有货损 ' : '无货损 ';
          break;
        case 'description':
          rowData.description = currentOrder.description ? currentOrder.description : '未填';
          break;
        case 'status':
          rowData.status = $scope.generateOrderStatus(currentOrder.status, currentOrder.delete_status);
          break;
        case 'abnormal_reason':
          rowData.abnormal_reason = currentOrder.abnormal_reason;
          break;
        case 'assign_time':
          rowData.assign_time = (currentOrder.assign_time ? new Date(currentOrder.assign_time).Format('yyyy-MM-dd hh:mm:ss') : '无');
          break;
        case 'entrance_time':
          if (currentOrder.pickup_sign_events && currentOrder.pickup_sign_events.length > 0) {
            rowData.entrance_time = new Date(currentOrder.pickup_sign_events[0].created).Format('yyyy-MM-dd hh:mm:ss');
          }
          else {
            rowData.entrance_time = '无';
          }
          break;
        case 'halfway':
          if (currentOrder.halfway_events && currentOrder.halfway_events.length > 0) {
            rowData.halfway = (new Date(currentOrder.halfway_events[0].created).Format('yyyy-MM-dd hh:mm:ss') + ' ');

            if (currentOrder.halfway_events[0].description) {
              rowData.halfway += currentOrder.halfway_events[0].description;
            }
            else {
              rowData.halfway += '无描述';
            }
          }
          else {
            rowData.halfway = '无';
          }
          break;
        case 'confirm':
          if (currentOrder.confirm_events && currentOrder.confirm_events.length > 0) {
            rowData.confirm = '已确认';
          }
          else {
            rowData.confirm = '未确认';
          }
          break;
        default:
          break;
      }
    });

    return rowData;
  }

  $scope.close = function (e) {
    //关闭音频
    if ($scope.orderDetailInfo.currentOrderEventInfo && $scope.orderDetailInfo.currentOrderEventInfo.events) {
      closeVoices($scope.orderDetailInfo.currentOrderEventInfo.events);
    }
    $scope.orders.transportEvent.current = '';

    $scope.orderDetailInfo.currentId = '';
    $scope.orderDetailInfo.currentOrderDetail = {};
    $scope.orderDetailInfo.currentTab = 'timeline';
    $scope.orderDetailInfo.curPhotoList = [];
    $scope.orderDetailInfo.showOrderDetail = false;
    showMaskLayer(false);
    clearMap();
    stopBubble(e);
  };
  $scope.changeTab = function (tabName, onlyGps) {
    $scope.orderDetailInfo.currentTab = tabName;
    if (tabName == 'map') {
      clearMap();
      drawTraceLineOnMap(onlyGps, function (err, tracePoints) {
        var railingPoint = addExpectLocationOnMap($scope.orderDetailInfo.currentOrderDetail.orderDetail);  //添加预计提货交货点范围圈
        tracePoints = tracePoints || [];
        var allPoints = tracePoints.concat(railingPoint);

        setTimeout(function () {
          map.setViewport(allPoints); //将所有的点都显示出来
        }, 1000);
      });
      addEventMarkerOnMap();
    }
  };
  $scope.evaluateDriver = function (driverOrder) {
    var user = Auth.getUser();
    var url = '/driver/evaluation/page?driver_id=' + driverOrder.execute_driver._id +
      '&order_id=' + driverOrder._id +
      '&company_id=' + user.company._id +
      '&access_token=' + Auth.getToken();

    openNewScreenWindow(url, '评价司机');
  };
  $scope.getEvaluationLevel = function (level) {
    var levelText = '';
    switch (level) {
      case 1:
        levelText = '好评';
        break;
      case 2:
        levelText = '中评';
        break;
      case 3:
        levelText = '差评';
        break;
      default:
        break;
    }
    return levelText;
  };

  $scope.orders.transportEvent.clickVoice = function (event) {
    if (!event)
      return;
    if (!event.voice_file)
      return;

    //此时每个AudioPlayer对象都已经创建，可直接调用。
    var currentEvent = $scope.orders.transportEvent.current;
    //1、判断是否点击自己
    if (currentEvent && currentEvent.voice_file === event.voice_file) {
      if (currentEvent.audioPlayer) {
        if (currentEvent.audioPlayer.status === 'playing') {
          currentEvent.audioPlayer.stop();
        }
        else {
          currentEvent.audioPlayer.play();
        }
      }
      return;
    }

    //2、点击别人
    if (event.audioPlayer) {
      if (currentEvent && currentEvent.audioPlayer) {
        currentEvent.audioPlayer.stop();
      }
      event.audioPlayer.play();
      $scope.orders.transportEvent.current = event;
    }

    return;
  };

  function closeVoices(events) {
    if (!events || events.length <= 0)
      return;

    for (var index = 0; index < events.length; index++) {
      var event = events[index];

      if (event.audioPlayer) {
        event.audioPlayer.close();
        event.audioPlayer = null;
      }
    }
  }

  function initVoices(events) {
    if (!events || events.length <= 0)
      return;
    for (var index = 0; index < events.length; index++) {
      var event = events[index];

      if (event.voice_file.length > 0) {
        event.voice_file = config.qiniuServerAddress + event.voice_file;
        event.audioPlayer = new AudioPlayer(event.voice_file, function (type, status) {
          setTimeout(function () {
            $scope.$apply();
          }, 1);
        });
      }
    }
  }

  function initBarcode(events) {
    if (!events || events.length <= 0)
      return;

    for (var index = 0; index < events.length; index++) {
      var event = events[index];

      if (event.order_codes && event.order_codes.length > 0) {
        event.barcodes = event.order_codes.join(', ');
      }
      else {
        event.barcodes = '';
      }
    }
  }

  function initPhotos(events) {
    if (!events || events.length <= 0)
      return;

    events.forEach(function (event) {
      switch (event.type) {
        case 'pickup':
        case 'delivery':
        {
          if (event.goods_photos && event.goods_photos.length > 0) {
            event.goods_photos.forEach(function (img) {
              photoThumListAreaWidth += photo_thum_width;
              var scan_obj = {
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
                title: '提货货物照片',
                warning: event.damaged ? '货物有损' : '',
                url: generatePhotoUrl(img),
                remark: event.description
              };
              addPhotosToList(scan_obj);
            });
          }

          if (event.credential_photos && event.credential_photos.length > 0) {
            event.credential_photos.forEach(function (img) {
              photoThumListAreaWidth += photo_thum_width;
              var scan_obj = {
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
                title: '提货单据照片',
                warning: event.damaged ? '货物有损' : '',
                url: generatePhotoUrl(img),
                remark: event.description
              };
              addPhotosToList(scan_obj);
            });
          }

          break;
        }
        case 'pickupSign':
        case 'deliverySign':
        case 'halfway':
        {
          if (event.halfway_photos && event.halfway_photos.length > 0) {
            event.halfway_photos.forEach(function (img) {
              photoThumListAreaWidth += photo_thum_width;
              var scan_obj = {
                order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
                title: getTypeStringByPhotoType(event.type),
                warning: event.damaged ? '货物有损' : '',
                url: generatePhotoUrl(img),
                remark: event.description
              };
              addPhotosToList(scan_obj);
            });
          }
          break;
        }
      }

      if (event.photos && event.photos.length > 0) {
        event.photos.forEach(function (img) {
          photoThumListAreaWidth += photo_thum_width;
          var scan_obj = {
            order: $scope.orderDetailInfo.currentOrderDetail.orderDetail.number,
            title: img.name,
            warning: event.damaged ? '货物有损' : '',
            url: generatePhotoUrl(img.url),
            remark: event.description
          };
          addPhotosToList(scan_obj);
        });
      }

    });
  }

  function initActualInfo(events) {
    if (!events || events.length <= 0)
      return;

    for (var index = 0; index < events.length; index++) {
      var event = events[index];

      event.actualGoods = [];
      event.actualShowing = false;

      if (event.actual_more_goods_record && event.actual_more_goods_record.length > 0) {
        for (var i = 0; i < event.actual_more_goods_record.length; i++) {
          if (event.actual_more_goods_record[i].name || event.actual_more_goods_record[i].count) {
            event.actualShowing = true;
          }
          event.actualGoods.push({
            title: '实收货物' + (i + 1),
            name: event.actual_more_goods_record[i].name || '未知名称',
            count: event.actual_more_goods_record[i].count || '未知数量',
            unit: event.actual_more_goods_record[i].unit
          });
        }
        if (event.actualGoods.length === 1) {
          event.actualGoods[0].title = '实收货物';
        }
      }
      else {
        if (event.actual_goods_record) {
          if (event.actual_goods_record.goods_name ||
            (event.actual_goods_record.count ||
            event.actual_goods_record.weight ||
            event.actual_goods_record.volume)) {
            event.actualShowing = true;
          }
          event.actualGoods.push({
            title: '实收货物',
            name: event.actual_goods_record.goods_name || '未知名称',
            count: OrderHelper.getCountDetail(event.actual_goods_record),
            unit: ''
          });
        }
      }
    }
  }

  function getOrderCountVolumeWeight(orderDetail) {
    var sText = '';
    sText += (orderDetail.count ? (orderDetail.count + (orderDetail.count_unit ? orderDetail.count_unit : '件')) : '未填') + '/';
    sText += (orderDetail.weight ? (orderDetail.weight + (orderDetail.weight_unit ? orderDetail.weight_unit : '吨')) : '未填') + '/';
    sText += (orderDetail.volume ? (orderDetail.volume + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方')) : '未填');

    return sText;
  }

  function onHeaderKeywordsChanged(field) {
    $scope.orders.orderList.pagination.searchName = field.value;
    $scope.orders.orderList.pagination.searchValue = field.keyword;
    getOrderList();
  }

  function onUpdateDisplayFields() {
    fillDisplayFields();

    if ($scope.orders.currentOrderList && $scope.orders.currentOrderList.length > 0) {
      renderOrderListRows($scope.orders.currentOrderList);
    }
  }

  function onSaveDisplayFields() {
    var columnFields = [];
    var currentOption;
    for (var i = 0; i < $scope.orders.orderList.selectOptions.length; i++) {
      currentOption = $scope.orders.orderList.selectOptions[i];

      if (currentOption.isSelected) {
        columnFields.push(currentOption.key);
      }
    }

    if (columnFields.length > 0) {
      UserProfileService.setFollowCustomizeColumns(columnFields).then(function (data) {
        if (!data) {
          console.log('set customize columns failed');
          return;
        }
        if (data.err) {
          console.log(data.err);
          return;
        }

      }, function (err) {
        console.log(err);
      });
    }
  }

  function onSaveMaxPageCount(columnName, pageCount) {
    UserProfileService.setMaxPageCount({column_name: columnName, max_page_count: pageCount}).then(function (data) {
      if (!data || data.err) {
        return console.log('set follow page max count failed');
      }

      console.log('set follow page max count success');
    }, function (err) {
      return console.log('set follow page max count failed');
    });
  }

  function onHeaderSortChanged(field) {
    $scope.orders.orderList.pagination.sortName = field.value;
    $scope.orders.orderList.pagination.sortValue = field.curSort.value;
    getOrderList();
  }

  //<editor-fold desc='公共方法'>
  function showMaskLayer(isShow) {
    $scope.orderDetailInfo.showDialog = isShow;
  }

  function stopBubble(e) {
    if (e && e.stopPropagation)
      e.stopPropagation(); //非IE
    else
      window.event.cancelBubble = true; //IE
  }

  function handleError(errType) {
    if (OrderError[errType]) {
      $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
    }
    else {
      $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
    }
  }

  function getStatusString(status) {
    var statusString = '';

    switch (status) {
      case 'unAssigned':
        statusString = '未分配';
        break;
      case 'assigning':
        statusString = '分配中';
        break;
      case 'unPickupSigned':
      case 'unPickuped':
        statusString = '未提货';
        break;
      case 'unDeliverySigned':
      case 'unDeliveried':
        statusString = '未交货';
        break;
      case 'confirm':
        statusString = '确认接单';
        break;
      case 'pickupSign':
        statusString = '提货签到';
        break;
      case 'pickup':
        statusString = '提货';
        break;
      case 'deliverySign':
        statusString = '交货签到';
        break;
      case 'delivery':
        statusString = '交货';
        break;
      case 'halfway':
        statusString = '中途事件';
        break;
      case 'completed':
        statusString = '已完成';
        break;
      default:
        break;
    }

    return statusString;
  }

  //</editor-fold desc='公共方法'>

  //<editor-fold desc='照片处理逻辑'>
  var photoThumListArea = document.querySelector("[id='photo-thum-list']");
  var photoThumListAreaWidth = 0;
  var photo_thum_width = 111;
  var photo_thum_position = 0;

  function generatePhotoUrl(photoName) {
    return config.qiniuServerAddress + photoName;
  }

  function getIndexByPhotoNameInScanList(photo) {
    if ($scope.orderDetailInfo.curPhotoList.length === 0) {
      return 0;
    }
    var _url = generatePhotoUrl(photo);
    for (var i = 0; i < $scope.orderDetailInfo.curPhotoList.length; i++) {
      if ($scope.orderDetailInfo.curPhotoList[i].url === _url) {
        return i;
      }
    }
    return 0;
  }

  function getTypeStringByPhotoType(type) {
    switch (type) {
      case 'pickup':
        return '提货货物照片';
      case 'delivery':
        return '交货货物照片';
      case 'pickupSign':
        return '提货签到照片';
      case 'deliverySign':
        return '交货签到照片';
      case 'halfway':
        return '中途事件照片'
    }
    return '';
  }

  function addPhotosToList(photo) {
    for (var i = 0; i < $scope.orderDetailInfo.curPhotoList.length; i++) {
      if ($scope.orderDetailInfo.curPhotoList[i] == photo) {
        return;
      }
    }
    $scope.orderDetailInfo.curPhotoList.push(photo);
  }

  function generatePhotoHtml(event) {
    var displayPhotos = [];
    switch (event.type) {
      case 'pickup':
      case 'delivery':
      {
        if (event.goods_photos && event.goods_photos.length > 0) {
          displayPhotos.push(event.goods_photos[0]);
        }
        if (event.credential_photos && event.credential_photos.length > 0) {
          displayPhotos.push(event.credential_photos[0]);
        }
        break;
      }
      case 'pickupSign':
      case 'deliverySign':
      case 'halfway':
      {
        if (event.halfway_photos && event.halfway_photos.length > 0) {
          displayPhotos.push(event.halfway_photos[0]);
        }
        break;
      }
    }
    var result = '';
    if (displayPhotos.length > 0) {
      result += '<div id="' + event._id + '" class="photos">';
      displayPhotos.forEach(function (photo) {
        result += ('<div class="photo" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
        '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
      });
      result += '</div>';
    }
    return result;
  }

  $scope.generatePhoto = function (photoName) {
    return photoName ? generatePhotoUrl(photoName) : 'images/icon/order_follow/error.jpg';
  };

  $scope.showPhotos = function (photo) {
    $scope.orderDetailInfo.imgIndex = getIndexByPhotoNameInScanList(photo);
    $scope.orderDetailInfo.showPhotoScan = true;
    if ($scope.orderDetailInfo.currentTab == 'map') {
      $scope.$apply();
    }
  };
  $scope.showPhotoByPhotos = function (img) {
    $scope.orderDetailInfo.curPhotoItem = img;
  };

  $scope.moveThumList = function () {
    var view_width = $(".photo-nav-view").width();
    if (photoThumListAreaWidth < view_width) {
      return;
    }
    photo_thum_position -= photo_thum_width;
    if (photo_thum_position - view_width + photoThumListAreaWidth <= 0) {
      return;
    }
    $("#photo-thum-list").css("left", photo_thum_position + 'px');
  };

  //</editor-fold desc='照片处理逻辑'>

  //<editor-fold desc='订单信息'>

  function onRowSelected(rowsInfo, event) {
    console.log(rowsInfo.length);
    if (!rowsInfo || rowsInfo.length <= 0) {
      $scope.orderShare.batchShareInfo.orders = [];
      $scope.orders.isShowBatchDelete = false;
      $scope.orders.isShowBatchShare = false;
    }
    else {
      $scope.orderShare.batchShareInfo.orders = rowsInfo;
      $scope.orders.isShowBatchDelete = true;
      $scope.orders.isShowBatchShare = true;

      for (var index = 0; index < rowsInfo.length; index++) {
        var currentOrder = rowsInfo[index];

        if (currentOrder.create_company_id !== currentOrder.execute_company_id || (currentOrder.status !== 'unAssigned' && currentOrder.status !== 'assigning' && currentOrder.status !== 'unPickupSigned')) {
          $scope.orders.isShowBatchDelete = false;
          break;
        }
      }
    }

    stopBubble(event);
  }

  function onRowClick(rowInfo) {
    if (!rowInfo || !rowInfo._id)
      return;

    if (rowInfo.rowConfig.isDeleted) {
      return;
    }

    $scope.orderDetailInfo.currentId = rowInfo._id;
    clearPointsNumber();
    getOrderInfo(rowInfo._id);

    if (configuration.onRowClick) {
      configuration.onRowClick(rowInfo, $scope.searchModule.currentLabel);
    }
  }

  function getOrderList() {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    var searchArray = getSearchCondition();

    configuration.getOrderList(
      $scope.orders.orderList.pagination.currentPage,
      $scope.orders.orderList.pagination.limit,
      $scope.orders.orderList.pagination.sortName,
      $scope.orders.orderList.pagination.sortValue,
      searchArray)
      .then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        console.log(data.orders);
        if (data.err) {
          handleError(data.err.type);
        }
        else {
          if (configuration.handleOrders && (typeof(configuration.handleOrders) === 'function')) {
            configuration.handleOrders(data);
          }

          $scope.orders.currentOrderList = data.orders;
          renderOrderListRows(data.orders);
          $scope.orders.orderList.pagination.currentPage = parseInt(data.currentPage);
          $scope.orders.orderList.pagination.limit = parseInt(data.limit);
          $scope.orders.orderList.pagination.totalCount = parseInt(data.totalCount);
          $scope.orders.orderList.pagination.pageCount = Math.ceil(data.totalCount / data.limit);
          $scope.orders.orderList.pagination.render();
        }
      }, function (err) {
        if (err)
          console.log(err);
      });
  }

  function hideMoreSameEventForOrder(orderEvents) {
    if (!orderEvents || orderEvents.length <= 0) {
      return [];
    }
    //orderEvents包含多个分段上传的多个事件。
    //将同一个Order的相同事件隐藏。
    var acturalResult = [];

    var singleArray = [];
    for (var i = 0; i < orderEvents.length; i++) {
      var orderItemEvent = orderEvents[i];
      var isExist = false;

      for (var j = 0; j < singleArray.length; j++) {
        var singleItem = singleArray[j];

        if (singleItem.order_id.toString() === orderItemEvent.order._id.toString()) {
          isExist = true;

          if (orderItemEvent.type === 'pickupSign' && singleItem.events.indexOf('pickupSign') > -1) {
            continue;
          }
          if (orderItemEvent.type === 'pickup' && singleItem.events.indexOf('pickup') > -1) {
            continue;
          }
          if (orderItemEvent.type === 'deliverySign' && singleItem.events.indexOf('deliverySign') > -1) {
            continue;
          }
          if (orderItemEvent.type === 'delivery' && singleItem.events.indexOf('delivery') > -1) {
            continue;
          }

          singleItem.events.push(orderItemEvent.type);
          acturalResult.push(orderItemEvent);
        }
      }

      if (!isExist) {
        singleArray.push({order_id: orderItemEvent.order._id, events: [orderItemEvent.type]});
        acturalResult.push(orderItemEvent);
      }

    }

    return acturalResult;
  }

  function myRound(x) {
    if (x) {
      return Math.round(x * 100) / 100;
    } else {
      return x;
    }
  }

  function formatGood(good, sum) {
    if (good) {
      var a = [];
      if (good.count && good.unit) {
        var count = parseFloat(good.count);
        if (count) {
          a.push(myFixed(count) + good.unit);
          if (sum[good.unit]) {
            sum[good.unit] += myRound(count);
          } else {
            sum[good.unit] = myRound(count);
          }
        }
      }
      if (good.count2 && good.unit2) {
        var count2 = parseFloat(good.count2);
        if (count2) {
          a.push(myFixed(count2) + good.unit2);
          if (sum[good.unit2]) {
            sum[good.unit2] += myRound(count2);
          } else {
            sum[good.unit2] = myRound(count2);
          }
        }
      }
      if (good.count3 && good.unit3) {
        var count3 = parseFloat(good.count3);
        if (count3) {
          a.push(myFixed(count3) + good.unit3);
          if (sum[good.unit3]) {
            sum[good.unit3] += myRound(count3);
          } else {
            sum[good.unit3] = myRound(count3);
          }
        }
      }
      if (a.length == 0) {
        return '-';
      } else {
        return a.join('/');
      }
    }
    return '-';
  }

  function getOrderEvent(orderId, orderDetail) {
    OrderService.getEventsByOrderId(orderId, $scope.searchModule.currentLabel)
      .then(function (result) {
        if (result.err) {
          return handleError(result.err.type);
        }
        if (result && result.events && result.events instanceof Array) {
          result.events.forEach(function (evt) {
            if (evt.type == 'pickup' || evt.type == 'delivery') {
              var plan_goods = orderDetail.goods;
              var actual_goods = evt.actual_more_goods_record;
              var compare_goods = [];
              var plan_sum = {}, actual_sum = {}, compare_sum = '正常';
              for (var i = 0, len = plan_goods.length; i < len; i++) {
                var good1 = plan_goods[i];
                var good2 = actual_goods.filter(function (e) {
                    if (good1._id.toString() == e._id.toString()) {
                      return e;
                    }
                  })[0] || {};
                var good1_string = formatGood(good1, plan_sum);
                var good2_string = formatGood(good2, actual_sum);
                var compare;
                if (good2 && good2.count) {
                  if (good1.count != good2.count) {
                    compare = '缺货';
                    compare_sum = '缺货';
                  } else {
                    compare = '正常';
                  }
                } else {
                  compare = '缺货';
                  compare_sum = '缺货';
                }
                compare_goods.push({
                  name: good1.name,
                  planned: good1_string,
                  actual: good2_string,
                  compare: compare
                });
              }
              var plan_sum_string = '';
              for (var p in plan_sum) {
                if (plan_sum.hasOwnProperty(p)) {
                  plan_sum_string += '/' + myFixed(plan_sum[p]) + p;
                }
              }
              if (plan_sum_string.length > 0) {
                plan_sum_string = plan_sum_string.substring(1);
              }
              var actual_sum_string = '';
              for (p in actual_sum) {
                if (actual_sum.hasOwnProperty(p)) {
                  actual_sum_string += '/' + myFixed(actual_sum[p]) + p;
                }
              }
              if (actual_sum_string.length > 0) {
                actual_sum_string = actual_sum_string.substring(1);
              } else {
                actual_sum_string = '-';
              }
              compare_goods.push({
                name: '合计',
                planned: plan_sum_string,
                actual: actual_sum_string,
                compare: compare_sum
              });

              evt.compare_goods = compare_goods;
            }
          });
        }

        result.events = hideMoreSameEventForOrder(result.events);

        $scope.orderDetailInfo.currentOrderEventInfo = result;
        $scope.orderDetailInfo.curPhotoList = [];
        initPhotos($scope.orderDetailInfo.currentOrderEventInfo.events);
        initVoices($scope.orderDetailInfo.currentOrderEventInfo.events);
        initBarcode($scope.orderDetailInfo.currentOrderEventInfo.events);
        initActualInfo($scope.orderDetailInfo.currentOrderEventInfo.events);

      }, function (err) {
        console.log(err);
        $scope.orderDetailInfo.currentOrderEventInfo = {};
        return handleError(err.err.type);
      });
  }

  function getDriverOrderEventObject(planAddress, planTime, actualEvent) {
    var eventObject = {};
    if (actualEvent) {
      eventObject.address = actualEvent.address || '未知地址';
      eventObject.time = new Date(actualEvent.time).Format('yyyy/MM/dd hh:mm');
      eventObject.isActual = true;
    }
    else {
      eventObject.address = planAddress || '未知地址';
      eventObject.time = planTime ? new Date(planTime).Format('yyyy/MM/dd hh:mm') : '未知时间';
      eventObject.isActual = false;
    }

    return eventObject;
  }

  function filterCompanyOrdersWithAssignDriver(data) {
    var user = Auth.getUser();

    data.companyOrdersWithAssignDriver = [];
    if (data && data.assignedCompanyOrders && data.assignedCompanyOrders.length > 0) {
      data.companyOrdersWithAssignDriver = data.assignedCompanyOrders.filter(function (companyOrder) {
        if (companyOrder.drivers && companyOrder.drivers.length > 0) {
          return true;
        }
        return false;
      });
    }
    data.companyOrdersWithAssignDriver.sort(function (a, b) {
      if (!a.assign_time) {
        return true;
      }
      if (!b.assign_time) {
        return false;
      }
      return new Date(a.assign_time) > new Date(b.assign_time);
    });

    var number = 1;
    for (var i = 0; i < data.companyOrdersWithAssignDriver.length; i++) {
      var companyOrder = data.companyOrdersWithAssignDriver[i];
      if (companyOrder.assign_time) {
        companyOrder.assign_time_format = new Date(companyOrder.assign_time).Format('yyyy/MM/dd hh:mm');
      }
      else {
        companyOrder.assign_time_format = '未知时间';
      }

      for (var j = 0; j < companyOrder.drivers.length; j++) {
        var driverOrder = companyOrder.drivers[j];

        driverOrder.pickup_event_format = getDriverOrderEventObject(
          driverOrder.pickup_contacts.address,
          driverOrder.pickup_start_time,
          driverOrder.pickup_events[0]
        );
        driverOrder.delivery_event_format = getDriverOrderEventObject(
          driverOrder.delivery_contacts.address,
          driverOrder.delivery_start_time,
          driverOrder.delivery_events[0]
        );

        if (driverOrder.driver_evaluations && driverOrder.driver_evaluations.length > 0) {
          var currentEvaluation = driverOrder.driver_evaluations.filter(function (item) {
            return item.company_id.toString() === user.company._id.toString();
          });
          if (currentEvaluation.length > 0) {
            driverOrder.current_evaluation = currentEvaluation[0];
          }
        }

        driverOrder.number = number;
        number++;
      }
    }
  }

  function createOrderGoodsDetail(orderDetail) {
    var goods = [];
    if (orderDetail.goods && orderDetail.goods.length > 0) {
      for (var i = 0; i < orderDetail.goods.length; i++) {
        goods.push({
          title: '货物' + (i + 1),
          name: orderDetail.goods[i].name || '未知名称',
          value: OrderHelper.getSingleCountDetail(orderDetail.goods[i]),
          sum: (parseFloat(orderDetail.goods[i].count) || 0) * (parseFloat(orderDetail.goods[i].price) || 0)
        });
      }
      if (goods.length === 1) {
        goods[0].title = '货物';
      }
    }
    else {
      goods.push({
        title: '货物',
        name: orderDetail.goods_name || '未知名称',
        value: OrderHelper.getOrderCountVolumeWeight(orderDetail),
        sum: 0
      });
    }
    orderDetail.goodsInfo = goods;
  }

  function getOrderInfo(orderId) {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    OrderService.getAssignedOrderDetail(orderId, $scope.searchModule.currentLabel).then(function (data) {
      $scope.$emit(GlobalEvent.onShowLoading, false);
      console.log(data);
      console.log(orderId);
      if (data.err) {
        return handleError(data.err.type);
      }
      if (data && data.orderDetail && data.orderDetail.salesmen && data.orderDetail.salesmen.length > 0) {
        var salesmen = [];
        for (var i = 0, len = data.orderDetail.salesmen.length; i < len; i++) {
          var salesman = data.orderDetail.salesmen[i];
          if (salesman) {
            if (salesman.nickname && salesman.nickname != salesman.username) {
              salesmen.push(salesman.nickname + '(' + salesman.username + ')');
            } else {
              salesmen.push(salesman.username);
            }
          }
        }
        data.orderDetail._salesmen = salesmen;
      } else {
        data.orderDetail._salesmen = [];
      }
      $scope.orderDetailInfo.showOrderDetail = true;
      showMaskLayer(true);

      filterCompanyOrdersWithAssignDriver(data); //显示已分配司机的单子
      createOrderGoodsDetail(data.orderDetail);  //显示多货物
      $scope.orderDetailInfo.currentOrderDetail = data;

      getOrderEvent(orderId, data.orderDetail);
    }, function (err) {
      handleError(err);
    });
  }

  function renderOrderListRows(orders) {
    $scope.orders.orderList.rows = [];

    for (var i = 0; i < orders.length; i++) {
      var currentOrder = orders[i];

      var rowItem = {
        _id: currentOrder._id,
        //create_company_id: currentOrder.create_company._id.toString(),
        //execute_company_id: currentOrder.execute_company.toString(),
        status: currentOrder.status,
        columns: generateFieldsColumn(currentOrder),
        extendData: {
          refer_order_number: currentOrder.refer_order_number,
          original_order_number: currentOrder.original_order_number,
          goods_name: currentOrder.goods_name,
          pickup_contact_name: currentOrder.pickup_contacts.name,
          pickup_contact_phone: currentOrder.pickup_contacts.phone,
          pickup_contact_mobile_phone: currentOrder.pickup_contacts.mobile_phone,
          pickup_contact_address: currentOrder.pickup_contacts.address,
          delivery_contact_name: currentOrder.delivery_contacts.name,
          delivery_contact_phone: currentOrder.delivery_contacts.phone,
          delivery_contact_mobile_phone: currentOrder.delivery_contacts.mobile_phone,
          delivery_contact_address: currentOrder.delivery_contacts.address,
          pickup_start_time: currentOrder.pickup_start_time,
          pickup_end_time: currentOrder.pickup_end_time,
          delivery_start_time: currentOrder.delivery_start_time,
          delivery_end_time: currentOrder.delivery_end_time,
          customer_name: currentOrder.customer_name,
          create_user: currentOrder.create_user,
          create_group: currentOrder.create_group,
          execute_group: currentOrder.execute_group,
          description: currentOrder.description,
          count: currentOrder.count,
          weight: currentOrder.weight,
          volume: currentOrder.volume,
          count_unit: currentOrder.count_unit,
          weight_unit: currentOrder.weight_unit,
          volume_unit: currentOrder.volume_unit,
          freight_charge: currentOrder.freight_charge,
          details: currentOrder.details,

          sender_name: currentOrder.sender_name,
          receiver_name: currentOrder.receiver_name,
          receiver_company: currentOrder.receiver_company,
          sender_company: currentOrder.sender_company,
          salesmen: currentOrder.salesmen || [],
          goods: currentOrder.goods || [],

          pickup_deferred_duration: currentOrder.pickup_deferred_duration || 0,
          delivery_early_duration: currentOrder.delivery_early_duration || 0,
          abnormal_push: currentOrder.abnormal_push || false,
          pickup_push: currentOrder.pickup_push || false,

          create_push: currentOrder.create_push || false,
          delivery_sign_push: currentOrder.delivery_sign_push || false,
          delivery_push: currentOrder.delivery_push || false,
          order_transport_type: currentOrder.order_transport_type || 'ltl'
        },
        rowConfig: {
          isDeleted: currentOrder.delete_status,
          notOptional: currentOrder.delete_status ? true : false,
          unEdited: true,
          selfButtons: generateSelfButton(currentOrder)
        }
      };
      if (configuration.generateRowData) {
        configuration.generateRowData(rowItem, currentOrder, Auth.getUser()._id.toString());
      }

      $scope.orders.orderList.rows.push(rowItem);
    }

    $scope.orders.orderList.load();
  };

  function generateSelfButton(currentOrder) {
    var selfButtons = [];
    // if (currentOrder.delete_status === true) {
    //   return selfButtons;
    // }
    //
    // if ($scope.searchModule.currentLabel === 'assign') {
    //
    //   // if (currentOrder.create_company._id === currentOrder.execute_company && currentOrder.status !== 'completed') {
    //   //   selfButtons.push({
    //   //     text: '',
    //   //     clickHandle: modifyOrderInfo,
    //   //     className: 'modify-order',
    //   //     title: '修改运单'
    //   //   });
    //   // }
    //
    //   //已经分配的订单,已经签到
    //   if (currentOrder.status === 'unPickupSigned' || currentOrder.status === 'assigning') {
    //     var canAssignAgain = true;
    //     if (currentOrder.assigned_infos && currentOrder.assigned_infos.length > 0) {
    //       //for (var index = 0; index < currentOrder.assigned_infos.length; index++) {
    //       //  if (!currentOrder.assigned_infos[index].order_id) {
    //       //    canAssignAgain = false;
    //       //    break;
    //       //  }
    //       //}
    //
    //       if (canAssignAgain) {
    //         selfButtons.push({
    //           text: '',
    //           clickHandle: modifyAssignInfo,
    //           className: 'modify-assign-info',
    //           title: '重新分配'
    //         });
    //       }
    //
    //     }
    //   }
    // }
    //
    // selfButtons.push({
    //   text: '',
    //   clickHandle: shareOrderByEmail,
    //   className: 'email-share',
    //   title: '分享到邮件'
    // });
    // selfButtons.push({
    //   text: '',
    //   clickHandle: function (rowInfo, event) {
    //     var orderInfo = generateWechatShareOrderInfos([rowInfo]);
    //     shareOrderByWechat(orderInfo, event);
    //   },
    //   className: 'wechat-share',
    //   title: '分享到微信'
    // });
    //
    // if ($scope.searchModule.currentLabel === 'assign') {
    //
    //   //已经分配的订单,已经签到
    //   // if (currentOrder.create_company._id === currentOrder.execute_company && (currentOrder.status === 'unAssigned' || currentOrder.status === 'assigning' || currentOrder.status === 'unPickupSigned')) {
    //   //   selfButtons.push({
    //   //     text: '',
    //   //     clickHandle: deleteOrder,
    //   //     className: 'delete-order',
    //   //     title: '删除'
    //   //   });
    //   // }
    // }

    return selfButtons;
  };

  $scope.generateOrderStatus = function (status, isDelete) {
    if (isDelete) {
      return '已撤销';
    }

    var statusText = getStatusString(status);
    return statusText ? statusText : '已完成';
  };
  $scope.generateEventTypeDescription = function (event) {
    if (event.order.type === 'warehouse')
      return '仓储收货';
    return eventTypeConvert(event.type);
  };
  $scope.getDetailInfo = function (orderId) {
    $scope.orderDetailInfo.currentId = orderId;
    clearPointsNumber();
    getOrderInfo(orderId);
  };
  $scope.exportOrderPdf = function () {
    OrderService.exportOrderPdf($scope.orderDetailInfo.currentId);
  };

  $scope.showPartners = function (arr) {
    if (arr) {
      $scope.partners = '';
      arr.forEach(function (info) {
        $scope.partners += info.partner_name + ' ';
      });
    }
  };
  $scope.batchDeleteOrders = function () {
    if (!$scope.orders.isShowBatchDelete) {
      return;
    }

    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    var order_ids = [];
    for (var index = 0; index < $scope.orderShare.batchShareInfo.orders.length; index++) {
      var currentOrder = $scope.orderShare.batchShareInfo.orders[index];
      order_ids.push(currentOrder._id);
    }

    $scope.$emit(GlobalEvent.onShowAlertConfirm, '确认要删除这' + $scope.orderShare.batchShareInfo.orders.length + '项运单吗？', function (param) {

      $scope.$emit(GlobalEvent.onShowLoading, true);
      OrderService.batchDeleteOrders(order_ids).then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        console.log(data);

        if (!data) {
          return handleError('');
        }
        if (data.err) {
          return handleError(data.err.type);
        }

        var showTip = '删除成功';
        if (data.failedOrders && data.failedOrders.length > 0) {
          showTip = '操作完成，失败' + data.failedOrders.length + '个';
        }
        $scope.$emit(GlobalEvent.onShowAlert, showTip, function () {
          $state.go('order_follow', {}, {reload: true});
        });

      }, function (err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);

        console.log(err);
      });

    }, null);

  };

  //<editor-fold desc="订单操作相关">
  function modifyOrderInfo(row, event) {
    console.log('修改订单信息');

    var modifyOrder = {
      order_id: row._id,
      order_number: row.columns.order_number,
      refer_order_number: row.extendData.refer_order_number,
      original_order_number: row.extendData.original_order_number,
      goods_name: row.extendData.goods_name,

      count: row.extendData.count,
      weight: row.extendData.weight,
      volume: row.extendData.volume,

      count_unit: row.extendData.count_unit,
      weight_unit: row.extendData.weight_unit,
      volume_unit: row.extendData.volume_unit,
      freight_charge: row.extendData.freight_charge,

      customer_name: row.extendData.customer_name,
      pickup_start_time: row.extendData.pickup_start_time,
      delivery_start_time: row.extendData.delivery_start_time,
      pickup_end_time: row.extendData.pickup_end_time,
      delivery_end_time: row.extendData.delivery_end_time,
      description: row.extendData.description,
      group_id: row.extendData.execute_group,

      //contacts
      pickup_contact_name: row.extendData.pickup_contact_name,
      pickup_contact_phone: row.extendData.pickup_contact_phone,
      pickup_contact_mobile_phone: row.extendData.pickup_contact_mobile_phone,
      pickup_contact_address: row.extendData.pickup_contact_address,
      pickup_contact_email: '',

      delivery_contact_name: row.extendData.delivery_contact_name,
      delivery_contact_phone: row.extendData.delivery_contact_phone,
      delivery_contact_mobile_phone: row.extendData.delivery_contact_mobile_phone,
      delivery_contact_address: row.extendData.delivery_contact_address,
      delivery_contact_email: '',

      sender_name: row.extendData.sender_name,
      receiver_name: row.extendData.receiver_name,
      receiver_company: row.extendData.receiver_company,
      sender_company: row.extendData.sender_company,
      goods: row.extendData.goods,
      salesmen: [],

      pickup_deferred_duration: row.extendData.pickup_deferred_duration,
      delivery_early_duration: row.extendData.delivery_early_duration,
      abnormal_push: row.extendData.abnormal_push,
      pickup_push: row.extendData.pickup_push,

      create_push: row.extendData.create_push,
      delivery_sign_push: row.extendData.delivery_sign_push,
      delivery_push: row.extendData.delivery_push,
      order_transport_type: row.extendData.order_transport_type
    };
    if (row.extendData.salesmen && row.extendData.salesmen.length > 0) {
      modifyOrder.salesmen = row.extendData.salesmen.map(function (item) {
        return item.username;
      });
    }

    if (!row.extendData.goods || row.extendData.goods.length == 0) {
      var goods = [];
      goods.push({
        name: row.extendData.goods_name,
        count: row.extendData.count,
        unit: row.extendData.count_unit,
        count2: row.extendData.weight,
        unit2: row.extendData.weight_unit,
        count3: row.extendData.volume,
        unit3: row.extendData.volume_unit
      });
      modifyOrder.goods = goods;
    }

    console.log(modifyOrder);

    stopBubble(event);
    $state.go('order_create', {
      title: '修改运单',
      order: JSON.stringify(modifyOrder),
      modify_type: row.status === 'unAssigned' ? 'normal' : 'assigned'
    });
  };

  function modifyAssignInfo(row, event) {
    console.log('修改订单分配信息');

    $state.go('order_modify_assign', {id: row._id});
    stopBubble(event);
  };

  function deleteOrder(row, event) {
    console.log('删除订单信息');

    $scope.$emit(GlobalEvent.onShowAlertConfirm, "确认要删除吗？",
      function (param) {
        OrderService.deleteAssignedOrder(param._id)
          .then(function (data) {
            console.log(data);
            $state.go('order_follow', {}, {reload: true});
          }, function (err) {
            console.log(err);
          })
      }, row);

    stopBubble(event);
  };
  //</editor-fold>

  //</editor-fold desc='订单信息'>

  //<editor-fold desc='地图'>
  var iconSize = new BMap.Size(42, 33);
  var iconAnchorSize = new BMap.Size(14, 33);
  var myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_current.gif", iconSize, {anchor: iconAnchorSize});
  var currentMapLocationMarkers = [];

  function clearPointsNumber() {
    $scope.orderDetailInfo.gpsCount = 0;
    $scope.orderDetailInfo.ungpsCount = 0;
  }

  function startGetTheCurrentDriverLocation(bmapPoint) {
    if (bmapPoint) {
      var marker = new BMap.Marker(bmapPoint, {icon: myIcon});
      map.addOverlay(marker);
      currentMapLocationMarkers.push(marker);
    }
  }

  function drawTraceLineOnMap(onlyGps, callback) {
    OrderService.getTracesByOrderId($scope.orderDetailInfo.currentId, $scope.searchModule.currentLabel)
      .then(function (driversTraces) {
        console.log(driversTraces, 'driverTraces===========');
        if (driversTraces.err) {
          handleError(driversTraces.err.type);
          return callback();
        }

        var allDriverPoints = [];
        clearPointsNumber();
        var latestPoint = {
          trace: '',
          time: new Date('1988-1-10')
        };

        driversTraces.forEach(function (driverTraceObject) {
          var drawLineResult = BMapService.drawLine(map, driverTraceObject.traces, latestPoint, onlyGps);
          var driverPoints = drawLineResult.points;
          $scope.orderDetailInfo.gpsCount += drawLineResult.gpsCount;
          $scope.orderDetailInfo.ungpsCount += drawLineResult.ungpsCount;

          driverPoints.forEach(function (driverPoint) {
            allDriverPoints.push(driverPoint);
          });
        });

        //绘制当前位置
        var currentOrderDetail = $scope.orderDetailInfo.currentOrderDetail.orderDetail;
        if (currentOrderDetail.status != 'completed' && currentOrderDetail.status != 'unAssigned') {
          if (latestPoint.trace) {
            removeCurrentMarkers();

            startGetTheCurrentDriverLocation(new BMap.Point(latestPoint.trace.location[0], latestPoint.trace.location[1]));
          }
        }

        return callback(null, allDriverPoints);

      }, function (err) {
        console.log(err);
        return callback();
      });
  }

  function addExpectLocationOnMap(currentOrderDetail) {
    //1.获取要绘制的点
    //2.默认从分配信息中获取所有的点
    //3.如果是顶层运单，优先选择创建地址
    var locations = [];
    if (!currentOrderDetail.parent_order) {
      if (currentOrderDetail.pickup_contacts.location && currentOrderDetail.pickup_contacts.location.length === 2) {
        locations.push(
          {
            point: currentOrderDetail.pickup_contacts.location,
            type: 'pickup',
            address: currentOrderDetail.pickup_contacts.brief || currentOrderDetail.pickup_contacts.address
          });
      }
      if (currentOrderDetail.delivery_contacts.location && currentOrderDetail.delivery_contacts.location.length === 2) {
        locations.push(
          {
            point: currentOrderDetail.delivery_contacts.location,
            type: 'delivery',
            address: currentOrderDetail.delivery_contacts.brief || currentOrderDetail.delivery_contacts.address
          });
      }
    }

    if (locations.length === 0) {
      if (currentOrderDetail.assigned_infos && currentOrderDetail.assigned_infos.length > 0) {
        currentOrderDetail.assigned_infos.forEach(function (assignItem) {
          if (assignItem.pickup_contact_location && assignItem.pickup_contact_location.length === 2) {
            locations.push(
              {
                point: assignItem.pickup_contact_location,
                type: 'pickup',
                address: assignItem.pickup_contact_brief || assignItem.pickup_contact_address
              });
          }
          if (assignItem.delivery_contact_location && assignItem.delivery_contact_location.length === 2) {
            locations.push(
              {
                point: assignItem.delivery_contact_location,
                type: 'delivery',
                address: assignItem.delivery_contact_brief || assignItem.delivery_contact_address
              });
          }
        });
      }
    }

    var mapPoints = [];
    if (locations.length > 0) {
      mapPoints = BMapService.drawCircle(map, locations);
    }

    return mapPoints;
  }

  function addEventMarkerOnMap() {
    if (!$scope.orderDetailInfo.currentOrderEventInfo.events || $scope.orderDetailInfo.currentOrderEventInfo.events.length <= 0)
      return;
    $scope.orderDetailInfo.currentOrderEventInfo.events.forEach(function (event) {
      var html = generateTipHtml(event);
      BMapService.drawDriverEvent(map, event, html);
    });
  }

  function clearMap() {
    map.clearOverlays();
  }

  function removeCurrentMarkers() {
    if (currentMapLocationMarkers.length > 0) {
      currentMapLocationMarkers.forEach(function (marker) {
        map.removeOverlay(marker);
      });
    }
  }

  function eventTypeConvert(type) {
    return getStatusString(type);
  }

  function generateTipHtml(event) {
    var html = '<div class="event-tip">'
      + '<div class="event_type">' + eventTypeConvert(event.type) + '</div>'
      + '<div class="driver"><strong>司机:</strong><span>'
      + (event.driver.nickname ? (event.driver.nickname) + " " : '')
      + (event.driver.username ? (event.driver.username) + " " : '')
      + (event.driver.plate_numbers.length > 0 ? (event.driver.plate_numbers[0] + " ") : '')
      + '</span></div>'
      + '<div class="time"><strong>时间:</strong><time>' + new Date(event.time).toLocaleString() + '</time></div>'
      + '<div class="address"><strong>地点:</strong><span>' + event.address + '</span></div>'
      + '<div class="damaged"><strong>货损:</strong><span>' + (event.damaged ? '有' : '无') + '</span></div>'
      + '<div class="description"><strong>备注:</strong><span>' + (event.description ? event.description : '无') + '</span></div>'
      + generatePhotoHtml(event)
      + '</div>';
    return html;
  }

  //</editor-fold desc='地图'>

  //<editor-fold desc='分享订单'>
  $scope.orderShare = {
    mainShareShow: false,  //显示分享页面
    editShareShow: true,   //显示运单信息，否则显示分享完成页面
    staffShareShow: true,  //显示员工分享，否则显示邮件分享
    count: 0,
    orders: '',
    batchShareInfo: {
      orders: []
    },
    suffix_customer: '',
    emailRecipients: '',  //单个Email
    staffRecipients: [],  //选择的员工Email
    allRecipients: '',    //收到分享的Email
    order_number_text: '',
    shareWithStaff: '',  //点击员工分享处理函数
    shareWithEmail: '',  //点击邮件分享处理函数
    closeSharePage: '',  //点击关闭运单分享页面
    clickShare: '',   //点击分享
    cooperateCompany: {
      allCompany: [],
      selectedCompanyStaffs: [],
      allSelectedCount: 0,
      isSelectedAll: false,
      isInvertSelected: false,
      clickSingleCompany: '',
      clickSingleStaff: '',
      clickSelectAll: '',
      clickInvertSelect: '',
      clickClearAll: '',
      currentCompanyName: ''
    }

  };

  $scope.batchWechatShareOrders = function () {
    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    displayWechatOrderShare($scope.orderShare.batchShareInfo.orders);
  };
  $scope.batchEmailShareOrders = function () {
    if (!$scope.orderShare.batchShareInfo.orders || $scope.orderShare.batchShareInfo.orders.length <= 0) {
      return;
    }

    displayEmailOrderShare($scope.orderShare.batchShareInfo.orders);
  };
  $scope.orderShare.closeSharePage = function () {

    $scope.orderShare.mainShareShow = false;
    showMaskLayer(false);
  };
  $scope.orderShare.shareWithStaff = function () {
    $scope.orderShare.staffShareShow = true;
  };
  $scope.orderShare.shareWithEmail = function () {
    $scope.orderShare.staffShareShow = false;
  };
  $scope.orderShare.clickShare = function () {
    if (($scope.orderShare.staffShareShow && $scope.orderShare.staffRecipients.length <= 0) ||
      (!$scope.orderShare.staffShareShow && !$scope.orderShare.emailRecipients)) {
      //报错
      $scope.$emit(GlobalEvent.onShowAlert, "请选择员工或输入邮箱地址");
      return;
    }

    var recipientsArray = [];
    if ($scope.orderShare.staffShareShow)
      recipientsArray = $scope.orderShare.staffRecipients;
    else
      recipientsArray.push($scope.orderShare.emailRecipients);

    //正则表达式验证邮箱
    var emailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
    var allEmailRight = true;
    recipientsArray.every(function (emailAddress, index, arr) {
      if (!emailReg.test(emailAddress)) {
        console.log('invalid email address: ' + emailAddress);
        allEmailRight = false;
        return false;
      }
      else
        return true;
    });

    if (!allEmailRight) {
      $scope.$emit(GlobalEvent.onShowAlert, "邮箱地址不合法，请检查");
      return;
    }
    $scope.$emit(GlobalEvent.onShowLoading, true);

    if (!$scope.orderShare.staffShareShow) {
      $scope.orderShare.allRecipients = recipientsArray[0];
    }

    if (recipientsArray.length > 1)
      $scope.orderShare.suffix_customer = '等' + recipientsArray.length.toString() + '位客户';
    else
      $scope.orderShare.suffix_customer = '1位客户';

    OrderService.shareOrders(getOrderIds($scope.orderShare.orders), recipientsArray, !$scope.orderShare.staffShareShow)
      .then(function (data) {
        $scope.$emit(GlobalEvent.onShowLoading, false);

        if (data.err) {
          if (data.err.data === '550 Mailbox not found or access denied') {
            $scope.$emit(GlobalEvent.onShowAlert, "您输入的邮箱可能不存在或者拒绝接受信件！请检查邮箱是否正确，重新输入。");
          } else {
            $scope.$emit(GlobalEvent.onShowAlert, "发送邮件失败！请检查邮箱是否正确，重新输入。");
          }
        } else {
          if (data.totalReceptionsCount === data.successReceptions.length) {
            $scope.orderShare.editShareShow = false;
          } else {
            var message = '';
            if (data.invalidEmailReceptionsCount > 0) {
              message += ('邮箱验证：' + data.invalidEmailReceptionsCount + '个失败！');
            }

            if (data.failedReceptions.length > 0) {
              message += ('用户分享：' + data.failedReceptions.length + '个失败！');
            }

            if (data.successReceptions.length > 0) {
              message += ('成功分享的邮箱有：' + data.successReceptionsString + '的' + data.successReceptions.length + '个！');
            }

            $scope.$emit(GlobalEvent.onShowAlert, message);
          }

        }
      }, function (err) {
        $scope.$emit(GlobalEvent.onShowLoading, false);
        $scope.$emit(GlobalEvent.onShowAlert, "发送邮件失败");
      });
  };

  $scope.orderShare.cooperateCompany.clickSingleCompany = function (company) {
    $scope.orderShare.cooperateCompany.selectedCompanyStaffs = company.staffs;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;

    //当前选中的项
    $scope.orderShare.cooperateCompany.currentCompanyName = company.name;
  };
  $scope.orderShare.cooperateCompany.clickSingleStaff = function () {
    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;

  };
  $scope.orderShare.cooperateCompany.clickSelectAll = function () {
    //执行全选操作
    if (!$scope.orderShare.cooperateCompany.selectedCompanyStaffs || $scope.orderShare.cooperateCompany.selectedCompanyStaffs.length <= 0)
      return;

    $scope.orderShare.cooperateCompany.selectedCompanyStaffs.forEach(function (staff) {
      staff.isSelected = $scope.orderShare.cooperateCompany.isSelectedAll;
    });

    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //去掉反选
    $scope.orderShare.cooperateCompany.isInvertSelected = false;
  };
  $scope.orderShare.cooperateCompany.clickInvertSelect = function () {
    invertCurrentSelect($scope.orderShare.cooperateCompany.selectedCompanyStaffs);

    //计算全部选中的员工数量
    var allSelectedCompany = calculateAllCompanySelectedStaffs($scope.orderShare.cooperateCompany.allCompany);
    $scope.orderShare.cooperateCompany.allSelectedCount = allSelectedCompany.length;

    //计算是否已全选
    $scope.orderShare.cooperateCompany.isSelectedAll = calculateIsAllStaffSelected($scope.orderShare.cooperateCompany.selectedCompanyStaffs);
  };
  $scope.orderShare.cooperateCompany.clickClearAll = function () {
    //清除所有选择
    clearAllSelectedStaff($scope.orderShare.cooperateCompany.allCompany);

    //计算全部选中的数量， 计算是否全选，去掉反选
    $scope.orderShare.cooperateCompany.clickSingleStaff();
  };

  function displayWechatOrderShare(orders, event) {
    var orderInfos = generateWechatShareOrderInfos(orders);
    shareOrderByWechat(orderInfos, event);
  };

  function generateWechatShareOrderInfos(orders) {
    if (orders.length <= 0) {
      return [];
    }
    var orderArray = [];
    for (var i = 0; i < orders.length; i++) {
      var order = {
        _id: orders[i]._id,
        order_number: orders[i].columns.order_number
      };
      orderArray.push(order);
    }
    return orderArray;
  };

  function shareOrderByWechat(orderInfoArray, event) {
    var param = JSON.stringify(orderInfoArray);
    param = encodeURIComponent(param);

    var url = config.serverAddress + '/wechat_share_qrcode?order_array=' + param;
    openNewScreenWindow(url);
    stopBubble(event);
  };


  function openNewScreenWindow(url, name) {
    if (name == null || name == '')
      name = "WechatShare";

    var win = window.open(url, name);
    win.focus();

    return win;
  };

  function shareOrderByEmail(rowInfo, event) {
    var orders = [];
    orders.push(rowInfo);

    displayEmailOrderShare(orders);

    stopBubble(event);
  }

  function displayEmailOrderShare(orders) {
    $scope.$emit(GlobalEvent.onShowLoading, true);
    getCooperateCompanyInfo(function () {
      $scope.orderShare.orders = orders;
      $scope.orderShare.count = orders.length;
      $scope.orderShare.order_number_text = getOrderNumberText(orders);

      $scope.orderShare.mainShareShow = true;
      $scope.orderShare.editShareShow = true;
      $scope.orderShare.staffShareShow = true;
      $scope.orderShare.cooperateCompany.currentCompanyName = '';
      $scope.orderShare.cooperateCompany.selectedCompanyStaffs = '';

      showMaskLayer(true);
      $scope.$emit(GlobalEvent.onShowLoading, false);
    });
  }

  function getOrderNumberText(orders) {
    if (!orders.length || orders.length <= 0)
      return '';
    var orderNumberText = orders[0].columns.order_number;
    if (orders.length > 1)
      orderNumberText += '...';

    return orderNumberText;
  }

  function getOrderIds(orders) {
    if (!orders || orders.length <= 0)
      return '';

    var orderIds = [];
    for (var index = 0; index < orders.length; index++) {
      orderIds.push(orders[index]._id.toString());
    }

    return orderIds;
  }

  function calculateAllCompanySelectedStaffs(companys) {
    if (!companys || companys.length <= 0)
      return [];

    var staffs = [];
    $scope.orderShare.staffRecipients = [];
    $scope.orderShare.allRecipients = [];

    companys.forEach(function (company) {
      if (!company.staffs || company.staffs.length <= 0)
        return true;

      company.staffs.forEach(function (staff) {
        if (staff.isSelected) {
          staffs.push(staff);
          $scope.orderShare.staffRecipients.push(staff.username);
          $scope.orderShare.allRecipients.push(staff.nickname);
        }
      });
    });

    if ($scope.orderShare.allRecipients.length > 0) {
      $scope.orderShare.allRecipients = $scope.orderShare.allRecipients.join('、');
    }
    return staffs;
  }

  function calculateIsAllStaffSelected(companyStaffs) {
    if (!companyStaffs || companyStaffs.length <= 0)
      return false;

    var result = true;

    companyStaffs.every(function (staff, index, arr) {
      if (!staff.isSelected) {
        result = false;
        return false;
      }
      else
        return true;
    });

    return result;
  }

  function invertCurrentSelect(companyStaffs) {
    if (!companyStaffs || companyStaffs.length <= 0)
      return;

    companyStaffs.forEach(function (staff) {
      staff.isSelected = !staff.isSelected;
    });
  }

  function clearAllSelectedStaff(companys) {
    if (!companys || companys.length <= 0)
      return;

    companys.forEach(function (company) {
      if (!company.staffs || company.staffs.length <= 0)
        return true;

      company.staffs.forEach(function (staff) {
        staff.isSelected = false;
      });
    });

    return;
  }

  function getCooperateCompanyInfo(callback) {
    OrderService.getCooperateCompanys().then(function (data) {
      if (data.err)
        console.log(data.err);
      else {
        if (!data.companyIds || data.companyIds.length <= 0) {
          console.log('no cooperation companys');
          callback();
          return;
        }
        if (!data.staffs || data.staffs.length <= 0) {
          console.log('there are no users in cooperation companys');
          callback()
          return;
        }

        var allCompany = [];
        data.companyIds.forEach(function (partnerCompanyId) {
          var users = [];
          data.staffs.forEach(function (staff) {
            if (partnerCompanyId.toString() === staff.company._id.toString()) {
              staff.isSelected = false;
              users.push(staff);
            }
          });

          if (users.length > 0)
            allCompany.push({name: users[0].company.name, staffs: users});
        });

        $scope.orderShare.cooperateCompany.allCompany = allCompany;
      }
      callback();

    }, function (err) {
      console.log(err);
      callback();
    });
  }

  //</editor-fold desc='Share Order to others'>

  //搜素模块
  $scope.searchModule = {
    isShowHighSearch: false,
    showHighSearchHandle: '',
    hideHighSearchHandle: '',
    executeCompanyorDriver: '',
    receiver: '',
    goods_name: '',
    damaged: '不限',
    sender: '',
    description: '',
    order_number: '',
    searchHandle: '',
    isShowStatusSelect: false,
    isShowDamageSelect: false,
    showStatusSelect: '',
    showDamageSelect: '',
    statusItemClickHandle: '',
    damageItemClickHandle: '',

    createTimeRange: '',
    pickUpTimeRange: '',
    deliveryTimeRange: '',
    cleanDeliveryTime: '',
    cleanPickupTime: '',

    currentLabel: 'assign',
    changeLabel: '',
    statusOptions: [{name: '未分配', value: ['unAssigned', 'assigning'], isSelected: true},
      {name: '未提货', value: ['unPickupSigned', 'unPickuped'], isSelected: true},
      {name: '未交货', value: ['unDeliverySigned', 'unDeliveried'], isSelected: true},
      {name: '已完成', value: ['completed'], isSelected: true},
      {name: '已撤销', value: ['deleted'], isSelected: false}],

    dateOptions: {
      locale: {
        fromLabel: "起始时间",
        toLabel: "结束时间",
        cancelLabel: '取消',
        applyLabel: '确定',
        customRangeLabel: '区间',
        daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
        firstDay: 1,
        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
          '十月', '十一月', '十二月']
      },
      timePicker: true,
      timePicker12Hour: false,
      timePickerIncrement: 1,
      separator: " ~ ",
      format: 'YY/MM/DD HH:mm'
    }
  };

  $scope.searchModule.showHighSearchHandle = function () {
    $scope.searchModule.isShowHighSearch = true;
  };
  $scope.searchModule.hideHighSearchHandle = function () {
    $scope.searchModule.isShowHighSearch = false;
  };

  $scope.searchModule.searchHandle = function () {
    $scope.orders.orderList.pagination.currentPage = 1;

    getOrderList();
  };

  $scope.searchModule.showStatusSelect = function (event) {
    $scope.searchModule.isShowStatusSelect = !$scope.searchModule.isShowStatusSelect;
    $scope.searchModule.isShowDamageSelect = false;

    stopBubble(event);
  };
  $scope.searchModule.showDamageSelect = function (event) {
    $scope.searchModule.isShowDamageSelect = !$scope.searchModule.isShowDamageSelect;
    $scope.searchModule.isShowStatusSelect = false;

    stopBubble(event);
  };

  $scope.searchModule.statusItemClickHandle = function (statusOption, event) {
    statusOption.isSelected = !statusOption.isSelected;

    if (statusOption.isSelected && statusOption.name === '已撤销') {
      $scope.searchModule.statusOptions.forEach(function (optionItem) {
        optionItem.isSelected = false;
      });

      statusOption.isSelected = true;
    }
    else if (statusOption.name !== '已撤销') {
      var deleteOption = $scope.searchModule.statusOptions.zzGetByAttribute('name', '已撤销');
      deleteOption[0].isSelected = false;
    }

    stopBubble(event);
  };
  $scope.searchModule.damageItemClickHandle = function (damageString) {
    $scope.searchModule.damaged = damageString;
  };

  $scope.searchModule.cleanDeliveryTime = function (event) {
    $scope.searchModule.deliveryTimeRange = '';

    stopBubble(event)
  };

  $scope.searchModule.cleanPickupTime = function (event) {
    $scope.searchModule.pickUpTimeRange = '';

    stopBubble(event)
  };

  $scope.searchModule.changeLabel = function (label) {
    if ($scope.searchModule.currentLabel === label) {
      return;
    }

    $scope.searchModule.currentLabel = label || 'assign';

    $scope.orders.orderList.pagination.currentPage = 1;

    getOrderList();
  };

  $scope.$on(GlobalEvent.onBodyClick, function () {
    $scope.searchModule.isShowStatusSelect = false;
    $scope.searchModule.isShowDamageSelect = false;
  });
  $scope.formatTime = function (time, format, defaultText) {
    if (!time) {
      return defaultText;
    }
    else {
      return new Date(time).Format(format);
    }
  };

  function getSearchCondition() {
    if (!$scope.searchModule)
      return;

    var searchArray = [];
    var statusArray = [];
    var isIncludeDeleteOrder = false;
    $scope.searchModule.statusOptions.forEach(function (statusOption) {
      if (statusOption.isSelected) {
        if (statusOption.name === '已撤销') {
          searchArray.push({
            key: 'isDeleted',
            value: true
          });

          isIncludeDeleteOrder = true;
        }
        else {
          statusArray = statusArray.concat(statusOption.value);
        }
      }
    });
    if (!isIncludeDeleteOrder) {
      searchArray.push({key: 'isDeleted', value: false});
    }

    if (statusArray.length > 0) {
      searchArray.push({key: 'order_status', value: statusArray});
    }

    if ($scope.searchModule.createTimeRange) {

      searchArray.push({
        key: 'createTimeStart',
        value: moment($scope.searchModule.createTimeRange.startDate).toISOString()
      });
      searchArray.push({
        key: 'createTimeEnd',
        value: moment($scope.searchModule.createTimeRange.endDate).toISOString()
      });
    }

    if ($scope.searchModule.deliveryTimeRange) {

      searchArray.push({
        key: 'deliveryTimeStart',
        value: moment($scope.searchModule.deliveryTimeRange.startDate).toISOString()
      });
      searchArray.push({
        key: 'deliveryTimeEnd',
        value: moment($scope.searchModule.deliveryTimeRange.endDate).toISOString()
      });
    }

    if ($scope.searchModule.receiver) {
      searchArray.push({
        key: 'receiver',
        value: $scope.searchModule.receiver
      });
    }
    if ($scope.searchModule.goods_name) {
      searchArray.push({
        key: 'goods_name',
        value: $scope.searchModule.goods_name
      });
    }
    if ($scope.searchModule.damaged && $scope.searchModule.damaged !== '不限') {
      searchArray.push({
        key: 'damaged',
        value: $scope.searchModule.damaged === '有' ? true : false
      });
    }
    if ($scope.searchModule.pickUpTimeRange) {
      searchArray.push({
        key: 'pickupTimeStart',
        value: moment($scope.searchModule.pickUpTimeRange.startDate).toISOString()
      });
      searchArray.push({
        key: 'pickupTimeEnd',
        value: moment($scope.searchModule.pickUpTimeRange.endDate).toISOString()
      });
    }

    if ($scope.searchModule.sender) {
      searchArray.push({
        key: 'sender',
        value: $scope.searchModule.sender
      });
    }
    if ($scope.searchModule.description) {
      searchArray.push({
        key: 'description',
        value: $scope.searchModule.description
      });
    }

    if ($scope.searchModule.order_number) {
      searchArray.push({
        key: 'order_number',
        value: $scope.searchModule.order_number
      });
    }

    if ($scope.searchModule.executeCompanyorDriver) {
      searchArray.push({
        key: 'executor',
        value: $scope.searchModule.executeCompanyorDriver
      });
    }
    if ($scope.searchModule.currentLabel) {
      searchArray.push({
        key: 'viewer',
        value: $scope.searchModule.currentLabel
      });
    }


    return searchArray;
  };

  getUserProfile(function () {
    var currentUser = Auth.getUser();
    if (currentUser && currentUser.roles) {
      if (currentUser.roles.indexOf('admin') > -1) {
        $scope.orderDetailInfo.isAdmin = true;
      }
    }

    fillDisplayFields();
    getOrderList(); //首次获取订单信息
  });

  $scope.verifyOrder = function (type, price, raise, reason, orderDetail) {
    if (orderDetail.tender[type]) {
      return;
    }
    OrderService.verifyOrder({
      type: type,
      price: price,
      raise: raise,
      reason: reason,
      order_id: orderDetail.order_id
    }).then(function (data) {
      console.log(data);
      if (!data.err) {
        $scope.$emit(GlobalEvent.onShowAlert, '审核通过', function () {
          $state.go('order_operation', {}, {reload: true});
        });
      }
    }, function (err) {
      console.log(err);
    });
  }

};
angular.module('zhuzhuqs').controller('OrderModifyAssignController',
  ['$scope', '$state', '$stateParams', 'GlobalEvent', 'OrderService', 'CompanyService', 'OrderError',
    function ($scope, $state, $stateParams, GlobalEvent, OrderService, CompanyService, OrderError) {
      var currentOrderId = $stateParams.id;
      if (!currentOrderId) {
        return;
      }

      $scope.order = {};
      $scope.assign_infos = [];
      $scope.selectData = {};
      $scope.rangeTimePanel = {};

      loadPageData();
      function loadPageData() {
        $scope.$emit(GlobalEvent.onShowLoading, true);
        loadPartners(function (partners) {
          loadDrivers(function (drivers) {
            var selectData = generateSelectData(partners, drivers);
            $scope.selectData = selectData;
            $scope.rangeTimePanel = $scope.zzRangeDatePicker;
            loadOrderInfo(currentOrderId, selectData.executeSelectData, selectData.executeWarehouseSelectData, function (err) {
              if (err) {
                return handleCompanyError(err);
              }

              $scope.$emit(GlobalEvent.onShowLoading, false);
              return;
            });
          });
        });
      };
      function sortPartnerCompanies(companyA, companyB) {
        var a = companyA.partner._id ? companyA.partner : companyA.company;

        if (a.auth_status && a.auth_status === 'authed') {
          return false;
        }

        return true;
      }
      function loadPartners(callback) {
        CompanyService.getPartnerCompanys().then(function (data) {
          if (data.err) {
            return handleCompanyError(data.err.type);
          }
          data.partnerCompany.sort(sortPartnerCompanies);
          if (callback)
            return callback(data.partnerCompany);


          return;
        }, function (err) {
        });
      };

      //计算好评率和等级
      function calculateEvaluation(companyDrivers) {
        if (!companyDrivers || companyDrivers.length <= 0) {
          return;
        }
        companyDrivers.forEach(function (companyDriver) {
          var evaluation = companyDriver.driver.all_count.evaluationCount;
          var totalCount = evaluation.good + evaluation.general + evaluation.bad;
          if (totalCount < 10) {
            companyDriver.driver.goodEvaluation = 0;
          }
          else {
            companyDriver.driver.goodEvaluation = Math.ceil(evaluation.good * 100 / totalCount);
          }

          if (companyDriver.driver.goodEvaluation >= 80) {
            companyDriver.driver.evaluationLevel = 3;
          }
          else if (companyDriver.driver.goodEvaluation >=60 && companyDriver.driver.goodEvaluation < 80) {
            companyDriver.driver.evaluationLevel = 2;
          }
          else {
            companyDriver.driver.evaluationLevel = 1;
          }

        });
      }
      function sortPartnerDrivers(driverA, driverB) {
        if (driverA.driver.evaluationLevel > driverB.driver.evaluationLevel) {
          return false;
        }
        else if (driverA.driver.evaluationLevel === driverB.driver.evaluationLevel) {
          if (driverA.driver.all_count.orderCount > driverB.driver.all_count.orderCount) {
            return false;
          }
          return true;
        }
        else {
          return true;
        }
      }

      function loadDrivers(callback) {
        CompanyService.getPartnerDrivers().then(function (data) {
          console.log(data);
          if (data.err) {
            return handleCompanyError(data.err.type);
          }

          calculateEvaluation(data.driverCompanys);
          data.driverCompanys.sort(sortPartnerDrivers);
          if (callback)
            return callback(data.driverCompanys);

          return;
        }, function (err) {

        });
      };
      function loadOrderInfo(orderId, executeSelectData, executeWarehouseSelectData, callback) {
        OrderService.getOrderById(orderId)
          .then(function (data) {
            $scope.order = data;
            for (var index = 0; index < data.assigned_infos.length; index++) {
              $scope.assign_infos.push(clone(data.assigned_infos[index]));
            }

            UpdateAssignedInfos($scope.assign_infos, executeSelectData, executeWarehouseSelectData);

            if (callback) {
              callback();
            }

          }, function (err) {
            console.log(err);
            return callback(err);
          })
      };
      function UpdateAssignedInfos(assign_infos, executeSelectData, executeWarehouseSelectData) {
        if (assign_infos.length <= 0) {
          return;
        }

        for (var i = 0; i <= assign_infos.length; i++) {
          updateAssignInfo(assign_infos[i], executeSelectData, executeWarehouseSelectData);
        }
      };
      function updateAssignInfo(assignInfo, executeSelectData, executeWarehouseSelectData) {
        if (!assignInfo)
          return;

        assignInfo.onSelected = updateType;

        assignInfo.pickupTimeRange = {
          startDate: assignInfo.pickup_start_time ? new Date(assignInfo.pickup_start_time) : null,
          endDate: assignInfo.pickup_end_time ? new Date(assignInfo.pickup_end_time) : null
        };

        assignInfo.deliveryTimeRange = {
          startDate: assignInfo.delivery_start_time ? new Date(assignInfo.delivery_start_time) : null,
          endDate: assignInfo.delivery_end_time ? new Date(assignInfo.delivery_end_time) : null
        };

        assignInfo.defaultContent = '搜索合作公司或司机';

        if (assignInfo.type === 'driver') {
          assignInfo.options = executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.options);
        } else if (assignInfo.type === 'warehouse') {
          assignInfo.options = executeWarehouseSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.options);
          assignInfo.defaultContent = '搜索仓库管理员';
        } else {
          assignInfo.options = executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.company_id, assignInfo.options);
        }
      };
      function generateSelectData(partners, drivers) {
        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {

          var currentPartner = partners[i];
          executeSelectData.push({
            key: currentPartner.partner._id ? currentPartner.partner._id : currentPartner.company._id,
            value: currentPartner.partner.name ? currentPartner.partner.name : currentPartner.company.name,
            authed: currentPartner.partner.auth_status ? (currentPartner.partner.auth_status === 'authed') : (currentPartner.company.auth_status === 'authed'),
            group_type: 'company'
          });
        }
        ;

        executeSelectData.push({key: null, value: '合作司机'});
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          executeSelectData.push({
            key: drivers[i].driver._id,
            value: ((drivers[i].driver.nickname === '' ? '匿名' : drivers[i].driver.nickname) + '(' + drivers[i].driver.all_count.orderCount + '单)') + '/'
            + (drivers[i].driver.plate_numbers.length > 0 ? drivers[i].driver.plate_numbers[0] : '未知车牌') + '/'
            + drivers[i].driver.username,
            goodEvaluation: drivers[i].driver.goodEvaluation,
            group_type: 'driver'
          });
          executeWarehouseSelectData.push({
            key: drivers[i].driver._id,
            value: (drivers[i].driver.nickname === '' ? '匿名' : drivers[i].driver.nickname)
            + '/' + drivers[i].driver.username,
            group_type: 'warehouse'
          });
        }
        ;

        return {
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };

      };
      function clone(oldObject) {
        if (typeof(oldObject) != 'object') return oldObject;
        if (oldObject == null) return oldObject;

        var newObject = new Object();
        for (var i in oldObject) {
          newObject[i] = clone(oldObject[i]);
        }

        return newObject;
      }

      function checkChangeAssignInfos() {
        var newAssignInfos = [];
        var isChanged = false;

        for (var index = 0; index < $scope.assign_infos.length; index++) {
          var assignInfo = $scope.assign_infos[index];
          var oldAssignInfo = $scope.order.assigned_infos[index];
          if (checkAssignChanged(assignInfo, oldAssignInfo)) {
            isChanged = true;
          }
        }

        return {newAssignInfos:$scope.assign_infos,isChanged:isChanged};
      }


      //function checkIsRightAssignInfo() {
      //  var isRightInfo = false;
      //
      //  for(var index = 0; index < $scope.assign_infos.length; index ++) {
      //    var assignInfo = $scope.assign_infos[index];
      //
      //    if (assignInfo.currentChoice) {
      //      isRightInfo = true;
      //      break;
      //    }
      //  }
      //
      //  return isRightInfo;
      //}

      function checkAssignChanged(newAssignInfo, oldAssignInfo) {
        if (newAssignInfo.pickup_contact_name !== oldAssignInfo.pickup_contact_name) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_phone !== oldAssignInfo.pickup_contact_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_mobile_phone !== oldAssignInfo.pickup_contact_mobile_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_address !== oldAssignInfo.pickup_contact_address) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.pickup_contact_email !== oldAssignInfo.pickup_contact_email) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (newAssignInfo.delivery_contact_name !== oldAssignInfo.delivery_contact_name) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_phone !== oldAssignInfo.delivery_contact_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_mobile_phone !== oldAssignInfo.delivery_contact_mobile_phone) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_address !== oldAssignInfo.delivery_contact_address) {
          newAssignInfo.basicInfoChanged = true;
        }
        if (newAssignInfo.delivery_contact_email !== oldAssignInfo.delivery_contact_email) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.pickup_start_time && !oldAssignInfo.pickup_start_time) {
        }
        else if (!newAssignInfo.pickup_start_time || !oldAssignInfo.pickup_start_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.pickup_start_time).toString() !== new Date(oldAssignInfo.pickup_start_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.pickup_end_time && !oldAssignInfo.pickup_end_time) {
        }
        else if (!newAssignInfo.pickup_end_time || !oldAssignInfo.pickup_end_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.pickup_end_time).toString() !== new Date(oldAssignInfo.pickup_end_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.delivery_start_time && !oldAssignInfo.delivery_start_time) {
        }
        else if (!newAssignInfo.delivery_start_time || !oldAssignInfo.delivery_start_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.delivery_start_time).toString() !== new Date(oldAssignInfo.delivery_start_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (!newAssignInfo.delivery_end_time && !oldAssignInfo.delivery_end_time) {
        }
        else if (!newAssignInfo.delivery_end_time || !oldAssignInfo.delivery_end_time) {
          newAssignInfo.basicInfoChanged = true;
        }
        else if (new Date(newAssignInfo.delivery_end_time).toString() !== new Date(oldAssignInfo.delivery_end_time).toString()) {
          newAssignInfo.basicInfoChanged = true;
        }

        if (newAssignInfo.driver_id !== oldAssignInfo.driver_id) {
          newAssignInfo.executorChanged = true;
        }
        else if (newAssignInfo.company_id !== oldAssignInfo.company_id) {
          newAssignInfo.executorChanged = true;
        }

        if (newAssignInfo.basicInfoChanged || newAssignInfo.executorChanged) {
          return true;
        }

        return false;
      }

      //function checkAssignInfo(){
      //  var isChanged = false;
      //
      //  for(var index = 0; index < $scope.assign_infos.length; index ++) {
      //    var newAssignInfo = $scope.assign_infos[index];
      //    var oldAssignInfo = $scope.order.assigned_infos[index];
      //
      //    if (newAssignInfo.pickup_contact_name !== oldAssignInfo.pickup_contact_name){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_phone !== oldAssignInfo.pickup_contact_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_mobile_phone !== oldAssignInfo.pickup_contact_mobile_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_address !== oldAssignInfo.pickup_contact_address){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.pickup_contact_email !== oldAssignInfo.pickup_contact_email){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (newAssignInfo.delivery_contact_name !== oldAssignInfo.delivery_contact_name){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_phone !== oldAssignInfo.delivery_contact_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_mobile_phone !== oldAssignInfo.delivery_contact_mobile_phone){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_address !== oldAssignInfo.delivery_contact_address){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    if (newAssignInfo.delivery_contact_email !== oldAssignInfo.delivery_contact_email){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.pickup_start_time && !oldAssignInfo.pickup_start_time){
      //    }
      //    else if (!newAssignInfo.pickup_start_time || !oldAssignInfo.pickup_start_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.pickup_start_time).toString() !== new Date(oldAssignInfo.pickup_start_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.pickup_end_time && !oldAssignInfo.pickup_end_time){
      //    }
      //    else if (!newAssignInfo.pickup_end_time || !oldAssignInfo.pickup_end_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.pickup_end_time).toString() !== new Date(oldAssignInfo.pickup_end_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.delivery_start_time && !oldAssignInfo.delivery_start_time){
      //    }
      //    else if (!newAssignInfo.delivery_start_time || !oldAssignInfo.delivery_start_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.delivery_start_time).toString() !== new Date(oldAssignInfo.delivery_start_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (!newAssignInfo.delivery_end_time && !oldAssignInfo.delivery_end_time){
      //    }
      //    else if (!newAssignInfo.delivery_end_time || !oldAssignInfo.delivery_end_time){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //    else if (new Date(newAssignInfo.delivery_end_time).toString() !== new Date(oldAssignInfo.delivery_end_time).toString()){
      //      newAssignInfo.basicInfoChanged = true;
      //    }
      //
      //    if (newAssignInfo.driver_id !== oldAssignInfo.driver_id) {
      //      newAssignInfo.executorChanged = true;
      //    }
      //    else if (newAssignInfo.company_id !== oldAssignInfo.company_id) {
      //      newAssignInfo.executorChanged = true;
      //    }
      //
      //    if (newAssignInfo.basicInfoChanged || newAssignInfo.executorChanged) {
      //      isChanged = true;
      //    }
      //
      //  }
      //
      //  return isChanged;
      //}

      function handleOrderError(errType) {
        if (OrderError[errType]) {
          $scope.$emit(GlobalEvent.onShowAlert, OrderError[errType]);
        }
        else {
          $scope.$emit(GlobalEvent.onShowAlert, "未知错误！请联系管理员");
        }
      }

      $scope.contactEdit = {
        isOpen: false,
        current: {
          assignInfo: null,
          pickupName: '',
          deliveryName: '',
          pickupMobilePhone: '',
          deliveryMobilePhone: '',
          pickupPhone: '',
          deliveryPhone: ''
        }
      };

      $scope.changeType = function (assignInfo) {
        assignInfo.currentText = '';
        assignInfo.currentChoice = null;

        if (assignInfo.type === 'driver' || assignInfo.type === 'company') {
          assignInfo.type = 'warehouse';
          assignInfo.defaultContent = '搜索仓库管理员';
          assignInfo.options = $scope.selectData.executeWarehouseSelectData
        }
        else {
          assignInfo.type = 'driver';
          assignInfo.defaultContent = '搜索合作公司或司机';
          assignInfo.options = $scope.selectData.executeSelectData
        }
      };

      $scope.editAssignDetailInfo = function (assignInfo) {
        $scope.contactEdit.isOpen = true;
        $scope.contactEdit.current.assignInfo = assignInfo;
        $scope.contactEdit.current.pickupName = assignInfo.pickup_contact_name;
        $scope.contactEdit.current.deliveryName = assignInfo.delivery_contact_name;
        $scope.contactEdit.current.pickupMobilePhone = assignInfo.pickup_contact_mobile_phone;
        $scope.contactEdit.current.deliveryMobilePhone = assignInfo.delivery_contact_mobile_phone;
        $scope.contactEdit.current.pickupPhone = assignInfo.pickup_contact_phone;
        $scope.contactEdit.current.deliveryPhone = assignInfo.delivery_contact_phone;
      };

      $scope.closeAssignDetailInfo = function () {
        $scope.contactEdit.isOpen = false;
      };

      $scope.saveAssignDetailInfo = function () {
        $scope.contactEdit.current.assignInfo.pickup_contact_name = $scope.contactEdit.current.pickupName;
        $scope.contactEdit.current.assignInfo.pickup_contact_mobile_phone = $scope.contactEdit.current.pickupMobilePhone;
        $scope.contactEdit.current.assignInfo.pickup_contact_phone = $scope.contactEdit.current.pickupPhone;
        $scope.contactEdit.current.assignInfo.delivery_contact_name = $scope.contactEdit.current.deliveryName;
        $scope.contactEdit.current.assignInfo.delivery_contact_mobile_phone = $scope.contactEdit.current.deliveryMobilePhone;
        $scope.contactEdit.current.assignInfo.delivery_contact_phone = $scope.contactEdit.current.deliveryPhone;
        $scope.contactEdit.isOpen = false;
      };

      $scope.cancelAndBack = function () {
        $state.go('order_follow', {}, {reload: true});
      };


      $scope.openPickupRangeDatePicker = function (assignInfo) {

        if (!$scope.rangeTimePanel)
          return;

        if ($scope.rangeTimePanel.isShow()) {
          $scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          $scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          $scope.rangeTimePanel.show();
        }

        $scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.pickupTimeRange = dateRange;
          assignInfo.pickup_start_time = moment(dateRange.startDate).toISOString();
          assignInfo.pickup_end_time = moment(dateRange.endDate).toISOString();
          console.log('changed');
          console.log(assignInfo.pickup_start_time);
          console.log(assignInfo.pickup_end_time);
          $scope.rangeTimePanel.hide();
        });
      };
      $scope.openDeliveryRangeDatePicker = function (assignInfo) {

        if (!$scope.rangeTimePanel)
          return;

        if ($scope.rangeTimePanel.isShow()) {
          $scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          $scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          $scope.rangeTimePanel.show();
        }

        $scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.deliveryTimeRange = dateRange;
          assignInfo.delivery_start_time = moment(dateRange.startDate).toISOString();
          assignInfo.delivery_end_time = moment(dateRange.endDate).toISOString();

          $scope.rangeTimePanel.hide();
        });
      };

      $scope.submitOrderAssignInfos = function () {
        var info = checkChangeAssignInfos();
        console.log(info);

        if (!info.isChanged) {
          $state.go('order_follow', {}, {reload: true});
          return;
        }

        $scope.$emit(GlobalEvent.onShowLoading, true);

        info.newAssignInfos.forEach(function (assignInfo) {
          delete assignInfo.$$hashKey;
          delete assignInfo.currentChoice;
          delete assignInfo.options;
        });

        OrderService.updateOrderAssign($scope.order._id.toString(), info.newAssignInfos).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);

          if (data.err) {
            handleOrderError(data.err.type);
            return;
          }
          $scope.$emit(GlobalEvent.onShowAlert, '修改成功');

          //保存
          $state.go('order_follow', {}, {reload: true});

        }, function (err) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          return handleOrderError(err.type);
        });
      };

      $scope.dateTransport = function (dateString) {
        return new Date(dateString);
      };

      function updateType(option) {
        if (!option) {
          this.company_id = '';
          this.driver_id = '';
          this.partner_name = '';

          return;
        }

        if (option.group_type === 'driver' || option.group_type === 'warehouse') {
          this.driver_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
        } else if (option.group_type === 'company') {
          this.company_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
        }
        return;
      };

      function findOption(key, options) {
        var result = null;
        for (var i = 0; i < options.length; i++) {
          if (options[i].key === key)
            result = options[i];
        }
        return result;
      };

      function handleCompanyError(errType) {
        console.log(errType);
      };

    }
  ])
;

angular.module('zhuzhuqs').controller('OrderOperationController',
  ['$scope', '$stateParams', '$state', '$timeout', 'CompanyService', 'OrderService', 'SalesmanService', 'OrderError', 'GroupError', 'GlobalEvent', 'UserProfileService',
    function ($scope, $stateParams, $state, $timeout, CompanyService, OrderService, SalesmanService, OrderError, GroupError, GlobalEvent, UserProfileService) {

      $scope.isCurrentLabel = function (label) {
        return window.location.hash.indexOf(label) > -1;
      };

      $scope.changeLabel = function (state) {
        $state.go(state);
      };


      $scope.orderCount = {
        assign: 0,
        onway: 0
      };

      var timer = null;

      function getOrderOperationCount(callback) {
        OrderService.getOperationOrderCount().then(function (data) {
          console.log(data);

          if (!data || data.err) {
            return callback();
          }

          if (data.assignCount >= 0) {
            $scope.orderCount.assign = data.assignCount;
            $scope.orderCount.onway = data.onwayCount;
          }

          return callback();

        }, function (err) {
          return callback();
        });
      }

      function updateOrderOperationCount() {
        timer = $timeout(function () {
          getOrderOperationCount(function () {
            updateOrderOperationCount();
          });
        }, 1000 * 10);
      }


      //第一次获取
      getOrderOperationCount(function(){});
      //定时获取
      updateOrderOperationCount();


      $scope.$on("$destroy", function () {
        if (timer) {
          $timeout.cancel(timer);
        }
      });

    }]);

/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderOperationFollowCompletedController',
  ['$state', '$scope', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer', 'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper) {

      var statusArray = ['completed'];


      var configuration = {
        selectOptions: [
          {
            key: '运单号',
            value: {
              name: '运单号',
              value: 'order_number',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '参考单号',
            value: {
              name: '参考单号',
              value: 'ref_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '订单号',
            value: {
              name: '订单号',
              value: 'original_order_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: false
          },
          {
            key: '货物名称',
            value: {
              name: '货物名称',
              value: 'goods_name',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '承运商',
            value: {
              name: '承运商',
              value: 'execute_company',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '司机',
            value: {
              name: '司机',
              value: 'execute_driver',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '发货方',
            value: {
              name: '发货方',
              value: 'sender_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '收货方',
            value: {
              name: '收货方',
              value: 'receiver_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '货损信息',
            value: {
              name: '货损信息',
              value: 'damage',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '备注',
            value: {
              name: '备注',
              value: 'description',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '状态',
            value: {
              name: '状态',
              value: 'status',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '分配时间',
            value: {
              name: '分配时间',
              value: 'assign_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '进场时间',
            value: {
              name: '进场时间',
              value: 'entrance_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '中途事件',
            value: {
              name: '中途事件',
              value: 'halfway',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '司机确认',
            value: {
              name: '司机确认',
              value: 'confirm',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          }],
        getOrderList: function (currentPage, limit, sortName, sortValue, searchArray) {
          searchArray.push({key: 'order_status', value: statusArray});
          for (var i = 0; i<searchArray.length; i++) {
            if (searchArray[i].key === 'order_status') {
              searchArray[i].value = statusArray;
              break;
            }
          }

          return OrderService.getAllOrders(currentPage, limit, sortName, sortValue, searchArray);
        }
      };

      new OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration);
    }

  ]);

/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderOperationFollowOnWayController',
  ['$state', '$scope', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer', 'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper) {

      var statusArray = ['assigning','unPickupSigned', 'unPickuped','unDeliverySigned', 'unDeliveried'];

      var configuration = {
        selectOptions: [
          {
            key: '运单号',
            value: {
              name: '运单号',
              value: 'order_number',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '参考单号',
            value: {
              name: '参考单号',
              value: 'ref_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '订单号',
            value: {
              name: '订单号',
              value: 'original_order_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: false
          },
          {
            key: '货物名称',
            value: {
              name: '货物名称',
              value: 'goods_name',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '承运商',
            value: {
              name: '承运商',
              value: 'execute_company',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '司机',
            value: {
              name: '司机',
              value: 'execute_driver',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '发货方',
            value: {
              name: '发货方',
              value: 'sender_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '收货方',
            value: {
              name: '收货方',
              value: 'receiver_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '货损信息',
            value: {
              name: '货损信息',
              value: 'damage',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '备注',
            value: {
              name: '备注',
              value: 'description',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '状态',
            value: {
              name: '状态',
              value: 'status',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '分配时间',
            value: {
              name: '分配时间',
              value: 'assign_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '进场时间',
            value: {
              name: '进场时间',
              value: 'entrance_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '中途事件',
            value: {
              name: '中途事件',
              value: 'halfway',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '司机确认',
            value: {
              name: '司机确认',
              value: 'confirm',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          }],
        getOrderList: function (currentPage, limit, sortName, sortValue, searchArray) {

          searchArray.push({key: 'order_status', value: statusArray});
          for (var i = 0; i<searchArray.length; i++) {
            if (searchArray[i].key === 'order_status') {
              searchArray[i].value = statusArray;
              break;
            }
          }

          return OrderService.getAllOrders(currentPage, limit, sortName, sortValue, searchArray);
        }
      };

      new OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration);
    }

  ]);

/**
 * Created by ZhangXuedong on 2016/10/18.
 */
(function () {
  'use strict';

  var module = angular.module('ae-datetimepicker', []);

  module.directive('datetimepicker', [
    '$timeout',
    function ($timeout) {
      return {
        restrict: 'EA',
        require: 'ngModel',
        scope: {
          options: '=?',
          onChange: '&?',
          onClick: '&?'
        },
        link: function ($scope, $element, $attrs, ngModel) {
          var dpElement = $element.parent().hasClass('input-group') ? $element.parent() : $element;

          $scope.$watch('options', function (newValue) {
            var dtp = dpElement.data('DateTimePicker');
            $.map(newValue, function (value, key) {
              dtp[key](value);
            });
          });

          ngModel.$render = function () {
            if (!!ngModel.$viewValue) {
              dpElement.data('DateTimePicker').date(ngModel.$viewValue);
            } else {
              dpElement.data('DateTimePicker').date(null);
            }
          };

          dpElement.on('dp.change', function (e) {
            $timeout(function () {
              if (e.date !== 'undefined') {
                $scope.$apply(function () {
                  ngModel.$setViewValue(e.date);
                });
                if (typeof $scope.onChange === 'function') {
                  $scope.onChange();
                }
              }
            });
          });

          dpElement.on('click', function () {
            $timeout(function () {
              if (typeof $scope.onClick === 'function') {
                $scope.onClick();
              }
            });
          });

          dpElement.datetimepicker($scope.options);
          $timeout(function () {
            if (!!ngModel.$viewValue) {
              if (!moment.isMoment(ngModel.$viewValue)) {
                ngModel.$setViewValue(moment($scope.date));
              }
              dpElement.data('DateTimePicker').date(ngModel.$viewValue);
            }
          });
        }
      };
    }
  ]);
})();
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
angular.module('zhuzhuqs').directive('zzLoading', function () {
  return {
    restrict: 'A',
    template: '<div class="zz-loading-layer" ng-if="showLoading">' +
    '<div class="zz-loading-info"> ' +
    '<img ng-src="images/global/load.gif"/>' +
    ' </div> </div>',
    replace: true
  }
});
angular.module('zhuzhuqs').directive('zzMasking', function () {
  return {
    restrict: 'A',
    template: '<div class="zz-masking-layer" ng-if="showMasking"></div>',
    replace: true
  }
});
/**
 * Created by liekkas.zeng on 2015/1/7.
 */
angular.module('ng-echarts',[])
.directive('ngEcharts',[function(){
  return {
    link: function(scope,element,attrs,ctrl){
      function refreshChart(){
        var theme = (scope.config && scope.config.theme)
          ? scope.config.theme : 'default';
        var chart = echarts.init(element[0],theme);
        if(scope.config && scope.config.dataLoaded === false){
          chart.showLoading();
        }

        if(scope.config && scope.config.dataLoaded){
          chart.setOption(scope.option);
          chart.resize();
          chart.hideLoading();
        }

        if(scope.config && scope.config.event){
          if(angular.isArray(scope.config.event)){
            angular.forEach(scope.config.event,function(value,key){
              for(var e in value){
                chart.on(e,value[e]);
              }
            });
          }
        }
      };

      //自定义参数 - config
      // event 定义事件
      // theme 主题名称
      // dataLoaded 数据是否加载

      scope.$watch(
        function () { return scope.config; },
        function (value) {if (value) {refreshChart();}},
        true
      );

      // //图表原生option
      scope.$watch(
        function () { return scope.option; },
        function (value) {if (value) {refreshChart();}},
        true
      );
    },
    scope:{
      option:'=ecOption',
      config:'=ecConfig'
    },
    restrict:'EA'
  }
}]);
/**
 * function: 分页UI
 * author: 缪跃跃
 * url: http://www.miaoyueyue.com
 * email: miaoyaoyao01@163.com
 * name: self.pagination
 * Version: 0.0.2
 * Options:
 *  <self-pagination conf="paginationConf"></self-pagination>
 *  zhuzhuqs.controller('TestController', function($scope) {
 *    $scope.paginationConf = {
 *      currentPage: 1,
 *      totalItems: 200,
 *      itemsPerPage: 15,
 *      pagesLength: 15,
 *      perPageOptions: [10, 20, 30, 40, 50],
 *      rememberPerPage: 'perPageItems',
 *      onChange: function () {
 *        //to do sometings
 *      }
 *    }
 *  }
 */

zhuzhuqs.directive('selfPagination',[function(){
  return {
    restrict: 'EA',
    template: '<div class="page-list">' +
    '<ul class="pagination" ng-show="conf.totalItems > 0">' +
    '<li ng-class="{disabled: conf.currentPage == 1}" ng-click="prevPage()"><span>&laquo;</span></li>' +
    '<li ng-repeat="item in pageList track by $index" ng-class="{active: item == conf.currentPage, separate: item == \'...\'}" ' +
    'ng-click="changeCurrentPage(item)">' +
    '<span>{{ item }}</span>' +
    '</li>' +
    '<li ng-class="{disabled: conf.currentPage == conf.numberOfPages}" ng-click="nextPage()"><span>&raquo;</span></li>' +
    '</ul>' +
    '<div class="page-total" ng-show="conf.totalItems > 0">' +
    '第<input type="text" ng-model="jumpPageNum"  ng-keyup="jumpToPage($event)"/>页 ' +
    '每页<select ng-model="conf.itemsPerPage" ng-options="option for option in conf.perPageOptions " ng-change="changeItemsPerPage()"></select>' +
    '共<strong>{{ conf.totalItems }}</strong>条' +
    '</div>' +
    '<div class="no-items" ng-show="conf.totalItems <= 0">暂无数据</div>' +
    '</div>',
    replace: true,
    scope: {
      conf: '='
    },
    link: function(scope, element, attrs){

      // 变更当前页
      scope.changeCurrentPage = function(item){
        if(item == '...'){
          return;
        }else{
          if (scope.conf.currentPage != item) {
            scope.conf.currentPage = item;

            if(scope.conf.onChange){
              scope.conf.onChange();
            }
          }
        }
      };

      // 定义分页的长度必须为奇数 (default:9)
      scope.conf.pagesLength = parseInt(scope.conf.pagesLength) ? parseInt(scope.conf.pagesLength) : 9 ;
      if(scope.conf.pagesLength % 2 === 0){
        // 如果不是奇数的时候处理一下
        scope.conf.pagesLength = scope.conf.pagesLength -1;
      }

      // conf.erPageOptions
      if(!scope.conf.perPageOptions){
        scope.conf.perPageOptions = [10, 15, 20, 30, 50];
      }

      // pageList数组
      function getPagination(){
        // conf.currentPage
        scope.conf.currentPage = parseInt(scope.conf.currentPage) ? parseInt(scope.conf.currentPage) : 1;
        // conf.totalItems
        scope.conf.totalItems = parseInt(scope.conf.totalItems);

        // conf.itemsPerPage (default:15)
        // 先判断一下本地存储中有没有这个值
        if(scope.conf.rememberPerPage){
          if(!parseInt(localStorage[scope.conf.rememberPerPage])){
            localStorage[scope.conf.rememberPerPage] = parseInt(scope.conf.itemsPerPage) ? parseInt(scope.conf.itemsPerPage) : 15;
          }

          scope.conf.itemsPerPage = parseInt(localStorage[scope.conf.rememberPerPage]);


        }else{
          scope.conf.itemsPerPage = parseInt(scope.conf.itemsPerPage) ? parseInt(scope.conf.itemsPerPage) : 15;
        }

        // numberOfPages
        scope.conf.numberOfPages = Math.ceil(scope.conf.totalItems/scope.conf.itemsPerPage);

        // judge currentPage > scope.numberOfPages
        if(scope.conf.currentPage < 1){
          scope.conf.currentPage = 1;
        }

        if(scope.conf.currentPage > scope.conf.numberOfPages){
          scope.conf.currentPage = scope.conf.numberOfPages;
        }

        // jumpPageNum
        scope.jumpPageNum = scope.conf.currentPage;

        // 如果itemsPerPage在不在perPageOptions数组中，就把itemsPerPage加入这个数组中
        var perPageOptionsLength = scope.conf.perPageOptions.length;
        // 定义状态
        var perPageOptionsStatus;
        for(var i = 0; i < perPageOptionsLength; i++){
          if(scope.conf.perPageOptions[i] == scope.conf.itemsPerPage){
            perPageOptionsStatus = true;
          }
        }
        // 如果itemsPerPage在不在perPageOptions数组中，就把itemsPerPage加入这个数组中
        if(!perPageOptionsStatus){
          scope.conf.perPageOptions.push(scope.conf.itemsPerPage);
        }

        // 对选项进行sort
        scope.conf.perPageOptions.sort(function(a, b){return a-b});

        scope.pageList = [];
        if(scope.conf.numberOfPages <= scope.conf.pagesLength){
          // 判断总页数如果小于等于分页的长度，若小于则直接显示
          for(i =1; i <= scope.conf.numberOfPages; i++){
            scope.pageList.push(i);
          }
        }else{
          // 总页数大于分页长度（此时分为三种情况：1.左边没有...2.右边没有...3.左右都有...）
          // 计算中心偏移量
          var offset = (scope.conf.pagesLength - 1)/2;
          if(scope.conf.currentPage <= offset){
            // 左边没有...
            for(i =1; i <= offset +1; i++){
              scope.pageList.push(i);
            }
            scope.pageList.push('...');
            scope.pageList.push(scope.conf.numberOfPages);
          }else if(scope.conf.currentPage > scope.conf.numberOfPages - offset){
            scope.pageList.push(1);
            scope.pageList.push('...');
            for(i = offset + 1; i >= 1; i--){
              scope.pageList.push(scope.conf.numberOfPages - i);
            }
            scope.pageList.push(scope.conf.numberOfPages);
          }else{
            // 最后一种情况，两边都有...
            scope.pageList.push(1);
            scope.pageList.push('...');

            for(i = Math.ceil(offset/2) ; i >= 1; i--){
              scope.pageList.push(scope.conf.currentPage - i);
            }
            scope.pageList.push(scope.conf.currentPage);
            for(i = 1; i <= offset/2; i++){
              scope.pageList.push(scope.conf.currentPage + i);
            }

            scope.pageList.push('...');
            scope.pageList.push(scope.conf.numberOfPages);
          }
        }

        //if(scope.conf.onChange){
        //  scope.conf.onChange();
        //}
        scope.$parent.conf = scope.conf;
      }

      // prevPage
      scope.prevPage = function(){
        if(scope.conf.currentPage > 1){
          scope.conf.currentPage -= 1;
        }
        if(scope.conf.onChange){
          scope.conf.onChange();
        }
      };
      // nextPage
      scope.nextPage = function(){
        if(scope.conf.currentPage < scope.conf.numberOfPages){
          scope.conf.currentPage += 1;
        }
        if(scope.conf.onChange){
          scope.conf.onChange();
        }
      };

      // 跳转页
      scope.jumpToPage = function(){
        scope.jumpPageNum = scope.jumpPageNum.replace(/[^0-9]/g,'');
        if(scope.jumpPageNum !== ''){
          scope.conf.currentPage = scope.jumpPageNum;
        }
        if(scope.conf.onChange){
          scope.conf.onChange();
        }
      };

      // 修改每页显示的条数
      scope.changeItemsPerPage = function(){
        // 清除本地存储的值方便重新设置
        if(scope.conf.rememberPerPage){
          localStorage.removeItem(scope.conf.rememberPerPage);
        }
      };

      scope.$watch(function(){
        var newValue = scope.conf.currentPage + ' ' + scope.conf.totalItems + ' ';
        //// 如果直接watch perPage变化的时候，因为记住功能的原因，所以一开始可能调用两次。
        ////所以用了如下方式处理
        //if(scope.conf.rememberPerPage){
        //  // 由于记住的时候需要特别处理一下，不然可能造成反复请求
        //  // 之所以不监控localStorage[scope.conf.rememberPerPage]是因为在删除的时候会undefind
        //  // 然后又一次请求
        //  if(localStorage[scope.conf.rememberPerPage]){
        //    newValue += localStorage[scope.conf.rememberPerPage];
        //  }else{
        //    newValue += scope.conf.itemsPerPage;
        //  }
        //}else{
        //  newValue += scope.conf.itemsPerPage;
        //}
        return newValue;

      }, getPagination);
    }
  };
}]);

/**
 * Created by Wayne on 15/7/9.
 */

'use strict';

zhuzhuqs.directive('zzplacehold', function() {
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
zhuzhuqs.directive('zzAlertDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show"><div class="zz-alert">' +
    '<div class="zz-alert-title"> <span>{{alertConfig.title}}</span></div>' +
    '<div class="zz-alert-content"> <span>{{alertConfig.content}}</span></div>' +
    '<div class="zz-alert-handle">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div>' +
    ' </div></div></div>',
    replace: true,
    scope:{},
    controller: 'AlertController'
  }
});
zhuzhuqs.directive('zzAlertConfirmDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show">' +
    '<div class="zz-alert">' +
    '<div class="zz-alert-title"> <span>{{alertConfig.title}}</span></div>' +
    '<div class="zz-alert-content"> <span>{{alertConfig.content}}</span></div>' +
    '<div class="row zz-alert-confirm-handle">' +
    '<div class="col-xs-6">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="sure()">{{alertConfig.sure}}</div>' +
    '</div>' +
    '<div class="col-xs-6">' +
    '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div> ' +
    '</div> </div> </div></div>',
    replace: true,
    scope:{},
    controller: 'AlertConfirmController'
  }
});
/**
 * Created by Wayne on 15/9/8.
 */

zhuzhuqs.directive('zzAlertConfirmStyleDialog', function () {
  return {
    restrict: 'A',
    template: '<div class="mask" ng-show="alertConfig.show">' +
    '<div class="zz-alert confirm-style">' +
      '<div class="zz-alert-title">' +
        '<span>{{alertConfig.title}}</span>' +
      '</div>' +
      '<div class="zz-alert-content">' +
        '<p class="floor-one" ng-show="alertConfig.content_one !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_one}}</span></p>' +
        '<p class="floor-two" ng-show="alertConfig.content_two !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_two}}</span></p>' +
        '<p class="floor-three" ng-show="alertConfig.content_three !== \'\'"><span class="point">●</span><span class="text">{{alertConfig.content_three}}</span></p>' +
      '</div>' +
      '<div class="row zz-alert-confirm-handle">' +
        '<div class="col-xs-6">' +
          '<div class="zz-btn-primary zz-alert-btn" ng-click="sure()">{{alertConfig.sure}}</div>' +
        '</div>' +
        '<div class="col-xs-6">' +
          '<div class="zz-btn-primary zz-alert-btn" ng-click="cancel()">{{alertConfig.cancel}}</div> ' +
        '</div> ' +
      '</div> ' +
    '</div>' +
    '</div>',
    replace: true,
    scope: {},
    controller: 'AlertConfirmStyleController'
  }
});
/**
 * Created by Wayne on 15/8/6.
 */

zhuzhuqs.directive('zzAlertPromptDialog', function () {
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
zhuzhuqs.directive('zzCustomizeDialog', function () {
    return {
        restrict: 'EA',
        template: '<div class="mask" ng-show="pageConfig.show">' +
        '<div class="zz-custom-dialog">' +
        '<div class="zz-dialog-title"> <span>{{pageConfig.title}}</span>' +
        '<div class="zz-dialog-close" ng-click="closed()"><img ng-src="images/icon/ic_close_24px.svg"/></div></div>' +
        '<div class="zz-dialog-content">' +
        '</div>' +
        '<div class="zz-dialog-handle">' +
        '<div class="zz-dialog-btn-new zz-dialog-btn" ng-click="closed()">{{pageConfig.okLabel}}</div>' +
        ' </div></div></div>',
        replace: true,
        scope: {
            pageConfig: '='
        },
        link: function (scope, element, attributes) {
            if (!scope.pageConfig) {
                scope.pageConfig = {
                    title: '自定义消息框',
                    content: '自定义内容',
                    okLabel: "确定",
                    show: false
                };
            }
            var _el = element.find('.zz-dialog-content');
            _el.append(scope.pageConfig.content);
            scope.closed = function () {
                scope.pageConfig.show = false;
            };
        }
    }
});
/**
 * Created by elinaguo on 15/5/20.
 */
/**
 * Created by elinaguo on 15/5/16.
 */
/**
 * function: 分页UI
 * author: elina
 *
 *  html代码
 *  <zz-list config="listConfig"></zz-list>
 *  angularjs代码
 *
 */


zhuzhuqs.directive('zzList', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_list/zz_list.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      scope.enableOptionalCount = 0;
      scope.isSelectedAll = false;
      scope.isShowFieldOption = false;
      scope.selectedRows = [];

      //<editor-fold desc="Interface for parent">
      scope.config.load = function (callback) {
        refreshDisplay();
        if (!callback) {
          return;
        }

        callback();
        return;
      };

      scope.config.reLoad = function (callback) {
        scope.config.isSelectedAll = false;
        refreshDisplay();
        if (!callback)
          return;

        return callback();
      };
      //</editor-fold>

      //<editor-fold desc="Row Event Relation">

      scope.toggleSelectAll = function () {
        scope.isSelectedAll = !scope.isSelectedAll;

        scope.selectedRows.splice(0, scope.selectedRows.length);

        for (var i = 0; i < scope.config.rows.length; i++) {
          var currentRow = scope.config.rows[i];
          if (!currentRow.rowConfig.notOptional) {
            currentRow.selected = scope.isSelectedAll;

            if (scope.isSelectedAll) {
              scope.selectedRows.push(currentRow);
            }
          }
        }

        notify('selectedHandler', scope.selectedRows);
      };

      scope.onRowSelected = function (currentRow, event) {
        if (currentRow.rowConfig.notOptional) {
          return;
        }

        currentRow.selected = !currentRow.selected;
        if (currentRow.selected) {
          scope.selectedRows.push(currentRow);
        } else {
          for (var i = 0; i < scope.selectedRows.length; i++) {
            if (scope.selectedRows[i]._id === currentRow._id) {
              scope.selectedRows.splice(i, 1);
            }
          }
        }

        //update selected all
        if (scope.selectedRows.length === scope.enableOptionalCount) {
          scope.isSelectedAll = true;
        }
        else {
          scope.isSelectedAll = false;
        }

        notify('selectedHandler', scope.selectedRows, event);
      };

      scope.onRowClick = function (currentRow) {
        notify('rowClickHandler', currentRow);
      };

      scope.onRowInfoEdit = function (currentRow) {
        notify('rowInfoEditHandler', currentRow);
      };

      scope.onRowDelete = function (currentRow) {
        notify('rowDeleteHandler', currentRow);
      };

      scope.onRowExpand = function (currentRow) {
        closeAllRowExpand();
        currentRow.isExpand = !currentRow.isExpand;
      };

      scope.onSortItemClick = function (field, item) {
        field.curSort = item;
        field.isExpanded = false;
        notify('headerSortChangedHandler', field);
      };

      scope.onSearchItemSubmit = function (field) {
        field.isExpanded = false;
        notify('headerKeywordsChangedHandler', field);
      };

      scope.onHeaderFieldClick = function (field, event) {
        field.isExpanded = !field.isExpanded;
        event.stopPropagation();
      };

      scope.$on(GlobalEvent.onBodyClick, function () {
        for (var i = 0; i < scope.config.fields.length; i++) {
          scope.config.fields[i].isExpanded = false;
        }

        if (scope.isShowFieldOption) {
          scope.isShowFieldOption = false;
          notify('saveDisplayFields');
        }

      });

      scope.onFieldSettingAreaClick = function(event) {
        stopBubble(event);
      };

      scope.onFieldOptionButtonClick = function (event) {
        scope.isShowFieldOption = !scope.isShowFieldOption;

        if (!scope.isShowFieldOption) {
          notify('saveDisplayFields');
        }

        stopBubble(event);
      };
      scope.onFiledOptionColumnClick = function (fieldItem, event) {
        stopBubble(event);

        if (!scope.config.selectOptions || scope.config.selectOptions.length <= 0) {
          return;
        }

        if (fieldItem.isSelected) {
          fieldItem.isSelected = false;

          notify('updateDisplayFields');
        }
        else {
          var selectedCount = 0;
          scope.config.selectOptions.forEach(function (optionItem) {
            if (optionItem.isSelected) {
              selectedCount += 1;
            }
          });

          if (selectedCount < scope.config.fields_length) {
            fieldItem.isSelected = !fieldItem.isSelected;

            notify('updateDisplayFields');
          }

          //超过最大长度，则选不中。
        }
      };

      //</editor-fold>

      //<editor-fold desc="Private function">
      function closeAllRowExpand() {
        for (var i = 0; i < scope.config.rows.length; i++) {
          scope.config.rows[i].isExpand = false;
        }
      }

      function stopBubble(e) {
        if (e && e.stopPropagation)
          e.stopPropagation(); //非IE
        else
          window.event.cancelBubble = true; //IE
      }

      function initConfig() {
        if (scope.config.isOptional === undefined || scope.config.isOptional === null) {
          scope.config.isOptional = true;
        }
        if (scope.config.selectionOption === undefined || scope.config.selectionOption === null) {
          scope.config.selectionOption = {columnWidth: 1};
        }
        if (scope.config.handleOption === undefined || scope.config.handleOption === null) {
          scope.config.handleOption = {columnWidth: 2};
        }
        if (scope.config.isFieldSetting === undefined || scope.config.isFieldSetting === null) {
          scope.config.isFieldSetting = true;
        }

        if (scope.config.rowExpand === undefined || scope.config.rowExpand === null) {
          scope.config.rowExpand = {
            isSupport: false,
            text: '展开'
          };
        }
        if (scope.config.rowExpand.enable === undefined || scope.config.rowExpand.enable === null) {
          scope.config.rowExpand.enable = false;
        }
        if (scope.config.rowExpand.expandText === undefined || scope.config.rowExpand.expandText === '') {
          scope.config.rowExpand.expandText = '展开';
        }
        if (scope.config.rowExpand.cancelText === undefined || scope.config.rowExpand.cancelText === '') {
          scope.config.rowExpand.cancelText = '取消';
        }

        if (scope.config.rowExpand.selfCloseButton === undefined || scope.config.rowExpand.selfCloseButton === '') {
          scope.config.rowExpand.selfCloseButton = false;
        }

        if (scope.config.isSelectedAll === undefined || scope.config.isSelectedAll === null) {
          scope.config.isSelectedAll = false;
        }

        if (!scope.config.selectedRows) {
          scope.config.selectedRows = [];
        }

        if (!scope.config.fields_length) {
          scope.config.fields_length = 7; //默认显示7个字段
        }

        refreshDisplay();
      };

      function refreshDisplay() {
        scope.enableOptionalCount = 0;
        scope.selectedRows.splice(0, scope.selectedRows.length);
        scope.isSelectedAll = false;

        if (scope.config.fields && scope.config.fields.length > 0) {
          for (var i = 0; i < scope.config.fields.length; i++) {
            if (!scope.config.fields[i].columnWidth) scope.config.fields[i].columnWidth = 1;

            scope.config.fields[i].columnWidthStyle = 'zz-list-col-' + scope.config.fields[i].columnWidth;

            if (scope.config.fields[i].self_column_class) {
              scope.config.fields[i].columnWidthStyle += (' ' + scope.config.fields[i].self_column_class);
            }

            scope.config.fields[i].isExpanded = false;
          }
          for (var i = 0; i < scope.config.rows.length; i++) {
            scope.config.rows[i].selected = false;
            scope.config.rows[i].isExpand = false;

            if (!scope.config.rows[i].disabled) {
              scope.enableOptionalCount++;
            }
          }
        }
        if (!scope.config.selectionOption.columnWidth) {
          scope.config.selectionOption.columnWidth = 1;
        }
        scope.config.selectionOptionColumnWidthStyle = 'zz-list-col-' + scope.config.selectionOption.columnWidth;
        if (!scope.config.handleOption.columnWidth) {
          scope.config.handleOption.columnWidth = 2;
        }
        scope.config.handleOptionColumnWidthStyle = 'zz-list-col-' + scope.config.handleOption.columnWidth;

      }

      //</editor-fold>

      function notify(notifyType, params, event) {
        if (scope.config.events) {
          if (scope.config.events[notifyType] && scope.config.events[notifyType].length > 0) {
            for (var i = 0; i < scope.config.events[notifyType].length; i++) {
              var currentEvent = scope.config.events[notifyType][i];
              if (currentEvent && typeof(currentEvent) === 'function') {
                currentEvent(params, event);
              }
            }
          }
        }
      };

      initConfig();
    }
  };
}]);

zhuzhuqs.directive('zzExportDialog', function () {
  return {
    restrict:'A',
    templateUrl:'directive/zz_export_dialog/order_export_dialog.client.directive.html',
    replace:false,
    scope:{
    },
    controller:'OrderExportController'
  };
});
/**
 * Created by elinaguo on 15/5/24.
 */
zhuzhuqs.directive('zzOrderAssign', ['OrderHelper', function (OrderHelper) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_order_assign/zz_order_assign.html',
    replace: true,
    link: function (scope, element, attributes, controllers) {

      scope.order = scope.$parent.row;
      scope.order.new_order_number = '';

      scope.extendData = scope.$parent.$parent.config.extendData;
      scope.rangeTimePanel = scope.extendData.rangeTimePanel;
      scope.selectData = generateSelectData();
      scope.isOpenEditBox = false;

      scope.contactEdit = {
        isOpen: false,
        current: {
          assignInfo: null,
          pickupName: '',
          deliveryName: '',
          pickupMobilePhone: '',
          deliveryMobilePhone: '',
          pickupPhone: '',
          deliveryPhone: ''
        }
      };

      scope.dateTransport = function (dateString) {
        return new Date(dateString);
      };

      if (!scope.order.extendData.assignInfos) {
        scope.order.extendData.assignInfos = [];
      }

      if (scope.order.extendData.assignInfos.length === 0) {
        scope.order.extendData.assignInfos.push(initAssignInfo());
      } else {

        var selectData = generateSelectData();
        for (var i = 0; i < scope.order.extendData.assignInfos.length; i++) {
          updateAssignInfo(scope.order.extendData.assignInfos[i], selectData);
        }
      }

      function generateSelectData() {
        var partners = scope.extendData.partnerCompanies;
        var drivers = scope.extendData.partnerDrivers;

        var executeSelectData = [];
        var executeWarehouseSelectData = [];
        executeSelectData.push({key: null, value: '合作公司'});
        for (var i = 0; i < partners.length; i++) {

          var currentPartner = partners[i];
          executeSelectData.push(OrderHelper.getCompanyAssignOption(currentPartner));
        }

        executeSelectData.push({key: null, value: '合作司机'});
        executeWarehouseSelectData.push({key: null, value: '仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          if (drivers[i].driver && drivers[i].driver.is_signup) {
            executeSelectData.push(OrderHelper.getDriverAssignOption(drivers[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getDriverAssignOption(drivers[i].driver, 'warehouse'));
          }
        }

        executeSelectData.push({key: null, value: '微信司机'});
        executeWarehouseSelectData.push({key: null, value: '微信仓库管理员'});
        for (var i = 0; i < drivers.length; i++) {
          if (drivers[i].driver && drivers[i].driver.wechat_profile && drivers[i].driver.wechat_profile.openid) {
            executeSelectData.push(OrderHelper.getWechatDriverAssignOption(drivers[i].driver, 'driver'));
            executeWarehouseSelectData.push(OrderHelper.getWechatDriverAssignOption(drivers[i].driver, 'warehouse'));
          }
        }

        return {
          executeSelectData: executeSelectData,
          executeWarehouseSelectData: executeWarehouseSelectData
        };

      }

      function updateAssignInfo(assignInfo, selectData) {
        if (!assignInfo)
          return;

        assignInfo.onSelected = updateType;
        if (assignInfo.pickup_start_time) {
          assignInfo.pickupTimeRange = {
            startDate: assignInfo.pickup_start_time ? new Date(assignInfo.pickup_start_time) : null,
            endDate: assignInfo.pickup_end_time ? new Date(assignInfo.pickup_end_time) : null
          };

        }
        if (assignInfo.delivery_start_time) {
          assignInfo.deliveryTimeRange = {
            startDate: assignInfo.delivery_start_time ? new Date(assignInfo.delivery_start_time) : null,
            endDate: assignInfo.delivery_end_time ? new Date(assignInfo.delivery_end_time) : null
          };
        }

        if (assignInfo.is_assigned === true || assignInfo.is_assigned === 'true') {
          assignInfo.enableEdit = false;
        } else {
          assignInfo.enableEdit = true;
        }

        if (assignInfo.type === 'driver') {
          assignInfo.options = selectData.executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.is_wechat, assignInfo.options);
          if (!assignInfo.currentChoice && assignInfo.driver_username) {  //临时司机的情况
            assignInfo.currentText = assignInfo.driver_username;
          }
        } else if (assignInfo.type === 'warehouse') {
          assignInfo.options = selectData.executeWarehouseSelectData;
          assignInfo.currentChoice = findOption(assignInfo.driver_id, assignInfo.is_wechat, assignInfo.options);
          if (!assignInfo.currentChoice && assignInfo.driver_username) { //临时司机的情况
            assignInfo.currentText = assignInfo.driver_username;
          }

        } else {
          assignInfo.options = selectData.executeSelectData;
          assignInfo.currentChoice = findOption(assignInfo.company_id, assignInfo.is_wechat, assignInfo.options);
        }

        if (!assignInfo.currentText) {
          assignInfo.currentText = assignInfo.currentChoice ? assignInfo.currentChoice.value : '';
        }
      };

      function findOption(key, isWechat, options) {
        var result = null;
        for (var i = 0; i < options.length; i++) {
          if (options[i].key === key) {
            if (isWechat) {
              if (options[i].is_wechat == isWechat) {
                result = options[i];
                break;
              }
            }
            else {
              result = options[i];
              break;
            }
          }
        }
        return result;
      };

      function initAssignInfo() {
        return {
          pickup_contact_name: scope.order.extendData.detail.pickup_contact_name,
          pickup_contact_phone: scope.order.extendData.detail.pickup_contact_phone,
          pickup_contact_mobile_phone: scope.order.extendData.detail.pickup_contact_mobile_phone,
          pickup_contact_address: scope.order.extendData.detail.pickup_contact_address,
          pickup_contact_email: '',
          delivery_contact_name: scope.order.extendData.detail.delivery_contact_name,
          delivery_contact_phone: scope.order.extendData.detail.delivery_contact_phone,
          delivery_contact_mobile_phone: scope.order.extendData.detail.delivery_contact_mobile_phone,
          delivery_contact_address: scope.order.extendData.detail.delivery_contact_address,
          delivery_contact_email: '',
          company_id: '',
          is_assigned: false,
          pickup_start_time: scope.order.extendData.detail.pickup_start_time,
          pickup_end_time: scope.order.extendData.detail.pickup_end_time,
          delivery_start_time: scope.order.extendData.detail.delivery_start_time,
          delivery_end_time: scope.order.extendData.detail.delivery_end_time,
          driver_id: '',
          type: 'company',
          pickupTimeRange: {
            startDate: scope.order.extendData.detail.pickup_start_time ? new Date(scope.order.extendData.detail.pickup_start_time) : null,
            endDate: scope.order.extendData.detail.pickup_end_time ? new Date(scope.order.extendData.detail.pickup_end_time) : null
          },
          deliveryTimeRange: {
            startDate: scope.order.extendData.detail.delivery_start_time ? new Date(scope.order.extendData.detail.delivery_start_time) : null,
            endDate: scope.order.extendData.detail.delivery_end_time ? new Date(scope.order.extendData.detail.delivery_end_time) : null
          },
          currentText: null,
          currentChoice: null,                          //以下都是该行的选择框配置数据
          defaultContent: '搜索合作公司或司机',
          options: scope.selectData.executeSelectData,
          onSelected: updateType,
          enableEdit: true    //是否启用编辑
        };
      };

      function generateNewAssignInfo() {
        return {
          pickup_contact_name: '',
          pickup_contact_phone: '',
          pickup_contact_mobile_phone: '',
          pickup_contact_address: '',
          pickup_contact_email: '',
          delivery_contact_name: '',
          delivery_contact_phone: '',
          delivery_contact_mobile_phone: '',
          delivery_contact_address: '',
          delivery_contact_email: '',
          company_id: '',
          pickup_start_time: '',
          pickup_end_time: '',
          delivery_start_time: '',
          delivery_end_time: '',
          driver_id: '',
          partner_name: '',
          type: 'company',
          pickupTimeRange: null,
          deliveryTimeRange: null,
          currentText: null,
          currentChoice: null,                          //以下都是该行的选择框配置数据
          defaultContent: '搜索合作公司或司机',
          options: scope.selectData.executeSelectData,
          onSelected: updateType,
          enableEdit: true    //是否启用编辑
        };
      };

      function updateType(option) {
        if (!option) {
          this.company_id = '';
          this.driver_id = '';
          this.partner_name = '';

          return;
        }

        if (option.group_type === 'driver' || option.group_type === 'warehouse') {
          this.driver_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
          this.is_wechat = option.is_wechat || false;
        } else if (option.group_type === 'company') {
          this.company_id = option.key;
          this.partner_name = option.value;
          this.type = option.group_type;
        }
        return;
      };

      scope.changeType = function (assignInfo) {
        if (assignInfo.enableEdit == false)
          return;

        var extendData = generateSelectData();
        if (assignInfo.type === 'driver' || assignInfo.type === 'company') {
          assignInfo.type = 'warehouse';
          assignInfo.currentChoice = null;
          assignInfo.defaultContent = '搜索仓库管理员';
          assignInfo.options = extendData.executeWarehouseSelectData
        }
        else {
          assignInfo.type = 'driver';
          assignInfo.currentChoice = null;
          assignInfo.defaultContent = '搜索合作公司或司机';
          assignInfo.options = extendData.executeSelectData
        }

      };

      scope.addNewAssignInfo = function () {
        scope.order.extendData.assignInfos.push(generateNewAssignInfo());
      };
      scope.cancelAssign = function () {
        scope.order.isExpand = false;
        scope.rangeTimePanel.hide();
      };
      scope.removeAssignInfo = function (index) {
        if (index < 0 || index >= scope.order.extendData.assignInfos.length)
          return;

        if (index === 0 && scope.order.extendData.assignInfos.length === 1)
          return;

        return scope.order.extendData.assignInfos.splice(index, 1);
      };

      scope.editAssignDetailInfo = function (assignInfo) {
        console.log('editAssignDetailInfo');
        console.log(assignInfo);
        scope.contactEdit.isOpen = true;
        scope.contactEdit.current.assignInfo = assignInfo;
        scope.contactEdit.current.pickupName = assignInfo.pickup_contact_name;
        scope.contactEdit.current.deliveryName = assignInfo.delivery_contact_name;
        scope.contactEdit.current.pickupMobilePhone = assignInfo.pickup_contact_mobile_phone;
        scope.contactEdit.current.deliveryMobilePhone = assignInfo.delivery_contact_mobile_phone;
        scope.contactEdit.current.pickupPhone = assignInfo.pickup_contact_phone;
        scope.contactEdit.current.deliveryPhone = assignInfo.delivery_contact_phone;
        //window.scrollTo(0,0);
      };
      scope.closeAssignDetailInfo = function () {
        scope.contactEdit.isOpen = false;
      };
      scope.saveAssignDetailInfo = function () {
        scope.contactEdit.current.assignInfo.pickup_contact_name = scope.contactEdit.current.pickupName;
        scope.contactEdit.current.assignInfo.pickup_contact_mobile_phone = scope.contactEdit.current.pickupMobilePhone;
        scope.contactEdit.current.assignInfo.pickup_contact_phone = scope.contactEdit.current.pickupPhone;
        scope.contactEdit.current.assignInfo.delivery_contact_name = scope.contactEdit.current.deliveryName;
        scope.contactEdit.current.assignInfo.delivery_contact_mobile_phone = scope.contactEdit.current.deliveryMobilePhone;
        scope.contactEdit.current.assignInfo.delivery_contact_phone = scope.contactEdit.current.deliveryPhone;
        scope.contactEdit.isOpen = false;
      };

      scope.submitOrderAssignInfos = function () {
        if (!scope.extendData.onRowSubmit) {
          return;
        }

        for (var i = 0; i < scope.order.extendData.assignInfos.length; i++) {
          var currentAssignInfo = scope.order.extendData.assignInfos[i];
          if (currentAssignInfo.currentChoice) {
            currentAssignInfo.enableEdit = false;
          }
        }

        scope.extendData.onRowSubmit(scope.order);
      };
      scope.openPickupRangeDatePicker = function (assignInfo) {
        if (!assignInfo.enableEdit)
          return;

        if (!scope.rangeTimePanel)
          return;

        if (scope.rangeTimePanel.isShow()) {
          scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          scope.rangeTimePanel.show();
        }

        scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.pickupTimeRange = dateRange;
          assignInfo.pickup_start_time = dateRange.startDate._d;
          assignInfo.pickup_end_time = dateRange.endDate._d;
          console.log('changed');
          console.log(assignInfo.pickup_start_time);
          console.log(assignInfo.pickup_end_time);
          scope.rangeTimePanel.hide();
        });
      };
      scope.openDeliveryRangeDatePicker = function (assignInfo) {
        if (!assignInfo.enableEdit)
          return;

        if (!scope.rangeTimePanel)
          return;

        if (scope.rangeTimePanel.isShow()) {
          scope.rangeTimePanel.hide();
        } else {
          var offsetLeft, offsetTop;
          if (event.target) {
            offsetLeft = event.target.offsetLeft;
            offsetTop = event.target.offsetTop;
          }
          else {
            offsetLeft = event.srcElement.offsetLeft;
            offsetTop = event.srcElement.offsetTop;
          }
          scope.rangeTimePanel.setLocation({left: offsetLeft, top: offsetTop});
          scope.rangeTimePanel.show();
        }

        scope.rangeTimePanel.bindDateRangeChangedEvent(function (dateRange) {
          assignInfo.deliveryTimeRange = dateRange;
          assignInfo.delivery_start_time = dateRange.startDate._d;
          assignInfo.delivery_end_time = dateRange.endDate._d;

          scope.rangeTimePanel.hide();
        });
      };
    }
  };
}]);

/**
 * Created by Wayne on 16/1/14.
 */

zhuzhuqs.directive('zzOrderOption', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_order_option/zz_order_option.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      var srcConfig;

      scope.config.removePhotoItem = function (index, photoArray, photoConfig) {
        if (photoArray.length === 0 || index < 0 || index >= photoArray.length) {
          return;
        }

        if (photoArray[index].isPlate) {
          photoConfig.isPlate = false;
        }

        photoArray.splice(index, 1);
      };
      scope.config.addPhotoItem = function (photoArray) {
        photoArray.push({name: ''});
      };
      scope.config.addPlatePhotoItem = function (photoArray, photoConfig) {
        if (photoConfig.isPlate) {
          return;
        }

        photoArray.push({name: '拍车牌', isPlate: true});
        photoConfig.isPlate = true;
      };

      scope.config.load = function (configuration) {
        srcConfig = configuration;
        if (!configuration) {
          return;
        }
        convertConfigToOptionPage(configuration);
      };
      scope.config.getData = function () {
        var dstData = getOptionPageData();
        var errorStr = checkConfiguration(dstData);
        var isModify = false;
        if (!srcConfig) {
          isModify = true;
        }
        else {
          isModify = compareConfiguration(srcConfig, dstData.config);
        }

        return {
          err: errorStr,
          isModify: isModify,
          config: dstData.config
        };
      };

      function convertConfigToOptionPage(orderConfig) {
        var option = scope.config;

        option.entrance.isOpen = orderConfig.must_entrance || false;
        option.entrance_photo.isOpen = orderConfig.must_entrance_photo || false;
        option.entrance_photo.isPlate = false;
        option.take_photo.isOpen = orderConfig.must_take_photo || false;
        option.take_photo.isPlate = false;
        option.confirm_detail.isOpen = orderConfig.must_confirm_detail || false;

        option.entrance_photo_array = [];
        if (orderConfig.entrance_photos && orderConfig.entrance_photos.length > 0) {
          orderConfig.entrance_photos.forEach(function (item) {
            if (item.isPlate) {
              option.entrance_photo_array.push({name: item.name, isPlate: true});
              option.entrance_photo.isPlate = true;
            }
            else {
              option.entrance_photo_array.push({name: item.name});
            }
          });
        }
        else {
          option.entrance_photo_array.push({name: '拍货物'});
        }

        option.take_photo_array = [];
        if (orderConfig.take_photos && orderConfig.take_photos.length > 0) {
          orderConfig.take_photos.forEach(function (item) {
            if (item.isPlate) {
              option.take_photo_array.push({name: item.name, isPlate: true});
              option.take_photo.isPlate = true;
            }
            else {
              option.take_photo_array.push({name: item.name});
            }
          });
        }
        else {
          option.take_photo_array.push({name: '拍货物'});
        }
      }
      function getOptionPageData() {
        var config = {};
        var invalidConfig = [];
        var option = scope.config;

        config.must_entrance = option.entrance.isOpen || false;
        config.must_entrance_photo = option.entrance_photo.isOpen || false;
        config.must_take_photo = option.take_photo.isOpen || false;
        config.must_confirm_detail = option.confirm_detail.isOpen || false;

        config.entrance_photos = [];
        option.entrance_photo_array.forEach(function (item) {
          if (item.name) {
            config.entrance_photos.push({
              name: item.name
            });
            if (item.isPlate) {
              config.entrance_photos[config.entrance_photos.length-1].isPlate = true;
            }
          }
          else {
            invalidConfig.push('entrance_photo_array');
          }
        });
        config.take_photos = [];
        option.take_photo_array.forEach(function (item) {
          if (item.name) {
            config.take_photos.push({
              name: item.name
            });
            if (item.isPlate) {
              config.take_photos[config.take_photos.length-1].isPlate = true;
            }
          }
          else {
            invalidConfig.push('take_photo_array');
          }
        });

        return {
          config: config,
          invalid: invalidConfig
        };
      }
      function checkConfiguration(data) {
        var str = '';
        if (data.invalid.length > 0) {

          if (data.invalid[0] === 'entrance_photo_array' && data.config.must_entrance_photo) {
            str = '进场拍照有未编辑步骤，请编辑文字';
            return scope.config.title + str;
          }

          if (data.invalid[0] === 'take_photo_array' && data.config.must_take_photo) {
            str = '拍照有未编辑步骤，请编辑文字';
            return scope.config.title + str;
          }
        }

        if (data.config.must_entrance_photo && data.config.entrance_photos.length === 0) {
          str = '强制进场拍照后，必须设置拍照步骤';
          return scope.config.title + str;
        }
        if (data.config.must_take_photo && data.config.take_photos.length === 0) {
          str = '强制拍照后，必须设置拍照步骤';
          return scope.config.title + str;
        }

        return '';
      }
      function compareConfiguration(src, dst) {
        if (src.must_entrance !== dst.must_entrance) {
          return true;
        }
        if (src.must_entrance_photo !== dst.must_entrance_photo) {
          return true;
        }
        if (src.must_take_photo !== dst.must_take_photo) {
          return true;
        }
        if (src.must_confirm_detail !== dst.must_confirm_detail) {
          return true;
        }

        if (src.entrance_photos.length !== dst.entrance_photos.length) {
          return true;
        }
        else {
          for (var i = 0; i < src.entrance_photos.length; i++) {
            if (src.entrance_photos[i].name !== dst.entrance_photos[i].name) {
              return true;
            }
          }
        }

        if (src.take_photos.length !== dst.take_photos.length) {
          return true;
        }
        else {
          for (var i = 0; i < src.take_photos.length; i++) {
            if (src.take_photos[i].name !== dst.take_photos[i].name) {
              return true;
            }
          }
        }

        return false;
      }
    }
  };
}]);

/**
 * Created by elinaguo on 15/5/16.
 */
/**
 * function: 分页UI
 * author: elina
 *
 *  html代码
 *  <zz-pagination config="pagination"></zz-pagination>
 *
 *  angularjs代码
    $scope.pagination= {
                  currentPage: 1,                     //default
                  limit: 20,                          //default   每页显示几条
                  pageNavigationCount: 5,             //default   分页显示几页
                  totalCount: 0,
                  pageCount: 0,
                  limitArray: [10, 20, 30, 40, 100],  //default   每页显示条数数组
                  pageList: [1],                      //显示几页的数字数组
                  canSeekPage: true,                  //default   是否可以手动定位到第几页
                  canSetLimit: true,                  //default   是否可以设置每页显示几页
                  isShowTotalInfo: true,              //default   是否显示总记录数信息
                  onCurrentPageChanged: null or function(callback){
                                                  //do something
                                                  function(data){
                                                    //data.totalCount, data.limit
                                                    callback(data);
                                                  }
                                                }
              };
    $scope.pagination.render(); //渲染pagination
 *  }
 *
 */




zhuzhuqs.directive('zzPagination',[function(){
  return {
    restrict: 'EA',
    template: '<div class="zz-pagination" ng-show="config.pageCount>0">'
                +'<div class="pagination_info">'
                    +'<div ng-show="config.isShowTotalInfo" class="base_info">总数: {{config.totalCount}}</div>'
                    +'<div ng-show="config.canSetLimit" class="limit_set"><span>每页显示:</span>'
                        +'<select ng-options="limitItem for limitItem in config.limitArray" ng-change="config.changePageLimit()" ng-model="config.limit" ></select>'
                    +'</div>'
                    +'<div ng-show="config.canSeekPage" class="currentPage_set">'
                      +'<span>跳转至第</span>'
                      +'<input  ng-model="config.currentPage" ng-change="config.seekPage(config.currentPage);"/>'
                      +'<span>页</span>'
                    +'</div>'
                +'</div>'
                +'<div class="page_list">'
                  +'<ul>'
                    +'<li ng-show="config.currentPage > 1" ng-click="config.changePage(1);"><a>首页</a></li>'
                    +'<li ng-show="config.currentPage > 1" ng-click="config.changePage(config.currentPage - 1);"><a>上一页</a></li>'
                    +'<li ng-repeat="pageNumber in config.pageList" ng-click="config.changePage(pageNumber);" ng-class="(config.currentPage == pageNumber)?\'current\':\'\'"><a>{{pageNumber}}</a></li>'
                    +'<li ng-show="config.currentPage < config.pageCount" ng-click="config.changePage(config.currentPage + 1);"><a>下一页</a></li>'
                    +'<li ng-show="config.currentPage < config.pageCount" ng-click="config.changePage(config.pageCount)"><a>最后</a></li>'
                  +'</ul>'
                +'</div>'
              +'</div>',
    replace: true,
    scope: {
      config: '='
    },

    link: function(scope, element, attributes){
      if(!scope.config){
        scope.config = {};
      }

      scope.config.render = function(){
        initConfig();
        refreshPageNavigation();
      };

      scope.config.changePage = function(newPage){
        switchPage(newPage);
      };

      scope.config.seekPage = function(newPage){
        if(!newPage)
          return;

        newPage = parseInt(newPage);
        if(newPage > scope.config.pageCount){
          return;
        }

        switchPage(newPage);
      };

      scope.config.changePageLimit = function(){
        scope.config.currentPage = 1;
        //limit已经通过ng－model改变
        scope.config.onCurrentPageChanged(function(data){
          //data.limit =  parseInt(data.limit);
          data.totalCount = data.totalCount;
          data.pageCount = Math.ceil(data.totalCount / data.limit);
        });
      };
      //
      //scope.$watch(function(){
      //    console.log('page changed');
      //    return scope.config.pageCount + scope.config.currentPage;
      //  },
      //  function(){
      //    console.log('currentPage changed');
      //    refreshPageNavigation();
      //  });

      scope.$watchCollection('config',function(){
        console.log('currentPage changed');
        refreshPageNavigation();
      });


      function initConfig(){
        if(!scope.config.currentPage || scope.config.currentPage === 0){
          scope.config.currentPage = 1;
        }

        if(!scope.config.limit || scope.config.limit === 0){
          scope.config.limit = 20;
        }

        if(!scope.config.totalCount){
          scope.config.totalCount = 0;
        }

        if(!scope.config.pageCount){
          scope.config.pageCount = 0;
        }

        if(!scope.config.limitArray || scope.config.limitArray.length === 0){
          scope.config.limitArray = [10,20,30,50,100];
        }

        if(!scope.config.pageNavigationCount || scope.config.pageNavigationCount === 0){
          scope.config.pageNavigationCount = 5;
        }

        if(scope.config.isShowTotalInfo === undefined || scope.config.isShowTotalInfo == null){
          scope.config.isShowTotalInfo = true;
        }

        if(scope.config.canSetLimit === undefined || scope.config.canSetLimit == null){
          scope.config.canSetLimit = true;
        }

        if(scope.config.canSeekPage === undefined || scope.config.canSeekPage == null){
          scope.config.canSeekPage = true;
        }

        if(!scope.config.onChange){
          scope.onChange = function(){
            console.log('Turn to the '+scope.config.currentPage + ' page');
          };
        }
      };

      function refreshPageNavigation(){
        if(scope.config.currentPage === '' || scope.config.currentPage <= 0){
          return scope.config.currentPage = 1;
        }

        scope.config.pageList.splice(0, scope.config.pageList.length);

        if(scope.config.pageCount > scope.config.pageNavigationCount){
          var length = ((scope.config.currentPage + scope.config.pageNavigationCount - 1) > scope.config.pageCount) ? scope.config.pageCount : (scope.config.currentPage + scope.config.pageNavigationCount -1 );
          var currentViewNumber = length - scope.config.pageNavigationCount + 1;
          for(var i=currentViewNumber; i<= length;i++){
            scope.config.pageList.push(i);
          }
        }else{
          for(var i=1;i<= scope.config.pageCount;i++){
            scope.config.pageList.push(i);
          }
        }
      };

      function switchPage(newPage){
        if(newPage === scope.config.currentPage ){
          return;
        }
        scope.config.currentPage = newPage;

        if(!scope.config.onCurrentPageChanged){
          console.log('currentPage changed!');
          return;
        }

        scope.config.onCurrentPageChanged(function(data){
          //data.limit =  parseInt(data.limit);
          data.totalCount = data.totalCount;
          data.pageCount = Math.ceil(data.totalCount / data.limit);
        });
      };
    }
  };
}]);

/**
 * 货物照片预览
 * author: louisha
 * 参数：数组
 * 数组成员：图片对象
 * {
 *     order:'订单号'
 *     title:'照片信息 例：提货货物照片',
 *     warning:'需要突出显示的信息,字体会变成红色',
 *     url:'图片url地址',
 *     remark:'图片备注'}
 */

zhuzhuqs.directive('zzPhotoScan', ['$document', function ($document) {
    return {
        restrict: 'EA',
        template: '<div class="zz-photo-scan-mask" ng-show="show">' +
        '<div class="zz-photo-scan-top">' +
        '<span>{{photoShow.currentPhoto.order}}</span>' +
        '<span>{{photoShow.currentPhoto.title}}</span>' +
        '<span class="warning">{{photoShow.currentPhoto.warning}}</span>' +
        '</div>' +
        '<div class="row zz-photo-scan-wrap">' +
        '<div class="col-xs-12 col-sm-10 col-sm-offset-1 container" ng-mouseover="showRemark(true)" ng-mouseleave="showRemark(false)">' +
        '<img ng-src="{{photoShow.currentPhoto.url}}" class="photo-info"/>' +
        '<div class="zz-photo-scan-remark" ng-show="photoShow.showRemark">' +
        '<div class="remark-info">{{photoShow.currentPhoto.remark}}</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="zz-photo-scan-close"  ng-click="close()">' +
        '<img src="images/global/close_white.png" />' +
        '</div>' +
        '<div class="zz-photo-scan-arrow-left-warp">' +
        '<div class="zz-photo-scan-arrow-left"  ng-class="{\'disable\':!photoShow.pre_enable}" ng-click="preClick()">' +
        '<img src="images/global/arrow_left.png" />' +
        '</div>' +
        '<div class="btn-mask" ng-show="!photoShow.pre_enable"></div>' +
        '</div>' +
        '<div class="zz-photo-scan-arrow-right-warp">' +
        '<div class="zz-photo-scan-arrow-right" ng-class="{\'disable\':!photoShow.next_enable}" ng-click="nextClick()">' +
        '<img src="images/global/arrow_right.png" />' +
        '</div> ' +
        '<div class="btn-mask" ng-show="!photoShow.next_enable"></div>' +
        '</div>' +
        '</div>',
        replace: true,
        scope: {
            photos: '=',
            show: '=',
            startIndex: '='
        },
        link: function (scope, element, attributes) {

            //$document.bind("keypress", function(event) {
            //    $scope.$apply(function (){
            //        if(event.keyCode == 38){
            //            $scope.selectNum--;
            //        }
            //        if(event.keyCode == 40){
            //            $scope.selectNum++;
            //        }
            //    })
            //});

            //$document.on("keypress", function (event) {
            //    switch (event.keyCode) {
            //        default:
            //            console.log(event.keyCode);
            //    }
            //
            //});
            if (!scope.photos) {
                scope.photos = [];
            }
            if (!scope.show) {
                scope.show = false;
            }
            if (!scope.startIndex) {
                scope.startIndex = 0;
            }
            scope.photoShow = {
                currentPhoto: scope.photos.length > 0 ? scope.photos[scope.startIndex] : null,
                current_index: scope.startIndex,
                next_enable: true,
                pre_enable: false,
                showRemark: false
            };
            scope.preClick = function () {
                if (scope.photoShow.current_index == 0 || scope.photos.length == 0) {
                    return;
                }
                scope.photoShow.current_index--;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };
            scope.nextClick = function () {
                if (scope.photos.length == 0 || scope.photoShow.current_index == scope.photos.length - 1) {
                    return;
                }
                scope.photoShow.current_index++;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };
            scope.close = function () {
                scope.show = false;
            };

            scope.initShow = function () {
                scope.photoShow.current_index = scope.startIndex;
                scope.photoShow.currentPhoto = scope.photos[scope.photoShow.current_index];
                initNavState();
            };

            scope.showRemark = function (bo) {
                if (!scope.photoShow.currentPhoto.remark || scope.photoShow.currentPhoto.remark == '') {
                    return;
                }
                scope.photoShow.showRemark = bo;
            };

            function initNavState() {
                scope.photoShow.pre_enable = scope.photoShow.current_index <= 0 ? false : true;
                scope.photoShow.next_enable = scope.photoShow.current_index >= scope.photos.length - 1 ? false : true
            }

            scope.$watch('show', function (newVal, oldVal) {
                scope.initShow();
            });
        }
    }
}]);
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

/**
* Created by elinaguo on 15/5/24.
*/
/**
 * Created by elinaguo on 15/5/24.
 */
/**

 html页面:
      <zz-range-date-picker></zz-range-date-picker>

 js:
      //绑定指令回调方法
      $scope.zzRangeDatePicker.bindDateRangeChangedEvent(updateInputText);
      function updateInputText(dateRange) {
        //do something
      };

      //同级作用域下调用显示
      $scope.zzRangeDatePicker.show();
      //同级作用域下调用隐藏
      $scope.zzRangeDatePicker.hide();
      //设置绝对定位的left和top值
      zzRangeDatePicker.setLocation({left:30,top:30});
      //设置指定开始和结束时间
      zzRangeDatePicker.setDateValue({startDate: new Date(),endDate: new Date()});

 */



angular.module('zhuzhuqs').directive('zzRangeDatePicker', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<input ng-show="zzRangeDatePickerConfig.isShow" type="text" date-range-picker  class="zz-range-date-picker"'
                  +'ng-model="zzRangeDatePickerConfig.queryLogTimeRange"'
                  +'min="zzRangeDatePickerConfig.queryLogMaxTime"'
                  +'options="zzRangeDatePickerConfig.dateOptions" readonly/>',
    link: function (scope, elem, attrs) {
      scope.element = elem;
      scope.zzRangeDatePickerConfig = {
        isShow: false,
        queryLogTimeRange: {startDate: new Date(), endDate: new Date()},
        queryLogMaxTime: moment().format('YY/MM/DD HH:mm'),
        dateOptions: {
          locale: {
            fromLabel: "起始时间",
            toLabel: "结束时间",
            cancelLabel: '取消',
            applyLabel: '确定',
            customRangeLabel: '区间',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            firstDay: 1,
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月',
              '十月', '十一月', '十二月']
          },
          timePicker: true,
          timePicker12Hour: false,
          timePickerIncrement: 1,
          separator: "~",
          format: 'YY/MM/DD HH:mm',
          opens: 'left'
        },
        onDateRangeChanged: null
      };
      scope.zzRangeDatePicker = {
        isShow: function(){
          return scope.zzRangeDatePickerConfig.isShow;
        },
        isBindEvent: function(){
          return (scope.zzRangeDatePickerConfig.onDateRangeChanged !== undefined && scope.zzRangeDatePickerConfig.onDateRangeChanged !== null);
        },
        show: function(){
          scope.zzRangeDatePickerConfig.isShow = true;
        },
        hide: function(){
          scope.zzRangeDatePickerConfig.isShow = false;
        },
        bindDateRangeChangedEvent: function(eventName){
          scope.zzRangeDatePickerConfig.onDateRangeChanged = eventName;
        },
        setDateValue: function(startDate, endDate){
          scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate = startDate;
          scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate = endDate;
        },
        setLocation: function(position){
          scope.element.css({
            position: "absolute",
            top: position.top.toString() + 'px',
            left: position.left.toString() + 'px'
          })
        }
      };

      scope.$watch(function(){
        var startDate = scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate;
        var endDate = scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate;

        return startDate + endDate;
      }, function(){
        if(!scope.zzRangeDatePickerConfig.onDateRangeChanged){
          return;
        }
        console.log('queryLogTimeRange changed');
        console.log(scope.zzRangeDatePickerConfig.queryLogTimeRange.startDate);
        console.log(scope.zzRangeDatePickerConfig.queryLogTimeRange.endDate);

        scope.zzRangeDatePickerConfig.onDateRangeChanged(scope.zzRangeDatePickerConfig.queryLogTimeRange);
      });

    }
  }
});

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

angular.module('zhuzhuqs').directive('zzSelect', ['GlobalEvent', function (GlobalEvent) {
  return {
    require: '?ngModel',
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
    link: function (scope, elem, attrs, ngModel) {

      scope.$watch('config.currentText', function(value) {
        if(attrs.required){
          ngModel.$setValidity('required', !!value);
        }
      });

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

/**
 * Created by Wayne on 16/1/14.
 */

zhuzhuqs.directive('zzSwitch', ['GlobalEvent', function (GlobalEvent) {
  return {
    restrict: 'EA',
    templateUrl: 'directive/zz_switch/zz_switch.client.directive.view.html',
    replace: true,
    transclude: true,
    scope: {
      config: '='
    },
    link: function (scope, element, attributes) {
      scope.config.switchHandle = function () {
        scope.config.isOpen = !scope.config.isOpen;
      };
      function initConfig() {
        scope.config.isOpen = scope.config.isOpen || false;
        scope.config.openText = scope.config.openText || '是';
        scope.config.closeText = scope.config.closeText || '否';
      };

      initConfig();
    }
  };
}]);
