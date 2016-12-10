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
