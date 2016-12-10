/**
 * Created by zhuzhu on 15/10/14.
 */

$(function(){

  var bodyElement = $('body');

  var importModule = new Import(bodyElement);

  importModule.appendHeader(function () {
    importModule.appendFooter(function () {

      var contactLink = bodyElement.find('.zz-home-header .link .contact');
      contactLink.addClass('current');
      var menu = new initMenu();

    });
  });

});