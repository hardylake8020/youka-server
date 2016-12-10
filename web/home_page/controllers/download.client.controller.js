/**
 * Created by zhuzhu on 15/10/14.
 */


$(function () {

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {
      var downloadLink = bodyElement.find('.zz-home-header .link .download');
      downloadLink.addClass('current');
      new Download(bodyElement);
      var menu = new initMenu();
    });
  });

});

function Download(bodyElement) {
  var allElement = {
    iosDownloadButton: bodyElement.find('.body-content .description .title .download-button .download-ios')
  };


  var zzDialog = new ZZDialog();
  zzDialog.init('下载提示', 'ios版本请使用Safari浏览器下载', '确定');
  allElement.iosDownloadButton.click(function () {
    if (!isSafari() || isAndroid()) {
      zzDialog.show();
      return false;
    }

  });


}