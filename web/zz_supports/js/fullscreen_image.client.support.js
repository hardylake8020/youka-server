/**
 * Created by Wayne on 15/10/8.
 */

function ImageFullScreen(imgElements, imgContainer) {
  var body = $('body,html');
  var photoItem = imgElements;
  var imageContainer = imgContainer;
  var image = imgContainer.find('.zz-image');
  var windowWidth = $(window).width();

  imageContainer.width(windowWidth).height($(window).outerHeight());
  var img;

  function showImageContainer(url) {
    document.addEventListener('touchmove',preventScroll);
    imageContainer.height( $(window).outerHeight(true));
    document.body.style.overflow = 'hidden';

    img = new Image();
    img.onload = function () {
      var w = img.width;
      var h = img.height;

      imageContainer.css('top', $(window).scrollTop());
      if (w / h < windowWidth / $(window).outerHeight(true)) {
        image.css({height: '100%'});
      }
      else {
        image.css({width: '100%','margin-top': ($(window).outerHeight(true) - (h * windowWidth) / w) / 2});
      }
      imageContainer.show();
    };
    img.onerror = function () {
      hideImageContainer();
    };

    image.attr('src', url);
    img.src = image.attr('src');
  }

  function hideImageContainer() {
    document.body.style.overflow = 'auto';
    document.removeEventListener('touchmove',preventScroll);

    imageContainer.hide();
  }

  function preventScroll(event){
    event.preventDefault();
  }

  imageContainer.click(function () {
    hideImageContainer();
  });

  photoItem.click(function () {
    showImageContainer($(this).attr('src'));
  });
}