/**
 * Created by louisha on 15/6/7.
 */
'use strict';

var wx = require('../../controllers/wechat/wechat_public');

module.exports = function (app) {
  app.route('/wechat_bind').get(wx.wechatBindPage);
  app.route('/wechat_bind').post(wx.wechatBind);
  app.route('/wechat_search_by_number_page').get(wx.orderSearchByNumberPage);
  app.route('/wechat_search_by_number').get(wx.orderSearchByNumber);

};
