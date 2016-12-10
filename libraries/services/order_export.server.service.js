/**
 * Created by ZhangXuedong on 2016/9/9.
 */
var dateFormat = 'YYYY/M/D kk:mm:ss',
  timezone = 8,
  moment = require('moment');

exports.generateOrderData = function(order) {
  var result = {};
  checkAbnormalReason(order);
  result['公司'] = order.sender_company && order.sender_company.company_name;
  result['发货方'] = order.sender_name ? order.sender_name : '未填';
  result['收货方'] = order.receiver_name ? order.receiver_name : '未填';

  result['运单号'] = order.order_detail && order.order_detail.order_number;
  result['创建时间'] = order.create_time ? moment(order.create_time).add(timezone, 'h').toDate() : null;
  result['分配时间'] = order.assign_time ? moment(order.assign_time).add(timezone, 'h').toDate() : null;

  if (order.pickup_sign_events && (order.pickup_sign_events instanceof Array) && order.pickup_sign_events.length > 0) {
    result['提货进场时间'] = order.pickup_sign_events[0].created ? moment(order.pickup_sign_events[0].created).add(timezone, 'h').toDate() : null;;
  }
  else {
    result['提货进场时间'] = null;
  }

  if (order.delivery_sign_events && (order.delivery_sign_events instanceof Array) && order.delivery_sign_events.length > 0) {
    result['交货进场时间'] = order.delivery_sign_events[0].created ? moment(order.delivery_sign_events[0].created).add(timezone, 'h').toDate() : null;
  }
  else {
    result['交货进场时间'] = null;
  }

  if (order.halfway_events && (order.halfway_events instanceof Array) && order.halfway_events.length > 0) {
    var halfWayInfo = '';
    order.halfway_events.forEach(function (halfwayItem) {
      halfWayInfo += isoDateFormat(halfwayItem.created);
      if (halfwayItem.description) {
        halfWayInfo += (' ' + halfwayItem.description);
      }
      halfWayInfo += '/';
    });
    result['中途事件'] = halfWayInfo.substring(0, halfWayInfo.length - 1);
  }
  else {
    result['中途事件'] = null;
  }

  result['参考单号'] = order.order_detail && order.order_detail.refer_order_number;
  result['品名'] = order.order_detail && order.order_detail.goods_name;
  result['运费'] = order.order_detail && order.order_detail.freight_charge;
  result['状态'] = order.delete_status ? '已删除' : getStatusContent(order.status);

  if (order.execute_drivers && (order.execute_drivers instanceof Array) && order.execute_drivers.length > 0) {
    var nickname = '', username = '', plate_numbers = '';

    for (var index = 0; index < order.execute_drivers.length; index++) {
      nickname += ((order.execute_drivers[index].nickname ? order.execute_drivers[index].nickname : '未填') + ',');
      username += ((order.execute_drivers[index].username ? order.execute_drivers[index].username : '未填') + ',');
      if (order.execute_drivers[index].plate_numbers && order.execute_drivers[index].plate_numbers.length > 0) {
        plate_numbers += (order.execute_drivers[index].plate_numbers[0] + ',');
      }
      else {
        plate_numbers += ('未填' + ',');
      }
    }

    result['司机姓名'] = nickname.substring(0, nickname.length - 1);
    result['司机手机'] = username.substring(0, username.length - 1);
    result['司机车牌'] = plate_numbers.substring(0, plate_numbers.length - 1);
  }
  else if (order.execute_driver) {
    result['司机姓名'] = order.execute_driver.nickname;
    result['司机手机'] = order.execute_driver.username;
    if (order.execute_driver.plate_numbers && order.execute_driver.plate_numbers.length > 0) {
      result['司机车牌'] = order.execute_driver.plate_numbers[0];
    } else {
      result['司机车牌'] = null;
    }
  }
  else {
    result['司机姓名'] = null;
    result['司机手机'] = null;
    result['司机车牌'] = null;
  }

  if (order.execute_companies && (order.execute_companies instanceof Array) && order.execute_companies.length > 0) {
    var companyNames = '';
    order.execute_companies.forEach(function (companyItem) {
      companyNames += ((companyItem.name ? companyItem.name : '未填') + ',');
    });

    result['承运商'] = companyNames.substring(0, companyNames.length - 1);
  }
  else if (order.execute_company) {
    result['承运商'] = order.execute_company.name ? order.execute_company.name : '未填';
  }
  else {
    result['承运商'] = null;
  }

  result['件数'] = order.order_detail && order.order_detail.count;
  result['件数单位'] = order.order_detail && order.order_detail.count_unit;
  result['重量'] = order.order_detail && order.order_detail.weight;
  result['重量单位'] = order.order_detail && order.order_detail.weight_unit;
  result['体积'] = order.order_detail && order.order_detail.volume;
  result['体积单位'] = order.order_detail && order.order_detail.volume_unit;
  result['实际提货时间'] = order.pickup_time ? moment(order.pickup_time).add(timezone, 'h').toDate() : null;
  result['实际交货时间'] = order.delivery_time ? moment(order.delivery_time).add(timezone, 'h').toDate() : null;
  result['计划提货时间'] = order.pickup_end_time_format;
  result['计划交货时间'] = order.delivery_end_time_format;
  if (order.pickup_contact) {
    result['提货联系人'] = order.pickup_contact.name;
    result['提货联系手机'] = order.pickup_contact.mobile_phone;
    result['提货联系固话'] = order.pickup_contact.phone;
    result['提货地址'] = order.pickup_contact.address;
  } else {
    result['提货联系人'] = null;
    result['提货联系手机'] = null;
    result['提货联系固话'] = null;
    result['提货地址'] = null;
  }
  if (order.delivery_contact) {
    result['交货联系人'] = order.delivery_contact.name;
    result['交货联系手机'] = order.delivery_contact.mobile_phone;
    result['交货联系固话'] = order.delivery_contact.phone;
    result['交货地址'] = order.delivery_contact.address;
  } else {
    result['交货联系人'] = null;
    result['交货联系手机'] = null;
    result['交货联系固话'] = null;
    result['交货地址'] = null;
  }

  var observers = null;
  if (order.salesmen && order.salesmen.length > 0) {
    observers = '';
    for (var i = 0, len = order.salesmen.length; i < len; i++) {
      var salesman = order.salesmen[i];
      if (salesman.nickname && salesman.nickname != salesman.username) {
        observers += ',' + salesman.nickname + '(' + salesman.username + ')';
      } else {
        observers += ',' + salesman.username;
      }
    }
    observers = observers.substr(1);
  }
  result['关注人'] = observers;

  result['备注'] = order.description;

  var assignCount = order.execute_drivers ? order.execute_drivers.length : 0;

  result['提货进场拍照'] = getUsualEventPhotoRecord(order.pickup_sign_events, assignCount);
  result['提货拍照'] = getUsualEventPhotoRecord(order.pickup_events, assignCount);
  result['交货进场拍照'] = getUsualEventPhotoRecord(order.delivery_sign_events, assignCount);
  result['交货拍照'] = getUsualEventPhotoRecord(order.delivery_events, assignCount);
  result['中途事件拍照'] = getHalfWayEventPhotoRecord(order.halfway_events);

  if (order.delivery_events && (order.delivery_events instanceof Array) && order.delivery_events.length > 0) {
    var actualInfo = getActualGoodsInfo(order.delivery_events);
    result['实收货物'] = actualInfo.goodsName;
    result['实收数量'] = actualInfo.countWeightVolume;
  }
  else {
    result['实收货物'] = null;
    result['实收数量'] = null;
  }

  if (order.damaged) {
    result['货损'] = 'Y';
  } else {
    result['货损'] = 'N';
  }

  var missing = [];
  // 提货是否缺件 实际提货件数不同于发货件数
  if (order.pickup_missing_packages) {
    missing.push('提货');
  }
  if (order.delivery_missing_packages) {
    missing.push('交货');
  }
  if (missing.length == 0) {
    result['货缺'] = 'N';
  } else {
    result['货缺'] = missing.join(',');
  }

  if(order.order_transport_type){
    switch (order.order_transport_type){
      case 'ltl' :
        result['类型'] = '零担';
        break;
      case 'tl' :
        result['类型'] = '整车';
        break;
      default :
        result['类型'] = null;
    }
  }
  if(order.abnormal_push){
    result['问题运单推送'] = '是';
  }else{
    result['问题运单推送'] = '否';
  }
  if(order.create_push){
    result['创建运单通知'] = '是';
  }else{
    result['创建运单通知'] = '否';
  }
  if(order.pickup_push){
    result['发货通知'] = '是';
  }else{
    result['发货通知'] = '否';
  }
  if(order.delivery_sign_push){
    result['到货通知'] = '是';
  }else{
    result['到货通知'] = '否';
  }
  if(order.delivery_push){
    result['送达通知'] = '是';
  }else{
    result['送达通知'] = '否';
  }

  return result;
};

function isoDateFormat(date) {
  if (date && date instanceof Date) {
    var str = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    return str.substring(0, 10) + ' ' + str.substring(11, 19);
  } else {
    return date;
  }
}

function getOrderCountVolumeWeight(orderDetail) {
  var sText = '';
  sText += (orderDetail.count ? (orderDetail.count + (orderDetail.count_unit ? orderDetail.count_unit : '件')) : '未填') + '/';
  sText += (orderDetail.weight ? (orderDetail.weight + (orderDetail.weight_unit ? orderDetail.weight_unit : '吨')) : '未填') + '/';
  sText += (orderDetail.volume ? (orderDetail.volume + (orderDetail.volume_unit ? orderDetail.volume_unit : '立方')) : '未填');

  return sText;
}
//获取实收货物信息
function getActualGoodsInfo(events) {
  var actualInfo = {
    goodsName: '',
    countWeightVolume: ''
  };

  if (!events || events.length <= 0) {
    return actualInfo;
  }
  var goodsName = [];
  var countWeightVolumes = [];
  events.forEach(function (event) {
    if (event.actual_goods_record) {
      if (event.actual_goods_record.goods_name) {
        goodsName.push(event.actual_goods_record.goods_name);
      }
      if (event.actual_goods_record.count || event.actual_goods_record.weight || event.actual_goods_record.volume) {
        countWeightVolumes.push(getOrderCountVolumeWeight(event.actual_goods_record));
      }
    }
  });

  actualInfo.goodsName = goodsName.join(',');
  actualInfo.countWeightVolume = countWeightVolumes.join(',');

  return actualInfo;
}
//操作时是否拍照
function getUsualEventPhotoRecord(events, assignCount) {
  if (assignCount === 0) {
    return 'N';
  }

  var recordValue = 'N';

  if (events && (events instanceof Array) && events.length > 0) {
    //获取拍照次数
    var photoCount = 0;
    events.forEach(function (eventItem) {
      if ((eventItem.credential_photos && eventItem.credential_photos.length > 0)
        || (eventItem.goods_photos && eventItem.goods_photos.length > 0)
        || (eventItem.halfway_photos && eventItem.halfway_photos.length > 0)) {
        photoCount += 1;
      }
    });

    if (photoCount > 0) {
      if (photoCount < assignCount) {
        recordValue = photoCount + '/' + assignCount;
      }
      else {
        recordValue = 'Y';
      }
    }
  }

  return recordValue;
}

//中途事件时是否拍照
function getHalfWayEventPhotoRecord(events) {
  var recordValue = 'N';

  if (events && (events instanceof Array) && events.length > 0) {
    for (var i = 0; i < events.length; i++) {
      if (events[i].halfway_photos && events[i].halfway_photos.length > 0) {
        recordValue = 'Y';
        break;
      }
    }
  }

  return recordValue;
}

function getStatusContent(status) {
  switch (status) {
    case 'unAssigned':
      return '未分配';
    case 'assigning':
      return '分配中';
    case 'unPickupSigned':
      return '未提货';
    case 'unPickuped':
      return '未提货';
    case 'unDeliverySigned':
      return '未交货';
    case 'unDeliveried':
      return '未交货';
    case 'completed':
    default:
      return '已完成';
  }
}

/*检查运单异常情况*/
function checkAbnormalReason(orderItem) {
  orderItem.abnormal_reason = '';

  if (orderItem.pickup_deferred || (orderItem.pickup_end_time && new Date(orderItem.pickup_end_time) < new Date())) {
    orderItem.abnormal_reason += '晚提货,';
  }
  if (orderItem.delivery_deferred || (orderItem.delivery_end_time && new Date(orderItem.delivery_end_time) < new Date())) {
    orderItem.abnormal_reason += '晚交货,';
  }

  if (orderItem.damaged) {
    orderItem.abnormal_reason += '有货损,';
  }
  if (orderItem.missing_packages) {
    orderItem.abnormal_reason += '交货缺件,';
  }
  if (orderItem.pickup_missing_packages) {
    orderItem.abnormal_reason += '提货缺件,';
  }
  if (orderItem.delivery_missing_packages) {
    orderItem.abnormal_reason += '交货缺件,';
  }
  if (orderItem.halfway_events && orderItem.halfway_events.length > 0) {
    orderItem.abnormal_reason += '中途事件,';
  }

  if (orderItem.pickup_address_difference) {
    orderItem.abnormal_reason += '提货地址异常,';
  }
  if (orderItem.delivery_address_difference) {
    orderItem.abnormal_reason += '交货地址异常,';
  }
  if (orderItem.pickup_driver_plate_difference) {
    orderItem.abnormal_reason += '提货司机车牌异常,';
  }
  if (orderItem.delivery_driver_plate_difference) {
    orderItem.abnormal_reason += '交货司机车牌异常,';
  }
  if (orderItem.transport_plate_difference) {
    orderItem.abnormal_reason += '提货送货车辆不一致,';
  }

  if (orderItem.abnormal_reason) {
    orderItem.abnormal_reason = orderItem.abnormal_reason.substring(0, orderItem.abnormal_reason.length - 1);
  }
}

function binarySearch(items, value, compare) {

  if (items.length == 0) {
    return -1;
  }

  var startIndex = 0,
    stopIndex = items.length - 1,
    middle = Math.floor((stopIndex + startIndex) / 2);

  while (compare(items[middle], value) != 0 && startIndex < stopIndex) {

    //adjust search area
    if (compare(value, items[middle]) < 0) {
      stopIndex = middle - 1;
    } else if (compare(value, items[middle]) > 0) {
      startIndex = middle + 1;
    }

    //recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  //make sure it's the right value
  return (compare(items[middle], value) != 0) ? -1 : middle;
}