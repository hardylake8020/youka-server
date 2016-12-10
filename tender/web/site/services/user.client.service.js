/**
 * Created by Wayne on 15/10/9.
 */

tender.factory('User', ['http', function (http) {
  return {
    getMe: function (params) {
      return http.post('/user/current', params);
    },
    login: function (params) {
      return http.post('/user/login', params);
    }
  };
}]);