/**
 * Created by Wayne on 15/10/9.
 */

tender.factory('HttpTender', ['http',
  function (http) {

  return {
    createTender: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "post('/tender/create', params)", params, successCallback, errorCallback);
    },
    deleteTender: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/tender/user/delete', params)", params, successCallback, errorCallback);
    },
    getTenders: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "post('/tender/user/get/list', params)", params, successCallback, errorCallback);
    },
    getOneTender: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/tender/user/get/one', params)", params, successCallback, errorCallback);
    },
    getTopQuoteRecord: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/tender/record/quote/top', params)", params, successCallback, errorCallback);
    },
    getAllBidRecord: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/tender/record/list', params)", params, successCallback, errorCallback);
    },
    getWinnerRecord: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/tender/record/winner', params)", params, successCallback, errorCallback);
    },
    applyBidder: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "post('/tender/apply/bidder', params)", params, successCallback, errorCallback);
    },
    getOrderInfo: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/order/single/info', params)", params, successCallback, errorCallback);
    },
    getOrderEvent: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/order/single/event', params)", params, successCallback, errorCallback);
    },
    getOrderTrace: function (scope, params, successCallback, errorCallback) {
      return http.sendRequest(scope, "get('/order/single/trace', params)", params, successCallback, errorCallback);
    }
  };
}]);