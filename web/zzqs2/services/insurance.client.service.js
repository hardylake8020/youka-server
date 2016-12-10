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