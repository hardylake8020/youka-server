function initMenu() {
  var bodyElement = $('body');
  var menu = bodyElement.find('.navigation .user-operation .menu');
  var slidingMenu = new ZZSlidingMenu();

  menu.click('touchend', function () {
    slidingMenu.toggleMenu();
    return false;
  });

  bodyElement.click('touchend', function (event) {
    slidingMenu.hideMenu();
  });

  if (isIphone()) {
    menu.bind('touchend', function () {
      slidingMenu.toggleMenu();
      return false;
    });

    bodyElement.bind('touchend', function (event) {
      slidingMenu.hideMenu();
    });
  }
}