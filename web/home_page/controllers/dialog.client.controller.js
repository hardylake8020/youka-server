function ZZDialog() {
  var bodyElement = $('body').append(
      '<div class="zz-dialog dialog-hidden">' +
        '<div class="wrap">' +
          '<p class="dialog-header"></p>' +
           '<p class="dialog-container"></p>' +

          '<div class="dialog-footer">' +
            '<div class="dialog-button"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
  );

  var allElement = {
    dialogContainer: bodyElement.find('.zz-dialog'),
    dialogHeader: bodyElement.find('.zz-dialog .wrap .dialog-header'),
    dialogText: bodyElement.find('.zz-dialog .wrap .dialog-container'),
    dialogButton: bodyElement.find('.zz-dialog .wrap .dialog-footer .dialog-button')
  }

  allElement.dialogButton.click(function () {
    hide();
    return false;
  });

  this.init = function (title, text, buttonText) {
    allElement.dialogHeader.text(title);
    allElement.dialogText.text(text);
    allElement.dialogButton.text(buttonText);

  };

  this.show = function () {
    if (allElement.dialogContainer.hasClass('dialog-hidden')) {
      allElement.dialogContainer.removeClass('dialog-hidden');
    }

    document.addEventListener('touchmove', preventScroll);
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    if (!allElement.dialogContainer.hasClass('dialog-hidden')) {
      allElement.dialogContainer.addClass('dialog-hidden');
    }
    document.body.style.overflow = 'auto';
    document.removeEventListener('touchmove', preventScroll);
  }

  function preventScroll(event) {
    event.preventDefault();
  }
}