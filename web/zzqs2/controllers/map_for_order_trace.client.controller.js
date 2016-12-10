angular.module('zhuzhuqs').controller('MapForOrderTraceController',
  ['$scope', 'BMapService', 'OrderService', 'GlobalEvent', 'config',
    function ($scope, BMapService, OrderService, GlobalEvent, config) {

      var map = new BMap.Map('mapForOrderTrace');
      map.centerAndZoom(new BMap.Point(116.404, 39.915), 11);  // 初始化地图,设置中心点坐标和地图级别
      map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
      map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
      var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
      var top_left_navigation = new BMap.NavigationControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        type: BMAP_NAVIGATION_CONTROL_SMALL
      });  //左上角，添加默认缩放平移控件
      map.addControl(top_left_control);
      map.addControl(top_left_navigation);

      $scope.mapInit = {
        showDriverNumber: 50,
        gpsCount: 0,
        ungpsCount: 0,
        icon: '/images/icon/map/driver.png',
        iconSize: new BMap.Size(42, 33),
        iconAnchorSize: new BMap.Size(14, 33),//offset
        myIcon: '',
        windowOpts: {
          width: 290,     // 信息窗口宽度
          enableMessage: true//设置允许信息窗发送短息
        },
        showPhotoScan: false,
        displayPhotos: [],
        currentPhotos: [],
        imgIndex: 0

      };
      $scope.mapInit.myIcon = new BMap.Icon(config.serverWebAddress + $scope.mapInit.icon, $scope.mapInit.iconSize);

      $scope.filterDriverNumber = function () {
        getDriverData();
      };
      $scope.showPhotos = function (photo) {
        $scope.mapInit.imgIndex = 0;
        $scope.mapInit.showPhotoScan = true;
        $scope.$apply();
      };

      function makeOldDataFromNewData(data) {
        var newData = [];

        if (data.drivers && data.drivers.length > 0 && data.allDriverOrders) {
          data.drivers.forEach(function (eachDriver) {
            if (data.allDriverOrders[eachDriver._id] && data.allDriverOrders[eachDriver._id].length > 0) {
              var newItem = {
                _id: eachDriver._id,
                address: '',
                driver: eachDriver,
                driver_id: eachDriver._id,
                location: eachDriver.current_location,
                orders: data.allDriverOrders[eachDriver._id]
              }
              if (data.allDriverOrders[eachDriver._id][0].pickup_events && data.allDriverOrders[eachDriver._id][0].pickup_events.length > 0) {
                newItem.events = data.allDriverOrders[eachDriver._id][0].pickup_events[0];
              }
              else {
                newItem.events = null;
              }

              newData.push(newItem);
            }
            else {
              console.log('can not find driver order');
            }

          });
        }

        return newData;
      }

      function getDriverData() {

        $scope.$emit(GlobalEvent.onShowLoading, true);
        OrderService.getDriverOrders($scope.mapInit.showDriverNumber).then(function (data) {
          $scope.$emit(GlobalEvent.onShowLoading, false);
          console.log(data);
          if (data.err) {
            handleError(data.err.type);
          }
          else {
            data = makeOldDataFromNewData(data);

            var allDriverPoints = [];
            clearMap();
            clearMapPoints();
            data.forEach(function (trace) {
              var bmapPoint = new BMap.Point(trace.location[0], trace.location[1]);
              if (bmapPoint) {
                allDriverPoints.push(bmapPoint);
                var marker = new BMap.Marker(bmapPoint, {icon: $scope.mapInit.myIcon});
                map.addOverlay(marker);
                marker.addEventListener("click", function (e) {
                  getAddressByPoint(trace);
                });
              }
            });
            map.setViewport(allDriverPoints);
          }
        }, function (err) {
          console.log(err);
        });


      }

      function handleError(errType) {
        $scope.$emit(GlobalEvent.onShowAlert, errType + " 未知错误！请联系管理员");
      }

      function clearMap() {
        map.clearOverlays();
      }

      function clearMapPoints() {
        $scope.mapInit.gpsCount = 0;
        $scope.mapInit.ungpsCount = 0;
      }

      function getAddressByPoint(trace) {
        var location = '';
        if (!trace.location || trace.location.length <= 0) {
          location = '未知';
          var _html = generateTipHtml(trace, location);
          var infoWindow = new BMap.InfoWindow(_html, $scope.mapInit.windowOpts);  // 创建信息窗口对象
          map.openInfoWindow(infoWindow, point); //开启信息窗口
        }
        else {
          var point = new BMap.Point(trace.location[0], trace.location[1]);
          var geoc = new BMap.Geocoder();
          geoc.getLocation(point, function (rs) {
            var addComp = rs.addressComponents;
            location = addComp.province + ", " + addComp.city + ", " + addComp.district + ", " + addComp.street + ", " + addComp.streetNumber;
            var _html = generateTipHtml(trace, location);
            var infoWindow = new BMap.InfoWindow(_html, $scope.mapInit.windowOpts);  // 创建信息窗口对象
            map.openInfoWindow(infoWindow, point); //开启信息窗口
          });
        }
      }

      function generateTipHtml(trace, location) {
        var html = generateDriverInforHtml(trace.driver)
          + generateOrderInforHtml(trace, location)
          + generatePhotoHtml(trace.events);
        return html;
      }

      function generateDriverInforHtml(driver) {
        var html = '<div class=" driver-info">';
        html += '<div class="content"><div class="avatar">';
        if (driver.photo) {
          html += '<img ng-src="' + generatePhotoUrl(driver.photo) + '" /></div>';
        }
        else {
          html += '</div>'
        }
        html += '<div class="info">' +
        '<div class="top"><span>' +
        (driver.nickname ? driver.nickname : '匿名司机') + '</span>' +
        '<span>(' + (driver.plate_numbers.length > 0 ? driver.plate_numbers[0] : '未知车牌') + ')</span>' +
        '</div>' +
        '<div class="bottom">' + driver.username + '</div>' +
        '</div>';

        html += '</div></div>';
        return html;

      }

      function generateOrderInforHtml(trace, location) {

        var html = '<div class="event-tip">';
        html += '<div class="content">';
        var orders = trace.orders;
        if (orders.length == 1) {
          var order = orders[0];
          html += '<div class="item">';
          html += '<div class="left">';
          html += '运单号：</div>';
          html += '<div class="right">';
          html += order.order_details.order_number + '</div></div>';
          html += '<div class="item">';
          html += '<div class="left">';
          html += '货物名称：</div>';
          html += '<div class="right">';
          html += (order.order_details.goods_name ? order.order_details.goods_name : '未知') + '</div></div>';
          html += '<div class="item">';
          html += '<div class="left">';
          html += '件重体：</div>';
          html += '<div class="right">';
          if (!order.order_details.weight && !order.order_details.count && !order.order_details.volume) {
            html += '未知</div></div>'
          }
          else {
            html += (order.order_details.count ? (order.order_details.count + order.order_details.count_unit) : '')
            + (order.order_details.weight ? ('|' + order.order_details.weight + order.order_details.weight_unit) : '')
            + (order.order_details.volume ? ('|' + order.order_details.volume + order.order_details.volume_unit) : '') + '</div></div>'
          }
          html += '<div class="item">';
          html += '<div class="left">';
          html += '货损状况：</div>';
          html += '<div class="right">';
          html += (order.damaged ? '有货损' : '无货损') + '</div></div>';

        }
        else {
          html += '<div class="item">';
          html += '<div class="left">';
          html += '运单号：</div>';
          html += '<div class="right">';
          html += getOrderList(trace.orders) + '共' + trace.orders.length + '张运单</div></div>';
        }
        html += '<div class="item">';
        html += '<div class="left">';
        html += '当前位置：</div>';
        html += '<div class="right">';
        html += location + '</div></div>';
        html += '</div></div>';

        return html;

      }

      function generatePhotoHtml(event) {
        if (!event) {
          return '';
        }
        $scope.mapInit.displayPhotos = [];
        $scope.mapInit.currentPhotos = [];
        if (event.goods_photos && event.goods_photos.length > 0) {
          $scope.mapInit.displayPhotos.push(event.goods_photos[0]);
          var scan_obj = {
            order: '',
            title: '',
            warning: '',
            url: generatePhotoUrl(event.goods_photos[0]),
            remark: ''
          };
          $scope.mapInit.currentPhotos.push(scan_obj);
        }
        if (event.credential_photos && event.credential_photos.length > 0) {
          $scope.mapInit.displayPhotos.push(event.credential_photos[0]);
          var scan_obj = {
            order: '',
            title: '',
            warning: '',
            url: generatePhotoUrl(event.credential_photos[0]),
            remark: ''
          };
          $scope.mapInit.currentPhotos.push(scan_obj);
        }

        var result = '';
        if ($scope.mapInit.displayPhotos.length > 0) {
          result += '<div id="' + event._id + '" class="photos">';
          for (var i = 0; i < $scope.mapInit.displayPhotos.length; i++) {
            var photo = $scope.mapInit.displayPhotos[i];
            if (i === 0) {
              result += ('<div class="photo" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
              '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
            }
            else {
              result += ('<div class="photo-right" onclick="angular.element(this).scope().showPhotos(\'' + photo + '\');">' +
              '<img src="' + generatePhotoUrl(photo) + '" onerror="this.src=\'images/icon/order_follow/error.jpg\'"/></div>');
            }

          }
          result += '</div>';

        }
        return result;
      }

      function getOrderList(orders) {
        var _list = orders[0].order_details.order_number;
        if (orders.length > 1) {
          var _length = orders.length > 5 ? 5 : orders.length;
          for (var i = 1; i < _length; i++) {
            _list += ',' + orders[i].order_details.order_number;
          }
          _list += '...';
        }
        return _list;
      }

      function generatePhotoUrl(photoName) {
        return config.qiniuServerAddress + photoName;
      }

      getDriverData();
    }])
;