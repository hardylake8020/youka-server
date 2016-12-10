'use strict';

var index = require('../../app/controllers/index');

module.exports = function (app) {
  //app.route('/').get(index.index);
  //app.route('/mobiles').get(index.mobile);
  //app.route('/signin').get(index.signin);
  //app.route('/signout').get(index.signout);
  //app.route('/signup').get(index.signup);
  //app.route('/reset_password').get(index.resetPassword);
  //app.route('/forget_password').get(index.forgetPassword);
  //app.route('/activate').get(index.activate);
  //app.route('/activate_success').get(index.activateSuccess);
  //app.route('/activate_failed').get(index.activateFailed);
  //app.route('/zzqs/login').get(index.zzqsLogin);
  //app.route('/zzqs2/index').get(index.zzqsIndex);
  //app.route('/zzqs/index').get(index.zzqsIndex);
  //app.route('/browserUpgrade').get(index.browserUpgrade);
  //app.route('/zzqs2/downloadApp').get(index.downloadApp);
  //app.route('/zzqs2/toDownloadApp').get(index.toDownloadApp);
  //app.route('/zzqs2/appDownloadBarcode').get(index.getAppBarcode);
  //app.route('/aboutus').get(index.aboutUs);


  app.route('/').get(index.homePage);
  app.route('/mobiles').get(index.mobile);
  app.route('/signin').get(index.homeSignIn);
  //app.route('/signout').get(index.signout);
  app.route('/signup').get(index.homeSignUp);
  //app.route('/reset_password').get(index.resetPassword);
  //app.route('/forget_password').get(index.homeForget);
  //app.route('/activate').get(index.activate);
  //app.route('/activate_success').get(index.activateSuccess);
  //app.route('/activate_failed').get(index.activateFailed);
  app.route('/zzqs/login').get(index.zzqsLogin);
  app.route('/zzqs2/index').get(index.zzqsIndex);
  app.route('/zzqs/index').get(index.zzqsIndex);
  app.route('/browserUpgrade').get(index.browserUpgrade);
  app.route('/zzqs2/downloadApp').get(index.downloadApp);
  app.route('/zzqs2/toDownloadApp').get(index.toDownloadApp);
  app.route('/zzqs2/appDownloadBarcode').get(index.getAppBarcode);

  app.route('/reset_password').get(index.resetPassword);
  app.route('/home/about').get(index.homeAbout);
  app.route('/home/contact').get(index.homeContact);
  app.route('/home/news').get(index.homeNews);
  app.route('/home/download').get(index.homeDownload);
  app.route('/home/article').get(index.homeArticle);
  app.route('/home/forget').get(index.homeForget);
  app.route('/home/tutorial').get(index.homeTutorial);

  app.route('/home/introduction').get(index.homeIntroduction);


  app.route('/wechat/test').get(index.testWechat);


};
