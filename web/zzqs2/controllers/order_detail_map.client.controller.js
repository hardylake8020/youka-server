/**
 * Created by Wayne on 15/6/1.
 */
angular.module('zhuzhuqs').controller('OrderDetailMapController',
  ['$state', '$scope', '$stateParams', '$timeout', 'OrderService', 'BMapService', 'OrderHelper', 'config',
    function ($state, $scope, $stateParams, $timeout, OrderService, BMapService, OrderHelper, config) {

      var pageConfig = {
        bMap: null,
        gpsCount: 0,
        ungpsCount: 0,
        iconSize: new BMap.Size(42, 33),
        iconAnchorSize: new BMap.Size(14, 33),
        initMap: function () {
          this.bMap = BMapService.create('order-map-id', '北京', 11, true);
        },
        clearMap: function () {
          if (this.bMap) {
            this.bMap.clearOverlays();
          }
        },
        resetData: function () {
          var that = this;
          this.gpsCount = 0;
          this.ungpsCount = 0;
          this.clearMap();

          getOrderEvent(function (err, result) {
            if (err) {
              return;
            }
            result.events.forEach(function (event) {
              BMapService.drawDriverEvent(that.bMap, event, generateTipHtml(event));
            });

            getOrderTraces(function (err, data) {
              if (err) {
                return;
              }
              that.gpsCount = data.gpsCount;
              that.ungpsCount = data.ungpsCount;

              if (data.latestPoint.trace && result.order.status !== 'completed' && result.order.status !== 'unAssigned') {
                that.addMarker(new BMap.Point(data.latestPoint.trace.location[0], data.latestPoint.trace.location[1]),
                  new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_current.gif", that.iconSize, {anchor: that.iconAnchorSize}));

              }

              setTimeout(function () {
                that.bMap.setViewport(data.allPoints);
              }, 1000);
            });
          });
        },
        addMarker: function (bmapPoint, myIcon) {
          if (bmapPoint) {
            var marker = new BMap.Marker(bmapPoint, {icon: myIcon});
            this.bMap.addOverlay(marker);
          }
        }
      };

      $scope.pageConfig = pageConfig;

      pageConfig.initMap();
      pageConfig.resetData();

      function getOrderTraces(callback) {
        OrderService.getTracesByOrderId($stateParams.order_id).then(function (data) {
          console.log('order traces--', data);

          if (data.err) {
            OrderService.handleError(data.err.type);
            return callback(data.err);
          }

          var allDriverPoints = [], gpsCount = 0, ungpsCount = 0;
          var latestPoint = {
            trace: '',
            time: new Date('1988/1/10')
          };

          data.forEach(function (driverTraceObject) {
            var drawLineResult = BMapService.drawLine(pageConfig.bMap, driverTraceObject.traces, latestPoint, false);
            gpsCount += drawLineResult.gpsCount;
            ungpsCount += drawLineResult.ungpsCount;
            allDriverPoints = allDriverPoints.concat(drawLineResult.points);
          });
          return callback(null, {
            allPoints: allDriverPoints,
            gpsCount: gpsCount,
            ungpsCount: ungpsCount,
            latestPoint: latestPoint
          });

        }, function (err) {
          console.log(err);
          OrderService.handleError(err);
          return callback(err);
        });
      }

      function getOrderEvent(callback) {
        OrderService.getEventsByOrderId($stateParams.order_id)
          .then(function (result) {
            console.log('events--', result);
            if (result.err) {
              OrderHelper.handleError(result.err.type);
              return callback(result.err);
            }
            if (result.events) {
              return callback(null, result);
            }
          }, function (err) {
            console.log(err);
            handleError(err.err.type);
            return callback(err);
          });
      }

      function generatePhotoHtml(event) {
        var displayPhotos = [];
        switch (event.type) {
          case 'pickup':
          case 'delivery':
            if (event.goods_photos && event.goods_photos.length > 0) {
              displayPhotos.push(event.goods_photos[0]);
            }
            if (event.credential_photos && event.credential_photos.length > 0) {
              displayPhotos.push(event.credential_photos[0]);
            }
            break;
          case 'pickupSign':
          case 'deliverySign':
          case 'halfway':
            if (event.halfway_photos && event.halfway_photos.length > 0) {
              displayPhotos.push(event.halfway_photos[0]);
            }
            break;
        }

        var result = '';
        if (displayPhotos.length > 0) {
          result += '<div id="' + event._id + '" class="photos">';
          displayPhotos.forEach(function (photo) {
            result += ('<div class="photo">' +
            '<img src="' + OrderHelper.generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
          });
          result += '</div>';
        }
        return result;
      }

      function generateTipHtml(event) {
        event.driver.plate_numbers = event.driver.plate_numbers || [];

        var html = '<div class="event-tip">'
          + '<div class="event_type">' + OrderHelper.getStatusString(event.type) + '</div>'
          + '<div class="driver"><strong>司机:</strong><span>'
          + (event.driver.nickname ? (event.driver.nickname) + " " : '')
          + (event.driver.username ? (event.driver.username) + " " : '')
          + (event.driver.plate_numbers.length > 0 ? (event.driver.plate_numbers[0] + " ") : '')
          + '</span></div>'
          + '<div class="time"><strong>时间:</strong><time>' + new Date(event.time).toLocaleString() + '</time></div>'
          + '<div class="address"><strong>地点:</strong><span>' + event.address + '</span></div>'
          + '<div class="damaged"><strong>货损:</strong><span>' + (event.damaged ? '有' : '无') + '</span></div>'
          + '<div class="description"><strong>备注:</strong><span>' + (event.description ? event.description : '无') + '</span></div>'
          + generatePhotoHtml(event)
          + '</div>';
        return html;
      }
    }
  ]);
