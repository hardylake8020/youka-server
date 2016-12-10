/**
 * Created by elinaguo on 15/1/9.
 */
var ivaWebInstance;
var ivaAppInstance;
var playerContainer;
var playerWebWrapper;
var playerAppWrapper;
var appVideoBtn;
var webVideoBtn;
$(function () {
  var indexScript = new Index({content: $('.content'), header: $('.header')});
  playerContainer = $('.player-container');
  playerWebWrapper = $('#player-web-wrapper');
  playerAppWrapper = $('#player-app-wrapper');
  appVideoBtn = $('.app-video');
  webVideoBtn = $('.web-video');

  webVideoBtn.click(function () {
    playerContainer.show();
    playerWebWrapper.show();
    playerAppWrapper.hide();

    ivaWebInstance = new Iva(
      'player-web-wrapper',//父容器id或者父容器DOM对象，给父容器设置宽高640px*480px以上可以获得最佳的浏览体验；如果宽高在640px*480px以下，Iva会以弹窗形式呈现
      {
        appkey: '4yGP0NQ1e',//必填，请在控制台查看应用标识
        video: 'http://v.youku.com/v_show/id_XMTI1OTkxMDgyMA==.html?from=s1.8-1-1.2',//必填，播放地址（http://www.tudou.com/programs/view/tM_vZCQy2uM/）或者资源地址（http://7xi4ig.com2.z0.glb.qiniucdn.com/shapuolang_ts.mp4）
        autoplay: true,
        title: '柱住签收web使用简介'//选填
      });
  });
  appVideoBtn.click(function () {
    playerContainer.show();
    playerAppWrapper.show();
    playerWebWrapper.hide();

    ivaAppInstance = new Iva(
      'player-app-wrapper',//父容器id或者父容器DOM对象，给父容器设置宽高640px*480px以上可以获得最佳的浏览体验；如果宽高在640px*480px以下，Iva会以弹窗形式呈现
      {
        appkey: '4yGP0NQ1e',//必填，请在控制台查看应用标识, 'NJdE21an'
        video: 'http://v.youku.com/v_show/id_XMTI3OTM1NTA2NA==.html?from=s1.8-1-1.2',//必填，播放地址（http://www.tudou.com/programs/view/tM_vZCQy2uM/）或者资源地址（http://7xi4ig.com2.z0.glb.qiniucdn.com/shapuolang_ts.mp4）
        autoplay: true,
        title: '柱住签收app使用简介'//选填
      });
  });

  playerWebWrapper.click(function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    else {
      window.event.cancelBubble = true;
    }
    //e.preventDefault();
  });

  playerAppWrapper.click(function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    else {
      window.event.cancelBubble = true;
    }
    //e.preventDefault();
  });

  playerContainer.click(function (event, abc) {
    if (ivaWebInstance) {
      ivaWebInstance.destroy();
    }
    if (ivaAppInstance) {
      ivaAppInstance.destroy();
    }

    playerContainer.hide();
    playerWebWrapper.hide();
    playerAppWrapper.hide();
  });
});


function Index(opt) {
  var Element =
  {
    Header: {
      Container: opt.header,
      Login: opt.header.find('.login a'),
      Register: opt.header.find('.register a'),
      Download: opt.header.find('.download a'),
      PopupCode: opt.header.find('.download .popup'),
      DownloadApp: opt.header.find('.download .popup .button'),
      QRCode: opt.header.find('.qr-code')
    },
    ViewPort: opt.content.find('.view-port'),
    PageNav: {
      Container: opt.content.find('.page-nav'),
      Prev: opt.content.find('.page-nav .prev'),
      Next: opt.content.find('.page-nav .next')
    },
    Pagination: opt.content.find('.pagination')
  };

  (function () {
    Element.Pagination.find('li').first().addClass('selected');
    Element.ViewPort.find('li').first().nextAll().hide();

    Element.Pagination.find('li').bind('click', function () {
      var newIndex = parseInt(Element.Pagination.find('li').index($(this)));
      var oldIndex = parseInt(Element.Pagination.find('li').index(Element.Pagination.find('li.selected')));

      if (newIndex == oldIndex) {
        return;
      }

      var oldView = Element.ViewPort.find('li:eq(' + oldIndex + ')');
      var newView = Element.ViewPort.find('li:eq(' + newIndex + ')');
      var marginSize = parseInt(oldView.width());

      if (newIndex > oldIndex) {
        SlideToRight(oldView, newView, marginSize);
      }
      else {
        SlideToLeft(oldView, newView, marginSize);
      }

      Element.Pagination.find('li').removeClass('selected');
      $(this).addClass('selected');
      ChangeSkin(newIndex);
    });

    Element.PageNav.Prev.bind('click', function () {
      var currentPage = Element.Pagination.find('li.selected');
      var newPage = currentPage.prev();
      if (newPage == undefined || newPage.length == 0) {
        newPage = Element.Pagination.find('li:nth-last-child(1)');
      }

      Element.Pagination.find('li').removeClass('selected');
      newPage.addClass('selected');

      var newIndex = parseInt(Element.Pagination.find('li').index(newPage));
      var oldIndex = newIndex + 1;
      if (oldIndex >= Element.Pagination.find('li').length) {
        oldIndex = 0;
      }

      var oldView = Element.ViewPort.find('li:eq(' + oldIndex + ')');
      var newView = Element.ViewPort.find('li:eq(' + newIndex + ')');
      var marginSize = parseInt(oldView.width());
      SlideToRight(oldView, newView, marginSize);

      ChangeSkin(newIndex);

    });

    Element.PageNav.Next.bind('click', function () {
      var currentPage = Element.Pagination.find('li.selected');
      var newPage = currentPage.next();
      if (newPage == undefined || newPage.length == 0) {
        newPage = Element.Pagination.find('li:nth-child(1)');
      }

      Element.Pagination.find('li').removeClass('selected');
      newPage.addClass('selected');

      var newIndex = parseInt(Element.Pagination.find('li').index(newPage));
      var oldIndex = newIndex - 1;
      if (oldIndex < 0) {
        oldIndex = parseInt(Element.Pagination.find('li').length) - 1;
      }

      var oldView = Element.ViewPort.find('li:eq(' + oldIndex + ')');
      var newView = Element.ViewPort.find('li:eq(' + newIndex + ')');
      var marginSize = parseInt(oldView.width());
      SlideToLeft(oldView, newView, marginSize);

      ChangeSkin(newIndex);

    });

    StartToClockwizeRotate(0, 2);
    StartToRotate(0, 1);

    Element.Header.Download.bind('click', function () {
      Element.Header.Download.parent().toggleClass('selected');
      return false;
    });
    Element.Header.PopupCode.bind('click', function () {
      return false;
    });

    Element.Header.DownloadApp.bind('click', function () {
      window.location.href = 'zzqs2/downloadApp';
      return false;
    });

    $(document).click(function () {
      Element.Header.Download.parent().removeClass('selected');
    });

    //bodyContainer 监听浏览器尺寸变化，并改变内容体高度
    $(window).resize(function () {
      var winHeight = $(window).height();
      var body = $('body');
      var setHeight = (winHeight - $("header").outerHeight() - 410 - 263);//中间滑布的区域高度：210px，图片展现区域最小尺度：410px
      $("[tag=page1] [auto-match]").stop(true);
      $("[tag=page1] [auto-match]").animate({'margin-top': 50}, 300);
      $("[tag=page2] [auto-match]").animate({'margin-top': 50}, 300);
      $("[tag=page3] [auto-match]").animate({'margin-top': 50}, 300);
      $("[tag=page4] [auto-match]").animate({'margin-top': 50}, 300);

    }).trigger("resize");

  })();

  // 不同页面的切换 开始
  function RotateByID(id, rotateValue) {
    if (document.getElementById(id) == null || document.getElementById(id) == undefined)
      return;

    document.getElementById(id).style.webkitTransform = "rotate(" + rotateValue + "deg)";
    document.getElementById(id).style.msTransform = "rotate(" + rotateValue + "deg)";
    document.getElementById(id).style.MozTransform = "rotate(" + rotateValue + "deg)";
    document.getElementById(id).style.OTransform = "rotate(" + rotateValue + "deg)";
    document.getElementById(id).style.transform = "rotate(" + rotateValue + "deg)";
  };

  function StartToClockwizeRotate(beginRotateValue, duration) {
    var endRotateValue = beginRotateValue + duration;
    RotateByID("dotted", endRotateValue);

    RotateByID("longDashed", endRotateValue);

    RotateByID("grayTape", endRotateValue);


    setTimeout(function () {
      StartToClockwizeRotate(endRotateValue, duration);
    }, 50);

  };

  function StartToRotate(beginRotateValue, duration) {
    var endRotateValue = beginRotateValue - duration;
    RotateByID("ruler", endRotateValue);
    RotateByID("solid", endRotateValue);
    RotateByID("dashed", endRotateValue);

    setTimeout(function () {
      StartToRotate(endRotateValue, duration);
    }, 50);
  };

  function SlideToRight(oldView, newView, marginSize) {
    oldView.stop();
    oldView.animate({"margin-left": (marginSize).toString() + "px"}, 200, function () {
      oldView.hide();
      oldView.css('margin-left', '0px');

      newView.css('margin-left', (marginSize * (-1)).toString() + "px");
      newView.show();
      newView.stop();
      newView.animate({"margin-left": "0px"}, 200, function () {
        newView.show();
      });
    });
  };

  function SlideToLeft(oldView, newView, marginSize) {
    oldView.stop();
    oldView.animate({"margin-left": (marginSize * (-1)).toString() + "px"}, 200, function () {
      oldView.hide();
      oldView.css('margin-left', '0px');

      newView.css('margin-left', marginSize.toString() + "px");
      newView.show();
      newView.stop();
      newView.animate({"margin-left": "0px"}, 200, function () {
        newView.show();
      });
    });
  }

  function ChangeSkin(viewIndex) {
    $('header img').fadeOut(50);

    Element.PageNav.Container.find('div.wrapper').fadeOut(50);
    $('body').removeClass();
    switch (parseInt(viewIndex)) {
      case 0:
      default :
      {
        $('body').addClass('skin-orange');
        $('header img:nth-child(1)').fadeIn(300);
        Element.PageNav.Container.find('div.wrapper:nth-child(1)').fadeIn(300);
        break;
      }
      case 1:
      {
        $('body').addClass('skin-green');
        $('header img:nth-child(2)').fadeIn(300);
        Element.PageNav.Container.find('div.wrapper:nth-child(2)').fadeIn(300);
        break;
      }
      case 2:
      {
        $('body').addClass('skin-blue');
        $('header img:nth-child(3)').fadeIn(300);
        Element.PageNav.Container.find('div.wrapper:nth-child(3)').fadeIn(300);
        break;
      }
      case 3:
      {
        $('body').addClass('skin-pink');
        $('header img:nth-child(4)').fadeIn(300);
        Element.PageNav.Container.find('div.wrapper:nth-child(4)').fadeIn(300);
        break;
      }
    }
  }

  // 不同页面的切换 结束
};

