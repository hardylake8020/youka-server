/**
 * Created by Wayne on 15/10/8.
 */
'use strict';

module.exports = {
  appDb: 'mongodb://localhost:27017/zzqs-dev',
  logDb: 'mongodb://localhost:27017/zzqs-pro-log',
  loggerLevel: 'info',
  app: {
    title: 'tender - Production Test Environment'
  },
  port: process.env.PORT || 3006,
  serverAddress:'http://tender.cvs001.com/',
  zzqsAddress:'http://www.cvs001.com/',
  depositAmount: 200,
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
