/**
 * Created by zenghong on 16/3/14.
 */

var index = require('../../controllers/wechat/index'),
  orderFilter = require('../../../../libraries/filters/order'),
  bidderFilter = require('../../../../libraries/filters/bidder'),
  tenderFilter = require('../../../../libraries/filters/tender');

module.exports = function (app) {
  app.route('/wechat/bind').post(index.bind);
  app.route('/wechat/unbind').get(bidderFilter.requireById, index.unbind);

  app.route('/wechat/entrance').get(index.entrance);
  app.route('/wechat/quote').post(bidderFilter.requireById, bidderFilter.requireNormalDeposit, tenderFilter.requireById, index.quoteTender); //报价
  app.route('/wechat/tender_list').post(bidderFilter.requireById, index.getTenderList); //获取标书列表,不同条件
  app.route('/wechat/apply_driver').post(bidderFilter.requireById, bidderFilter.requireNormalDeposit, tenderFilter.requireById, index.applyDrivers); //指定司机
  app.route('/wechat/preview_tender').get(bidderFilter.requireById, index.previewTender); //记录查看标书
  app.route('/wechat/single_order_page').get(bidderFilter.requireById, index.getSingleOrderPage); //记录查看标书


  app.route('/wechat/order_list').post(bidderFilter.requireById, index.getOrderList); //获取标书列表,不同条件

  app.route('/wechat/order_map').get(orderFilter.requireOrder, index.getOrderMapPage);

  app.route('/wechat/single_tender_page').get(bidderFilter.requireById, index.getSingleTenderPage);

  app.route('/wechat/bidder_save_deposit').post(bidderFilter.requireById, bidderFilter.canSaveDeposit, index.saveDeposit);
  app.route('/wechat/bidder_extract_deposit').post(bidderFilter.requireById, bidderFilter.requireNormalDeposit, index.extractDeposit);
  app.route('/wechat/bidder_deposit_log_list').post(bidderFilter.requireById, index.getDepositLogList);

};