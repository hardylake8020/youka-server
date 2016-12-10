/**
 * Created by Wayne on 15/10/26.
 */
'use strict';

var path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  fs = require('fs'),
  ejs = require('ejs'),
  mongoose = require('mongoose'),
  appDb = require('../../libraries/mongoose').appDb,
  Order = appDb.model('Order'),
  Insurance = appDb.model('Insurance'),
  InsurancePayment = appDb.model('InsurancePayment'),
  config = require('../../config/config'),
  emailLib = require('../libraries/email'),
  paymentLib = require('../libraries/payment'),
  groupService = require('../services/group'),
  insuranceError = require('../errors/insurance');

function getSearchCondition(searchArray) {
  var search = {};
  search.$and = [];
  if (searchArray || searchArray.length > 0) {
    searchArray.forEach(function (item) {
      switch(item.key) {
        case 'payment_status':
          if (item.value) {
            if (item.value === 'payed') {
              search.$and.push({'insurance.pay_status': 'payed'});
            }
            else {
              search.$and.push({'insurance.pay_status': {$ne: 'payed'}});
              search.$and.push({status: 'unAssigned'});
            }
          }
          break;
        case 'order_number':
          if (item.value) {
            search.$and.push({$or: [
              {
                'order_details.order_number': {$regex: item.value, $options: 'i'}
              },
              {
                'order_details.refer_order_number': {$regex: item.value, $options: 'i'}
              }
            ]});
          }
          break;
        case 'receiver_name':
          if (item.value) {
            search.$and.push({'receiver_name': {$regex: item.value, $options: 'i'}});
          }
          break;
        case 'sender_name':
          if (item.value) {
            search.$and.push({'sender_name': {$regex: item.value, $options: 'i'}});
          }
          break;
        case 'goods_name':
          if (item.value) {
            search.$and.push({'order_details.goods_name': {$regex: item.value, $options: 'i'}});
          }
          break;
        case 'description':
          if (item.value) {
            search.$and.push({'description': {$regex: item.value, $options: 'i'}});
          }
          break;
        case 'create_start_time':
          if (item.value) {
            search.$and.push({'created': {$gte: new Date(item.value)}});
          }
          break;
        case 'create_end_time':
          if (item.value) {
            search.$and.push({'created': {$lte: new Date(item.value)}});
          }
          break;
        case 'pickup_start_time':
          if (item.value) {
            search.$and.push({'pickup_start_time': {$gte: new Date(item.value)}});
          }
          break;
        case 'pickup_end_time':
          if (item.value) {
            search.$and.push({'pickup_end_time': {$lte: new Date(item.value)}});
          }
          break;
        case 'delivery_start_time':
          if (item.value) {
            search.$and.push({'delivery_start_time': {$gte: new Date(item.value)}});
          }
          break;
        case 'delivery_end_time':
          if (item.value) {
            search.$and.push({'delivery_end_time': {$lte: new Date(item.value)}});
          }
          break;
        default:
          break;
      }
    });
  }
  return search;
}
function getSortCondition(sortObject) {
  var sort;
  if (sortObject) {
    var sortValue;
    for (var name in sortObject) {
      sortValue = parseInt(sortObject[name]) || 1;
      switch(name) {
        case 'order_number':
          sort = {'order_details.order_number': sortValue};
          break;
        case 'sender_company':
          sort = {sender_name: sortValue};
          break;
        case 'goods_name':
          sort= {'order_details.goods_name': sortValue};
          break;
        default:
          break;
      }
    }
  }
  return sort;
}

function sendEmail(emailAddress, templateFileName, renderData, callback) {
  fs.readFile(templateFileName, 'utf8', function (err, str) {
    if (err) {
      console.log('fs.readFile(' + templateFileName + ') failed');
      return callback({err: insuranceError.internal_system_error});
    }

    var html = ejs.render(str, renderData);

    emailLib.sendEmail(emailAddress, '柱柱签收网邮箱', html,
      function (err, result) {
        if (err) {
          console.log('emailLib.sendEmail(' + emailAddress + ') failed');
          return callback({err: insuranceError.email_sent_failed});
        }

        return callback(null, result);
      });
  });
}

exports.sendReportEmail = function (emailAddress, callback) {
  var renderData = {
    logoPictureUrl: config.serverAddress + 'zzqs2/images/icon/order_follow/order_follow_share_logo.png',
    serverAddress: config.serverAddress,
    startTime: new Date('2015-10-8 12:00').format('yyyy.MM.dd hh:mm'),
    endTime: new Date('2015-10-8 18:00').format('yyyy.MM.dd hh:mm'),
    orders: []
  };

  for (var i = 0; i < 10; i++) {
    renderData.orders.push({
      order_number: 'AC09077854' + i,
      insurance_buy_time: new Date('2015-10-8 14:00').format('yyyy.MM.dd hh:mm'),
      insurance_insuredFee: 100000 * i,
      insurance_payment: 25 * i,
      insurance_buy_company: '上海家化',
      insurance_buy_nickname: '梅志威',
      insurance_buy_phone: '13918429709',
      insurance_benefit_company: '郑州太古可口可乐',
      goods_name: '可乐',
      count_weight_volume: i + '吨' + i + '立方',
      pickup_address: '郑州市北京路34号34室',
      delivery_address: '上海市浦东新区香楠路408弄76号'
    });
  }

  var templateFileName = path.join(__dirname, '../../web/zzqs2/templates/email_sent/insurance_notify.client.view.html');

  sendEmail(emailAddress, templateFileName, renderData, function (err, result) {
    if (err) {
      return callback(err);
    }

    return callback();
  });
};

exports.getInsuranceOrders = function (groupIds, searchArray, sort, pagination, callback) {
  var sortQuery = getSortCondition(sort);
  if (!sortQuery) {
    sortQuery = {'insurance.pay_status': 1, created: -1};
  }

  var searchQuery = getSearchCondition(searchArray);
  searchQuery.$and.push({$or: [{delete_status: false}, {delete_status: {$exists: false}}]});
  searchQuery.$and.push({insurance: {$exists: true}});
  searchQuery.$and.push({execute_group: {$in: groupIds}});

  async.auto({
    count: function (autoCallback) {
      Order.count(searchQuery, function (err, allCount) {
        if (err) {
          return autoCallback({err: insuranceError.internal_system_error});
        }
        return autoCallback(null, allCount);
      });
    },
    orders: function (autoCallback) {
      Order.aggregate([
        {
          $match: searchQuery
        },
        {
          $sort: sortQuery
        },
        {
          $skip: (pagination.current_page - 1) * pagination.limit
        },
        {
          $limit: pagination.limit
        }
      ]).exec(
        function (err, findOrders) {
          if (err) {
            return autoCallback({err: insuranceError.internal_system_error});
          }
          return autoCallback(null, findOrders);
        }
      );
    }
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, {orders: result.orders, pagination: {currentPage: pagination.current_page, limit: pagination.limit, totalCount: result.count}});
  });
};

exports.getUnpayInsuranceOrders = function (groupIds, callback) {
  Order.aggregate([
    {
      $match: {
        $or: [{delete_status: false}, {delete_status: {$exists: false}}],
        execute_group: {$in: groupIds},
        status: 'unAssigned',
        insurance: {$exists: true},
        'insurance.pay_status': 'paying'
      }
    }
  ]).exec(function (err, orders) {
    return callback(err, orders);
  });
};

exports.getUnpayInsurancePrice = function (groupIds, callback) {
  Order.aggregate([
    {
      $match: {
        $or: [{delete_status: false}, {delete_status: {$exists: false}}],
        execute_group: {$in: groupIds},
        status: 'unAssigned',
        insurance: {$exists: true},
        'insurance.pay_status': 'paying'
      }
    },
    {
      $group: {
        _id: '$insurance.pay_status',
        coverage_sum: {$sum: '$insurance.coverage_total'},
        need_pay_count: {$sum: '$insurance.buy_count'},
        need_pay_price: {$sum: '$insurance.price_total'}
      }
    }
  ]).exec(function (err, result) {
    if (err) {
      return callback({err: insuranceError.internal_system_error});
    }
    return callback(null, result);
  });
};

exports.ensureInsuranceOrder = function (insuranceInfo, currentOrder, callback) {
  var mustFields = ['sender_name', 'goods_name', 'count', 'weight', 'volume', 'count_unit', 'weight_unit', 'volume_unit', 'buy_count', 'pickup_address', 'delivery_address'];

  if (currentOrder.status !== 'unAssigned') {
    return callback({err: insuranceError.can_not_pay});
  }

  if (currentOrder.insurance.pay_status !== 'unpay' && currentOrder.insurance.pay_status !== 'paying') {
    return callback({err: insuranceError.can_not_pay});
  }

  async.each(mustFields, function (field, eachCallback) {
    if (!insuranceInfo[field]) {
      return eachCallback({err: insuranceError['empty_' + field]});
    }
    if (field === 'buy_count') {
      var buyCount = parseInt(insuranceInfo[field]);
      if (!buyCount || buyCount < 1 || buyCount > 999) {
        return eachCallback({err: insuranceError.invalid_buy_count});
      }
    }

    currentOrder.insurance[field] = insuranceInfo[field];

    return eachCallback();
  }, function (err) {
    if (err) {
      return callback(err);
    }
    currentOrder.insurance.buy_count = parseInt(currentOrder.insurance.buy_count);
    currentOrder.insurance.pay_status = 'paying';
    currentOrder.insurance.price_unit = 2.5 * 100;
    currentOrder.insurance.price_total = currentOrder.insurance.buy_count * currentOrder.insurance.price_unit;
    currentOrder.insurance.coverage_unit = 10000 * 100;
    currentOrder.insurance.coverage_total = currentOrder.insurance.buy_count * currentOrder.insurance.coverage_unit;
    currentOrder.markModified('insurance');
    currentOrder.save(function (err, order) {
      if (err || !order) {
        return callback({err: {type: 'internal_system_error'}});
      }
      return callback(null, order);
    });
  });
};

exports.cancelInsuranceOrder = function (currentOrder, callback) {
  if (currentOrder.insurance && currentOrder.insurance.pay_status === 'payed') {
    return callback({err: {type: 'insurance_payed'}});
  }

  currentOrder.insurance = new Insurance({});
  currentOrder.markModified('insurance');
  currentOrder.save(function (err, order) {
    if (err || !order) {
      return callback({err: {type: 'internal_system_error'}});
    }
    return callback(null, order);
  });
};

exports.buyInsuranceFromPayment = function (order_ids, buy_count, coverage_total, price_total, companyId, callback) {
  var objectArray = [];
  order_ids.forEach(function (order_id) {
    objectArray.push(new mongoose.Types.ObjectId(order_id));
  });

  Order.aggregate([
    {
      $match: {
        _id: {$in: objectArray},
        $or: [{delete_status: false}, {delete_status: {$exists: false}}],
        status: 'unAssigned',
        insurance: {
          $exists: true
        },
        'insurance.pay_status': 'paying'
      }
    },
    {
      $group: {
        _id: '$insurance.pay_status',
        orders: {$push: '$insurance'},
        buy_count: {$sum: '$insurance.buy_count'},
        coverage_total: {$sum: '$insurance.coverage_total'},
        price_total: {$sum: '$insurance.price_total'}
      }
    }
  ]).exec(function (err, result) {
    if (err || !result || !result[0]) {
      return callback({err: {type: 'internal_system_error'}});
    }
    result = result[0];
    if (result.buy_count !== buy_count ||
      result.coverage_total !== coverage_total ||
      result.price_total !== price_total) {
      return callback({err: {type: 'internal_system_error'}});
    }

    var newInsurancePayment = new InsurancePayment({
      buy_count: buy_count,
      coverage_total: coverage_total,
      price_total: price_total,
      company: companyId,
      orders: result.orders
    });

    newInsurancePayment.save(function (err, insurancePayment) {
      if (err || !insurancePayment) {
        return callback({err: {type: 'internal_system_error'}});
      }

      paymentLib.executePaymentForInsurance(insurancePayment, function (err, result) {
        if (err) {
          return callback(err);
        }

        if (result) {
          result = JSON.parse(result.body.text);
        }

        return callback(null, result);
      });
    });
  });
};

exports.getInsurancePaymentHistory = function (companyId, callback) {
  InsurancePayment.find({company: companyId, status: 'payed'}, function (err, insurancePayments) {
    if (err) {
      return callback({err: {type: 'internal_system_error'}});
    }
    return callback(null, insurancePayments);
  });
};