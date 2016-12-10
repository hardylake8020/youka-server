/**
 * Created by Wayne on 15/8/5.
 */

'use strict';
var path = require('path'),
  async = require('async'),
  superagent = require('superagent').agent(),
  mongoose = require('mongoose'),
  appDb = require('../../../../libraries/mongoose').appDb,
  User = appDb.model('User'),
  Order = appDb.model('Order'),
  Company = appDb.model('Company'),
  Driver = appDb.model('Driver'),
  orderError = require('../../../errors/order'),
  driverError = require('../../../errors/driver'),
  config = require('../../../../config/config');

var orderService = require('../../../services/order'),
  traceService = require('../../../services/trace');

exports.getReceiverListPage = function (req, res, next) {
  var cookies = {};

  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(function (cookie) {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = ( parts[1] || '' ).trim();
    });
  }

  console.log(cookies);
  if (cookies.openid) {
    return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_list_receiver.client.view.html'), {openid: cookies.openid});
  }

  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.wx_appid + '&secret=' + config.wx_secret + '&code=' + req.query.code + '&grant_type=authorization_code';
  superagent.get(url)
    .end(function (err, result) {
      result = JSON.parse(result.text) || '{}';
      console.log(result);
      if (result.openid) {
        res.setHeader('Set-Cookie', ['openid=' + result.openid]);
      }
      return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_list_receiver.client.view.html'), {openid: result.openid});
    });
};

exports.getSenderListPage = function (req, res, next) {
  var cookies = {};

  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(function (cookie) {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = ( parts[1] || '' ).trim();
    });
  }

  if (cookies.openid) {
    return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_list_sender.client.view.html'), {openid: cookies.openid});
  }
  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.wx_appid + '&secret=' + config.wx_secret + '&code=' + req.query.code + '&grant_type=authorization_code';
  superagent.get(url)
    .end(function (err, result) {
      result = JSON.parse(result.text) || '{}';
      if (result.openid) {
        res.setHeader('Set-Cookie', ['openid=' + result.openid]);
      }
      return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_list_sender.client.view.html'), {openid: result.openid});
    });
};

function checkDriverInEvents(driverId, events, callback) {
  if (!driverId || !events || events.length <= 0) {
    return callback(false);
  }

  async.each(events, function (event, eventCallback) {
    if (!event.driver) {
      return eventCallback();
    }

    if (event.driver.toString() === driverId.toString()) {
      return eventCallback(orderError.has_found_driver);
    }
    else {
      return eventCallback();
    }
  }, function (err) {
    if (err && err.type === orderError.has_found_driver.type.toString()) {
      return callback(true);
    }
    else {
      return callback(false);
    }
  });

}

/*
 * 对于每一张运单，找出下级在运的司机.
 * 司机已提货，但未交货.
 * */
function findOnWayDriver(orderItem, callback) {
  var driverItem = null;

  if (orderItem.execute_drivers.length > 0) {
    async.each(orderItem.execute_drivers, function (eachDriver, driverCallback) {
      var driverId = eachDriver._id;
      checkDriverInEvents(driverId, orderItem.pickup_events, function (isPickupExist) {
        if (isPickupExist) {
          checkDriverInEvents(driverId, orderItem.delivery_events, function (isDeliveryExist) {
            if (isDeliveryExist) {
              return driverCallback();
            }
            else {
              driverItem = eachDriver;
              return driverCallback(orderError.has_found_driver);
            }
          });
        }
        else {
          return driverCallback();
        }
      });

    }, function (err) {
      if (err && err.type === orderError.has_found_driver.type) {
        return callback(null, driverItem);
      }
      else {
        return callback(null, null);
      }
    });
  }
  else {
    return callback(null, null);
  }
}

exports.getSubmitPage = function (req, res, next) {
  var openid = req.query.openid || req.body.openid || '';
  var order_id = req.query.order_id || req.body.order_id || '';
  if (!order_id) {
    return res.send({err: {type: 'empty_order_id'}});
  }

  Order.findOne({_id: order_id}, function (err, order) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }
    if (!order) {
      return res.send({err: {type: 'invalid_order_id'}});
    }

    return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_submit.client.view.html'), {
      openid: openid,
      order: JSON.stringify(order)
    });
  });
};

exports.getOnWayPage = function (req, res, next) {
  var order_id = req.query.order_id || req.body.order_id || '';
  if (!order_id) {
    return res.send({err: {type: 'empty_order_id '}});
  }

  Order.findOne({_id: order_id}, function (err, order) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }
    if (!order) {
      return res.send({err: {type: 'invalid_order_id'}});
    }

    async.auto({
      onWayDriver: function (callback) {
        findOnWayDriver(order, function (err, driverItem) {
          if (err) {
            return callback({err: {type: 'find_driver_error'}});
          }
          if (!driverItem) {
            return callback(null, null);
          }
          Driver.findOne({_id: driverItem._id}, function (err, driver) {
            if (err) {
              return callback({err: orderError.internal_system_error});
            }
            if (!driver) {
              return callback(null, null);
            }
            return callback(null, driver);
          });
        });
      },
      traces: ['onWayDriver', function (callback, result) {
        if (!result.onWayDriver) {
          return callback(null, null);
        }
        orderService.getDriverChildrenOrders(order._id, function (err, driverOrders) {
          if (err) {
            return callback({err: orderError.internal_system_error});
          }
          if (!driverOrders) {
            return callback({err: {type: 'no_driver_orders'}});
          }

          traceService.getTracesByOrders(driverOrders).then(function (driverTraces) {
            return callback(null, driverTraces);
          }, function (err) {
            return callback(err);
          });
        });
      }]
    }, function (err, result) {
      if (err) {
        console.log(err);
      }

      return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_onway.client.view.html'), {
        order: JSON.stringify(order),
        driver: result.onWayDriver ? JSON.stringify(result.onWayDriver) : null,
        traces: result.traces ? JSON.stringify(result.traces) : null
      });

    });
  });

};

exports.getCompletedPage = function (req, res, next) {
  var order_id = req.query.order_id || req.body.order_id || '';
  if (!order_id) {
    return res.send({err: {type: 'empty_order_id '}});
  }

  Order.findOne({_id: order_id}, function (err, order) {
    if (err) {
      return res.send({err: {type: 'internal_system_error'}});
    }
    if (!order) {
      return res.send({err: {type: 'invalid_order_id'}});
    }

    async.auto({
      onWayDriver: function (callback) {
        if (order.execute_drivers && order.execute_drivers.length > 0) {
          Driver.findOne({_id: order.execute_drivers[0]._id}, function (err, driver) {
            if (err) {
              return callback({err: orderError.internal_system_error});
            }
            if (!driver) {
              return callback(null, null);
            }
            return callback(null, driver);
          });
        }
        else {
          return callback(null, null);
        }
      },
      traces: ['onWayDriver', function (callback, result) {
        if (!result.onWayDriver) {
          return callback(null, null);
        }
        orderService.getDriverChildrenOrders(order._id, function (err, driverOrders) {
          if (err) {
            return callback({err: orderError.internal_system_error});
          }
          if (!driverOrders) {
            return callback({err: {type: 'no_driver_orders'}});
          }

          traceService.getTracesByOrders(driverOrders).then(function (driverTraces) {
            return callback(null, driverTraces);
          }, function (err) {
            return callback(err);
          });
        });
      }]
    }, function (err, result) {
      if (err) {
        console.log(err);
      }

      return res.render(path.join(__dirname, '../../../../web/wechat/zz_receiver_sender/views/order_completed.client.view.html'), {
        order: JSON.stringify(order),
        driver: result.onWayDriver ? JSON.stringify(result.onWayDriver) : null,
        traces: result.traces ? JSON.stringify(result.traces) : null
      });

    });
  });

};

//target: 指定收货方还是发货方。
function findOrdersByOpenidAndStatus(openid, statuses, orderCount, fromCreateTime, target, callback) {
  if (!fromCreateTime) {
    fromCreateTime = new Date();
  }

  User.findOne({weichat_openid: openid}, function (err, user) {
    if (err) {
      return callback({err: {type: 'internal_system_error'}});
    }
    if (!user) {
      return callback({err: {type: 'invalid_openid'}});
    }

    var orderQuery = {
      $and: []
    };

    orderQuery.$and.push({status: {$in: statuses}});
    orderQuery.$and.push({execute_driver: {$exists: false}});
    orderQuery.$and.push({create_time: {$lt: fromCreateTime}});
    orderQuery.$and.push({$or: [{delete_status: {$exists: false}}, {delete_status: false}]});

    if (target === 'sender_company') {
      orderQuery.$and.push({'sender_company.company_id': user.company.toString()});
    }
    else {
      orderQuery.$and.push({'receiver_company.company_id': user.company.toString()});
    }

    Order.find(orderQuery)
      .limit(orderCount)
      .sort('-created')
      .exec(function (err, orders) {
        if (err || !orders) {
          return callback({err: {type: 'internal_system_error'}});
        }

        return callback(null, orders);
      });
  });
}

exports.getUnPickupOrderForReceiver = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'receiver_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

exports.getUnDeliveryOrderForReceiver = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['unDeliverySigned', 'unDeliveried'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'receiver_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

exports.getCompletedOrderForReceiver = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['completed'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'receiver_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

//发货方

exports.getUnPickupOrderForSender = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['unAssigned', 'assigning', 'unPickupSigned', 'unPickuped'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'sender_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

exports.getUnDeliveryOrderForSender = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['unDeliverySigned', 'unDeliveried'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'sender_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

exports.getCompletedOrderForSender = function (req, res, next) {
  var fromTime = req.body.from_time || req.query.from_time || '';
  fromTime = (fromTime !== '') ? new Date(fromTime) : new Date();

  var orderCount = req.body.order_count || req.query.order_count || 10;
  orderCount = parseInt(orderCount) || 10;

  var openid = req.query.openid || req.body.openid || '';

  if (!openid) {
    return res.send({err: {type: 'empty_openid'}});
  }

  var statusArray = ['completed'];
  findOrdersByOpenidAndStatus(openid, statusArray, orderCount, fromTime, 'sender_company', function (err, orders) {
    if (err) {
      return res.send(err);
    }
    return res.send(orders);
  });
};

