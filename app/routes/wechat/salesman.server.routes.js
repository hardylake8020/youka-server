'use strict';

var salesman = require('../../controllers/wechat/salesman'),
  userFilter = require('../../filters/user'),
  companyFilter = require('../../filters/company'),
  orderFilter = require('../../filters/order'),
  salesmanFilter = require('../../filters/salesman');

module.exports = function (app) {
  app.route('/salesman_homepage').get(salesman.homePage);
  app.route('/salesman_bind_page').get(salesman.bindPage);
  app.route('/salesman_entrance').get(salesman.entrance);
  app.route('/salesman_bind').post(salesman.bindWx);
  app.route('/salesman_unbind').post(salesmanFilter.requireSalesman,salesman.unbindWx);
  app.route('/salesman_verify_code').post(salesman.getVerifyCode);
  app.route('/salesman_order_detail').get(orderFilter.requireOrder, salesman.orderDetailPage);
  app.route('/salesman_order_map').get(orderFilter.requireOrder, salesman.orderMapPage);
  app.route('/salesman_order_delivery_confirm').get(orderFilter.requireOrder, salesman.orderDeliveryConfirmPage); //收货确认页面
  app.route('/salesman_order_search').get(salesman.orderSearchPage);
  app.route('/salesman_order_list').get(salesman.orderListPage);
  app.route('/salesman_receiver_name').post(salesmanFilter.requireSalesman,salesman.getReceiverNames);

  app.route('/salesman/order/list').post(salesmanFilter.requireSalesman, salesman.getSalesmanOrderList);
  app.route('/salesman/driver/traces').post(orderFilter.requireOrder, salesman.driverTraces);
  app.route('/salesman/create').post(userFilter.requireUser, salesman.create);
  app.route('/salesman/batchcreate').post(userFilter.requireUser, salesman.batchCreate);
  app.route('/salesman/update').post(userFilter.requireUser, salesman.update);
  app.route('/salesman/list/all/detail').get(userFilter.requireUser, salesman.getListByCompanyIdWithDetail); //获取与公司相关的关注人的详情信息
  app.route('/salesman/list/all/basic').get(userFilter.requireUser, salesman.getCompanySalesmanOnly); //只获取与公司相关的关注人username
  app.route('/salesman_company/remove/id').get(userFilter.requireUser, salesman.removeSalesmanCompanyById);
  app.route('/salesman_company/remove/username').get(userFilter.requireUser, salesman.removeSalesmanCompanyByUsername);

  app.route('/salesman/export').get(userFilter.requireUser, salesman.exportListByCompanyIdWithDetail);

  app.route('/tender_entrance').get( salesman.redirectToTenderServer);


  app.route('/salesman/order/evaluation').post(salesmanFilter.requireSalesman, orderFilter.requireOrder, salesman.evaluationOrder);

};
