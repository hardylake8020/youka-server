/**
 * Created by Wayne on 16/1/31.
 */

function ZZCommon() {
  var self = this;

  this.getPeriodTimeString = function (startTime, endTime) {
    startTime = new Date(startTime);
    endTime = new Date(endTime);

    var timeString;
    if (startTime.Format('yyyy-MM-dd') === endTime.Format('yyyy-MM-dd')) {
      timeString = startTime.Format('MM-dd hh:mm') + ' ~ ' + endTime.Format('hh:mm');
    }
    else {
      timeString = startTime.Format('MM-dd hh:mm') + ' ~ ' + endTime.Format('MM-dd hh:mm');
    }
    return timeString;
  };
  this.formatRemainTime = function (ms) {
    if (ms <= 0) {
      return '0分钟';
    }

    var dd = parseInt(ms / 1000 / 60 /60 / 24, 10);
    var hh = parseInt(ms / 1000 / 60 /60 % 24, 10);
    var mm = parseInt(ms / 1000 / 60 % 60, 10);
    var ss = parseInt(ms / 1000 % 60, 10);

    if (dd > 0) {
      return dd + '天';
    }
    if (hh > 0) {
      return hh + '小时';
    }

    if (mm > 0) {
      return mm + '分钟';
    }

    if (ss > 0) {
      return ss + '秒';
    }

    return '0分钟';
  };
}