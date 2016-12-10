'use strict';

var cryptoLib = require('../libraries/crypto'),
   qiniu = require('../libraries/qiniu');

exports.uploadToken = function (req, res, next) {
  var token = new qiniu.rs.PutPolicy('zhuzhuqs').token();
  res.send({token: token});
};

exports.uploaWebToken = function (req, res, next) {
  var token = new qiniu.rs.PutPolicy('zhuzhuqs').token();
  res.send({uptoken: token});
};

exports.uploadAmrAudioToken = function (req, res, next) {
  var amrFilePath = req.body.mp3_key || req.query.mp3_key || '';
  var qiniuPath = 'zhuzhuqs:' + amrFilePath;
  qiniuPath = cryptoLib.toBase64(qiniuPath);

  var persistentOps = 'avthumb/mp3/ab/64k/ar/44100/acodec/libmp3lame|saveas/' + qiniuPath;

  var token = new qiniu.rs.PutPolicy('zhuzhuqs', //scope
                                      null,      //callbackUrl
                                      null,      //callbackBody
                                      null,      //returnUrl
                                      null,      //returnBody
                                      null,      //asyncOps
                                      null,      //endUser
                                      null,      //expires
                                      persistentOps, //persistentOps
                                      null      //persistentNotifyUrl
  ).token();

  res.send({token: token});
};
