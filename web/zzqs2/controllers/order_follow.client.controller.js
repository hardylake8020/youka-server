/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderFollowController',
  ['$state', '$scope', 'OrderService', 'BMapService', 'GlobalEvent', 'config', 'AudioPlayer', 'OrderError', 'UserProfileService', 'Auth', 'OrderHelper',
    function ($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper) {

      var configuration = {
        selectOptions: [
          {
            key: '运单号',
            value: {
              name: '运单号',
              value: 'order_number',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '参考单号',
            value: {
              name: '参考单号',
              value: 'ref_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: true
          },
          {
            key: '订单号',
            value: {
              name: '订单号',
              value: 'original_order_number',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}],
              curSort: '',
              keyword: ''
            },
            isSelected: false
          },
          {
            key: '货物名称',
            value: {
              name: '货物名称',
              value: 'goods_name',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '承运商',
            value: {
              name: '承运商',
              value: 'execute_company',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '司机',
            value: {
              name: '司机',
              value: 'execute_driver',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: true
          },
          {
            key: '发货方',
            value: {
              name: '发货方',
              value: 'sender_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '收货方',
            value: {
              name: '收货方',
              value: 'receiver_name',
              isSort: false,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: true
          },
          {
            key: '货损信息',
            value: {
              name: '货损信息',
              value: 'damage',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '备注',
            value: {
              name: '备注',
              value: 'description',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '状态',
            value: {
              name: '状态',
              value: 'status',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '分配时间',
            value: {
              name: '分配时间',
              value: 'assign_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '进场时间',
            value: {
              name: '进场时间',
              value: 'entrance_time',
              isSort: true,
              isSearch: false,
              columnWidth: 1,
              sortList: [{text: '升序', value: '1'}, {text: '降序', value: '-1'}]
            },
            isSelected: false
          },
          {
            key: '中途事件',
            value: {
              name: '中途事件',
              value: 'halfway',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          },
          {
            key: '司机确认',
            value: {
              name: '司机确认',
              value: 'confirm',
              isSort: false,
              isSearch: false,
              columnWidth: 1
            },
            isSelected: false
          }],
        getOrderList: function (currentPage, limit, sortName, sortValue, searchArray) {
          return OrderService.getAllOrders(currentPage, limit, sortName, sortValue, searchArray);
        }
      };

      new OrderFollow($state, $scope, OrderService, BMapService, GlobalEvent, config, AudioPlayer, OrderError, UserProfileService, Auth, OrderHelper, configuration);
    }

  ]);
