/**
 * Created by Wayne on 15/10/15.
 */

$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      new employeeActivate(bodyElement);
    });
  });

});

function employeeActivate(bodyElement) {
  var allElement = {
    username: bodyElement.find('.signup-body .form .username .text'),
    password: bodyElement.find('.signup-body .form .password .text'),
    surePassword: bodyElement.find('.signup-body .form .password-sure .text'),
    error: bodyElement.find('.signup-body .form .operation .error'),
    signUp: bodyElement.find('.signup-body .form .operation .button'),
    form: bodyElement.find('.signup-body .form')
  };

  var params = GetQueryParams();
  allElement.username.val(params['username'] || '');

  //事件处理开始

  allElement.username.keyup(changeText);
  allElement.password.keyup(changeText);
  allElement.surePassword.keyup(changeText);

  allElement.form.submit(function () {
    if (!canSignUp()) {
      return false;
    }

    showSignUp(false);

    var username = allElement.username.val();
    var password = allElement.password.val();
    var surePassword = allElement.surePassword.val();

    if (!username || !username.testMail()) {
      showError(true, '邮箱不合法');
      showSignUp(false);
      return false;
    }
    if (!password || password.length < 6) {
      showError(true, '密码不足6位');
      showSignUp(false);
      return false;
    }
    if (!surePassword || surePassword.length < 6) {
      showError(true, '确认密码不足6位');
      showSignUp(false);
      return false;
    }
    if (password !== surePassword) {
      showError(true, '密码不一致');
      showSignUp(false);
      return false;
    }
    if (!params['token']) {
      showError(true, '验证失败');
      showSignUp(false);
      return false;
    }

    $.ajax({
      data: {username: username, password: password, token: params['token']},
      type: 'post',
      url: '/company/company_signup',
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
            case 'internal_system_error':
            default :
              errorText = '系统错误，注册失败';
              break;
          }

          showError(true, errorText);
          showSignUp(false);
        }
        else {
          //成功
          window.location='/zzqs/login?token=' + result.access_token;
        }
      })
      .fail(function () {
        showError(true, '系统错误，注册失败');
        showSignUp(false);
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

  function showSignUp(isShow) {
    if (isShow) {
      if (!allElement.signUp.hasClass('able')) {
        allElement.signUp.addClass('able');
      }
    }
    else {
      allElement.signUp.removeClass('able');
    }
  }

  function canSignUp() {
    if (allElement.signUp.hasClass('able')) {
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
      showSignUp(true);
    }
    else {
      showSignUp(false);
    }
  }

  //公共方法结束
}