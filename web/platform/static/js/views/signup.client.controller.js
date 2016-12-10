$(function () {
  var login = new RegistFramework($('body'));
});
function RegistFramework(container) {
  var Element =
  {
    Register: {
      Container: container.find('.register-container'),
      EmailBox: container.find('.email'),
      PasswordBox: container.find('.password'),
      PasswordTwiceBox: container.find('.password-twice'),
      ReadMeIcon: container.find('.read-me .icon'),
      ReadMe: container.find('#readMe'),
      UserName: container.find('#username'),
      Password: container.find('#password'),
      PasswordTwice: container.find('#passwordTwice'),
      Form: container.find('#registerForm'),
      Submit: container.find('#regist')
    },
    Result: {
      Container: container.find('.result-container'),
      ResultContent: container.find('#resultContent'),
      SubmitAgain: container.find('#registAgain'),
      ResultDetail: container.find('#resultDetail'),
      Username: container.find('#resultUsername')
    }
  };

  var Placeholder =
  {
    Username: Element.Register.UserName.attr('placeholder'),
    Password: Element.Register.Password.attr('placeholder'),
    PasswordTwice: Element.Register.PasswordTwice.attr('placeholder')
  };

  (function () {

    Element.Result.Container.addClass('hide');

    Element.Register.Submit.click(function () {

      if (!RegisterValid())
        return;

      Element.Result.Username.val(Element.Register.UserName.val());

      $.ajax({
        data: Element.Register.Form.serialize(),
        type: 'post',
        url: '/user/signup',
        dataType: 'json'
      }).done(function (result) {
        Element.Register.Container.addClass('hide');

        Element.Result.Container.removeClass('hide');

        if (result.err) {
          switch (result.err.type) {

            case 'invalid_email': {

              Element.Result.ResultContent.text('无效的邮箱地址!')
              Element.Result.ResultDetail.text('请使用正确的邮箱注册！刷新页面重试！');
              Element.Result.SubmitAgain.addClass('hide');
              break;
            }
            case 'invalid_password': {

              Element.Result.ResultContent.text('无效密码设置，请输入至少6位数密码!')
              Element.Result.ResultDetail.text('请设置正确格式的密码进行注册！刷新页面重试！');
              Element.Result.SubmitAgain.addClass('hide');
              break;
            }
            case 'account_exist': {
              Element.Result.ResultContent.text('您的邮箱已经注册，不能重新注册!')
              Element.Result.ResultDetail.text('请使用新的邮箱注册或者直接登录！');
              Element.Result.SubmitAgain.addClass('hide');
              break;
            }
            case 'account_not_activate': {
              Element.Result.ResultContent.text('您的邮箱已经注册，但是没有激活，请到邮箱进行激活!')
              Element.Result.ResultDetail.text('请使用新的邮箱注册或者直接登录！');
              break;
            }
            default :
            case 'internal_system_error': {
              Element.Result.ResultContent.text('系统错误，注册失败！');
              Element.Result.ResultDetail.text('请刷新页面重试！');
              Element.Result.SubmitAgain.addClass('hide');
              break;
            }
          }
        }
        else
        {
          Element.Result.ResultContent.text('您的账户注册成功！');
          Element.Result.ResultDetail.text('已向下方的邮箱发送了一封验证邮件，请及时查看并进行激活。');
          Element.Result.Container.removeClass('hide');

          Element.Result.SubmitAgain.removeClass('hide');
        }


      }).fail(function () {
        Element.Register.Container.addClass('hide');

        Element.Result.Container.removeClass('hide');

        Element.Result.ResultContent.text('系统错误，注册失败！');
        Element.Result.ResultDetail.text('请刷新页面重试！');
        Element.Result.SubmitAgain.addClass('hide');
      });
    });

    Element.Result.SubmitAgain.click(function () {
      $.ajax({
        data: Element.Register.Form.serialize(),
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
            default :
            case 'internal_system_error': {
              alert("您的邮箱注册失败，不能重新注册，请刷新页面重试！");
              break;
            }
          }
        }
        else
        {
          alert("已向您的邮箱发送成功，请注意查收！");
        }
      });
    });

    Element.Register.UserName.focus(function () {
      $(this).attr('placeholder', '');
      $(this).select();
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Username);
      if (IsNullOrEmpty(Element.Register.UserName.val())) {
        HideError(Element.Register.EmailBox);
        return;
      }
      EmailFormatValid();

      Element.Result.Username.val($(this).val());
    });


    Element.Register.ReadMeIcon.click(function () {
      $(this).toggleClass('selected');
      Element.Register.ReadMe.parent().removeClass('error');
      Element.Register.ReadMe.val($(this).hasClass('selected'));
    });

    Element.Register.Password.focus(function () {
      $(this).attr('placeholder', '');
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Password);
      if (!IsNullOrEmpty($(this).val()))
        HideError($(this).parent());

      PasswordCountValid($(this));
      PasswordTwiceValid();
    });
    Element.Register.PasswordTwice.focus(function () {
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
        Element.Register.Submit.click();
        return false;
      }
      return true;
    };
  })();

  function EmailFormatValid() {
    var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
    if (patten.test(Element.Register.UserName.val()) == false)
      ShowError(Element.Register.EmailBox, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
    else
      HideError(Element.Register.EmailBox);
  };

  function PasswordCountValid(element) {
    if (IsNullOrEmpty(element.val()))
      return;

    if (element.val().length < 6)
      ShowError(element.parent(), "密码不少于6位！");
    else
      HideError(element.parent());

  };

  function RegisterValid() {
    EmailFormatValid();
    EmailNullCheck();
    PasswordNullCheck();
    PasswordTwiceNullCheck();
    PasswordCountValid(Element.Register.Password);
    PasswordCountValid(Element.Register.PasswordTwice);
    PasswordTwiceValid();

    if (!Element.Register.EmailBox.hasClass('error')
      && !Element.Register.PasswordBox.hasClass('error')
      && !Element.Register.PasswordTwiceBox.hasClass('error')
      && ReadMeNullCheck())
      return true;
    else
      return false;
  };

  function EmailNullCheck() {
    if (IsNullOrEmpty(Element.Register.UserName.val()))
      ShowError(Element.Register.EmailBox, "邮箱不能为空！");
  };
  function PasswordNullCheck() {
    if (IsNullOrEmpty(Element.Register.Password.val()))
      ShowError(Element.Register.PasswordBox, "密码不能为空！");
  };
  function PasswordTwiceNullCheck() {
    if (IsNullOrEmpty(Element.Register.PasswordTwice.val()))
      ShowError(Element.Register.PasswordTwiceBox, "密码不能为空！");
  };
  function PasswordTwiceValid() {
    if (IsNullOrEmpty(Element.Register.PasswordTwice.val()))
      return;

    if (Element.Register.Password.val() == Element.Register.PasswordTwice.val())
      HideError(Element.Register.PasswordTwiceBox);
    else
      ShowError(Element.Register.PasswordTwiceBox, "密码不一致");

  };
  function ReadMeNullCheck() {
    var isReaded = IsTrue(Element.Register.ReadMe.val());
    if (!isReaded)
      Element.Register.ReadMe.parent().addClass('error');

    return isReaded;
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
