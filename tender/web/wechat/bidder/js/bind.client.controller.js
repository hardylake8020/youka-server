/**
 * Created by zenghong on 15/12/3.
 */
$(function () {
  var tip = $('.tip');
  var verifyInput = $('.verify');
  var usernameInput = $('.username');
  var submitBtn = $('.submit');
  var openid = document.getElementById('error3').getAttribute('data-value');
  var access_token = document.getElementById('error4').getAttribute('data-value');
  var verify = new VerifyCode(showWarnning);
  $('.input-container').append(verify.element);

  //if (!access_token || !openid) {
  //  window.location = window.location;
  //}

  var curId = '';

  verifyInput.keydown(function () {
    hideWarnning('请输入验证码');
  });

  usernameInput.keydown(function () {
    hideWarnning('请输入您的手机号');
  });

  submitBtn.click(function () {
    submitBind();
  });


  function showWarnning(message) {
    return tip.addClass('warnning').text(message);
  }

  function hideWarnning(message) {
    return tip.removeClass('warnning').text(message);
  }

  function submitBind() {
    if (!usernameInput.val() || usernameInput.val().length !== 11) {
      return showWarnning('请输入正确的手机号');
    }

    if (!verifyInput.val()) {
      return showWarnning('请输入验证码');
    }

    if (!verify.getCodeId()) {
      return showWarnning('请输入正确的验证码');
    }

    $.ajax({
      url: '/wechat/bind',
      method: 'post',
      data: {
        openid: openid,
        access_token: access_token,
        code: verifyInput.val(),
        phone: usernameInput.val(),
        codeid: verify.getCodeId()
      },
      success: function (result) {
        if (!result.err) {
          window.location = window.location;
        }
        else {
          alert(result.err.zh_message);
        }
      },
      error: function (err) {
        alert('绑定失败');
      }
    });
  }

  function VerifyCode(showWarnning) {
    var self = this;
    var id = null;
    self.element = $('<div class="verify-btn">获取验证码</div>');
    self.element.click(function () {
      sendCode(usernameInput.val());
    });

    function setVerifyText(text) {
      self.element.text(text);
    }

    document.body.addEventListener('touchstart', function () { });

    var time = 60;
    var undo = false;

    function endTimeout() {
      undo = false;
      self.element.removeClass('zz-disable');
      time = 60;
      setVerifyText('获取验证码');
    }

    function startTimeout() {
      undo = true;
      setVerifyText((time--) + '秒后重新获取');
      setTimeout(function () {
        if (time >= 0) {
          startTimeout();
        }
        else {
          endTimeout();
        }

      }, 1000);
    }

    function sendCode(phone) {
      if (!phone || phone.length !== 11) {
       return showWarnning('请输入正确的手机号');
      }

      if (undo) {
        return;
      }

      self.element.addClass('zz-disable');
      startTimeout();
      $.ajax({
        url: '/verify_code/wxBind',
        method: 'get',
        data: {phone: phone},
        success: function (data) {
          if (data.err) {
            return alert('获取验证码出错');
          }
          return id = data._id;
        },
        error: function (err) {
          return alert('获取验证码出错');
        }
      });
    };

    self.getCodeId = function () {
      return id;
    }
  }
});

