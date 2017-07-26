/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailAdjustmentController',
  ['$state', '$scope', '$stateParams', '$timeout', 'OrderService', 'GlobalEvent',
    function ($state, $scope, $stateParams, $timeout, OrderService, GlobalEvent) {

      var pageConfig = {
        amount: 0,
        actual_amount: 0,
        paymentList: [
          {
            key: 'top',
            text: '首单支付',
            rate: 0,
            amount: 0,
            actual_amount: 0,
            can_tiaozhang: false,
            has_tiaozhang: false,
            tiaozhangs: []
          },
          {
            key: 'tail',
            text: '尾单支付',
            rate: 0,
            amount: 0,
            actual_amount: 0,
            can_tiaozhang: false,
            has_tiaozhang: false,
            tiaozhangs: []
          },
          {
            key: 'last',
            text: '回单支付',
            rate: 0,
            amount: 0,
            actual_amount: 0,
            can_tiaozhang: false,
            has_tiaozhang: false,
            tiaozhangs: []
          },
          {
            key: 'ya_jin',
            text: '押金支付',
            rate: null,
            amount: 0,
            actual_amount: 0,
            can_tiaozhang: false,
            has_tiaozhang: false,
            tiaozhangs: []
          }
        ],
        resetPaymentList: function (tender, status) {
          var that = this;

          for (var i = 0; i < 4; i++) {
            if (this.paymentList[i].rate === null) {
              this.paymentList[i].amount = tender[this.paymentList[i].key];
            }
            else {
              this.paymentList[i].rate = tender['payment_' + this.paymentList[i].key + '_rate'] || 0;
              this.paymentList[i].amount = tender.winner_price * this.paymentList[i].rate;
            }
            this.paymentList[i].has_tiaozhang = tender['can_pay_' + this.paymentList[i].key] || false;
            if (status === 'completed') {
              this.paymentList[i].can_tiaozhang = true;
            }
          }
          if (status !== 'completed' && ['unDeliverySigned', 'unDeliveried'].indexOf(status) !== -1) {
            this.paymentList[0].can_tiaozhang = true;
          }

          for (var j = 0; j < 4; j++) {
            if (this.paymentList[j].has_tiaozhang) {
              this.paymentList[j].can_tiaozhang = false;
            }
            this.paymentList[j].tiaozhangs = (tender['real_pay_' + this.paymentList[j].key + '_tiaozhangs'] || []).map(function (item) {
              return {
                type: item.price > 0 ? 'increase' : 'decrease',
                price: Math.abs(item.price),
                reason: item.reason,
                disabled: !that.paymentList[j].can_tiaozhang
              };
            });
          }

          this.calcAll();
        },
        addTiaoZhang: function (paymentInfo) {
          paymentInfo.tiaozhangs.push({
            type: 'increase',//increase,decrease
            price: 0,
            reason: '',
            disabled: false,
            changePrice: this.changeTiaoZhangPrice
          });
        },
        removeTiaoZhang: function (paymentInfo, index) {
          paymentInfo.tiaozhangs.splice(index, 1);
          this.calcAll();
        },
        changeTiaoZhangPrice: function () {
          var tiaozhang = this;

          if (tiaozhang.price && tiaozhang.price.toString().indexOf('.') === tiaozhang.price.toString().length - 1) {
            return;
          }

          var price = parseFloat(tiaozhang.price);
          if (price) {
            tiaozhang.price = Math.abs(price);
          }
          pageConfig.calcAll();
        },
        calcAll: function () {
          var that = this;
          var amount = 0, actualAmount = 0;
          this.paymentList.forEach(function (paymentInfo) {
            that.calcPaymentSum(paymentInfo);
            amount += paymentInfo.amount;
            actualAmount += paymentInfo.actual_amount;
          });
          this.amount = amount;
          this.actual_amount = actualAmount;
        },
        calcPaymentSum: function (paymentInfo) {
          paymentInfo.actual_amount = paymentInfo.amount;
          if (paymentInfo.tiaozhangs && paymentInfo.tiaozhangs.length > 0) {
            paymentInfo.tiaozhangs.forEach(function (tiaozhang) {
              if (tiaozhang.price) {
                paymentInfo.actual_amount += tiaozhang.price * (tiaozhang.type === 'increase' ? 1 : -1);
              }
            });
          }
        },
        reviewTiaoZhang: function (paymentInfo) {
          if (paymentInfo.can_tiaozhang) {
            var tiaozhangs = [];
            for (var i = 0; i < paymentInfo.tiaozhangs.length; i++) {
              if (!paymentInfo.tiaozhangs[i].price) {
                return $scope.$emit(GlobalEvent.onShowAlert, '金额不正确');
              }
              tiaozhangs.push({
                price: Math.abs(paymentInfo.tiaozhangs[i].price) * (paymentInfo.tiaozhangs[i].type === 'increase' ? 1 : -1),
                reason: paymentInfo.tiaozhangs[i].reason
              });
            }

            $scope.$emit(GlobalEvent.onShowAlertConfirm, '确认审核通过吗？', function (companyId) {
              $scope.$emit(GlobalEvent.onShowLoading, true);

              OrderService.verifyOrder({
                type: 'can_pay_' + paymentInfo.key,
                price: paymentInfo.amount,
                tender_tiaozhang: tiaozhangs,
                order_id: $stateParams.order_id
              }).then(function (data) {
                $scope.$emit(GlobalEvent.onShowLoading, false);
                console.log(data);
                if (!data.err) {
                  $scope.$emit(GlobalEvent.onShowAlert, '审核通过', function () {
                    $state.go('order_detail.adjustment', {}, {reload: true});
                  });
                }
              }, function (err) {
                $scope.$emit(GlobalEvent.onShowLoading, false);
                console.log(err);
              });
            }, null, {title: '确认'});
          }
        }
      };

      $scope.pageConfig = pageConfig;

      pageConfig.addTiaoZhang(pageConfig.paymentList[0]);

      function getOrderInfo() {
        OrderService.getOrderById($stateParams.order_id).then(function (data) {
          console.log(data);
          if (data && data._id && data.tender) {
            pageConfig.resetPaymentList(data.tender, data.status);
          }
        });
      }

      getOrderInfo();
    }
  ]);
