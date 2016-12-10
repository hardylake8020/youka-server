/**
 * Created by Wayne on 15/10/9.
 */

tender.factory('http', ['$http', '$q', 'config', 'GlobalEvent', 'CommonHelper',
  function ($http, $q, config, GlobalEvent, CommonHelper) {

    function get(address, params) {
      var q = $q.defer();
      address = config.serverAddress + address;

      $http.get(address, {params: params})
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });

      return q.promise;
    }

    function post(address, params) {
      var q = $q.defer();
      address = config.serverAddress + address;

      $http.post(address, params)
        .success(function (data) {
          q.resolve(data);
        })
        .error(function (err) {
          q.reject(err);
        });

      return q.promise;
    }

    return {
      sendRequest: function (scope, request, params, successCallback, errorCallback) {
        scope.$emit(GlobalEvent.onShowLoading, true);
        eval(request).then(function (data) {
          scope.$emit(GlobalEvent.onShowLoading, false);

          if (!data) {
            return CommonHelper.showAlert(scope, '服务器错误');
          }
          if (data.err) {
            CommonHelper.showAlert(scope, data.err.zh_message);
          }

          return successCallback(data.err, data);

        }, function (err) {
          scope.$emit(GlobalEvent.onShowLoading, false);

          CommonHelper.showAlert(scope, '服务器错误');
          if (errorCallback) {
            errorCallback(err);
          }
        });
      },
      get: function (address, params) {
        return get(address, params);
      },
      post: function (address, params) {
        return post(address, params);
      }
    };

  }]);
