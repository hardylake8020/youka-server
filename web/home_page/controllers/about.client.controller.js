/**
 * Created by zhuzhu on 15/10/14.
 */


$(function(){

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      var aboutLink = bodyElement.find('.zz-home-header .link .about');
      aboutLink.addClass('current');
      var menu = new initMenu();

    });
  });

});