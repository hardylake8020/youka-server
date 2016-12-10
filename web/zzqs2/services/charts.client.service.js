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