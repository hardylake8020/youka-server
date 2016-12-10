function ZZOrderDetail(backCallback) {
  var self = this;
  self.element = $('\
  <div class="zz-order-detail">\
    <div class="sm-header">\
      <img class="left detail-back" src="/wechat/bidder/images/nav_back.png">\
      <div class="center">运单详情</div>\
      <div class="right">地图轨迹</div>\
    </div>\
    <div class="info-tip">\
      <div class="cur-status"></div> \
      <div class="damaged-reason"></div> \
      <img src="/wechat/bidder/images/detail_processing_icon.png" class="car-icon"> \
      <img src="/wechat/bidder/images/nav_go.png" class="nav-go"> \
    </div> \
    <div class="info-container">\
      <div class="title">\
        <div class="key">运单号</div>\
        <div class="value order_number"></div>\
      </div>\
      <div class="item-container">\
        <div class="item">\
          <div class="key">参考单号</div>\
          <div class="value refer_order_number"></div>\
        </div>\
        <div class="item">\
          <div class="key">货物</div>\
          <div class="value goods"></div>\
        </div>\
        <div class="item">\
          <div class="key">备注</div>\
          <div class="value description"></div>\
        </div>\
        <div class="item">\
          <div class="key">异常信息</div>\
          <div class="value abnormal_info"></div>\
        </div>\
      </div>\
      <div class="title">\
        <div class="key">收货方</div>\
        <div class="value receiver_name"></div>\
      </div>\
      <div class="item-container">\
        <div class="item">\
          <div class="key">收货地址</div>\
          <div class="value delivery_address"></div>\
        </div>\
        <div class="item">\
          <div class="key">收货时间</div>\
          <div class="value delivery_start_time"></div>\
        </div>\
        <div class="item">\
          <div class="key">实际收货时间</div>\
          <div class="value delivery_time"></div>\
        </div>\
        <div class="item">\
          <div class="key">收货联系人</div>\
          <div class="value delivery_name"></div>\
        </div>\
        <div class="item">\
          <div class="key">联系人手机</div>\
          <a class="value delivery_phone phone"></a>\
        </div>\
        <div class="item">\
          <div class="key">联系人固话</div>\
          <a class="value delivery_tel_phone phone"></a>\
        </div>\
      </div>\
      <div class="title">\
        <div class="key">发货方</div>\
        <div class="value sender_name"></div>\
      </div>\
      <div class="item-container">\
      <div class="item">\
        <div class="key">提货地址</div>\
        <div class="value pickup_address"></div>\
      </div>\
      <div class="item">\
        <div class="key">提货时间</div>\
        <div class="value pickup_start_time"></div>\
      </div>\
      <div class="item">\
        <div class="key">实际提货时间</div>\
        <div class="value pickup_time"></div>\
      </div>\
      <div class="item">\
        <div class="key">提货联系人</div>\
        <div class="value pickup_name"></div>\
      </div>\
      <div class="item">\
        <div class="key">联系人手机</div>\
        <a class="value pickup_phone phone"></a>\
      </div>\
      <div class="item">\
        <div class="key">联系人固话</div>\
        <a class="value pickup_tel_phone phone"></a>\
      </div>\
      </div>\
    </div>\
  </div>');

  var zzTimeline = new ZZTimeline();
  self.element.append(zzTimeline.element);

  var timeline = self.element.find('.info-tip');
  var back = self.element.find('.detail-back');
  var map = self.element.find('.right');
  var infoTip = self.element.find('.info-tip');
  var isAbnormal = false;
  var curOrder = null;

  self.show = function (order) {
    curOrder = order;
    self.element.find('.damaged-reason').text(getAbnormalString(order));
    self.element.find('.cur-status').text(getDriverStatus(order.status).statusString);
    infoTip.removeClass('abnormal');
    self.element.find('.abnormal_info').removeClass('abnormal');
    if (isAbnormal) {
      infoTip.addClass('abnormal');
      self.element.find('.abnormal_info').addClass('abnormal');
    }

    infoTip.find('.car-icon').attr('src', '/wechat/bidder/images/' + getDriverStatus(order.status).iconString);

    setValue('order_number', order.order_details.order_number);
    setValue('refer_order_number', order.order_details.refer_order_number);
    setValue('abnormal_info', getAbnormalString(order));
    setValue('description', order.description);
    setValue('goods', getGoodsInfo(order.order_details.goods));

    setValue('receiver_name', order.receiver_name);
    setValue('delivery_address', order.delivery_contacts.address);
    setValue('delivery_start_time', order.delivery_start_time ? getTimeString(order.delivery_start_time) : '');
    setValue('delivery_time', order.delivery_time ? getTimeString(order.delivery_time) : '');
    setValue('delivery_name', order.delivery_contacts.name);
    setValue('delivery_phone', order.delivery_contacts.mobile_phone);
    setValue('delivery_tel_phone', order.delivery_contacts.phone);

    highlightElement('.delivery_phone', order.delivery_contacts.mobile_phone);
    highlightElement('.delivery_tel_phone', order.delivery_contacts.phone);


    setValue('sender_name', order.sender_name);
    setValue('pickup_address', order.pickup_contacts.address);
    setValue('pickup_start_time', order.pickup_start_time ? getTimeString(order.pickup_start_time) : '');
    setValue('pickup_time', order.pickup_time ? getTimeString(order.pickup_time) : '');
    setValue('pickup_name', order.pickup_contacts.name);
    setValue('pickup_phone', order.pickup_contacts.mobile_phone);
    setValue('pickup_tel_phone', order.pickup_contacts.phone);

    highlightElement('.pickup_phone', order.pickup_contacts.mobile_phone);
    highlightElement('.pickup_tel_phone', order.pickup_contacts.phone);


    self.element.addClass('show');
  };

  self.hide = function () {
    self.element.removeClass('show');
  };

  back.click(function () {
    self.hide();
    if (backCallback) {
      backCallback();
    }
  });

  map.click(function () {
    window.location.href = '/wechat/order_map?order_id=' + curOrder._id;
  });

  timeline.click(function () {
    zzTimeline.show(curOrder);
  });

  function highlightElement(className, value) {
    var element = self.element.find(className);
    if (value) {
      element.attr('href', 'tel:' + value);
      element.addClass('highlight');
    }
    else {
      element.removeAttr('href');
      element.removeClass('highlight');
    }
  }

  function setValue(className, value, isAbnormal) {
    var item = self.element.find('.' + className);
    item.text(value || '未填');
    if (value) {
      item.addClass('hasvalue');
      if (isAbnormal) {
        item.addClass('abnormal');
      }
    }
  }

  function getDriverStatus(status) {
    var statusString = '';
    var iconString = '';

    switch (status) {
      case 'unAssigned':
        statusString = '运单待分配';
        break;
      case 'assigning':
        statusString = '运单待分配';
        break;
      case 'unPickupSigned':
      case 'unPickuped':
        iconString = 'detail_unpickup_icon.png';
        statusString = '司机未提货';
        break;
      case 'unDeliverySigned':
      case 'unDeliveried':
        iconString = 'detail_processing_icon.png';
        statusString = '司机已提货';
        break;
      case 'pickupSign':
        statusString = '提货签到';
        break;
      case 'pickup':
        statusString = '提货';
        break;
      case 'deliverySign':
        statusString = '交货签到';
        break;
      case 'delivery':
        statusString = '交货';
        break;
      case 'halfway':
        statusString = '中途事件';
        break;
      case 'completed':
        iconString = 'detail_completed_icon.png';
        statusString = '司机已交货';
        break;
      default:
        break;
    }

    return {statusString: statusString, iconString: iconString};
  }

  function getAbnormalString(order) {
    var abnormals = [];
    isAbnormal = false;
    if (order.damaged) {
      abnormals.push('货损');
    }

    if (order.pickup_missing_packages) {
      abnormals.push('提货缺件');
    }

    if (order.delivery_missing_packages) {
      abnormals.push('交货缺件');
    }

    if (order.pickup_deferred) {
      abnormals.push('提货迟到');
    }

    if (order.delivery_deferred) {
      abnormals.push('交货迟到');
    }

    if (order.halfway_events && order.halfway_events.length > 0) {
      abnormals.push('中途事件');
    }

    if (order.pickup_address_difference) {
      abnormals.push('提货地址异常');
    }
    if (order.delivery_address_difference) {
      abnormals.push('交货地址异常');
    }
    if (order.pickup_driver_plate_difference) {
      abnormals.push('提货司机车牌异常');
    }
    if (order.delivery_driver_plate_difference) {
      abnormals.push('交货司机车牌异常');
    }
    if (order.transport_plate_difference) {
      abnormals.push('提货送货车辆不一致');
    }

    if (abnormals.length > 0) {
      isAbnormal = true;
      return abnormals.join(' ');
    }

    return '无';
  }

  function getGoodsInfo(goods) {
    if (!goods || goods.length === 0) {
      return '货物名称未填写';
    }
    var result = [];
    if (goods) {
      goods.forEach(function (good) {
        result.push((good.name || '未填货物') + ' ' + (good.count || '未填数量') + (good.unit || '未填数量单位'))
      });
    }

    return result.join(',');
  }

  function getTimeString(time) {
    return new Date(time).Format('yyyy-MM-dd hh:mm');
  }
}