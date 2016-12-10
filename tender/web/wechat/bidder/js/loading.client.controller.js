/**
 * Created by Wayne on 16/1/30.
 */

function ZZLoading() {
  var self = this;

  this.element = $('\
    <div class="zz-loading-layer"> \
      <div class="zz-loading-info"> \
        <img src="/wechat/bidder/images/load.gif"/>\
      </div>\
    </div>');

  this.show = function () {
    self.element.show();
  };

  this.hide = function () {
    self.element.hide();
  };

};