'use strict';

module.exports = {
  appDb: 'mongodb://localhost:27017/zzqs-dev',
  logDb: 'mongodb://localhost:27017/zzqs-pro-log',
  loggerLevel: 'info',
  app: {
    title: 'zhuzhuqs - Production Environment'
  },
  app_version: '1029',
  app_version_ios:'2009',
  app_kuaichuan_android_version:'1008',
  app_download_page_url: 'http://www.cvs001.com/home/download',
  app_kuaichuan_android_url:'https://www.cvs001.com/zhuzhuqs/shipxy/android/test',
  app_download_android_url: 'app-debug.apk',
  app_download_ios_url: 'app-debug.ipa',
  app_download_ios_redirect_url: 'itms-services://?action=download-manifest&url=https://www.cvs001.com/zhuzhuqs/ios/debug/plist',
  app_barcode_url: 'barcode_cvs001.png',
  port: process.env.PORT || 3002,
  serverAddress:'http://www.cvs001.com/',
  pushAddress:'http://push.cvs001.com/',
  tenderAddress:'http://tender.cvs001.com/',
  paymentAddress:'http://payment.cvs001.com/',
  email: {
    from: '柱柱网络测试<admin@zhuzhu56.com>',
    auth: {
      user: 'admin@zhuzhu56.com',
      pass: 'Social2015'
    }
  },
  smsUrl:'https://sandboxapp.cloopen.com:8883',
  smsAcc:'aaf98f894bc4f9b9014bc595363100a5',
  smsTok:'b3ed072a6b2948bd979744293e05461c',
  smsAppId:'8a48b5514bfc2b4a014bfc7defd400bd'
};
