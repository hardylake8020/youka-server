/**
 * Created by elinaguo on 15/3/24.
 */
'use strict';

/**
 * Module dependencies.
 */
var orders = require('../../app/controllers/order'),
  userFilter = require('../filters/user'),
  orderFilter = require('../filters/order'),
  groupFilter = require('../filters/group'),
  driverFilter = require('../filters/driver');

module.exports = function (app) {
  app.route('/order').post(userFilter.requireUser, orders.create);
  app.route('/order/assignedorder/update').post(userFilter.requireUser, orders.updateAssignedOrder); //更新已分配运单的基本信息
  app.route('/order/assignedorder/delete').post(userFilter.requireUser, orders.deleteAssignedOrder);
  app.route('/order/update').post(userFilter.requireUser, orders.update); //修改未分配的运单
  app.route('/order/delete').post(userFilter.requireUser, orders.delete);
  app.route('/order/batchdelete').post(userFilter.requireUser, orders.batchDelete);
  app.route('/order/batchcreate').post(userFilter.requireUser, groupFilter.requireUserGroup, orders.batchCreate);

  app.route('/order/batchassign').post(userFilter.requireUser, orders.asssignBatch); //批量分配
  app.route('/order/export').get(userFilter.requireUser, orders.exportOrders);
  app.route('/order').get(userFilter.requireUser, orders.getUserOrders);
  app.route('/order/all').post(userFilter.requireUser, orders.getUserAllOrders);
  app.route('/order/unassigned').post(userFilter.requireUser, orders.getUnassignedOrders);
  app.route('/order/getorderbyid').get(userFilter.requireUser, orders.getOrderById);
  app.route('/order/multiassign').post(userFilter.requireUser, orders.multiAssign); //第一次多段分配
  app.route('/order/continueassign').post(userFilter.requireUser, orders.continueAssign); //继续分配
  app.route('/order/detail').get(userFilter.requireUser, orders.getOrderDetailById);
  app.route('/order/assignedOrderDetail').get(userFilter.requireUser, orders.getOrderAssignedDetailById);
  app.route('/order/childrenOrders').get(userFilter.requireUser, orders.getChildrenOrdersById);
  app.route('/order/share').post(userFilter.requireUser, orders.shareOrders);
  app.route('/order/remainOrderCreateCount').get(userFilter.requireUser, orders.getRemainOrderCreateCount);
  app.route('/order/sharedorderlist').get(userFilter.requireUser, orders.sharedOrderList);
  app.route('/order/sharedorderassigninfo').get(userFilter.requireUser, orders.getOrderAssignedInfo);
  app.route('/order/update/assigninfo').post(userFilter.requireUser, orders.updateAssign); //更新已分配的运单（包括基本信息和分配对象）
  app.route('/order/abnormal').post(userFilter.requireUser, orders.getAbnormalOrders); //获取异常运单
  app.route('/order/abnormal/count').get(userFilter.requireUser, orders.getAbnormalOrdersCount); //获取异常运单数量
  app.route('/order/abnormal/handle').get(userFilter.requireUser, orders.handleAbnormalOrder);//处理异常运单

  app.route('/order/pickup_address/get').get(userFilter.requireUser, orders.getPickupAddressList);



  //获取要操作的运单数量: 待分配，在途
  app.route('/order/operation/count').get(userFilter.requireUser, orders.getOperationCount);

  //获取临时司机的运单
  app.route('/order/temporarydriver').get(driverFilter.requireTemporaryDriver, orders.getTemporaryDriverOrder);
  
  
  app.route('/order/verifyOrder').post(userFilter.requireUser, orderFilter.requireOrder, orders.verifyOrder);

  app.route('/resources/pdf_templates/pdf').get(orders.exportOrderToPdf);

  app.route('/resources/pdf_templates/page').get(orders.exportOrderToPdfPage);
  app.route('/resources/pdf_templates/page_header').get(orders.exportOrderToPdfPageHeader);
  app.route('/resources/pdf_templates/page_footer').get(orders.exportOrderToPdfPageFooter);


};
