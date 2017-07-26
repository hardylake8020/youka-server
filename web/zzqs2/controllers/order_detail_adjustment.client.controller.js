/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailAdjustmentController',
  ['$state', '$scope', '$stateParams', '$timeout', 'OrderService',
    function ($state, $scope, $stateParams, $timeout, OrderService) {

      var pageConfig = {
        paymentList: [
          {
            key: 'top',
            text: '首单支付',
            rate: 50,
            amount: 100,
            can_tiaozhang: true,
            has_tiaozhang: false,
            tiaozhangs: []
          }
        ],
        addTiaoZhang: function (paymentInfo) {
          paymentInfo.tiaozhangs.push({
            key: paymentInfo.key,
            type: 'increase',//increase,decrease
            price: 0,
            reason: '',
            disabled: false,
            changePrice: this.changeTiaoZhangPrice
          });
        },
        changeTiaoZhangPrice: function () {
          var tiaozhang = this;
          tiaozhang.price = parseFloat(tiaozhang.price);
          if (tiaozhang.price) {
            tiaozhang.price = Math.abs(tiaozhang.price) * (type === 'increase' ? 1 : -1);
          }
          //修改实际支付金额
        },
        reviewTiaoZhang: function (paymentInfo) {

        }
      };

      $scope.pageConfig = pageConfig;

      pageConfig.addTiaoZhang(pageConfig.paymentList[0]);

      function getOrderInfo() {
        OrderService.getOrderById($stateParams.order_id).then(function (data) {
          console.log(data);
          if (data && data._id && data.tender) {

          }
        });
      }

    }
  ]);
