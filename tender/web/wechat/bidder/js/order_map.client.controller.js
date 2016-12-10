/**
 * Created by zenghong on 15/12/16.
 */
function ZZOrderMap() {
  var self = this;
  self.element = $('\
  <div class="zz-order-map">\
    <div class="sm-header"> \
      <img class="left map-back" src="/wechat/bidder/images/nav_back.png"> \
      <div class="center">地图轨迹</div> \
    </div>\
    <div class="map-container" id="map-container"></div>\
    </div>');

  self.show = function (order, events) {
    map.clearOverlays();
    addEventMarkerOnMap(events);
    getDriverTraces(order, function (err, tracePoints) {
      var railingPoint = addExpectLocationOnMap(order);

      tracePoints = tracePoints || [];
      var allPoints = tracePoints.concat(railingPoint);

      setTimeout(function () {
        map.setViewport(allPoints); //将所有的点都显示出来
      }, 1000);
    });
  };

  var back = self.element.find('.map-back');
  back.click(function () {
    window.history.back();
  });

  var map;
  self.init = function () {
    map = new BMap.Map('map-container');
    map.centerAndZoom('上海', 11);  // 初始化地图,设置中心点坐标和地图级别
    map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
    map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
  };

  function getDriverTraces(order, callback) {
    $.ajax({
      url: '/order/driver/traces',
      method: 'get',
      data: {
        order_id: order._id
      },
      success: function (data) {
        if (data.err) {
          alert(data.err.type);
          return callback();
        }
        else {
          var result = drawTraceLineOnMap(data);
          drawCurrentLocation(order, result.latestPoint);

          return callback(null, result.allPoints || []);
        }
      },
      error: function (err) {
        alert(JSON.stringify(err));
        return callback();
      }
    });
  }

  function drawTraceLineOnMap(driverTraces) {
    console.log(driverTraces, 'driverTraces===========');
    var allDriverPoints = [];
    var latestPoint = {
      trace: '',
      time: new Date('1988-01-10')
    };

    driverTraces.forEach(function (driverTraceObject) {
      var drawLineResult = drawLine(map, driverTraceObject.traces, latestPoint, false);
      var driverPoints = drawLineResult.points;

      driverPoints.forEach(function (driverPoint) {
        allDriverPoints.push(driverPoint);
      });
    });

    return {
      allPoints: allDriverPoints,
      latestPoint: latestPoint
    };
  }

  function drawCurrentLocation(order, point) {
    if (order.status != 'completed' && order.status != 'unAssigned') {
      if (point.trace && point.trace.location && point.trace.location[0] && point.trace.location[1]) {
        var iconSize = new BMap.Size(42, 33);
        var iconAnchorSize = new BMap.Size(14, 33);
        var myIcon = new BMap.Icon("/wechat/bidder/images/map_current.gif", iconSize, {anchor: iconAnchorSize});

        var marker = new BMap.Marker(new BMap.Point(point.trace.location[0], point.trace.location[1]), {icon: myIcon});
        map.addOverlay(marker);
      }
    }
  }

  function addEventMarkerOnMap(events) {
    if (!events || events.length <= 0)
      return;
    events.forEach(function (event) {
      drawDriverEvent(map, event);
    });
  }

  function addExpectLocationOnMap(currentOrderDetail) {
    //1.获取要绘制的点
    //2.默认从分配信息中获取所有的点
    //3.如果是顶层运单，优先选择创建地址
    var locations = [];
    if (!currentOrderDetail.parent_order) {
      if (currentOrderDetail.pickup_contacts.location && currentOrderDetail.pickup_contacts.location.length === 2) {
        locations.push(
          {
            point: currentOrderDetail.pickup_contacts.location,
            type: 'pickup',
            address: currentOrderDetail.pickup_contacts.brief || currentOrderDetail.pickup_contacts.address
          });
      }
      if (currentOrderDetail.delivery_contacts.location && currentOrderDetail.delivery_contacts.location.length === 2) {
        locations.push(
          {
            point: currentOrderDetail.delivery_contacts.location,
            type: 'delivery',
            address: currentOrderDetail.delivery_contacts.brief || currentOrderDetail.delivery_contacts.address
          });
      }
    }

    if (locations.length === 0) {
      if (currentOrderDetail.assigned_infos && currentOrderDetail.assigned_infos.length > 0) {
        currentOrderDetail.assigned_infos.forEach(function (assignItem) {
          if (assignItem.pickup_contact_location && assignItem.pickup_contact_location.length === 2) {
            locations.push(
              {
                point: assignItem.pickup_contact_location,
                type: 'pickup',
                address: assignItem.pickup_contact_brief || assignItem.pickup_contact_address
              });
          }
          if (assignItem.delivery_contact_location && assignItem.delivery_contact_location.length === 2) {
            locations.push(
              {
                point: assignItem.delivery_contact_location,
                type: 'delivery',
                address: assignItem.delivery_contact_brief || assignItem.delivery_contact_address
              });
          }
        });
      }
    }

    var mapPoints = [];
    if (locations.length > 0) {
      mapPoints = drawCircle(map, locations);
    }

    return mapPoints;
  }
  function drawCircle(map, locations) {
    var pointArray = [];
    if (locations && locations.length > 0) {

      locations.forEach(function (location) {
        var mapPoint = new BMap.Point(location.point[1], location.point[0]);
        var circle = new BMap.Circle(mapPoint, 1000, {
          fillColor: "#ffa81a",
          strokeColor: "#265f00",
          strokeWeight: 2,
          fillOpacity: 0.6,
          strokeOpacity: 1
        });
        map.addOverlay(circle);

        var marker = new BMap.Marker(mapPoint);
        map.addOverlay(marker);

        var labelText = ((location.type === 'pickup' ? '提货' : '交货') + '地址范围') + '(' + location.address + ')';
        var label = new BMap.Label(labelText, {offset:new BMap.Size(20,-10)});
        label.setStyle({whiteSpace: 'normal', maxWidth: 'none', width: '160px', opacity: 0.9});
        marker.setLabel(label);

        pointArray.push(mapPoint);
      });

      return pointArray;
    }
  }

  function drawDriverEvent(map, event) {
    if (event.type === 'confirm') {
      return;
    }
    console.log(event, 'event===========');

    var myIcon = {};
    var iconSize = new BMap.Size(42, 33);
    var iconAnchorSize = new BMap.Size(14, 33);
    switch (event.type) {
      case 'pickup':
      {
        myIcon = new BMap.Icon("/wechat/bidder/images/map_pickup.png", iconSize, {anchor: iconAnchorSize});
        break;
      }
      case 'delivery':
      {
        myIcon = new BMap.Icon("/wechat/bidder/images/map_delivery.png", iconSize, {anchor: iconAnchorSize});
        break;
      }
      case 'pickupSign':
      case 'deliverySign':
      {
        myIcon = new BMap.Icon("/wechat/bidder/images/map_sign.png", iconSize, {anchor: iconAnchorSize});
        break;
      }
      case 'halfway':
      {
        myIcon = new BMap.Icon("/wechat/bidder/images/map_halfway.png", iconSize, {anchor: iconAnchorSize});
        break;
      }
    }

    if (event.location[0] && event.location[1]) {
      var marker = new BMap.Marker(new BMap.Point(event.location[0], event.location[1]), {icon: myIcon});

      map.addOverlay(marker);
      console.log(marker, 'marker=======');
    }
  }

  function drawLine(map, traces, latestPoint, onlyGps) {
    var points = [];
    var gpsPoints = [];

    traces.forEach(function (trace) {
      if (trace.location[0] != Number.MIN_VALUE && trace.location[1] != Number.MIN_VALUE) {
        var traceTime = new Date(trace.time);
        if (latestPoint.time < traceTime) {
          latestPoint.trace = trace;
          latestPoint.time = traceTime;
        }
        if (trace.location[0] != 0 && trace.location[1] != 0) {
          if (trace.type == 'gps') {
            gpsPoints.push(new BMap.Point(trace.location[0], trace.location[1]));
          }
          points.push(new BMap.Point(trace.location[0], trace.location[1]));
        }
      }
    });

    var polyline;
    if (onlyGps) {
      polyline = new BMap.Polyline(gpsPoints, {strokeColor: "blue", strokeWeight: 2, strokeOpacity: 0.5});   //创建折线
    }
    else {
      polyline = new BMap.Polyline(points, {strokeColor: "blue", strokeWeight: 2, strokeOpacity: 0.5});   //创建折线
    }
    map.addOverlay(polyline);

    return {points: points, gpsCount: gpsPoints.length, ungpsCount: points.length - gpsPoints.length};
  }
}
