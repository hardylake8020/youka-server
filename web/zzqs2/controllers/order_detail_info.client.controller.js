/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailInfoController',
  ['$state', '$scope', '$stateParams', '$timeout', 'OrderService', 'OrderHelper',
    function ($state, $scope, $stateParams, $timeout, OrderService, OrderHelper) {

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
                value: OrderHelper.getStatusString(order.status)
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
                text: '发标单位',
                value: tender.sender_company
              },
              {
                key: 'goods',
                text: '货物',
                value: OrderHelper.getGoodsNameString(tender)
              },
              {
                key: 'fee',
                text: '运费',
                value: tender.winner_price,
                unit: '元'
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


          if (tender.tender_type === 'grab') {
            this.detailInfos.push(
              [
                {
                  key: '',
                  text: '保证金额',
                  value: tender.deposit,
                  unit: '元'
                },
                {
                  key: '',
                  text: '押金',
                  value: tender.ya_jin,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最低抢单价',
                  value: tender.lowest_grab_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最高抢单价',
                  value: tender.highest_grab_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '抢单时间窗',
                  value: tender.grab_time_duration,
                  unit: '分钟'
                },
                {
                  key: '',
                  text: '运费递增值',
                  value: tender.grab_increment_price,
                  unit: '元'
                }
              ]
            );
          } else if (tender.tender_type === 'compare') {
            this.detailInfos.push(
              [
                {
                  key: '',
                  text: '保证金额',
                  value: tender.deposit,
                  unit: '元'
                },
                {
                  key: '',
                  text: '押金',
                  value: tender.ya_jin,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最低保护价',
                  value: tender.lowest_protect_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最高保护价',
                  value: tender.highest_protect_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '自动截标',
                  value: tender.auto_close_duration,
                  unit: '分钟'
                }
              ]
            )
          } else if (tender.tender_type === 'compares_ton') {
            this.detailInfos.push(
              [
                {
                  key: '',
                  text: '保证金额',
                  value: tender.deposit,
                  unit: '元'
                },
                {
                  key: '',
                  text: '押金',
                  value: tender.ya_jin,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最高保护价',
                  value: tender.highest_protect_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '最高超额单价',
                  value: tender.highest_more_price_per_ton,
                  unit: '元'
                },
                {
                  key: '',
                  text: '保底吨数',
                  value: tender.lowest_tons_count,
                  unit: ''
                },
                {
                  key: 'winner_price_per_ton',
                  text: '中标超出单价／吨',
                  value: tender.winner_price_per_ton
                },
                {
                  key: 'pickup_real_tons',
                  text: '实际提货吨数',
                  value: tender.pickup_real_tons
                },
                {
                  key: '',
                  text: '实际超出吨数',
                  value: ''
                }
              ]
            )
          } else if (tender.tender_type === 'assign') {
            this.detailInfos.push(
              [
                {
                  key: '',
                  text: '保证金额',
                  value: tender.deposit,
                  unit: '元'
                },
                {
                  key: '',
                  text: '押金',
                  value: tender.ya_jin,
                  unit: '元'
                },
                {
                  key: '',
                  text: '运费价格',
                  value: tender.lowest_grab_price,
                  unit: '元'
                },
                {
                  key: '',
                  text: '供应商',
                  value: tender.sender_company,
                  unit: ''
                }
              ]
            )
          }

          this.detailInfos.push(
            [
              {
                key: 'winner_price',
                text: '中标价格',
                value: tender.winner_price,
                unit: '元'
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
                value: new Date(tender.pickup_start_time).Format('yyyy.MM.dd hh:mm') + ' ~ ' + new Date(tender.pickup_end_time).Format('yyyy.MM.dd hh:mm')
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
                value: new Date(tender.delivery_start_time).Format('yyyy.MM.dd hh:mm') + ' ~ ' + new Date(tender.delivery_end_time).Format('yyyy.MM.dd hh:mm')
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

      function getOrderDetail() {
        OrderService.getOrderById($stateParams.order_id).then(function (data) {
          console.log(data);
          if (data && data._id && data.tender) {
            pageConfig.setDetailInfos(data);
          }

        });
      }

      getOrderDetail();
    }
  ]);
