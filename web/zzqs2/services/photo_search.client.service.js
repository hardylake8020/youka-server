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