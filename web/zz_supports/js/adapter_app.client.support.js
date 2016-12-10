/*
* 适配各类型手机的界面
* 默认设计界面的宽度为720
* 修改屏幕的缩放大小来调整页面显示
* Author: Wayne
* Create: 2015-06-09 Tuesday
*/

(function(){
  var phoneWidth = parseInt(window.screen.width);
  var phoneScale = phoneWidth / 720;
  document.write('<meta name="viewport" content="width=720, minimum-scale = ' + phoneScale + ', maximum-scale = ' + phoneScale + ', target-densitydpi=device-dpi">');
})();

