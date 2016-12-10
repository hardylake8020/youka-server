'use strict';

var verifyCode = require('../controllers/verify_code');


module.exports = function (app) {
  app.route('/verify_code/wxBind').get(verifyCode.getWxBindCode);

};
