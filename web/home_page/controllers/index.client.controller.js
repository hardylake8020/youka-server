$(function () {
  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      new Index(bodyElement);
      new SignUp(bodyElement);
      new SignIn(bodyElement);
    });
  });


});


function SignUp(bodyElement) {
  var allElement = {
    username: bodyElement.find('.download-register .username'),
    password: bodyElement.find('.download-register .password'),
    register: bodyElement.find('.download-register .register'),

    error: bodyElement.find('.error-tip'),

    operationRegister: bodyElement.find('.download-register .register')
  };

  function changeText(e, errorElement) {
    var theEvent = window.event || e;
    if (theEvent) {
      var code = theEvent.keyCode || theEvent.which;
      if (code === 13) {
        return false;
      }
    }
    showError(false, '', errorElement);
  }

  allElement.username.keyup(function (e) {
    changeText(e, allElement.error);
  });

  allElement.password.keyup(function (e) {
    changeText(e, allElement.error);
  });

  allElement.operationRegister.click(function () {
    return submitRegister(allElement.username.val(), allElement.password.val(), allElement.error);
  });

  function submitRegister(username, password, errorElement) {
    if (!hasUsername(username)) {
      showError(true, '账号不能为空', errorElement);
      return false;
    }

    if (!hasPassword(password)) {
      showError(true, '密码不能为空', errorElement);
      return false;
    }

    if (!username || !username.testMail()) {
      showError(true, '邮箱不合法', errorElement);
      return false;
    }

    if (!password || password.length < 6) {
      showError(true, '密码不足6位', errorElement);
      return false;
    }

    $.ajax({
      data: { username: username, password: password },
      type: 'post',
      url: '/user/signup',
      dataType: 'json'
    })
      .done(function (result) {
        console.log(result);
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

          showError(true, errorText, errorElement);
        }
        else {
          alert('注册成功,已发送了一封验证邮件到您邮箱，请及时查收并激活');
        }
      }).fail(function () {
        showError(true, '系统错误，注册失败', errorElement);
      });
    return false;
  }

  function showError(isShow, text, errorElement) {
    if (isShow) {
      errorElement.text(text);
      errorElement.removeClass('zz-hidden');
    }
    else {
      if (!errorElement.hasClass('zz-hidden')) {
        errorElement.addClass('zz-hidden');
      }
    }
  }


  function hasUsername(username) {
    if (!username || !username.length) {
      return false;
    }
    else {
      return true;
    }
  }

  function hasPassword(password) {
    if (!password || !password.length) {
      return false;
    }
    else {
      return true;
    }
  }
}

function SignIn(bodyElement) {
  var allElement = {
    username: bodyElement.find('.operation-signin .signin-content .username'),
    password: bodyElement.find('.operation-signin .signin-content .password'),
    signin: bodyElement.find('.operation-signin .signin-content .signin'),
    error: bodyElement.find('.error'),
    operationSignIn: bodyElement.find('.operation .operation-signin')
  };

  var isLoging = false;

  //事件处理开始

  allElement.username.keyup(changeText);
  allElement.password.keyup(changeText);

  allElement.operationSignIn.submit(function () {
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

  init();

}

function Index(bodyElement) {

  var allElement = {
    iosDownloadButton: bodyElement.find('.app-download .download-ios')
  };

  var header = $('.operation .zz-home-header');
  var operation = $('.operation');
  var operationHeight = operation.height();

  $(window).scroll(function () {
    if ($(window).scrollTop() > operationHeight) {
      if (!header.hasClass('zz-home-header-two')) {
        header.addClass('zz-home-header-two');
      }
    }
    else {
      header.removeClass('zz-home-header-two');
    }
  }).trigger('scroll');

  //浏览器版本提示
  var zzDialog = new ZZDialog();
  zzDialog.init('下载提示', 'ios版本请使用Safari浏览器下载', '确定');
  allElement.iosDownloadButton.click(function () {

    if (!isSafari() || isAndroid()) {
      zzDialog.show();
      return false;
    }
  });

  //侧边栏
  var menu = new initMenu();


  var wrapContainer = $('.wrap .wrap-container');

  $(window).resize(function () {
    var clientHeight = document.body.clientHeight;
    if (clientHeight < 680) {
      wrapContainer.css('top', '680px');
    }
    else {
      wrapContainer.css('top', '100%');
    }
  });
}