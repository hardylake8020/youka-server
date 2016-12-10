/**
 * Created by louisha on 15/5/22.
 */
'use strict';

var async = require('async'),
  orderError = require('../errors/order'),
  companyError = require('../errors/company'),
  moment = require('moment'),
  mongoose = require('mongoose'),

  appDb = require('../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  Driver = appDb.model('Driver'),
  Company = appDb.model('Company');


//根据角色统计单量
function isRightRole(role) {
  if (!role || (role !== 'execute_company' && role !== 'execute_driver' && role !== 'sender_name' && role !== 'receiver_name')) {
    return false;
  }
  return true;
}
function getBasicCondition(startTime) {
  return {
    created: {$gte: startTime},
    status: 'completed',
    delete_status: false
  };
}
function getExecuteDriverQueryCondition(myCompany, driverId) {
  var query = {
    create_company: myCompany._id,
    type: 'driver'
  };
  if (driverId) {
    query.execute_driver = mongoose.Types.ObjectId(driverId);
  }

  return query;
}

function getMyRoleQueryCondition(myRole, myCompany) {
  var myRolesCondition = {
    execute_company: {
      $or: [
        //别人分给我的运单
        {
          create_company: {$ne: myCompany._id},
          execute_company: myCompany._id
        },
        //我自己创建并承运的运单
        {
          create_company: myCompany._id,
          execute_company: myCompany._id,
          'assigned_infos.type': 'driver'
        }
      ]
    },
    sender_name: {
      sender_name: myCompany.name,
      parent_order: {$exists: false}
    },
    receiver_name: {
      receiver_name: myCompany.name,
      parent_order: {$exists: false}
    }
  };

  return myRolesCondition[myRole];
}
function getViewRoleConditionWithCompanyName(viewRole, viewRoleName) {
  var returnValue;
  switch (viewRole) {
    case 'execute_company':
      returnValue = {execute_company: mongoose.Types.ObjectId(viewRoleName)};
      break;
    case 'sender_name':
      returnValue = {sender_name: viewRoleName};
      break;
    case 'receiver_name':
      returnValue = {receiver_name: viewRoleName};
      break;
    default:
      break;
  }

  return returnValue;
}
function getGroupConditionByViewRole(viewRole) {
  var groups = {
    execute_company: '$execute_company',
    execute_driver: '$execute_driver',
    sender_name: {'$ifNull': ['$sender_name', '']},
    receiver_name: {'$ifNull': ['$receiver_name', '']}
  };

  return groups[viewRole];
}


function getQueryCondition(myRole, viewRole, viewRoleName, startTime, company, callback) {
  if (!isRightRole(myRole) || !isRightRole(viewRole)) {
    return callback({err: orderError.params_invalid});
  }
  var matchCondition;

  if (viewRole === 'execute_driver') {
    matchCondition = {
      $and: [getBasicCondition(startTime), getExecuteDriverQueryCondition(company, viewRoleName)]
    };
  }
  else {
    matchCondition = {
      $and: [getBasicCondition(startTime), getMyRoleQueryCondition(myRole, company)]
    };
    if (viewRoleName) {
      var viewRoleCondition = getViewRoleConditionWithCompanyName(viewRole, viewRoleName);
      if (viewRoleCondition) {
        matchCondition.$and.push(viewRoleCondition);
      }
    }
  }

  return callback(null, matchCondition);
}


exports.sortByOrderCount = function (req, res, next) {
  var days = parseInt(req.query.days) || 7;
  var myRole = req.query.my_role || '';
  var viewRole = req.query.view_role || '';
  var viewRoleName = req.query.view_role_company_name || '';
  var startTime = new Date(new Date() - days * 24 * 60 * 60 * 1000);
  var curUser = req.user || {};
  var company = curUser.company || {};

  getQueryCondition(myRole, viewRole, viewRoleName, startTime, company, function (err, matchCondition) {

    if (err) {
      return res.send(err);
    }

    Order.aggregate(
      [
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: getGroupConditionByViewRole(viewRole),
            count: {$sum: 1}
          }
        },
        {
          $sort: {count: -1}
        }
      ]
    ).exec(function (err, result) {
        if (err) {
          return res.send(err);
        }
        console.log(result);

        if (viewRole !== 'execute_company' && viewRole !== 'execute_driver') {
          return res.send(result);
        }

        if (viewRole === 'execute_company') {
          async.each(result, function (item, asyncCallback) {
            Company.findOne({_id: item._id}, function (err, company) {
              if (err) {
                return asyncCallback({err: orderError.internal_system_error});
              }
              item.name = company.name;
              return asyncCallback();
            });
          }, function (err) {
            if (err) {
              return res.send(err);
            }
            return res.send(result);
          });
        }
        else {
          async.each(result, function (item, asyncCallback) {
            Driver.findOne({_id: item._id}, function (err, driver) {
              if (err) {
                return asyncCallback({err: orderError.internal_system_error});
              }
              item.name = driver.nickname ? driver.nickname : driver.username;
              return asyncCallback();
            });
          }, function (err) {
            if (err) {
              return res.send(err);
            }
            return res.send(result);
          });
        }

      });

  });
};

//根据角色统计货物完好率
exports.getOrderRate = function (req, res, next) {
  var days = parseInt(req.query.days) || 7;
  var myRole = req.query.my_role || '';
  var viewRole = req.query.view_role || '';
  var viewRoleName = req.query.view_role_company_name || '';
  var startTime = new Date(new Date() - days * 24 * 60 * 60 * 1000);
  var curUser = req.user || {};
  var company = curUser.company || {};

  getQueryCondition(myRole, viewRole, viewRoleName, startTime, company, function (err, matchCondition) {

    if (err) {
      return res.send(err);
    }

    var groupCondition = {
      _id: {'year': '$year', 'month': '$month', 'dayOfMonth': '$dayOfMonth'},
      is_damaged: {
        $sum: {
          $cond: [{
            $or: [
              {
                $eq: ['$damaged', true]
              },
              {
                $eq: ['$pickup_missing_packages', true]
              },
              {
                $eq: ['$missing_packages', true]
              },
              {
                $eq: ['$delivery_missing_packages', true]
              }
            ]
          }, 1, 0]
        }
      },
      is_pickup_defered: {
        $sum: {
          $cond: [{
            $or: [
              {
                $eq: ['$pickup_sign_deferred', true]
              }
            ]
          }, 1, 0]
        }
      },
      is_delivery_defered: {
        $sum: {
          $cond: [{
            $or: [
              {
                $eq: ['$delivery_sign_deferred', true]
              }
            ]
          }, 1, 0]
        }
      },
      is_pickup_address_difference: {
        $sum: {
          $cond: [{
            $or: [
              {
                $eq: ['$pickup_address_difference', true]
              }
            ]
          }, 1, 0]
        }
      },
      is_delivery_address_difference: {
        $sum: {
          $cond: [{
            $or: [
              {
                $eq: ['$delivery_address_difference', true]
              }
            ]
          }, 1, 0]
        }
      },
      count: {$sum: 1}
    };

    Order.aggregate([
      {
        $match: matchCondition
      },
      {
        $project: {
          execute_company: '$execute_company',
          sender_name: '$sender_name',
          receiver_name: '$receiver_name',
          created: '$created',
          damaged: '$damaged',
          dayOfWeek: {$dayOfWeek: '$created'},
          dayOfMonth: {$dayOfMonth: '$created'},
          dayOfYear: {$dayOfYear: '$created'},
          week: {$week: '$created'},
          month: {$month: '$created'},
          year: {$year: '$created'},
          pickup_deferred: {$ifNull: ['$pickup_sign_deferred', false]},
          delivery_deferred: {$ifNull: ['$delivery_sign_deferred', false]},
          missing_packages: {$ifNull: ['$missing_packages', false]},
          pickup_missing_packages: {$ifNull: ['$pickup_missing_packages', false]},
          delivery_missing_packages: {$ifNull: ['$delivery_missing_packages', false]},
          pickup_address_difference: {$ifNull: ['pickup_address_difference', false]},
          delivery_address_difference: {$ifNull: ['delivery_address_difference', false]}
        }
      },
      {
        $group: groupCondition
      },
      {
        $sort: {'_id': 1}
      }
    ]).exec(function (err, result) {
      if (err) {
        return res.send(err);
      }

      async.each(result, function (item, callback) {
        item.time = new Date(item._id.year, item._id.month - 1, item._id.dayOfMonth).format('yyyy-MM-dd');
        return callback();
      }, function (err) {
        return res.send(result);
      });
    });

  });

};