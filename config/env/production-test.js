'use strict';

module.exports = {
  appDb: 'mongodb://localhost/zzqs-dev',
  logDb: 'mongodb://localhost/zzqs-dev-log',
  loggerLevel: 'debug',
  app: {
    title: 'zhuzhuqs - Development Environment'
  },
  app_version: '1008',
  app_download_page_url: 'http://www.zhuzhu56.com/home/download',
  app_download_android_url: 'app-release.apk',
  app_download_ios_url: 'app-release.ipa',
  app_download_ios_redirect_url: 'itms-services://?action=download-manifest&url=https://www.cvs001.com/zhuzhuqs/ios/debug/plist',
  app_barcode_url: 'barcode_zhuzhu56.png',
  serverAddress: 'http://183.131.76.178:3002/',
  pushAddress:'http://localhost:3005/',
  tenderAddress:'http://www.zzuka.com.cn:3006/',
  paymentAddress:'http://localhost:3004/',
  port: process.env.PORT || 3002,
  email: {
    from: '柱柱网络测试<hardy@zhuzhuqs.com>',
    auth: {
      user: 'hardy@zhuzhuqs.com',
      pass: 'yujia123'
    }
  },
  smsUrl: 'https://sandboxapp.cloopen.com:8883',
  smsAcc: 'aaf98f894bc4f9b9014bc595363100a5',
  smsTok: 'b3ed072a6b2948bd979744293e05461c',
  smsAppId: '8a48b5514bfc2b4a014bfc7defd400bd'
};
