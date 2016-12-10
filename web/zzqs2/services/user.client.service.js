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
