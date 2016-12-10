/**
 * Created by Wayne on 15/11/3.
 */
'use strict';


var async = require('async'),
  orderError = require('../errors/order'),
  driverError = require('../errors/driver'),
  driverEvaluationError = require('../errors/driver_evaluation'),
  appDb = require('../../libraries/mongoose').appDb,
  DriverEvaluation = appDb.model('DriverEvaluation'),
  Order = appDb.model('Order'),
  Driver = appDb.model('Driver'),
  OrderReject = appDb.model('OrderReject');

var orderService = require('./order'),
  driverService = require('./driver');


function getByOrderIdAndDriverId(orderId, driverId, companyId, callback) {
  DriverEvaluation.findOne({order_id: orderId, driver_id: driverId, company_id: companyId}, function (err, evaluation) {
    if (err) {
      return callback({err: driverEvaluationError.internal_system_error});
    }
    return callback(null, evaluation);
  });
}
function getBySalesman(orderId, driverId, salesmanId, callback) {
  DriverEvaluation.findOne({order_id: orderId, driver_id: driverId, 'user._id': salesmanId}, function (err, evaluation) {
    if (err) {
      return callback({err: driverEvaluationError.internal_system_error});
    }
    return callback(null, evaluation);
  });
}


function getById(evaluationId, callback) {
  DriverEvaluation.findOne({_id: evaluationId}, function (err, evaluation) {
    if (err) {
      return callback({err: driverEvaluationError.internal_system_error});
    }
    return callback(null, evaluation);
  });
}

function getForSystem(orderId, driverId, callback) {
  DriverEvaluation.findOne({order_id: orderId, driver_id: driverId, is_system: true, delete_status: false}, function (err, evaluation) {
    if (err) {
      return callback({err: driverEvaluationError.internal_system_error});
    }
    return callback(null, evaluation);
  });
}

function deleteSystemEvaluation(orderId, driverId, callback) {
  getForSystem(orderId, driverId, function (err, evaluation) {
    if (err) {
      return callback(err);
    }

    if (!evaluation) {
      return callback(null);
    }

    evaluation.delete_status = true;
    evaluation.save(function (err, saveEvaluation) {
      if (err || !saveEvaluation) {
        return callback({err: driverEvaluationError.internal_system_error});
      }

      return callback(null);
    });
  });
}

exports.create = function (orderId, driverId, currentUser, isSystem, level, content, callback) {
  getByOrderIdAndDriverId(orderId, driverId, currentUser.company._id, function (err, evaluation) {
    if (err) {
      return callback(err);
    }

    if (evaluation) {
      return callback({err: driverEvaluationError.evaluation_has_exist});
    }

    async.auto({
      findDriverOrder: function (autoCallback) {
        orderService.getOrderByOrderIdAndDriverId(orderId, driverId, function (err, order) {
          if (err) {
            return autoCallback(err);
          }
          if (!order) {
            return autoCallback({err: orderError.order_not_exist});
          }
          if (order.status !== 'completed') {
            return autoCallback({err: {type: 'order_is_not_completed'}});
          }
          return autoCallback(null, order);
        });
      },
      createEvaluation: ['findDriverOrder', function (autoCallback, result) {
        if (!result.findDriverOrder) {
          return autoCallback({err: orderError.order_not_exist});
        }
        evaluation = new DriverEvaluation({
          driver_id: driverId,
          order_id: orderId,
          company_id: currentUser.company._id,
          order: result.findDriverOrder.toJSON(),
          driver: result.findDriverOrder.execute_driver.toJSON(),
          user: currentUser.toJSON(),
          is_system: isSystem,
          level: level
        });
        if (content) {
          evaluation.content_text = content;
        }

        evaluation.save(function (err, saveEvaluation) {
          if (err || !saveEvaluation) {
            return autoCallback({err: driverEvaluationError.internal_system_error});
          }

          result.findDriverOrder.driver_evaluations.push({
            _id: saveEvaluation._id,
            company_id: saveEvaluation.company_id,
            level: saveEvaluation.level,
            content_text: saveEvaluation.content_text
          });
          result.findDriverOrder.save(function (err, saveOrder) {
            if (err || !saveOrder) {
              return autoCallback({err: driverEvaluationError.internal_system_error});
            }

            return autoCallback(null, saveEvaluation);
          });

        });
      }]
    }, function (err, result) {
      if (err) {
        return callback(err);
      }

      //创建成功后，删除系统评论
      deleteSystemEvaluation(orderId, driverId, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, result.createEvaluation);
      });
    });
  });
};

exports.update = function (evaluationId, isSystem, level, content, callback) {
  getById(evaluationId, function (err, evaluation) {
    if (err) {
      return callback(err);
    }
    if (!evaluation) {
      return callback({err: driverEvaluationError.evaluation_not_exist});
    }

    evaluation.is_system = isSystem;
    evaluation.level = level;
    evaluation.content_text = content;

    evaluation.save(function (err, saveEvaluation) {
      if (err || !saveEvaluation) {
        return callback({err: driverEvaluationError.internal_system_error});
      }

      Order.findOne({_id: saveEvaluation.order_id}, function (err, findOrder) {
        if (err) {
          return callback({err: orderError.internal_system_error});
        }
        var driverEvaluations = findOrder.driver_evaluations;
        findOrder.driver_evaluations = [];
        for (var i = 0; i < driverEvaluations.length; i++) {
          if (driverEvaluations[i]._id.toString() === saveEvaluation._id.toString()) {
            driverEvaluations[i].level = saveEvaluation.level;
            driverEvaluations[i].content_text = saveEvaluation.content_text;
            break;
          }
        }
        findOrder.driver_evaluations = driverEvaluations;

        findOrder.save(function (err, saveOrder) {
          if (err || !saveOrder) {
            return callback({err: driverEvaluationError.internal_system_error});
          }

          return callback(null, saveEvaluation);
        });

      });
    });
  });
};

//不包含driver, order信息
exports.getSimpleList = function (driverId, fromTime, level, limit, callback) {
  var searchCondition = {
    created: {$lt: fromTime},
    driver_id: driverId,
    delete_status: false
  };
  if (level) {
    searchCondition.level = level;
  }

  DriverEvaluation.find(searchCondition)
    .select('order.order_details.order_number user.company.name level content_text create_time_format update_time_format created updated')
    .sort({created: -1})
    .limit(limit)
    .exec(function (err, evaluationList) {
      if (err) {
        return callback({err: driverEvaluationError.internal_system_error});
      }

      return callback(null, evaluationList);
    });
};

exports.getByOrderIdAndDriverId = function (orderId, driverId, companyId, callback) {
  return getByOrderIdAndDriverId(orderId, driverId, companyId, callback);
};

//包含运单总数，好评数，中评数，差评数
exports.getAllCountByDriverId = function (driverId, callback) {

  async.auto({
    findRejectCount: function(autoCallback){
      OrderReject.count({
        driver : driverId
      }).exec(function(err, count){
        if(err){
          return autoCallback({err: orderError.internal_system_error});
        }
        return autoCallback(null, count);
      });
    },
    findOrderCount: function (autoCallback) {
      Order.count({
        execute_driver: driverId,
        status: 'completed',
        $or: [{delete_status: {$exists: false}}, {delete_status: false}] })
        .exec(function (err, count) {
          if (err) {
            return autoCallback({err: orderError.internal_system_error});
          }
          return autoCallback(null, count);
        });
    },
    findEvaluationCount: function (autoCallback) {
      DriverEvaluation.aggregate([
        {
          $match: {
            driver_id: driverId,
            delete_status: false
          }
        },
        {
          $project: {
            level: '$level'
          }
        },
        {
          $group: {
            _id: {
              level: '$level'
            },
            count: {$sum: 1}
          }
        }
      ]).exec(function (err, result) {
        if (err) {
          return autoCallback({err: driverEvaluationError.internal_system_error});
        }
        var evaluationCount = {
          good: 0,
          general: 0,
          bad: 0
        };
        var good = result.filter(function(item) {return item._id.level === 1;});
        if (good.length > 0) {
          evaluationCount.good = good[0].count;
        }
        var general = result.filter(function(item) {return item._id.level === 2;});
        if (general.length > 0) {
          evaluationCount.general = general[0].count;
        }
        var bad = result.filter(function(item) {return item._id.level === 3;});
        if (bad.length > 0) {
          evaluationCount.bad = bad[0].count;
        }


        return autoCallback(null, evaluationCount);
      });
    }
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, {orderCount: result.findOrderCount, evaluationCount: result.findEvaluationCount, rejectCount : result.findRejectCount});
  });
};

exports.systemCreate = function (orderId, driverId, callback) {
  getForSystem(orderId, driverId, function (err, evaluation) {
    if (err) {
      return callback(err);
    }

    if (evaluation) {
      return callback({err: driverEvaluationError.evaluation_has_exist});
    }

    async.auto({
      findDriverOrder: function (autoCallback) {
        orderService.getOrderByOrderIdAndDriverId(orderId, driverId, function (err, order) {
          if (err) {
            return autoCallback(err);
          }
          if (!order) {
            return autoCallback({err: orderError.order_not_exist});
          }
          if (order.status !== 'completed') {
            return autoCallback({err: {type: 'order_is_not_completed'}});
          }
          return autoCallback(null, order);
        });
      },
      createEvaluation: ['findDriverOrder', function (autoCallback, result) {
        if (!result.findDriverOrder) {
          return autoCallback({err: orderError.order_not_exist});
        }
        evaluation = new DriverEvaluation({
          driver_id: driverId,
          order_id: orderId,
          order: result.findDriverOrder.toJSON(),
          driver: result.findDriverOrder.execute_driver.toJSON(),
          is_system: true
        });

        evaluation.save(function (err, saveEvaluation) {
          if (err || !saveEvaluation) {
            return autoCallback({err: driverEvaluationError.internal_system_error});
          }
          return autoCallback(null, saveEvaluation);
        });
      }]
    }, function (err, result) {
      if (err) {
        return callback(err);
      }
      return callback(null, result.createEvaluation);
    });
  });
};

//不包含driver, order信息
exports.findDriverEvaluations = function (driverId, currentPage, limit, callback) {
  if(!driverId){
    return callback('driverId is required', null);
  }
  var searchCondition = {
    driver_id: driverId,
    delete_status: false
  };

  DriverEvaluation.count(searchCondition, function(err, total){
    if(err){
      return callback(err);
    }

    DriverEvaluation.find(searchCondition)
    .select('order.order_details.order_number user.company.name level content_text create_time_format update_time_format')
    .skip(limit * (currentPage-1))
    .limit(limit)
    .sort({created: -1})
    .exec(function (err, evaluationList) {
      if (err) {
        return callback({err: driverEvaluationError.internal_system_error});
      }
      return callback(null, evaluationList, total);
    });
  });
};

exports.createForSalesman = function (companyOrder, salesman, level, content, callback) {
  var driverId = companyOrder.delivery_events[companyOrder.delivery_events.length-1].driver.toString();
  var driver = companyOrder.execute_drivers.filter(function (item) {
    return item._id.toString() === driverId;
  })[0];

  if (!driver) {
    return callback({err: orderError.driver_not_exist});
  }

  getBySalesman(companyOrder._id, driverId, salesman._id, function (err, evaluation) {
    if (err) {
      return callback(err);
    }

    if (evaluation) {
      return callback(null, evaluation);
    }

    evaluation = new DriverEvaluation({
      driver_id: driverId,
      order_id: companyOrder._id,
      order: companyOrder,
      driver: driver,
      user: {_id: salesman._id, username: salesman.username},
      is_system: false,
      level: level
    });
    if (content) {
      evaluation.content_text = content;
    }

    evaluation.save(function (err, saveEvaluation) {
      if (err || !saveEvaluation) {
        return callback({err: driverEvaluationError.internal_system_error});
      }

      return callback(null, saveEvaluation);
    });

  });
};