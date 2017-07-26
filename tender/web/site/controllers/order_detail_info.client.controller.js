/**
 * Created by Wayne on 15/6/1.
 */
tender.controller('OrderDetailInfoController',
  ['$state', '$scope', '$stateParams', '$timeout', 'HttpTender',
    function ($state, $scope, $stateParams, $timeout, HttpTender) {

      var pageConfig = {
        detailInfos: [],
        setDetailInfos: function (order) {
          var tender = order.tender;

          this.detailInfos = [];
          this.detailInfos.push(
            [
              {
                key: 'status',
                text: '运单状态',
                value: getStatusString(tender)
              },
              {
                key: 'order_number',
                text: '运单号',
                value: tender.order_number
              },
              {
                key: 'refer_order_number',
                text: '参考单号',
                value: tender.refer_order_number
              },
              {
                key: 'tender_number',
                text: '订单号',
                value: tender.tender_number
              },
              {
                key: 'sender_company',
                text: '发货方',
                value: tender.sender_company
              },
              {
                key: 'receiver_company',
                text: '收货方',
                value: tender.receiver_company
              },
              {
                key: 'goods',
                text: '货物',
                value: getOrderGoodsName(tender)
              },
              {
                key: 'fee',
                text: '运费',
                value: order.freight_charge
              },
              {
                key: 'damaged',
                text: '货损信息',
                value: order.damaged ? '是' : '否'
              },
              {
                key: 'remark',
                text: '备注',
                value: tender.remark
              }
            ]
          );
          this.detailInfos.push(
            [
              {
                key: 'winner_price',
                text: '中标价格',
                value: tender.winner_price,
                unit: '元'
              },
              {
                key: 'lowest_tons_count',
                text: '保底吨数',
                value: tender.lowest_tons_count,
                isHide: tender.tender_type !== 'compares_ton'
              },
              {
                key: 'winner_price_per_ton',
                text: '中标超出单价／吨',
                value: tender.winner_price_per_ton,
                isHide: tender.tender_type !== 'compares_ton'
              },
              {
                key: 'pickup_real_tons',
                text: '实际提货吨数',
                value: tender.pickup_real_tons,
                isHide: tender.tender_type !== 'compares_ton'
              },
              {
                key: '',
                text: '实际超出吨数',
                value: '',
                isHide: tender.tender_type !== 'compares_ton'
              },
              {
                key: '',
                text: '首单应支付',
                value: (tender.winner_price * tender.payment_top_rate) / 100,
                unit: '元'
              },
              {
                key: '',
                text: '尾单应支付',
                value: (tender.winner_price * tender.payment_tail_rate) / 100,
                unit: '元'
              },
              {
                key: '',
                text: '回单应支付',
                value: (tender.winner_price * tender.payment_last_rate) / 100,
                unit: '元'
              },
              {
                key: '',
                text: '押金应支付',
                value: tender.ya_jin,
                unit: '元'
              }
            ]
          );
          this.detailInfos.push(
            [
              {
                key: 'pickup_address',
                text: '提货地址',
                value: tender.pickup_address
              },
              {
                key: 'pickup_time',
                text: '提货时间',
                value: new Date(tender.pickup_start_time).Format('yyyy.MM.dd HH:mm') + ' ~ ' + new Date(tender.pickup_end_time).Format('yyyy.MM.dd HH:mm')
              },
              {
                key: 'pickup_name',
                text: '提货联系人',
                value: tender.pickup_name
              },
              {
                key: 'pickup_mobile_phone',
                text: '联系人手机',
                value: tender.pickup_mobile_phone
              },
              {
                key: 'pickup_tel_phone',
                text: '联系人固话',
                value: tender.pickup_tel_phone
              }
            ]
          );
          this.detailInfos.push(
            [
              {
                key: 'delivery_address',
                text: '提货地址',
                value: tender.delivery_address
              },
              {
                key: 'delivery_time',
                text: '提货时间',
                value: new Date(tender.delivery_start_time).Format('yyyy.MM.dd HH:mm') + ' ~ ' + new Date(tender.delivery_end_time).Format('yyyy.MM.dd HH:mm')
              },
              {
                key: 'delivery_name',
                text: '提货联系人',
                value: tender.delivery_name
              },
              {
                key: 'delivery_mobile_phone',
                text: '联系人手机',
                value: tender.delivery_mobile_phone
              },
              {
                key: 'delivery_tel_phone',
                text: '联系人固话',
                value: tender.delivery_tel_phone
              }
            ]
          );
        }
      };

      $scope.pageConfig = pageConfig;

      function getTenderDetail() {
        HttpTender.getTenderByTenderId($scope, {
          tender_id: $stateParams.tender_id
        }, function (err, data) {
          pageConfig.setDetailInfos({tender: data})
        });
      }

      getTenderDetail();

      function getStatusString(tender) {
        var results = '未知';
        switch (tender.status) {
          case 'unStarted':
            results = '未开始';
            break;
          case 'comparing':
            results = '比价中';
            break;
          case 'compareEnd':
            results = '比价结束';
            break;
          case 'unAssigned':
            results = '未分配司机';
            break;
          case 'inProgress':
            results = '进行中';
            break;
          case 'stop':
            results = '已停止';
            break;
          case 'completed':
            results = '已完成';
            break;
        }

        return results;
      }

      function getOrderGoodsName(tender) {
        var goodsName = '';
        if (tender.goods && tender.goods.length > 0) {
          tender.goods.forEach(function (item) {
            goodsName += ((item.name || '未知') + ',');
          });
          goodsName = goodsName.substr(0, goodsName.length - 1);
        }
        else {
          goodsName = tender.goods_name || '未知';
        }
        return goodsName;
      }

      // getOrderDetail();
    }
  ]);
