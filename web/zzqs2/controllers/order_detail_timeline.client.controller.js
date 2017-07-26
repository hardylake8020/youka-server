/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailTimelineController',
  ['$state', '$scope', '$stateParams', '$timeout', 'OrderService', 'OrderHelper', 'config',
    function ($state, $scope, $stateParams, $timeout, OrderService, OrderHelper, config) {

      var pageConfig = {
        events: [],
        order: {},
        init: function () {
          getOrderEvent();
        },
        generateEventTypeDescription: function (event) {
          if (event.order.type === 'warehouse') {
            return '仓储收货';
          }
          return OrderHelper.getStatusString(event.type);
        },
        generatePhoto: function (photoKey) {
          return photoKey ? OrderHelper.generatePhotoUrl(photoKey) : 'images/icon/order_follow/error.jpg';
        }
      };

      $scope.pageConfig = pageConfig;

      function initBarcode(events) {
        if (!events || events.length <= 0)
          return;

        for (var index = 0; index < events.length; index++) {
          var event = events[index];

          if (event.order_codes && event.order_codes.length > 0) {
            event.barcodes = event.order_codes.join(', ');
          }
          else {
            event.barcodes = '';
          }
        }
      }

      function initActualInfo(events) {
        if (!events || events.length <= 0)
          return;

        for (var index = 0; index < events.length; index++) {
          var event = events[index];

          event.actualGoods = [];
          event.actualShowing = false;

          if (event.actual_more_goods_record && event.actual_more_goods_record.length > 0) {
            for (var i = 0; i < event.actual_more_goods_record.length; i++) {
              if (event.actual_more_goods_record[i].name || event.actual_more_goods_record[i].count) {
                event.actualShowing = true;
              }
              event.actualGoods.push({
                title: '实收货物' + (i + 1),
                name: event.actual_more_goods_record[i].name || '未知名称',
                count: event.actual_more_goods_record[i].count || '未知数量',
                unit: event.actual_more_goods_record[i].unit
              });
            }
            if (event.actualGoods.length === 1) {
              event.actualGoods[0].title = '实收货物';
            }
          }
          else {
            if (event.actual_goods_record) {
              if (event.actual_goods_record.goods_name ||
                (event.actual_goods_record.count ||
                event.actual_goods_record.weight ||
                event.actual_goods_record.volume)) {
                event.actualShowing = true;
              }
              event.actualGoods.push({
                title: '实收货物',
                name: event.actual_goods_record.goods_name || '未知名称',
                count: OrderHelper.getCountDetail(event.actual_goods_record),
                unit: ''
              });
            }
          }
        }
      }

      function getOrderEvent() {
        OrderService.getEventsByOrderId($stateParams.order_id)
          .then(function (result) {
            console.log('events--', result);
            if (result.err) {
              return OrderHelper.handleError(result.err.type);
            }
            if (result.events && result.order) {
              initBarcode(result.events);
              initActualInfo(result.events);
              result.events.forEach(function (event) {
                if (event.voice_file) {
                  event.audio_config = OrderHelper.getAudioConfig(event.voice_file);
                }
              });

              pageConfig.events = result.events;
              pageConfig.order = result.order;
            }

          }, function (err) {
            console.log(err);
            return handleError(err.err.type);
          });
      }

      pageConfig.init();
    }
  ]);
