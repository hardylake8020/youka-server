/**
 * Created by zhuzhu on 15/10/14.
 */


function Import(bodyElement) {

  this.appendHeader = function (callback) {
    $.get('../../home_page/views/header.client.view.html', function (headerContentElement) {
      bodyElement.find('.zz-home-header').append(headerContentElement);

      return callback();
    });
  };

  this.appendFooter = function (callback) {
    $.get('../../home_page/views/footer.client.view.html', function (footerContentElement) {
      bodyElement.find('.zz-home-footer').append(footerContentElement);

      return callback();
    });
  };

  this.appendDialog = function(callback){
    $.get('../../home_page/views/dialog.client.view.html',function(dialogContentElement){
      bodyElement.append(dialogContentElement);

      return callback();
    });
  };
}