/**
 * Created by Wayne on 15/10/15.
 */


$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      new ForgetPassword(bodyElement);
      var menu = new initMenu();
    });
  });

});

function ForgetPassword(bodyElement) {
  var allElement = {
    username: bodyElement.find('.forget-body .form .username .text'),
    error: bodyElement.find('.forget-body .form .operation .error'),
    sendEmail: bodyElement.find('.forget-body .form .operation .button'),
    form: bodyElement.find('.forget-body .form'),

    forgetResult: bodyElement.find('.forget-result'),
    forgetContainer: bodyElement.find('.forget-container'),
    resultUsername: bodyElement.find('.resultUsername'),
    sendAgain: bodyElement.find('.sendAgain')
  };

  allElement.username.keyup(changeText);
  allElement.forgetResult.addClass('hide');

  allElement.form.submit(function () {
      if (!canSendEmail()) {
        return false;
      }
      showSendEmail(false);

      var username = allElement.username.val();

      if (!username || !username.testMail()) {
        showError(true, '邮箱不合法');
        showSendEmail(false);
        return false;
      }

      sendEmail(username, function (isSuccess, err) {
        if (isSuccess) {
          if (err) {
            var errorText = '';
            switch (err.type) {
              case 'account_not_exist':
                errorText = '账户不存在';
                break;
              case 'account_not_activate':
                errorText = '账户未激活';
                break;
              case 'email_failed':
                errorText = '发送失败，请重试';
                break;
              case 'internal_system_error':
                errorText = '系统错误，请重试';
                break;
              default:
                errorText = '系统错误，请重试';
                break;
            }
            showError(true, errorText);
            showSendEmail(false);
          }
          else {
            showResultPage();
            allElement.resultUsername.text(username);
          }
        }
        else {
          showError(true, '系统错误，注册失败');
          showSendEmail(false);
        }
      });

      return false;
    });

  function sendEmail(username, callback) {
    $.ajax({
      data: {username: username},
      type: 'get',
      url: '/user/resetpasswordrequest',
      dataType: 'json'
    }).done(function (result) {
      callback(true, result.err);
    }).fail(function () {
      callback(false);
    });
  }

  allElement.sendAgain.click(function () {
    sendEmail(allElement.username.val(), function (isSuccess, err) {
      if (isSuccess) {
        if (err) {
          var errorText = '';
          switch (err.type) {
            case 'account_not_exist':
              errorText = '账户不存在';
              break;
            case 'account_not_activate':
              errorText = '账户未激活';
              break;
            case 'email_failed':
              errorText = '发送失败，请重试';
              break;
            case 'internal_system_error':
              errorText = '系统错误，请重试';
              break;
            default:
              errorText = '系统错误，请重试';
              break;
          }
          alert(errorText);
        }
        else {
          alert('邮件发送成功，请注意查收!');
        }
      }
      else {
        alert('邮件发送失败');
      }
    });
  });

  function showInputPage() {
    if (allElement.forgetContainer.hasClass('hide')) {
      allElement.forgetContainer.removeClass('hide');
    }
    if (!allElement.forgetResult.hasClass('hide')) {
      allElement.forgetResult.addClass('hide');
    }
  }

  function showResultPage() {
    if (!allElement.forgetContainer.hasClass('hide')) {
      allElement.forgetContainer.addClass('hide');
    }
    if (allElement.forgetResult.hasClass('hide')) {
      allElement.forgetResult.removeClass('hide');
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

  function hasUsername() {
    var username = allElement.username.val();
    if (!username || !username.length) {
      return false;
    }
    else {
      return true;
    }
  }

  function showSendEmail(isShow) {
    if (isShow) {
      if (!allElement.sendEmail.hasClass('able')) {
        allElement.sendEmail.addClass('able');
      }
    }
    else {
      allElement.sendEmail.removeClass('able');
    }
  }

  function canSendEmail() {
    if (allElement.sendEmail.hasClass('able')) {
      return true;
    }
    else {
      return false;
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
    if (hasUsername()) {
      showSendEmail(true);
    }
    else {
      showSendEmail(false);
    }

  }


}