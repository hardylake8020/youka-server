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