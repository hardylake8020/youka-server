/**
 * Created by Wayne on 16/1/30.
 */

function ZZAlert() {
  var self = this;
  this.element = $('\
    <div class="zz-alert-layer">\
      <div class="box">\
        <div class="header">\
          <p class="text">消息</p>\
        </div>\
        <div class="body-content">\
          <p class="text"></p>\
        </div>\
        <div class="footer">\
          <p class="text">好的</p>\
        </div>\
      </div>\
    </div>\
  ');

  var clickHandle;

  this.element.find('.footer').click(function () {
    self.element.fadeOut(500, function () {
      if (clickHandle) {
        clickHandle();
      }
    });
  });
  this.show = function (message, callback) {
    self.element.find('.body-content .text').text(message);
    clickHandle = callback;
    self.element.show();
    return;
  };
}