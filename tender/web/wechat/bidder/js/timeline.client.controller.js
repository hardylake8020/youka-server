/**
 * Created by zenghong on 15/12/16.
 */

function ZZTimeline() {
  var self = this;

  this.element = $('\
  <div class="zz-order-timeline"> \
    <div class="sm-header"> \
      <img class="left timeline-back" src="/wechat/bidder/images/nav_back.png"> \
      <div class="center">时间轴</div> \
    </div>\
    <div class="timeline-container"></div>\
  </div>');

  var back = this.element.find('.timeline-back');
  var container = this.element.find('.timeline-container');
  var photos = [];

  this.show = function (order) {
    removeItem();
    appendItem(null, order);
    appendItemlist(getEvents(order), order);
    self.element.addClass('show');
  };

  this.hide = function () {
    self.element.removeClass('show');
  };

  back.click(function () {
    self.hide();
  });

  function appendItemlist(events, order) {
    for (var i = 0; i < events.length; i++) {
      appendItem(events[i], order);
    }
  }

  function appendItem(item, order) {
    var item = new TimelineItem(item, order, imageClicked);
    container.append(item.element);
    photos = photos.concat(item.photos);
  }

  function removeItem() {
    container.children('.zz-timeline-item').remove();
    photos = [];
  }

  function imageClicked(src, photos) {
    if (src) {
      wx.previewImage({
        current: src,
        urls: photos
      });
    }
  }

  function getEvents(order) {
    var events = [].concat(order.pickup_sign_events, order.pickup_events, order.delivery_sign_events, order.delivery_events, order.halfway_events);
    events.sort(function (a, b) {
      return new Date(a.created).getTime() - new Date(b.created).getTime();
    });

    return events;
  }
}

function TimelineItem(event, order, imageClicked) {
  var self = this;
  this.photos = [];
  if (!event) {
    self.element = $('<div class="zz-timeline-item">'
      + '<div class="left"></div>'
      + '<img class="dot" src="/wechat/bidder/images/timeline_dot.png">'
      + '<div class="right">'
      + '<div class="title">运单创建成功</div>'
      + '<div class="text">' + getTimeString(order.created) + '</div></div>'
      + '</div>');
    return;
  }

  self.element = $('<div class="zz-timeline-item">'
    + '<div class="left"></div>'
    + '<img class="dot" src="/wechat/bidder/images/timeline_dot.png">'
    + '<div class="right">'
    + '<div class="title">'
    + '<span class="driver-name">' + (event.driver_name || '未知司机') + ' ' + '</span>'
    + '<span class="driver-number"></span>'
    + '<a class="driver-phone">' + (event.driver_phone || '未知手机号') + ' ' + '</a>'
    + '<span class="event-type">' + getStatusString(event.type) + '</span>'
    + '</div>'
    + '<div class="text">' + getTimeString(event.created) + ' ' + event.address + '</div>'
    + '<div class="text damaged">货损 ' + (event.damaged ? '有' : '无') + '</div>'
    + '<div class="img-container">'
    + '</div>'
    + '</div>'
    + '</div>');

  if (event.driver_phone) {
    self.element.find('.driver-phone').attr('href', 'tel:' + event.driver_phone);
    self.element.find('.driver-phone').addClass('highlight');
  }

  self.imageContainer = self.element.find('.img-container');

  if (event.credential_photos) {
    appendPhoto(event.credential_photos);
  }
  if (event.goods_photos) {
    appendPhoto(event.goods_photos);
  }
  if (event.halfway_photos) {
    appendPhoto(event.halfway_photos);
  }

  if (event.photos && event.photos.length > 0) {
    var customPhotos = [];
    event.photos.forEach(function (item) {
      if (item.url) {
        customPhotos.push(item.url);
      }
    });

    appendPhoto(customPhotos);
  }


  var driverNumber = self.element.find('.driver-number');
  driverNumber.text('未知车牌 ');
  if (event.driver_plate_numbers && event.driver_plate_numbers.length > 0) {
    driverNumber.text(event.driver_plate_numbers[0]+' ');
  }
  if (event.damaged) {
    self.element.find('.damaged').addClass('abnormal');
  }

  function appendPhoto(arr) {
    arr.forEach(function (photo) {
      var url = getPhotoString(photo);
      var img = $('<img class="img" src="' + url + '">');
      self.imageContainer.append(img);
      img.click(function () {
        var src = $(this).attr('src');

        imageClicked(src, self.photos);
      });
      self.photos.push(url);
    });
  }

  function getPhotoString(photo) {
    return 'http://7xiwrb.com1.z0.glb.clouddn.com/@' + photo;
  }

  function getStatusString(status) {
    var statusString = '';

    switch (status) {
      case 'unAssigned':
        statusString = '未分配';
        break;
      case 'assigning':
        statusString = '分配中';
        break;
      case 'unPickupSigned':
      case 'unPickuped':
        statusString = '未提货';
        break;
      case 'unDeliverySigned':
      case 'unDeliveried':
        statusString = '未交货';
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
        statusString = '已完成';
        break;
      default:
        break;
    }

    return statusString;
  }

  function getTimeString(time) {
    return new Date(time).Format('yyyy-MM-dd hh:mm');
  };
}