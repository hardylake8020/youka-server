$(function () {
  var login = new ResetPasswordFramework($('body'));
});
function ResetPasswordFramework(container) {
  var Element =
  {
    Header: container.find('header'),
    Footer: container.find('footer'),
    ResetPassword: {
      Container: container.find('.center-container'),
      EmailBox: container.find('.email'),
      PasswordBox: container.find('.password'),
      PasswordTwiceBox: container.find('.password-twice'),
      Username: container.find('#username'),
      Password: container.find('#password'),
      PasswordTwice: container.find('#passwordTwice'),
      VerifyCode: container.find('#verifyCode'),
      Form: container.find('#resetPasswordForm'),
      Submit: container.find('#resetPassword')
    },
    Result: {
      Container: container.find('.result-container'),
      ResultContent: container.find('#resultContent'),
      Login: container.find('#login'),
      ResultDetail: container.find('#resultDetail'),
      Username: container.find('#resultUsername'),
      ForgetPassword: container.find('#forgetPassword')
    }
  };

  var Placeholder =
  {
    Username: Element.ResetPassword.Username.attr('placeholder'),
    Password: Element.ResetPassword.Password.attr('placeholder'),
    PasswordTwice: Element.ResetPassword.PasswordTwice.attr('placeholder')
  };

  (function () {

    var params = GetQueryParams();
    var username = unescape(params.username);
    var token = params.token;
    //var verifyCode = params.verifycode;
    //
    //
    //if(IsNullOrEmpty(username) || IsNullOrEmpty(verifyCode))
    //{
    //
    //    Element.ResetPassword.Container.addClass('hide');
    //
    //    Element.Result.ResultContent.text('重置密码链接失效!')
    //    Element.Result.ResultDetail.text('请重新找回密码');
    //    Element.Result.Login.addClass('hide');
    //    return;
    //}
    if (IsNullOrEmpty(username)) {
      Element.ResetPassword.Container.addClass('hide');

      Element.Result.ResultContent.text('链接参数错误，重置密码失败!')
      Element.Result.ResultDetail.text('请重新找回密码');
      Element.Result.Login.addClass('hide');
      return;
    }

    Element.ResetPassword.Username.val(username);
    //Element.ResetPassword.VerifyCode.val(verifyCode);
    Element.Result.Username.val(username);

    Element.Result.Container.addClass('hide');

    Element.ResetPassword.Submit.click(function () {

      if (!ResetPasswordValid())
        return;

      $.ajax({
        data: Element.ResetPassword.Form.serialize(),
        type: 'post',
        url: '/user/updatepassword?token='+token,
        dataType: 'json'
      }).done(function (data) {
        Element.ResetPassword.Container.addClass('hide');

        Element.Result.Container.removeClass('hide');

        if (data.err) {
          Element.ResetPassword.Container.addClass('hide');
          Element.Result.Container.removeClass('hide');
          Element.Result.Login.addClass('hide');
          Element.Result.ForgetPassword.removeClass('hide');

          switch (data.err.type) {
            case 'account_not_exist':
              Element.Result.ResultContent.text('账户不存在，重置密码失败！');
              Element.Result.ResultDetail.text('请登录首页，重新注册');
              return;
            case 'account_not_activate':
              Element.Result.ResultContent.text('账户未激活，重置密码失败！');
              Element.Result.ResultDetail.text('请进入邮箱进行激活操作！');
              return;
            case 'invalid_password':
              Element.Result.ResultContent.text('重置的密码格式不正确，重置密码失败！');
              Element.Result.ResultDetail.text('请刷新页面重新设置！');
              return;
            case 'internal_system_error':
            default:
              Element.Result.ResultContent.text('系统错误，重置密码失败！');
              Element.Result.ResultDetail.text('请刷新页面重新设置！');
              return;
          }
        }
        else {
          Element.Result.ResultContent.text('密码重置成功！');
          Element.Result.ResultDetail.text('请点击下面的登录按钮进行登录');

          Element.Result.Login.removeClass('hide');
          Element.Result.ForgetPassword.addClass('hide');
          //TODO 直接登录
          return;
        }

      }).fail(function () {
        Element.ResetPassword.Container.addClass('hide');
        Element.Result.Container.removeClass('hide');

        Element.Result.ResultContent.text('重置密码失败！');
        Element.Result.ResultDetail.text('请重新申请找回密码');

        Element.Result.Login.addClass('hide');
        Element.Result.ForgetPassword.removeClass('hide');
      });
    });

    Element.Result.Login.click(function () {
      window.location.href = "/signin";
    });

    Element.Result.ForgetPassword.click(function () {
      window.location.href = "/forget_password";
    });


    Element.ResetPassword.Username.focus(function () {
      $(this).attr('placeholder', '');
      $(this).select();
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Username);
      if (IsNullOrEmpty(Element.ResetPassword.Username.val())) {
        HideError(Element.ResetPassword.EmailBox);
        return;
      }
      EmailFormatValid();

      Element.Result.Username.val($(this).val());
    });

    Element.ResetPassword.Password.focus(function () {
      $(this).attr('placeholder', '');
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Password);
      if (!IsNullOrEmpty($(this).val()))
        HideError($(this).parent());

      PasswordCountValid($(this));
      PasswordTwiceValid();
    });
    Element.ResetPassword.PasswordTwice.focus(function () {
      $(this).attr('placeholder', '');
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.PasswordTwice);
      if (!IsNullOrEmpty($(this).val()))
        HideError($(this).parent());

      PasswordCountValid($(this));
      PasswordTwiceValid();
    });

    document.onkeydown = function (e) {
      var theEvent = window.event || e;
      var code = theEvent.keyCode || theEvent.which;
      if (code == 13) {
        Element.ResetPassword.Submit.click();
        return false;
      }
      return true;
    };
  })();

  function EmailFormatValid() {
    var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
    if (patten.test(Element.ResetPassword.Username.val()) == false)
      ShowError(Element.ResetPassword.EmailBox, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
    else
      HideError(Element.ResetPassword.EmailBox);
  };

  function PasswordCountValid(element) {
    if (IsNullOrEmpty(element.val()))
      return;

    if (element.val().length < 6)
      ShowError(element.parent(), "密码不少于6位！");
    else
      HideError(element.parent());

  };

  function ResetPasswordValid() {
    EmailFormatValid();
    EmailNullCheck();
    PasswordNullCheck();
    PasswordTwiceNullCheck();
    PasswordCountValid(Element.ResetPassword.Password);
    PasswordCountValid(Element.ResetPassword.PasswordTwice);
    PasswordTwiceValid();

    if (!Element.ResetPassword.EmailBox.hasClass('error')
      && !Element.ResetPassword.Password.hasClass('error')
      && !Element.ResetPassword.PasswordTwice.hasClass('error'))
      return true;
    else
      return false;
  };

  function EmailNullCheck() {
    if (IsNullOrEmpty(Element.ResetPassword.Username.val()))
      ShowError(Element.ResetPassword.EmailBox, "邮箱不能为空！");
  };
  function PasswordNullCheck() {
    if (IsNullOrEmpty(Element.ResetPassword.Password.val()))
      ShowError(Element.ResetPassword.PasswordBox, "密码不能为空！");
  };
  function PasswordTwiceNullCheck() {
    if (IsNullOrEmpty(Element.ResetPassword.PasswordTwice.val()))
      ShowError(Element.ResetPassword.PasswordTwiceBox, "密码不能为空！");
  };
  function PasswordTwiceValid() {
    if (IsNullOrEmpty(Element.ResetPassword.PasswordTwice.val()))
      return;

    if (Element.ResetPassword.Password.val() == Element.ResetPassword.PasswordTwice.val())
      HideError(Element.ResetPassword.PasswordTwiceBox);
    else
      ShowError(Element.ResetPassword.PasswordTwiceBox, "密码不一致");

  };
  function ShowError(element, message) {
    element.find('.tip').text(message);
    element.addClass('error');
  };

  function HideError(element) {
    element.find('.tip').text('');
    element.removeClass('error');
  };
};
