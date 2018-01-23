/**
 * Created by Wayne on 15/10/15.
 */
/**
 * Created by Wayne on 15/10/14.
 */

$(function () {

  var bodyElement = $('body');
  var verifiCode = '';

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      new SignUp(bodyElement);
      var menu = new initMenu();
    });
  });

});

function SignUp(bodyElement) {
  var allElement = {
    username: bodyElement.find('.signup-body .form .username .text'),
    password: bodyElement.find('.signup-body .form .password .text'),
    mobile_phone: bodyElement.find('.signup-body .form .mobile_phone .text'),
    surePassword: bodyElement.find('.signup-body .form .password-sure .text'),
    error: bodyElement.find('.signup-body .form .operation .error'),
    signUp: bodyElement.find('.signup-body .form .operation .button'),
    form: bodyElement.find('.signup-body .form'),

    resultUsername: bodyElement.find('.resultUsername'),
    sendAgain: bodyElement.find('.sendAgain'),
    registerContainer: bodyElement.find('.register-container'),
    resultContainer: bodyElement.find('.result-container'),
    getVerifyCode: bodyElement.find('.signup-body .form .verify_code .get_verify_code'),
    inputVerifyCode: bodyElement.find('.signup-body .form .verify_code .input_verify_code'),
  };

  //事件处理开始

  allElement.username.keyup(changeText);
  allElement.password.keyup(changeText);
  allElement.surePassword.keyup(changeText);
  allElement.resultContainer.addClass('hide');

  var sendingCode = false;
  allElement.getVerifyCode.click(function () {
    if (sendingCode) {
      return;
    }
    var mobile_phone = allElement.mobile_phone.val();
    if (!mobile_phone || mobile_phone.length !== 11) {
      showError(true, '请输入正确的手机号');
      showSignUp(false);
      return false;
    }

    $.ajax({
      data: { username: mobile_phone },
      type: 'post',
      url: '/driver/getsmsverifycode',
      dataType: 'json',
      success: function (result) {
        verifiCode = result.code;
        allElement.getVerifyCode.text('发送成功..');
        setTimeout(function () {
          allElement.getVerifyCode.text('重新发送');
        }, 60000);
      }
    });


  });
  allElement.form.submit(function () {
    if (!canSignUp()) {
      return false;
    }

    showSignUp(false);

    var username = allElement.username.val();
    var password = allElement.password.val();
    var mobile_phone = allElement.mobile_phone.val();
    var surePassword = allElement.surePassword.val();
    var verify_code = allElement.inputVerifyCode.val();

    if (!verifiCode) {
      showError(true, '请输获取证码');
      showSignUp(false);
      return false;
    }

    if (!verify_code) {
      showError(true, '请输入验证码');
      showSignUp(false);
      return false;
    }


    if (verify_code !== verifiCode) {
      showError(true, '请输入验正确证码');
      showSignUp(false);
      return false;
    }


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

    if (!mobile_phone || mobile_phone.length !== 11) {
      showError(true, '请输入正确的手机号');
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

    $.ajax({
      data: { username: username, password: password, mobile_phone: mobile_phone },
      type: 'post',
      url: '/user/signup',
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
              errorText = '邮箱已注册，但未激活';
              break;
            case 'internal_system_error':
            default:
              errorText = '系统错误，注册失败';
              break;
          }

          showError(true, errorText);
          showSignUp(false);
        }
        else {
          //成功
          showResult();
          allElement.resultUsername.text(allElement.username.val());
        }
      })
      .fail(function () {
        showError(true, '系统错误，注册失败');
        showSignUp(false);
      });

    return false;
  });

  allElement.sendAgain.click(function () {
    $.ajax({
      data: { username: allElement.username.val() },
      type: 'post',
      url: '/user/activate',
      dataType: 'json'
    }).done(function (result) {
      if (result.err) {
        switch (result.err.type) {
          case 'invalid_email': {
            alert("无效的邮箱地址!");
            break;
          }
          case 'account_not_exist': {
            alert("您的邮箱账户不存在，请刷新页面重新注册！");
            break;
          }
          case 'account_has_activated': {
            alert("您的邮箱已经激活，请直接登录！");
            break;
          }
          default:
          case 'internal_system_error': {
            alert("您的邮箱注册失败，不能重新注册，请刷新页面重试！");
            break;
          }
        }
      }
      else {
        alert('邮件已发送，请注意查收');
      }
    }).fail(function () {
      alert('系统错误，请重试！');
    });
  });

  //事件处理结束

  //公共方法开始

  function showResult() {
    if (!allElement.registerContainer.hasClass('hide')) {
      allElement.registerContainer.addClass('hide');
    }
    if (allElement.resultContainer.hasClass('hide')) {
      allElement.resultContainer.removeClass('hide');
    }
  }

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