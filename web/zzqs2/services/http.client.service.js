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