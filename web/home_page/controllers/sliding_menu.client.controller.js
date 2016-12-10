function ZZSlidingMenu() {
  var bodyElement = $('body').append(
      '<div class="sliding-menu"> ' +
      '<a class="item index" href="/">首页</a>' +
      '<a class="item about" href="/home/about">关于柱柱</a>' +
      '<a class="item news" href="/home/news">柱柱资讯</a>' +
      '<a class="item tutorial" href="/home/tutorial">使用教程</a>' +
      '<a class="item contact" href="/home/contact">联系我们</a>' +
      '<a class="item download" href="/home/download">APP下载</a>' +
      '<a class="item signup" href="/signup">注册</a>' +
      '<a class="item login" href="/signin">登录</a>' +
      '</div>'
  );
  var allElement = {
    slider: bodyElement.find('.sliding-menu')
  };

  allElement.slider.bind('touchend', function (event) {
    event.stopPropagation();
  });

  bodyElement.css('position', 'relative');
  this.showMenu = function () {
    bodyElement.css('right', '40%');
    allElement.slider.addClass('show');
    return false;
  };

  this.hideMenu = function () {
    allElement.slider.removeClass('show');
    bodyElement.css('right', '0px');
    return false;
  };

  this.toggleMenu = function () {
    if (allElement.slider.hasClass('show')) {
      return this.hideMenu();
    }
    else {
      return this.showMenu();
    }
  };
}