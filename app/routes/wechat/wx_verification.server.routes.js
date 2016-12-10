/**
 * Created by louisha on 15/6/5.
 */
'use strict';

var verification = require('../../controllers/wechat/wx_verification');

module.exports = function (app) {
    app.route('/wechat/createsign').post(verification.createSign);
    app.route('/wechat/checksignature').get(verification.checkSignature);
    //app.route('/wechat/refreshtoken').get(verification.refreshToken);
};