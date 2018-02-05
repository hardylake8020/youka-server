/**
 * Created by Wayne on 15/10/14.
 */

$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      new SignIn(bodyElement);
      var menu = new initMenu();
    });
  });

});

function SignIn(bodyElement) {
  var allElement = {
    username: bodyElement.find('.login-body .form .username .text'),
    password: bodyElement.find('.login-body .form .password .text'),
    error: bodyElement.find('.login-body .form .operation .error'),
    login: bodyElement.find('.login-body .form .operation .button'),
    forgetPassword: bodyElement.find('.login-body .form .password .tip .forgetPassword'),
    form: bodyElement.find('.login-body .form')
  };

  var isLoging = false;

  //事件处理开始

  allElement.username.keyup(changeText);
  allElement.password.keyup(changeText);

  allElement.form.submit(function () {
    if (isLoging) {
      return false;
    }

    isLoging = true;

    var username = allElement.username.val();
    var password = allElement.password.val();

    // if (!username || !username.testMail()) {
    //   showError(true, '邮箱不合法');
    //   isLoging = false;
    //   return false;
    // }
    if (!password || password.length < 6) {
      showError(true, '密码不足6位');
      isLoging = false;
      return false;
    }

    $.cookie('zz-username', username, { expires: 7 });
    $.cookie('zz-password', password, { expires: 7 });


    $.ajax({
      data: { username: username, password: password },
      type: 'post',
      url: '/user/signin',
      dataType: 'json'
    })
      .done(function (result) {
        if (result.err) {
          switch (result.err.type) {
            case 'invalid_email':
              showError(true, "无效邮箱地址！");
              break;
            case 'invalid_password':
              showError(true, "无效密码！");
              break;
            case 'account_not_exist':
              showError(true, "账户不存在！");
              break;
            case 'account_not_match':
              showError(true, "账户或密码出错！");
              break;
            case 'account_not_activate':
              showError(true, "账户未激活，请到您的邮箱进行激活！");
              break;
            case 'internal_system_error':
            default:
              showError(true, "系统出错，请刷新页面重试！");
              break;
          }

          isLoging = false;
        }
        else {
          window.location = '/zzqs/login?token=' + result.access_token;
        }
      })
      .fail(function () {
        showError(true, "系统出错，请刷新页面重试！");
        isLoging = false;
      });

    return false;
  });
  //事件处理结束

  //公共方法开始

  function showError(isShow, text) {
    if (isShow) {
      allElement.error.text(text);
      allElement.error.removeClass('zz-hidden');
    }
    else {
      if (!allElement.error.hasClass('zz-hidden')) {
        allElement.error.addClass('zz-hidden');
      }
    }
  }

  function hasPassword() {
    var password = allElement.password.val();

    if (!password || !password.length) {
      return false;
    }
    else {
      return true;
    }
  }
  function hasUsername() {
    var username = allElement.username.val();

    if (!username || !username.length) {
      return false;
    }
    else {
      return true;
    }
  }

  function changeText(e) {
    var theEvent = window.event || e;
    if (theEvent) {
      var code = theEvent.keyCode || theEvent.which;
      if (code === 13) {
        return false;
      }
    }

    showError(false);
  }

  //公共方法结束

  function init() {
    allElement.username.val($.cookie('zz-username') || '');
    allElement.password.val($.cookie('zz-password') || '');
    changeText();
  }

  allElement.forgetPassword.click(function () {
    window.location.href = "/home/forget";
  });

  init();

}