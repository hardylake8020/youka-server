/**
 * Created by louisha on 15/5/13.
 */
'use strict';

var path = require('path'),
    async = require('async'),
    appDb = require('../../libraries/mongoose').appDb,
    orderError = require('../errors/order'),
    TransportEvent = appDb.model('TransportEvent'),
    userError = require('../errors/user'),
    driverError = require('../errors/driver'),
    Driver = appDb.model('Driver'),
    companyError = require('../errors/company'),
    Company = appDb.model('Company'),
    Order = appDb.model('Order'),
    OrderDetail = appDb.model('OrderDetail'),
    userService = require('../services/user');


var transportEventService = require('../services/transport_event'),
    orderservice = require('../services/order');


exports.searchPhotos = function (req, res, next) {
    var user = req.user || {};
    var filter = JSON.parse(req.query.filter) || {};

    var orderNo = filter.orderNo || '';
    var custom = filter.custom || '';
    var isDamage = filter.isDamage || [];
    var driver = filter.driver || '';
    var carriers = filter.carriers || '';
    var startTime = filter.startTime || new Date('1970-1-1 00:00:00');
    var endTime = filter.endTime || new Date();

    var _damage = [];
    var driverOrders = [];
    var transportEvents = [];

    if (isDamage.length > 0) {
        _damage = isDamage;
    }
    else {
        _damage = [true, false];
    }

    userService.getGroups(user._id.toString(), function (err, userGroups) {
        if (err)
            return res.send({err: orderError.internal_system_error});

        if (!userGroups || userGroups.length === 0)
            return res.send({err: userError.not_in_any_group});
        var groupIds = [];
        userGroups.forEach(function (userGroup) {
            groupIds.push(userGroup.group._id);

        });

        Order.find({
            $or: [
                {
                    create_company: user.company._id,
                    execute_company: user.company._id,
                    $or: [{create_group: {$in: groupIds}}, {execute_group: {$in: groupIds}}]
                },
                {
                    execute_company: user.company._id,
                    create_company: {$ne: user.company._id},
                    $or: [{create_group: {$in: groupIds}}, {execute_group: {$in: groupIds}}]
                }
            ],
            customer_name: {$regex: custom, $options: 'i'},
            'order_details.order_number':{$regex: orderNo, $options: 'i'},
            damaged: {$in: _damage},
            status: {$nin: ['unAssigned', 'assigning']},
            $and: [{create_time: {$gte: startTime}},
                {create_time: {$lte: endTime}}]
        }).populate('order_detail  execute_company  execute_driver create_company')
            .exec(function (err, orders) {
                if (err) {
                    return res.send({err: orderError.internal_system_error});
                }
                if (!orders) {
                    return res.send({err: orderError.order_not_exist});
                }
                getEventResult(orders);
            });
    });

    function getEventResult(orders) {
        async.each(orders, function (order, callback) {
            queryChildOrders(order, callback, false);
        }, function (err) {
            if (err) {
                return res.send(err);
            }
            async.each(driverOrders, function (driverOrder, callback) {
                TransportEvent.find({order: driverOrder._id})
                    .exec(function (err, transportEventsResult) {
                        if (err || !transportEventsResult) {
                            return callback({err: orderError.internal_system_error});
                        }
                        transportEventsResult.forEach(function (tr) {
                            tr._doc.order_number = driverOrder.order_details.order_number;
                            tr._doc.customer_name = driverOrder.customer_name;
                            transportEvents.push(tr);
                        });
                        return callback();
                    });
            }, function (err) {
                if (err) {
                    return res.send(err);
                }
                return res.send(transportEvents);
            });
        });
    }

    function queryChildOrders(companyOrder, callback, isPass) {
        Order.find({parent_order: companyOrder._id})
            .populate('order_detail execute_company execute_driver create_company')
            .exec(function (err, childOrders) {
                if (err || !childOrders) {
                    callback({err: orderError.internal_system_error});
                }
                var _regx;
                async.each(childOrders, function (childOrder, childCallback) {
                    if (childOrder.execute_driver) {
                        if (childOrder.create_company._id.toString() === user.company._id.toString()) {
                            //需要判断是否是自己公司下的直接订单，承运商就是自己公司名字
                            if (carriers !== '') {
                                _regx = new RegExp(carriers, 'i');
                                if (_regx.test(childOrder.create_company.name)) {
                                    //司机名称模糊匹配
                                    isPass = true;
                                    if (checkByDriver(childOrder)) {
                                        driverOrders.push(childOrder);
                                    }
                                }
                            }
                            else {
                                if (checkByDriver(childOrder)) {
                                    driverOrders.push(childOrder);
                                }
                            }

                        }
                        else {
                            if (isPass) {
                                //如果是有分配到子公司的，承运商已经被过滤
                                if (checkByDriver(childOrder)) {
                                    driverOrders.push(childOrder);
                                }
                            }

                        }
                        childCallback();
                    }
                    else if (childOrder.execute_company) {
                        if (isPass) {
                            queryChildOrders(childOrder, childCallback, isPass);
                        }
                        else {
                            if (carriers !== '') {
                                _regx = new RegExp(carriers, 'i');
                                if (_regx.test(childOrder.execute_company.name)) {
                                    isPass = true;
                                }
                            }
                            else {
                                isPass = true;
                            }
                            queryChildOrders(childOrder, childCallback, isPass);
                        }
                    }
                    else {
                        childCallback();
                    }
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                });
            });
    }

    function checkByDriver(order) {
        var _regx = new RegExp(driver, 'i');
        if (_regx.test(order.execute_driver.nikename) || _regx.test(order.execute_driver.username)) {
            return true;
        }
        return false;
    }

};

/*
 var driverOrders = [];
 if (orderNo) {
 driverOrders = filterByOrderNo(driverOrders);
 }
 if (carriers) {
 driverOrders = filterByCarrier(driverOrders);
 }
 driverOrders = filterByDriver(orders);

 var transportEvents = [];
 async.each(driverOrders, function (driverOrder, callback) {
 TransportEvent.find({order: driverOrder._id})
 .exec(function (err, transportEventsResult) {
 if (err || !transportEventsResult) {
 return callback({err: orderError.internal_system_error});
 }
 transportEventsResult.forEach(function (tr) {
 tr._doc.order_number = driverOrder.order_detail.order_number;
 tr._doc.customer_name = driverOrder.customer_name;
 transportEvents.push(tr);
 });
 return callback();
 });
 }, function (err) {
 if (err) {
 return res.send(err);
 }
 return res.send(transportEvents);
 });
 function filterByDriver(orders) {
 var driverOrders = [];
 orders.forEach(function (order) {
 if (order.execute_driver) {
 var _regx = new RegExp(driver, 'i');
 if (_regx.test(order.execute_driver.nikename) || _regx.test(order.execute_driver.username)) {
 driverOrders.push(order);
 }
 }
 });
 return driverOrders;
 }

 function filterByOrderNo(orders) {
 var driverOrders = [];
 orders.forEach(function (order) {
 var _regx = new RegExp(orderNo, 'i');
 if (_regx.test(order.order_detail.order_number)) {
 driverOrders.push(order);
 }
 });
 return driverOrders;
 }

 function filterByCarrier(orders) {
 var driverOrders = [];
 orders.forEach(function (order) {
 var _regx = new RegExp(carriers, 'i');
 if (order.create_company && _regx.test(order.create_company.name)) {
 driverOrders.push(order);
 }
 });
 return driverOrders;

 }
 */