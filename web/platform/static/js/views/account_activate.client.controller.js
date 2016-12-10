$(function () {
  new ActivatePage($('body'));
});
function ActivatePage(container) {
  var Element =
  {
    Container: container.find('#bodyContainer'),
    Username: container.find('#username'),
    UsernameTip: container.find('#usernameTip'),
    Tip: container.find('#tip'),
    SendActivateEmail: container.find('#sendActivateEmail'),
    SendActivateEmailAgain: container.find('#sendActivateEmailAgain')
  };

  var Placeholder =
    {
      username: Element.Username
    };

  (function () {
    Element.SendActivateEmailAgain.addClass('hide');

    var username = getUrlParam('username');
    if(username === undefined || username === null || username === '')
    {
      Element.Tip.text('错误链接，没有获得用户信息！请在下面输入框中输入想要激活的账户！');
      Element.Username.attr('readonly', false);
    }
    else
    {
      Element.Username.val(username);
    }

    Element.Username.focus(function () {
      $(this).attr('placeholder', '');
      $(this).select();
    }).blur(function () {
      $(this).attr('placeholder', Placeholder.Username);
      if (IsNullOrEmpty(Element.Username.val())) {
        HideError(Element.UsernameTip);
        return;
      }
      EmailFormatValid();

      Element.Username.val($(this).val());
    });

    Element.SendActivateEmailAgain.click(function(){
      var isHasError = Element.UsernameTip.parent().hasClass('error');
      if(isHasError){
        return;
      }

      if(Element.Username.val === undefined || Element.Username.val() === '' || Element.Username.val() === null)
      {
        ShowError(Element.UsernameTip, '请先输入用户名');
        return;
      }

      $.ajax({
        data: {username: Element.Username.val()},
        type: 'post',
        url: '/user/activate',
        dataType: 'json'
      }).done(function (result) {

        if (result.err) {
          switch (result.err.type) {
            case 'account_not_exist': {
              alert("账户不存在!");
              break;
            }
            case 'account_exist': {
              alert("您的邮箱已经激活，请直接登录！");
              break;
            }
            default :
            case 'internal_system_error': {
              alert("发送邮箱失败，请刷新页面重试！");
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

    Element.SendActivateEmail.click(function () {
      var isHasError = Element.UsernameTip.parent().hasClass('error');
      if(isHasError){
        return;
      }

      if(Element.Username.val === undefined || Element.Username.val() === '' || Element.Username.val() === null)
      {
        ShowError(Element.UsernameTip, '请先输入用户名');
        return;
      }

      $.ajax({
        data: {username: Element.Username.val()},
        type: 'post',
        url: '/user/activate',
        dataType: 'json'
      }).done(function (result) {

        if (result.err) {

          switch (result.err.type) {

            case 'account_not_exist': {
              Element.Tip.text('账户不存在!');
              break;
            }
            case 'account_exist': {
              Element.Tip.text('您的邮箱已经激活，请直接登录！');
              break;
            }
            default :
            case 'internal_system_error': {
              Element.Tip.text('发送邮箱失败，请刷新页面重试！');
              break;
            }
          }
        }
        else
        {
          Element.SendActivateEmailAgain.removeClass('hide');
          Element.SendActivateEmail.addClass('hide');
          Element.Tip.text("已向您的邮箱发送成功，请注意查收！");
        }
      });
    });

    document.onkeydown = function (e) {
      var theEvent = window.event || e;
      var code = theEvent.keyCode || theEvent.which;
      if (code == 13) {
        Element.Register.Submit.click();
      }
    };
  })();

  function EmailFormatValid() {
    var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
    if (patten.test(Element.Username.val()) === false)
      ShowError(Element.UsernameTip, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
    else
      HideError(Element.UsernameTip);
  };

  function ShowError(element, message) {
    element.text(message);
    element.parent().addClass('error');
  };
  function HideError(element) {
    element.text('');
    element.parent().removeClass('error');
  };
  function getUrlParam(name)
  {
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r!=null)
      return unescape(r[2]);
    else
      return null; //返回参数值
  };
};
