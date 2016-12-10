zhuzhuqs.factory('BMapService', ['$http', '$q', 'config', function ($http, $q, config) {

  return {
    create: function (mapLayoutId, currentCity, degree, enableScrollWheelZoom) {
      var map = new BMap.Map(mapLayoutId);
      map.centerAndZoom(currentCity, degree);  // 初始化地图,设置中心点坐标和地图级别
      map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
      map.enableScrollWheelZoom(enableScrollWheelZoom);     //开启鼠标滚轮缩放
      console.log(map);
      return map;
    },
    drawLine: function (map, traces, latestPoint, onlyGps) {
      var points = [];
      var gpsPoints = [];

      traces.forEach(function (trace) {
        //TODO 之后优化 时间紧急
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
    },
    drawDriverEvent: function (map, event, tipContent) {
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
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_pickup.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'delivery':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_delivery.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'pickupSign':
        case 'deliverySign':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_sign.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
        case 'halfway':
        {
          myIcon = new BMap.Icon(config.serverWebAddress + "/images/icon/order_follow/map_halfway.png", iconSize, {anchor: iconAnchorSize});
          break;
        }
      }

      if (event.location[0] && event.location[1]) {
        var marker = new BMap.Marker(new BMap.Point(event.location[0], event.location[1]), {icon: myIcon});

        map.addOverlay(marker);

        console.log(marker, 'marker=======');

        var infoWindow = new BMap.InfoWindow(tipContent);  // 创建信息窗口对象
        marker.addEventListener("click", function () {
          this.openInfoWindow(infoWindow);
        });
      }
    },
    drawCircle: function (map, locations) {
      var pointArray = [];
      if (locations && locations.length > 0) {

        locations.forEach(function (location) {
          var mapPoint = new BMap.Point(location.point[1], location.point[0]);
          var circle = new BMap.Circle(mapPoint, config.maxAddressOffset, {
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
  }
}]);
