/*
 * 全局执行脚本。含如下几种主要功能

 */


//#region 扩展方法

/*
 * 以下函数为新增功能函数，之后需要移动存放位置，但不影响使用
 */
String.prototype.Trim = function ()
{
  /// <summary>
  /// 字符串去除前后空格
  /// </summary>
  /// <returns type=""></returns>
  return this.replace(/(^\s*)|(\s*$)/g, "");
};
String.prototype.LTrim = function ()
{
  /// <summary>
  /// 字符串去除左边空格
  /// </summary>
  /// <returns type=""></returns>
  return this.replace(/(^\s*)/g, "");
};
String.prototype.RTrim = function ()
{
  /// <summary>
  /// 字符串去除右边空格
  /// </summary>
  /// <returns type=""></returns>
  return this.replace(/(\s*$)/g, "");
};
String.prototype.PadLeft = function (padChar, count)
{
  /// <summary>
  /// 字符串去除左边空格
  /// </summary>
  var temp = this;
  while (temp.length < count)
    temp = padChar + temp;
  return temp;
};

String.Format = function ()
{
  /// <summary>
  /// 字符串格式化函数(C#同质化的字符串格式化函数)
  /// </summary>
  /// <returns type=""></returns>
  if (arguments.length == 0)
    return null;
  var str = arguments[0];
  for (var i = 1; i < arguments.length; i++)
  {
    var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
    str = str.replace(re, arguments[i]);
  }
  return str;
};

Date.prototype.Format = function (fmt)
{
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
    "M+": this.getMonth() + 1,                 //月份
    "d+": this.getDate(),                    //日
    "h+": this.getHours(),                   //小时
    "m+": this.getMinutes(),                 //分
    "s+": this.getSeconds(),                 //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds()             //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};


/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.Pattern = function (fmt)
{
  var o = {
    "M+": this.getMonth() + 1,          //月份
    "d+": this.getDate(),               //日
    "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
    "H+": this.getHours(),              //小时
    "m+": this.getMinutes(),            //分
    "s+": this.getSeconds(),        //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  var week = {
    "0": "/u65e5",
    "1": "/u4e00",
    "2": "/u4e8c",
    "3": "/u4e09",
    "4": "/u56db",
    "5": "/u4e94",
    "6": "/u516d"
  };
  if (/(y+)/.test(fmt))
  {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  if (/(E+)/.test(fmt))
  {
    fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
  }
  for (var k in o)
  {
    if (new RegExp("(" + k + ")").test(fmt))
    {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
};

function IsTrue(value)
{
  if (IsNullOrEmpty(value))
    return false;

  return (value.toString().toLowerCase() === 'true');
};
function IsGuidEmpty(value)
{
  if (IsNullOrEmpty(value))
    return true;

  return (value == "00000000-0000-0000-0000-000000000000");
};
function IsNullOrEmpty(value)
{
  return (value == undefined || value == null || value == "");
};
function JsonTimeConvertToDate(jsonTime)
{
  var timeString = jsonTime.replace(/\/Date\((\d+)\)\//gi, "$1");
  return new Date(parseInt(timeString));
};
//#endregion 扩展方法

//检测浏览器缩放
function DetectBrowserZoom()
{
  /// <summary>
  /// 检测浏览器缩放 100：无缩放，>100：被放大，<100：被缩小
  /// </summary>
  /// <returns type="number">缩放百分比</returns>
  var ratio = 0,
    screen = window.screen,
    ua = navigator.userAgent.toLowerCase();

  if (~ua.indexOf('firefox'))
  {
    if (window.devicePixelRatio !== undefined)
    {
      ratio = window.devicePixelRatio;
    }
  }
  else if (~ua.indexOf('msie'))
  {
    if (screen.deviceXDPI && screen.logicalXDPI)
    {
      ratio = screen.deviceXDPI / screen.logicalXDPI;
    }
  }
  else if (window.outerWidth !== undefined && window.innerWidth !== undefined)
  {
    ratio = window.outerWidth / window.innerWidth;
  }

  if (ratio)
  {
    ratio = Math.round(ratio * 100);
  }

  return ratio;
};

function getUrlParam(name)
{
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
  var r = window.location.search.substr(1).match(reg);  //匹配目标参数
  if (r!=null)
    return unescape(r[2]);
  else
    return null; //返回参数值
}

function GetQueryParams()
{
  /// <summary>
  /// 获取请求参数
  /// </summary>
  /// <param name="name"></param>
  /// <returns type=""></returns>
  var url = location.href;
  var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
  var paraObj = {}

  for (var i = 0; j = paraString[i]; i++)
  {
    paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
  }

  return paraObj;
};

//临时处理日期时间不正确的问题
Date.prototype.toJSON = function () { return this.Format("yyyy-MM-ddThh:mm:ss.S+08:00") };
