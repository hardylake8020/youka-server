$(function () {
  var login = new ForgetPasswordFramework($('body'));
});
function ForgetPasswordFramework(container) {
  var Element =
  {
    ForgetPassword: {
      Container: container.find('.center-container'),
      EmailBox: container.find('.email'),
      Username: container.find('#username'),
      Form: container.find('#forgetPasswordForm'),
      Submit: container.find('#findPassword')
    },
    Result: {
      Container: container.find('.result-container'),
      ResultContent: container.find('#resultContent'),
      SubmitAgain: container.find('#findAgain'),
      ResultDetail: container.find('#resultDetail'),
      Username: container.find('#resultUsername')
    }
  };

  var Placeholder =
  {
    Username: Element.ForgetPassword.Username.attr('placeholder')
  };

  (function () {

    Element.Result.Container.addClass('hide');

    Element.ForgetPassword.Submit.click(function () {

      if (!RegisterValid())
        return;

      Element.ForgetPassword.Username.blur();

      $.ajax({
        data: Element.ForgetPassword.Form.serialize(),
        type: 'get',
        url: '/user/resetpasswordrequest',
        dataType: 'json'
      }).done(function (data) {
        Element.ForgetPassword.Container.addClass('hide');
        Element.Result.Container.removeClass('hide');

        if (data.err) {
          switch (data.err.type) {
            case 'account_not_exist':
              Element.Result.ResultContent.text('账户不存在,申请失败！');
              Element.Result.ResultDetail.text('请检查账户名是否正确，并刷新页面重试！');
              Element.Result.SubmitAgain.addClass('hide');
              return;
            case 'account_not_activate':
              Element.Result.ResultContent.text('账户未激活,申请失败！');
              Element.Result.ResultDetail.text('请查看邮箱进行激活账户，或者登录进行账户激活');
              Element.Result.SubmitAgain.addClass('hide');
              return;
            case 'email_failed':
              Element.Result.ResultContent.text('邮箱发送失败，请检查邮箱是否有效！');
              Element.Result.ResultDetail.text('请检查账户名是否正确，并刷新页面重试');
              Element.Result.SubmitAgain.addClass('hide');
              return;
            case 'internal_system_error':
            default:
              Element.Result.ResultContent.text('系统错误，申请失败！');
              Element.Result.ResultDetail.text('系统错误，请刷新页面重试');
              Element.Result.SubmitAgain.addClass('hide');
              return;
          }
        }
        else {
          Element.Result.ResultContent.text('申请找回密码成功！');
          Element.Result.ResultDetail.text('已向下方的邮箱发送了一封邮件，请及时查看并进行重置密码。');

          Element.Result.Container.removeClass('hide');

          Element.Result.SubmitAgain.removeClass('hide');
          return;
        }
      }).fail(function () {
        Element.ForgetPassword.Container.addClass('hide');

        Element.Result.Container.removeClass('hide');

        Element.Result.ResultContent.text('系统错误，申请失败！');
        Element.Result.ResultDetail.text('系统错误，请刷新页面重试');
        Element.Result.SubmitAgain.addClass('hide');
        return;
      });
    });

    Element.Result.SubmitAgain.click(function () {
      if (Element.Result.SubmitAgain.hasClass('disabled')) {
        return;
      }

      Element.Result.SubmitAgain.addClass('disabled');
      EnableButtonLater(60, function () {
        Element.Result.SubmitAgain.removeClass('disabled');
      });

      Element.ForgetPassword.Submit.click();
    });

    Element.ForgetPassword.Username.focus(function () {
      $(this).attr('placeholder', '');
      $(this).select();
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Username);

      Element.Result.Username.val($(this).val());

      if (IsNullOrEmpty(Element.ForgetPassword.Username.val())) {
        HideError(Element.ForgetPassword.EmailBox);
        return;
      }
      EmailFormatValid();

    });

    document.onkeydown = function (e) {
      var theEvent = window.event || e;
      var code = theEvent.keyCode || theEvent.which;
      if (code == 13) {
        Element.ForgetPassword.Submit.click();
        return false;
      }
      return true;
    };
  })();

  function EnableButtonLater(seconds, callback) {
    Element.Result.SubmitAgain.val('(' + seconds + ')秒后可再次发送！');
    if (seconds > 0) {
      seconds--;
      setTimeout(function () {
        EnableButtonLater(seconds, callback);
      }, 1000);
    }
    else {
      Element.Result.SubmitAgain.val('未收到邮件？再发送一次');
      if (callback != null && typeof(callback) == 'function')
        callback();
    }
  };

  function EmailFormatValid() {
    var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
    if (patten.test(Element.ForgetPassword.Username.val()) == false)
      ShowError(Element.ForgetPassword.EmailBox, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
    else
      HideError(Element.ForgetPassword.EmailBox);
  };

  function EmailNullCheck() {
    if (IsNullOrEmpty(Element.ForgetPassword.Username.val()))
      ShowError(Element.ForgetPassword.EmailBox, "邮箱不能为空！");
  };

  function RegisterValid() {
    EmailFormatValid();
    EmailNullCheck();

    if (!Element.ForgetPassword.EmailBox.hasClass('error'))
      return true;
    else
      return false;
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
