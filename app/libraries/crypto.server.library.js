'use strict';

var crypto = require('crypto');

exports.toMd5 = function (str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

exports.toBase64 = function(str){
  return new Buffer(str).toString('base64');
};


function encrypt(str, secret) {
  var cipher, enc;
  cipher = crypto.createCipher('aes192', secret);
  enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
}

function decrypt(str, secret) {
  var dec, decipher;
  decipher = crypto.createDecipher('aes192', secret);
  dec = decipher.update(str, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

exports.encrypToken = function (token, secret) {
  return encrypt(JSON.stringify(token), secret);
};

exports.decrpToken = function (token, secret) {
  return JSON.parse( decrypt(token, secret));
};

exports.encryptString = function (strText, secret) {
  return encrypt(JSON.stringify(strText), secret);
};
exports.decryptString = function (strText, secret) {
  return JSON.parse(decrypt(strText, secret));
};

