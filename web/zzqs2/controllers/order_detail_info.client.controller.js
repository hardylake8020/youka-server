/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailInfoController',
  ['$state', '$scope', '$timeout', 'OrderService',
    function ($state, $scope, $timeout, OrderService) {

      var pageConfig = {
        detailInfos: [
          [
            {
              key: 'status',
              text: '运单状态',
              value: '未提货'
            },
            {
              key: 'order_number',
              text: '运单号',
              value: 'WJ20170524'
            },
            {
              key: 'ref_number',
              text: '参考单号',
              value: 'HM_WJ20170524'
            },
            {
              key: 'sales_number',
              text: '订单号',
              value: 'OD_0000'
            },
            {
              key: 'sender_company',
              text: '发货方',
              value: '大昌商贸有限公司'
            },
            {
              key: 'receiver_company',
              text: '收货方',
              value: '万达售后服务部'
            },
            {
              key: 'goods',
              text: '货物',
              value: '家具／纸箱'
            },
            {
              key: 'fee',
              text: '运费',
              value: '5000'
            },
            {
              key: 'damaged',
              text: '货损信息',
              value: '无货损'
            },
            {
              key: 'remark',
              text: '备注',
              value: ''
            },


          ],
          [
            {
              key: '',
              text: '中标价格',
              value: '5000元'
            },
            {
              key: '',
              text: '保底吨数',
              value: ''
            },
            {
              key: '',
              text: '中标超出单价／吨',
              value: ''
            },
            {
              key: '',
              text: '实际提货吨数',
              value: ''
            },
            {
              key: '',
              text: '实际超出吨数',
              value: ''
            },
            {
              key: '',
              text: '首单应支付',
              value: '3000元'
            },
            {
              key: '',
              text: '尾单应支付',
              value: '1000元'
            },
            {
              key: '',
              text: '回单应支付',
              value: '1000元'
            },
            {
              key: '',
              text: '押金应支付',
              value: '1000元'
            }
          ],
          [
            {
              key: 'pickup_address',
              text: '提货地址',
              value: '江苏省镇江市开发区檀山路于312国道交汇处向西100米'
            },
            {
              key: 'pickup_time',
              text: '提货时间',
              value: new Date().toLocaleString()
            },
            {
              key: 'pickup_contact',
              text: '提货联系人',
              value: '王师傅'
            },
            {
              key: 'pickup_mobile',
              text: '联系人手机',
              value: '13122223333'
            },
            {
              key: 'pickup_tel',
              text: '联系人固话',
              value: ''
            }
          ],
          [
            {
              key: 'delivery_address',
              text: '交货地址',
              value: '江苏省镇江市开发区檀山路于312国道交汇处向西100米'
            },
            {
              key: 'delivery_time',
              text: '交货时间',
              value: new Date().toLocaleString()
            },
            {
              key: 'delivery_contact',
              text: '交货联系人',
              value: '王师傅'
            },
            {
              key: 'delivery_mobile',
              text: '联系人手机',
              value: '13122223333'
            },
            {
              key: 'delivery_tel',
              text: '联系人固话',
              value: ''
            }
          ]
        ],
        setDetailInfos: function (order) {

        }
      };

      $scope.pageConfig = pageConfig;

      function getOrderDetail() {
        OrderService.getOrderById().then(function (data) {

        });
      }

    }
  ]);
