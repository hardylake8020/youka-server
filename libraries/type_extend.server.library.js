/**
 * Created by Wayne on 15/6/7.
 */
'use strict';

Date.prototype.format = function (fmt) {
  /// <summary>
  /// 对Date的扩展，将 Date 转化为指定格式的String
  /// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
  /// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
  /// 例子：
  /// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
  /// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
  /// </summary>
  /// <param name="fmt"></param>
  /// <returns type=""></returns>
  var o = {
    'M+': this.getMonth() + 1,                 //月份
    'd+': this.getDate(),                    //日
    'h+': this.getHours(),                   //小时
    'm+': this.getMinutes(),                 //分
    's+': this.getSeconds(),                 //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    'S': this.getMilliseconds()             //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  return fmt;
};

Date.prototype.isDate = function (dateString) {
  if (!dateString) {
    return false;
  }
  var date = new Date(dateString);

  if (date.getTime()) {
    return true;
  }

  return false;
};

Date.prototype.compareTime = function (time1, time2) {
  if (!time1 || !time2) {
    return false;
  }
  return new Date(time1).getTime() > new Date(time2).getTime();
};
Date.prototype.greaterThan = function (time) {
  if (!time) {
    return true;
  }

  var time1 = new Date(time).getTime();
  if (!time1) {
    return true;
  }

  return this.getTime() > time1;
};

String.prototype.testMail = function () {
  var mailReg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,}){1,2})$/;
  if (!mailReg.test(this)) {
    return false;
  }

  return true;
};

String.prototype.testPhone = function () {
  var phoneReg = /\d{11}/;
  if (!phoneReg.test(this) || this.length != 11) {
    return false;
  }

  return true;
};

//只支持值类型数组
Array.prototype.zzDistinct = function () {
  var source = this;
  if (source.length === 0) {
    return [];
  }
  var result = [];
  source.forEach(function (item) {
    if (result.indexOf(item) === -1) {
      result.push(item);
    }
  });

  return result;
}
