$(function () {
  var login = new LoginFramework($('body'));
});
function LoginFramework(container) {
  var Element =
  {
    Login: {
      Container: container.find('.login-container'),
      UsernameBox: container.find('.username'),
      PasswordBox: container.find('.password'),
      RememberIcon: container.find('.remember-me .icon'),
      Form: container.find('form'),
      Username: container.find('#username'),
      Password: container.find('#password'),
      RemeberMe: container.find('#rememberMe'),
      Submit: container.find('#login')
    }
  };

  var Placeholder =
  {
    Username: Element.Login.Username.attr('placeholder'),
    Password: Element.Login.Password.attr('placeholder')
  };

  (function () {


    Element.Login.Username.focus(function () {
      $(this).attr('placeholder', '');
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Username);
      HideError($(this).parent());
      EmailFormatValid();
    });

    Element.Login.Password.focus(function () {
      $(this).attr('placeholder', '');
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Password);
      HideError($(this).parent());
    });

    Element.Login.RememberIcon.click(function () {
      $(this).toggleClass("selected");
      Element.Login.RemeberMe.val($(this).hasClass("selected"));
    });

    Element.Login.Submit.click(function () {
      if (!LoginValid())
        return;

      $.ajax({
        data: Element.Login.Form.serialize(),
        type: 'post',
        url: "user/signin",
        // 单机运行时使用，测试服务器已允许跨域访问，"http://192.168.11.191/public/rest/login"
        dataType: 'json'
      }).done(function (result) {
        if (result.err) {
          switch (result.err.type) {
            case 'invalid_email':
              ShowError(Element.Login.PasswordBox, "无效邮箱地址！");
              break;
            case 'invalid_password':
              ShowError(Element.Login.PasswordBox, "无效密码！");
              break;
            case 'account_not_exist':
              ShowError(Element.Login.PasswordBox, "账户不存在！");
              break;
            case 'account_not_match':
              ShowError(Element.Login.PasswordBox, "账户或密码出错！");
              break;
            case 'account_not_activate':
              ShowError(Element.Login.PasswordBox, "账户未激活，请到您的邮箱进行激活！");
              window.location.href = '/activate?username='+Element.Login.Username.val();
              break;
            case 'internal_system_error':
              ShowError(Element.Login.PasswordBox, "系统出错，请刷新页面重试！");
              break;
          }
        }
        else {
          window.location = '/zzqs/login?token=' + result.access_token;
        }

      }).fail(function (jqXHR, textStatus, errorThrown) {
        ShowError(Element.Login.PasswordBox, "系统出错，登录失败，请刷新页面重试！");
      })
      ;
    });


    document.onkeydown = function (e) {
      var theEvent = window.event || e;
      var code = theEvent.keyCode || theEvent.which;
      if (code == 13) {
        Element.Login.Submit.click();
        return false;
      }
    };
  })();

  function LoginValid() {
    EmailFormatValid();
    UsernameNullCheck();
    PasswordNullCheck();

    if (!Element.Login.UsernameBox.hasClass('error') && !Element.Login.PasswordBox.hasClass('error'))
      return true;
    else
      return false;
  };

  function EmailFormatValid() {
    var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
    if (patten.test(Element.Login.Username.val()) == false)
      ShowError(Element.Login.UsernameBox, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
    else
      HideError(Element.Login.UsernameBox);
  };

  function UsernameNullCheck() {
    if (IsNullOrEmpty(Element.Login.Username.val()))
      ShowError(Element.Login.UsernameBox, "账户名不能为空");
    else
      HideError(Element.Login.UsernameBox);
  };
  function PasswordNullCheck() {
    if (IsNullOrEmpty(Element.Login.Password.val()))
      ShowError(Element.Login.PasswordBox, "密码不能为空");
    else
      HideError(Element.Login.PasswordBox);

  };

  function ShowError(element, message) {
    element.find('.tip').text(message);
    element.addClass('error');
  };
  function HideError(element) {
    element.removeClass('error');
  };
};
