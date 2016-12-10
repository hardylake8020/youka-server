/**
 * Created by Wayne on 16/1/13.
 */
'use strict';

//角度转弧度
function toRadian(d) {return d * Math.PI / 180;}

//获取两点间的距离, 单位米
function getDistance(lat1, lng1, lat2, lng2) {
  var earthRadius = 6378137; //单位 米
  var radLat1 = toRadian(lat1);
  var radLat2 = toRadian(lat2);

  var deltaLat = radLat1 - radLat2;
  var deltaLng = toRadian(lng1) - toRadian(lng2);

  var number1 = Math.pow(Math.sin(deltaLat/2), 2);
  var number2 = Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng/2), 2);

  return 2 * Math.asin( Math.sqrt(number1 + number2) ) * earthRadius;
}

exports.getLocationDistance = function (lat1, lng1, lat2, lng2) {
  return getDistance(lat1, lng1, lat2, lng2);
};