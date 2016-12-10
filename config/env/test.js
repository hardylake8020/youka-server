'use strict';

module.exports = {
  appDb: 'mongodb://localhost/zzqs-test',
  logDb: 'mongodb://localhost/zzqs-test-log',
  loggerLevel: 'warn',
  port: 3001,
  app: {
    title: 'zhuzhuqs - Test Environment'
  },
  app_version: '1003',
  app_download_android_url: 'app-release.apk',
  app_download_ios_url: 'app-release.ipa',
  app_download_ios_redirect_url: 'itms-services://?action=download-manifest&url=https://ios.parrowtech.com/zhuzhu/pro.plist',
  app_barcode_url: 'barcode_zhuzhu56.png',
  serverAddress: 'http://localhost:3001/',
  email: {
    from: '柱柱网络测试<admin@zhuzhu56.com>',
    auth: {
      user: 'admin@zhuzhu56.com',
      pass: 'Social2015'
    }
  },
  smsUrl: 'https://sandboxapp.cloopen.com:8883',
  smsAcc: 'aaf98f894bc4f9b9014bc595363100a5',
  smsTok: 'b3ed072a6b2948bd979744293e05461c',
  smsAppId: '8a48b5514bfc2b4a014bfc7defd400bd'
};
