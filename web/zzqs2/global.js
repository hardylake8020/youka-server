/**
 * Created by elinaguo on 15/5/25.
 */
//日期时间格式化
Date.prototype.Format = function (fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};

//根据对象的属性值名对去获取指定的值名对集合。
//仅限于value为基本类型，引用类型不适合.
Array.prototype.zzGetByAttribute = function (attrName, attrValue) {
  var records = [];
  for (var i = 0; i < this.length; i++) {
    if (attrValue === this[i][attrName]) {
      records.push(this[i]);
    }
  }

  return records;
};
