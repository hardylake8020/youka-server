/**
 * Created by Wayne on 15/10/23.
 */

$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      new ResetPassword(bodyElement);
    });
  });

});

function ResetPassword(bodyElement) {
  var allElement = {
    username: bodyElement.find('.signup-body .form .username .text'),
    password: bodyElement.find('.signup-body .form .password .text'),
    surePassword: bodyElement.find('.signup-body .form .password-sure .text'),
    error: bodyElement.find('.signup-body .form .operation .error'),
    sure: bodyElement.find('.signup-body .form .operation .button'),
    form: bodyElement.find('.signup-body .form')
  };

  var params = GetQueryParams();
  allElement.username.val(params['username'] || '');

  //事件处理开始
  allElement.username.keyup(changeText);
  allElement.password.keyup(changeText);
  allElement.surePassword.keyup(changeText);

  allElement.form.submit(function () {
    if (!canReset()) {
      return false;
    }

    showResetButton(false);

    var username = allElement.username.val();
    var password = allElement.password.val();
    var surePassword = allElement.surePassword.val();

    if (!username || !username.testMail()) {
      showError(true, '邮箱不合法');
      showResetButton(false);
      return false;
    }
    if (!password || password.length < 6) {
      showError(true, '密码不足6位');
      showResetButton(false);
      return false;
    }
    if (!surePassword || surePassword.length < 6) {
      showError(true, '确认密码不足6位');
      showResetButton(false);
      return false;
    }
    if (password !== surePassword) {
      showError(true, '密码不一致');
      showResetButton(false);
      return false;
    }
    if (!params['token']) {
      showError(true, '验证失败');
      showResetButton(false);
      return false;
    }

    $.ajax({
      data: {username: username, newPassword: password, token: params['token']},
      type: 'post',
      url: '/user/updatepassword',
      dataType: 'json'
    })
      .done(function (result) {
        if (result.err) {
          var errorText = '';
          switch (result.err.type) {
            case 'invalid_email':
              errorText = '无效的邮箱地址';
              break;
            case 'invalid_password':
              errorText = '无效密码设置';
              break;
            case 'account_exist':
              errorText = '邮箱已经注册';
              break;
            case 'account_not_activate':
              errorText = '邮箱未激活';
              break;
            case 'account_not_exist':
              errorText = '链接已失效，请重新操作';
              break;
            case 'internal_system_error':
            default :
              errorText = '系统错误，重置密码失败';
              break;
          }

          showError(true, errorText);
          showResetButton(false);
        }
        else {
          //成功
          window.location='/zzqs/login?token=' + result.access_token;
        }
      })
      .fail(function () {
        showError(true, '系统错误，注册失败');
        showResetButton(false);
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

  function showResetButton(isShow) {
    if (isShow) {
      if (!allElement.sure.hasClass('able')) {
        allElement.sure.addClass('able');
      }
    }
    else {
      allElement.sure.removeClass('able');
    }
  }

  function canReset() {
    if (allElement.sure.hasClass('able')) {
      return true;
    }
    else {
      return false;
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

  function hasSurePassword() {
    var password = allElement.surePassword.val();

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
    if (hasUsername() && hasPassword() && hasSurePassword()) {
      showResetButton(true);
    }
    else {
      showResetButton(false);
    }
  }

  //公共方法结束
}