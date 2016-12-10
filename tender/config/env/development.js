/**
 * Created by Wayne on 15/10/8.
 */
'use strict';

module.exports = {
  appDb: 'mongodb://localhost/zzqs-dev',
  logDb: 'mongodb://localhost/zzqs-dev-log',
  loggerLevel: 'debug',
  app: {
    title: 'tender - Development Environment'
  },
  serverAddress: 'http://localhost:3006/',
  zzqsAddress:'http://localhost:3002/',
  port: process.env.PORT || 3006,
  depositAmount: 200,
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
