/**
 * Created by Wayne on 15/7/24.
 */

'use strict';

var should = require('should'),
  superagent = require('superagent'),
  agent = superagent.agent(),
  config = require('../../../../config/config');

//创建单个订单
exports.createOrder = function (access_token, orderInfo, groupId, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      order: orderInfo,
      group_id: groupId,
      access_token: access_token
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.order_details.order_number.should.equal(orderInfo.order_number);
      }

      callback(err, res.body);
    });
};

//批量创建运单
exports.batchCreateOrder = function (access_token, infos, groupId, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order/batchcreate')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      infos: infos,
      group_id: groupId,
      access_token: access_token
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.success.should.equal(true);
        res.body.totalCount.should.equal(infos.length);
        res.body.successCount.should.equal(infos.length);
        res.body.errorArray.length.should.equal(0);
      }
      return callback(err, res.body);
    });
};

//第三方接口批量创建运单
exports.apiBatchCreateOrder = function (group_name, signature, order_infos, company_id, timestamp, callback) {
  agent.post(config.serverAddress + 'api/multiorder')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      group_name: group_name,
      signature: signature,
      order_infos: order_infos,
      company_id: company_id,
      timestamp: timestamp
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};

//第三方接口通过order_number获取运单详情
exports.apiGetOrderDetailData = function (group_name, signature, order_number, company_id, timestamp, callback) {
  agent.get(config.serverAddress + 'api/order/detail/number')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .query({
      group_name: group_name,
      signature: signature,
      order_number: order_number,
      company_id: company_id,
      timestamp: timestamp
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};

exports.apiAssignOrderToDriver = function(signature,order_number,company_id,timestamp,assign_infos,callback){
  agent.post(config.serverAddress + 'api/order/assign/driver')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      signature: signature,
      order_number: order_number,
      company_id: company_id,
      timestamp: timestamp,
      assign_infos:assign_infos
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};

exports.apiDeleteOrderAssign = function (signature, company_id, timestamp, order_number, assign_info_id, callback) {
  agent.post(config.serverAddress + 'api/order/assign/driver/delete')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      signature: signature,
      company_id: company_id,
      timestamp: timestamp,
      order_number: order_number,
      assign_info_id:assign_info_id
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};

exports.apiModifyOrderAssign = function (signature, company_id, timestamp, order_number, assign_info_id, assign_info_new, callback) {
  agent.post(config.serverAddress + 'api/order/assign/driver/modify')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      signature: signature,
      company_id: company_id,
      timestamp: timestamp,
      order_number: order_number,
      assign_info_id:assign_info_id,
      assign_info_new:assign_info_new
    })
    .end(function (err, res) {
      if (err)
        console.log(err);
      return callback(err, res.body);
    });
};

//第一次分配运单
exports.assignOrder = function (access_token, orderId, assignInfoList, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order/multiassign')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      assign_infos: assignInfoList
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.assignedOrderList.length.should.equal(assignInfoList.length);
        res.body.assignedInfos.length.should.equal(assignInfoList.length);
      }

      callback(err, res.body);
    });
};

//继续分配运单
exports.continueAssignOrder = function (access_token, orderId, assignInfoList, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order/continueassign')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      assign_infos: assignInfoList
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        var noAssignCount = 0;
        assignInfoList.forEach(function (assignItem) {
          if (!assignItem.is_assigned) {
            noAssignCount++;
          }
        });

        res.body.assignedOrderList.length.should.equal(noAssignCount);
        res.body.assignedInfos.length.should.equal(noAssignCount);
      }

      callback(err, res.body);
    });
};

//批量分配运单
exports.batchAssignOrder = function (access_token, assignInfo, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order/batchassign')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      assignInfo: assignInfo
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.success.should.equal(true);
      }

      callback(err, res.body);
    });
};

//修改未分配运单
exports.updateUnAssignedOrder = function (access_token, orderInfo, groupId, isSuccessCheck, callback) {
  agent.post(config.serverAddress + 'order/update')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order: orderInfo,
      group_id: groupId
    })
    .end(function (err, res) {
      if (isSuccessCheck) {
        res.body.order_details.order_number.should.equal(orderInfo.order_number);
      }

      callback(err, res.body);
    });
};

//修改已分配运单，但未提货
exports.updateAssignedOrder = function (access_token, orderId, newAssignInfoList, callback) {
  agent.post(config.serverAddress + 'order/update/assigninfo')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      order_id: orderId,
      assign_infos: newAssignInfoList
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

//运单的查看

//查看当前运输途中的司机的运单。 map_for_order_trace
exports.getOnWayDriverOrders = function (access_token, max_driver_number, callback) {
  agent.get(config.serverAddress + 'map/alldriverorders')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      showNumber: max_driver_number
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};

//查看所有运单
exports.getUserAllOrders = function (access_token, currentPage, limit, sortName, sortValue, searchArray, callback) {
  agent.post(config.serverAddress + 'order/all')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: access_token,
      currentPage: currentPage,
      limit: limit,
      sortName: sortName,
      sortValue: sortValue,
      searchArray: searchArray
    })
    .end(function (err, res) {
      callback(err, res.body);
    });
};