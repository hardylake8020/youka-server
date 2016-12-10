/*
 * 全局执行脚本。含如下几种主要功能
 * 1、设置表格奇偶行样式 （需要表格设置 even-odd 样式）
 * 2、显示非打断提示信息（暂无）
 */
$(document).ready(function ()
{
  //bodyContainer 监听浏览器尺寸变化，并改变内容体高度
  $(window).resize(function () {
    var winHeight = $(window).height();
    var body = $('#bodyContainer');

    var setHeight = (winHeight - $(".header").outerHeight() - $(".footer").outerHeight());
    body.stop(true);
    body.animate({'min-height': setHeight + 'px'}, 300);

  });

  setTimeout(function () {
    $(window).resize();
  }, 1);
  //}).trigger("resize");
});

function OpenFullScreenWindow(url, name)
{
  if (name == null || name == '')
    name = "ExamWindow";

  var win = window.open(url, name,
    "fullscreen=yes,titlebar=no,toolbar=no,menubar=no,resizable=yes,location=no,status=no,scrollbars=yes,directories=yes,alwaysRaised=yes,z-look=yes");
  win.focus();

  return win;
};
//#endregion


//登出确认提示，当需要确认后登出时调用此方法
function ConfirmLogout(confirmMessage)
{
  if (confirmMessage == null || confirmMessage == "")
    confirmMessage = "您确定要立即退出系统吗？";
  $("#sysLogout").click(function ()
  {
    exDialog.open({
      container: {
        header: '退出提示',
        content: confirmMessage,
        yesFn: function () { window.location.href = $("#sysLogout")[0]; },
        noFn: true
      }
    });

    return false;
  });
};

//输入框只能输入数字和小数点
//example:   $('input').numeral();
$.fn.numeral = function () {
  $(this).css("ime-mode", "disabled");
  this.bind("keypress", function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);  //兼容火狐 IE
    if (!$.browser.msie && (e.keyCode == 0x8))  //火狐下 不能使用退格键
    {
      return;
    }
    return code >= 48 && code <= 57 || code == 46;
  });
  this.bind("blur", function () {
    if (this.value.lastIndexOf(".") == (this.value.length - 1)) {
      this.value = this.value.substr(0, this.value.length - 1);
    } else if (isNaN(this.value)) {
      this.value = " ";
    }
  });
  this.bind("paste", function () {
    var s = clipboardData.getData('text');
    if (!/\D/.test(s));
    value = s.replace(/^0*/, '');
    return false;
  });
  this.bind("dragenter", function () {
    return false;
  });
  this.bind("keyup", function () {
    this.value = this.value.replace(/[^\d.]/g, "");
    //必须保证第一个为数字而不是.
    this.value = this.value.replace(/^\./g, "");
    //保证只有出现一个.而没有多个.
    this.value = this.value.replace(/\.{2,}/g, ".");
    //保证.只出现一次，而不能出现两次以上
    this.value = this.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
  });
};

//$.fn.numeral = function (maxValue) {
//    $(this).css("ime-mode", "disabled");
//    this.bind("keypress", function (e) {
//        var code = (e.keyCode ? e.keyCode : e.which);  //兼容火狐 IE
//        if (!$.browser.msie && (e.keyCode == 0x8))  //火狐下 不能使用退格键
//        {
//            return;
//        }
//
//        return code >= 48 && code <= 57 || code == 46;
//    });
//    this.bind("blur", function () {
//        if (this.value.lastIndexOf(".") == (this.value.length - 1)) {
//            this.value = this.value.substr(0, this.value.length - 1);
//        } else if (isNaN(this.value)) {
//            this.value = " ";
//        }
//    });
//    this.bind("paste", function () {
//        var s = clipboardData.getData('text');
//        if (!/\D/.test(s));
//        value = s.replace(/^0*/, '');
//        return false;
//    });
//    this.bind("dragenter", function () {
//        return false;
//    });
//    this.bind("keyup", function () {
//        this.value = this.value.replace(/[^\d.]/g, "");
//        //必须保证第一个为数字而不是.
//        this.value = this.value.replace(/^\./g, "");
//        //保证只有出现一个.而没有多个.
//        this.value = this.value.replace(/\.{2,}/g, ".");
//        //保证.只出现一次，而不能出现两次以上
//        this.value = this.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
//    });
//};

